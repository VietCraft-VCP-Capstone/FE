import { useRef, useEffect, useState, useMemo } from 'react';
import {
    Loader2, Upload, Trash2, Image as ImageIcon, AlertTriangle, ChevronUp, ChevronDown, Copy,
    Maximize2, RotateCw, FlipHorizontal, Search, Sliders, Keyboard, Eraser,
} from 'lucide-react';
import { Stage, Layer, Image as KImage, Rect, Group, Transformer, Line as KLine, Text as KText } from 'react-konva';
import { useHTMLImage, abs } from './useHTMLImage';
import { TEMPLATE_SIZE, cmPerPx, printBoxOf, printDpi, type LayerItem } from './podShared';

export type { LayerItem } from './podShared';

const SNAP_PX = 6; // khoảng hít vào đường tâm (px màn hình)

function LayerNode({ layer, ratio, onSelect, onChange, nodeRef, onDragMove, onDragEnd }: any) {
    const ref = useRef<any>(null);
    useEffect(() => {
        if (ref.current) nodeRef(layer.id, ref.current);
        return () => { nodeRef(layer.id, null); };
    }, [layer.id]);
    const designImg = useHTMLImage(layer.design?.file_url);
    const w = layer.baseW || 0, h = layer.baseH || 0;
    const flip = layer.flipH ? -1 : 1;
    return (
        <Group
            ref={ref}
            x={layer.x * ratio} y={layer.y * ratio}
            scaleX={flip * layer.scale * ratio} scaleY={layer.scale * ratio}
            rotation={layer.rotation}
            offsetX={layer.flipH ? w : 0}
            draggable
            onMouseDown={onSelect} onTap={onSelect}
            onDragMove={onDragMove}
            onDragEnd={(e: any) => { onDragEnd(); onChange({ x: e.target.x() / ratio, y: e.target.y() / ratio }); }}
            onTransformEnd={() => {
                const n = ref.current; if (!n) return;
                onChange({ scale: Math.abs(n.scaleX()) / ratio, rotation: n.rotation(), x: n.x() / ratio, y: n.y() / ratio });
            }}
        >
            <Rect width={w} height={h} fill="rgba(0,0,0,0.001)" />
            {designImg && <KImage image={designImg} width={w} height={h} />}
        </Group>
    );
}

interface Step2DesignEditorProps {
    blank: any;
    designs: any[];
    faces: Record<string, LayerItem[]>;
    activeFace: string;
    setActiveFace: (key: string) => void;
    layers: LayerItem[];
    selected: LayerItem | null;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    updateLayer: (id: string, patch: Partial<LayerItem>) => void;
    removeLayer: (id: string) => void;
    duplicateLayer: (id: string) => void;
    reorderLayer: (id: string, dir: 1 | -1) => void;
    clearFace: () => void;
    addImageDesign: (d: any) => void;
    uploading: boolean;
    onUpload: (file: File) => void;
    fileRef: React.RefObject<HTMLInputElement>;
    areaOf: (key: string) => any;
}

const btn = 'inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[11.5px] font-semibold transition-colors';
const btnIdle = `${btn} border-stone-200 bg-white text-stone-700 hover:bg-stone-50`;

export function Step2DesignEditor({
    blank, designs, faces, activeFace, setActiveFace, layers, selected, selectedId, setSelectedId,
    updateLayer, removeLayer, duplicateLayer, reorderLayer, clearFace, addImageDesign, uploading, onUpload, fileRef, areaOf,
}: Step2DesignEditorProps) {
    const areas = blank?.print_areas || [];
    const area = areaOf(activeFace);
    const isWrap = area?.surface === 'wrap';
    const box = printBoxOf(area);
    const k = cmPerPx(area);

    // Canvas co giãn theo cột giữa
    const wrapRef = useRef<HTMLDivElement>(null);
    const [canvas, setCanvas] = useState(480);
    useEffect(() => {
        const el = wrapRef.current; if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setCanvas(Math.max(280, Math.min(600, Math.floor(w - 8))));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const ratio = canvas / TEMPLATE_SIZE;

    const blankImg = useHTMLImage((typeof area?.image === 'string' && area.image.trim()) ? area.image : blank?.default_image);
    const trRef = useRef<any>(null);
    const nodeMap = useRef<Record<string, any>>({});
    const registerNode = (id: string, node: any) => { if (node) nodeMap.current[id] = node; else delete nodeMap.current[id]; };
    const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });

    useEffect(() => {
        const tr = trRef.current; if (!tr) return;
        const node = selectedId ? nodeMap.current[selectedId] : null;
        tr.nodes(node && node.getStage() ? [node] : []);
        tr.getLayer()?.batchDraw();
    }, [selectedId, layers, activeFace, canvas]);

    // Hít vào đường tâm vùng in khi kéo
    const onDragMove = (layer: LayerItem) => (e: any) => {
        const n = e.target;
        const w = (layer.baseW || 0) * layer.scale * ratio;
        const h = (layer.baseH || 0) * layer.scale * ratio;
        const cx = (box.x + box.width / 2) * ratio, cy = (box.y + box.height / 2) * ratio;
        let v = false, hz = false;
        if (!layer.rotation) {
            if (Math.abs(n.x() + w / 2 - cx) < SNAP_PX) { n.x(cx - w / 2); v = true; }
            if (Math.abs(n.y() + h / 2 - cy) < SNAP_PX) { n.y(cy - h / 2); hz = true; }
        }
        if (v !== guides.v || hz !== guides.h) setGuides({ v, h: hz });
    };
    const endDrag = () => setGuides({ v: false, h: false });

    // ---------- Đặt hình nhanh ----------
    const sizeOf = (l: LayerItem) => ({ w: (l.baseW || 800) * l.scale, h: (l.baseH || 800) * l.scale });
    const resizeTo = (frac: number, mode: 'fit' | 'fillW' = 'fit') => {
        if (!selected) return;
        const bw = selected.baseW || 800, bh = selected.baseH || 800;
        const s = mode === 'fillW' ? box.width / bw : Math.min((box.width * frac) / bw, (box.height * frac) / bh);
        const w = bw * s, h = bh * s;
        updateLayer(selected.id, { scale: s, rotation: 0, x: Math.round(box.x + (box.width - w) / 2), y: Math.round(box.y + (box.height - h) / 2) });
    };
    const placeAt = (where: 'center' | 'top' | 'bottom' | 'topLeft' | 'topRight') => {
        if (!selected) return;
        const { w, h } = sizeOf(selected);
        const pad = Math.round(Math.min(box.width, box.height) * 0.06);
        const xs = { left: box.x + pad, center: box.x + (box.width - w) / 2, right: box.x + box.width - w - pad };
        const ys = { top: box.y + pad, middle: box.y + (box.height - h) / 2, bottom: box.y + box.height - h - pad };
        const pos = {
            center: [xs.center, ys.middle], top: [xs.center, ys.top], bottom: [xs.center, ys.bottom],
            topLeft: [xs.left, ys.top], topRight: [xs.right, ys.top],
        }[where];
        updateLayer(selected.id, { x: Math.round(pos[0]), y: Math.round(pos[1]), rotation: 0 });
    };

    // Phím tắt: Delete xoá, mũi tên dịch 1px (Shift: 10px), Ctrl/Cmd+D nhân bản
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (!selected || t.closest('input, textarea, select, [contenteditable="true"]')) return;
            const step = e.shiftKey ? 10 : 1;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            if (moves[e.key]) {
                e.preventDefault();
                updateLayer(selected.id, { x: selected.x + moves[e.key][0], y: selected.y + moves[e.key][1] });
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault(); removeLayer(selected.id);
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault(); duplicateLayer(selected.id);
            } else if (e.key === 'Escape') {
                setSelectedId(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, updateLayer, removeLayer, duplicateLayer, setSelectedId]);

    const outOf = (l: LayerItem) => {
        const { w, h } = sizeOf(l);
        return l.x < box.x - 1.5 || l.y < box.y - 1.5 || l.x + w > box.x + box.width + 1.5 || l.y + h > box.y + box.height + 1.5;
    };
    const anyOut = layers.some(outOf);
    const sel = selected ? sizeOf(selected) : null;
    const dpi = selected ? printDpi(selected, area) : null;

    // Thư viện thiết kế
    const [q, setQ] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const shownDesigns = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return kw ? designs.filter(d => (d.name || '').toLowerCase().includes(kw)) : designs;
    }, [designs, q]);
    const usedIds = new Set(Object.values(faces).flat().map(l => l.design?._id));

    const A = (n: number) => n * ratio; // template px -> màn hình

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-admin-sm">
            {/* Thư viện hình thiết kế */}
            <aside className="border-b lg:border-b-0 lg:border-r border-stone-200 p-4 flex flex-col gap-3 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900">Hình thiết kế</h3>
                    <span className="text-[11px] text-stone-500">{designs.length} hình</span>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
                <button type="button" disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); }}
                    className={`flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${dragOver ? 'border-admin-brand bg-admin-brand-050 text-admin-brand' : 'border-stone-300 text-stone-600 hover:border-admin-brand hover:text-admin-brand'}`}>
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {uploading ? 'Đang tải lên…' : 'Tải hình lên hoặc kéo thả vào đây'}
                    <span className="font-normal text-[10.5px] text-stone-400">PNG nền trong suốt cho kết quả in đẹp nhất</span>
                </button>
                {designs.length > 6 && (
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm hình…"
                            className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-admin-brand" />
                    </div>
                )}
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto max-h-[420px] pr-0.5">
                    {shownDesigns.map((d: any) => (
                        <button type="button" key={d._id} onClick={() => addImageDesign(d)} title={`Chèn "${d.name}" vào ${area?.label || 'mặt in'}`}
                            className="group relative rounded-lg border border-stone-200 bg-[repeating-conic-gradient(#f5f5f4_0_25%,#fff_0_50%)] bg-[length:12px_12px] p-1.5 hover:border-admin-brand transition-colors text-left">
                            <img src={abs(d.file_url)} alt="" loading="lazy" className="w-full aspect-square object-contain" />
                            <span className="block text-[10.5px] font-medium text-stone-600 truncate mt-1">{d.name}</span>
                            {usedIds.has(d._id) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-admin-brand" title="Đang dùng" />}
                            <span className="absolute inset-0 rounded-lg bg-admin-brand/10 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity">
                                <span className="bg-admin-brand text-white text-[10px] font-bold px-2 py-1 rounded">+ Chèn</span>
                            </span>
                        </button>
                    ))}
                    {designs.length === 0 && (
                        <div className="col-span-full py-6 text-center text-xs text-stone-400">
                            <ImageIcon size={22} className="mx-auto mb-1 text-stone-300" />Chưa có hình nào.
                        </div>
                    )}
                </div>
            </aside>

            {/* Khung thiết kế */}
            <div className="flex flex-col items-center gap-3 p-4 bg-[radial-gradient(140%_120%_at_50%_-10%,#fff_0%,#f2f5f8_60%,#e9eef3_100%)] min-w-0">
                {areas.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Mặt in">
                        {areas.map((a: any) => {
                            const count = (faces[a.key] || []).length;
                            return (
                                <button key={a.key} type="button" role="tab" aria-selected={activeFace === a.key} onClick={() => setActiveFace(a.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeFace === a.key ? 'bg-admin-brand text-white border-admin-brand' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'}`}>
                                    {a.label || a.key}{count > 0 && <span className={`ml-1.5 px-1.5 rounded-full text-[10px] ${activeFace === a.key ? 'bg-white/25' : 'bg-admin-brand-050 text-admin-brand'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div ref={wrapRef} className="w-full flex justify-center">
                    <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(15,23,42,.05),0_20px_46px_-16px_rgba(15,23,42,.22)]" style={{ width: canvas, height: canvas }}>
                        <Stage width={canvas} height={canvas}
                            onMouseDown={(e: any) => { if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelectedId(null); }}
                            onTouchStart={(e: any) => { if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelectedId(null); }}>
                            <Layer>
                                {blankImg && <KImage name="bg" image={blankImg} width={canvas} height={canvas} />}
                                {/* Làm mờ phần ngoài vùng in để thấy rõ chỗ được in */}
                                <Group listening={false}>
                                    <Rect x={0} y={0} width={canvas} height={A(box.y)} fill="rgba(15,23,42,0.08)" />
                                    <Rect x={0} y={A(box.y + box.height)} width={canvas} height={canvas - A(box.y + box.height)} fill="rgba(15,23,42,0.08)" />
                                    <Rect x={0} y={A(box.y)} width={A(box.x)} height={A(box.height)} fill="rgba(15,23,42,0.08)" />
                                    <Rect x={A(box.x + box.width)} y={A(box.y)} width={canvas - A(box.x + box.width)} height={A(box.height)} fill="rgba(15,23,42,0.08)" />
                                    <Rect x={A(box.x)} y={A(box.y)} width={A(box.width)} height={A(box.height)}
                                        stroke={anyOut ? '#dc2626' : '#1a6b1a'} strokeWidth={1.5} dash={[7, 5]} />
                                    <Group x={A(box.x)} y={Math.max(0, A(box.y) - 20)}>
                                        <Rect fill={anyOut ? '#dc2626' : '#1a6b1a'} height={18} width={k ? 150 : 70} cornerRadius={4} />
                                        <KText text={k ? `Vùng in ${(box.width * k).toFixed(1)}×${(box.height * k).toFixed(1)} cm` : 'Vùng in'} fill="#fff" fontSize={10.5} fontStyle="bold" x={7} y={4} />
                                    </Group>
                                    {guides.v && <KLine points={[A(box.x + box.width / 2), A(box.y), A(box.x + box.width / 2), A(box.y + box.height)]} stroke="#ec4899" strokeWidth={1} />}
                                    {guides.h && <KLine points={[A(box.x), A(box.y + box.height / 2), A(box.x + box.width), A(box.y + box.height / 2)]} stroke="#ec4899" strokeWidth={1} />}
                                </Group>

                                {layers.map(l => (
                                    <LayerNode key={l.id} layer={l} ratio={ratio}
                                        onSelect={() => setSelectedId(l.id)}
                                        onChange={(patch: any) => updateLayer(l.id, patch)}
                                        onDragMove={onDragMove(l)} onDragEnd={endDrag}
                                        nodeRef={registerNode} />
                                ))}
                                <Transformer ref={trRef} rotateEnabled keepRatio flipEnabled={false}
                                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                                    anchorStroke="#1a6b1a" anchorFill="#fff" anchorSize={10} anchorCornerRadius={5}
                                    borderStroke="#1a6b1a" borderStrokeWidth={1.5} />
                            </Layer>
                        </Stage>
                        {layers.length === 0 && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                                <span className="px-3 py-1.5 rounded-full bg-white/95 border border-stone-200 text-xs font-medium text-stone-600 shadow-sm">
                                    Chọn hình ở cột trái để chèn vào {area?.label || 'mặt in'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {isWrap && (
                    <p className="flex items-center gap-1.5 text-[11.5px] text-stone-600"><Sliders size={13} /> Bề mặt cuộn: hình sẽ được uốn cong theo thân ly trong ảnh mockup.</p>
                )}
                {anyOut && (
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600"><AlertTriangle size={14} /> Có hình tràn ra ngoài vùng in, phần tràn sẽ không được in.</p>
                )}
                <p className="hidden lg:flex items-center gap-1.5 text-[11px] text-stone-400"><Keyboard size={12} /> Mũi tên: dịch hình · Shift: dịch nhanh · Delete: xoá · Ctrl+D: nhân bản</p>
            </div>

            {/* Thuộc tính hình đang chọn */}
            <aside className="border-t lg:border-t-0 lg:border-l border-stone-200 p-4 flex flex-col gap-4 min-w-0">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{area?.label || area?.key}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                        {k ? <>Khổ in tối đa <b className="text-stone-800">{(box.width * k).toFixed(1)}×{(box.height * k).toFixed(1)} cm</b></> : 'Xưởng chưa khai báo khổ in thật'}
                    </div>
                </div>

                {selected && sel ? (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border border-stone-200 p-3 text-xs flex flex-col gap-1.5">
                            <div className="flex justify-between"><span className="text-stone-500">Kích thước in</span>
                                <b className="text-stone-800">{k ? `${(sel.w * k).toFixed(1)} × ${(sel.h * k).toFixed(1)} cm` : `${Math.round((sel.w / box.width) * 100)}% chiều rộng vùng in`}</b></div>
                            {dpi !== null && (
                                <div className="flex justify-between items-center"><span className="text-stone-500">Độ nét khi in</span>
                                    <span className={`font-bold ${dpi >= 200 ? 'text-emerald-700' : dpi >= 150 ? 'text-amber-700' : 'text-red-600'}`}>
                                        {dpi} DPI · {dpi >= 200 ? 'Tốt' : dpi >= 150 ? 'Tạm được' : 'Có thể bị vỡ'}
                                    </span></div>
                            )}
                            {dpi !== null && dpi < 150 && (
                                <p className="text-[11px] text-red-600 leading-snug">Thu nhỏ hình hoặc dùng file có độ phân giải cao hơn để bản in không bị nhoè.</p>
                            )}
                        </div>

                        <div>
                            <div className="text-[11.5px] font-semibold text-stone-700 mb-1.5">Kích thước nhanh</div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button type="button" className={btnIdle} onClick={() => resizeTo(1)}><Maximize2 size={13} /> Vừa khung</button>
                                <button type="button" className={btnIdle} onClick={() => resizeTo(1, 'fillW')}>Tràn chiều ngang</button>
                                <button type="button" className={btnIdle} onClick={() => resizeTo(0.5)}>Vừa (50%)</button>
                                <button type="button" className={btnIdle} onClick={() => resizeTo(0.25)}>Logo nhỏ (25%)</button>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11.5px] font-semibold text-stone-700 mb-1.5">Vị trí trong vùng in</div>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button type="button" className={btnIdle} onClick={() => placeAt('topLeft')}>Trên trái</button>
                                <button type="button" className={btnIdle} onClick={() => placeAt('top')}>Trên giữa</button>
                                <button type="button" className={btnIdle} onClick={() => placeAt('topRight')}>Trên phải</button>
                                <button type="button" className={`${btnIdle} col-span-2`} onClick={() => placeAt('center')}>Chính giữa</button>
                                <button type="button" className={btnIdle} onClick={() => placeAt('bottom')}>Dưới giữa</button>
                            </div>
                        </div>

                        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-stone-700">
                            <span className="flex justify-between">Tỷ lệ <span className="text-stone-500 font-medium">{Math.round(selected.scale * 100)}%</span></span>
                            <input type="range" min={2} max={300} value={Math.round(selected.scale * 100)} className="accent-[#1a6b1a]"
                                onChange={e => updateLayer(selected.id, { scale: Number(e.target.value) / 100 })} />
                        </label>
                        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-stone-700">
                            <span className="flex justify-between items-center">Góc xoay <span className="text-stone-500 font-medium">{Math.round(selected.rotation)}°</span></span>
                            <input type="range" min={-180} max={180} value={Math.round(selected.rotation)} className="accent-[#1a6b1a]"
                                onChange={e => updateLayer(selected.id, { rotation: Number(e.target.value) })} />
                        </label>

                        <div className="grid grid-cols-2 gap-1.5">
                            <button type="button" className={btnIdle} onClick={() => updateLayer(selected.id, { rotation: ((selected.rotation + 90 + 180) % 360) - 180 })}><RotateCw size={13} /> Xoay 90°</button>
                            <button type="button" onClick={() => updateLayer(selected.id, { flipH: !selected.flipH })}
                                className={`${btn} ${selected.flipH ? 'border-admin-brand bg-admin-brand-050 text-admin-brand' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`}>
                                <FlipHorizontal size={13} /> Lật ngang
                            </button>
                            <button type="button" className={btnIdle} onClick={() => duplicateLayer(selected.id)}><Copy size={13} /> Nhân bản</button>
                            <button type="button" className={`${btn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => removeLayer(selected.id)}><Trash2 size={13} /> Xoá</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-stone-500 leading-relaxed">Bấm vào một hình trên phôi để chỉnh kích thước, vị trí và góc xoay.</p>
                )}

                {layers.length > 0 && (
                    <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11.5px] font-semibold text-stone-700">Các lớp ({layers.length})</span>
                            <button type="button" onClick={clearFace} className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-600"><Eraser size={12} /> Xoá hết mặt này</button>
                        </div>
                        <ul className="flex flex-col gap-1">
                            {[...layers].reverse().map(l => (
                                <li key={l.id}>
                                    <div role="button" tabIndex={0} onClick={() => setSelectedId(l.id)} onKeyDown={e => e.key === 'Enter' && setSelectedId(l.id)}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer ${l.id === selectedId ? 'border-admin-brand bg-admin-brand-050' : 'border-transparent hover:bg-stone-50'}`}>
                                        <img src={abs(l.design?.file_url)} alt="" className="w-8 h-8 rounded object-contain bg-stone-50 border border-stone-200" />
                                        <span className="flex-1 min-w-0 text-[11.5px] font-medium text-stone-700 truncate">{l.design?.name || 'Hình thiết kế'}</span>
                                        {outOf(l) && <AlertTriangle size={13} className="text-red-500 shrink-0" aria-label="Tràn vùng in" />}
                                        <button type="button" onClick={e => { e.stopPropagation(); reorderLayer(l.id, 1); }} className="p-0.5 text-stone-400 hover:text-stone-800" aria-label="Đưa lên trên"><ChevronUp size={13} /></button>
                                        <button type="button" onClick={e => { e.stopPropagation(); reorderLayer(l.id, -1); }} className="p-0.5 text-stone-400 hover:text-stone-800" aria-label="Đưa xuống dưới"><ChevronDown size={13} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </aside>
        </div>
    );
}

export default Step2DesignEditor;
