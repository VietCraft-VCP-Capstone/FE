import { useRef, useEffect, useState } from 'react';
import {
    Loader2, Upload, Trash2, Image as ImageIcon, AlertTriangle, ChevronUp, ChevronDown,
    Sliders, Maximize2, RotateCw, AlignCenterVertical, AlignCenterHorizontal,
    Move, Info, FlipHorizontal, AlignLeft, AlignRight, RefreshCw, Scaling, Eye
} from 'lucide-react';
import { Stage, Layer, Image as KImage, Rect, Group, Transformer, Text as KText, Line as KLine } from 'react-konva';
import { useHTMLImage, abs } from './useHTMLImage';

const CANVAS = 460;
const TEMPLATE_SIZE = 800;
const COLLAR_Y_PX = 160; // Collar line position on 800x800 shirt template space

export interface LayerItem {
    id: string; type: 'image';
    x: number; y: number; scale: number; rotation: number;
    flipH?: boolean;
    design?: any; baseW?: number; baseH?: number;
}

// Konva Layer Node Component
function LayerNode({ layer, ratio, offX, offY, onSelect, onChange, nodeRef }: any) {
    const ref = useRef<any>(null);
    useEffect(() => {
        if (ref.current) nodeRef(layer.id, ref.current);
        return () => { nodeRef(layer.id, null); };
    }, [layer.id]);
    const designImg = useHTMLImage(layer.design?.file_url);

    const hitW = layer.baseW || 0, hitH = layer.baseH || 0;
    const flipH = layer.flipH ? -1 : 1;
    const groupProps = {
        ref,
        x: offX + layer.x * ratio, y: offY + layer.y * ratio,
        scaleX: flipH * layer.scale * ratio, scaleY: layer.scale * ratio, rotation: layer.rotation,
        offsetX: layer.flipH ? hitW : 0,
        draggable: true,
        onClick: onSelect, onTap: onSelect,
        onDragEnd: (e: any) => onChange({ x: (e.target.x() - offX) / ratio, y: (e.target.y() - offY) / ratio }),
        onTransformEnd: () => {
            const n = ref.current; if (!n) return;
            onChange({ scale: Math.abs(n.scaleX()) / ratio, rotation: n.rotation(), x: (n.x() - offX) / ratio, y: (n.y() - offY) / ratio });
        },
    };

    return (
        <Group {...groupProps}>
            <Rect width={hitW} height={hitH} fill="rgba(0,0,0,0.001)" />
            {designImg && <KImage image={designImg} width={hitW} height={hitH} />}
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
    reorderLayer: (id: string, dir: 1 | -1) => void;
    addImageDesign: (d: any) => void;
    uploading: boolean;
    onUpload: (file: File) => void;
    fileRef: React.RefObject<HTMLInputElement>;
    areaOf: (key: string) => any;
    spaceOf: (area: any) => { x: number; y: number; width: number; height: number };
    updateAreaOverride: (key: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => void;
    resetAreaOverride: (key: string) => void;
    resetAllDesigns?: () => void;
}

export function Step2DesignEditor({
    blank, designs, faces, activeFace, setActiveFace, layers, selected, selectedId, setSelectedId,
    updateLayer, removeLayer, reorderLayer, addImageDesign, uploading, onUpload, fileRef, areaOf, spaceOf,
    updateAreaOverride, resetAreaOverride, resetAllDesigns
}: Step2DesignEditorProps) {
    const areas = blank?.print_areas || [];
    const area = areaOf(activeFace);
    const isWrap = area?.surface === 'wrap';
    const isTshirt = blank?._id ? blank._id.includes('tshirt') : false;
    const isFrame = blank?._id ? blank._id.includes('frame') : false;
    const isTote = blank?._id ? blank._id.includes('tote') : false;
    const isMug = blank?._id ? blank._id.includes('mug') : false;
    const sp = spaceOf(area);

    const [isAreaSelected, setIsAreaSelected] = useState(false);
    const [showGuides, setShowGuides] = useState(true);

    const blankImg = useHTMLImage(area?.image || blank?.default_image);
    const trRef = useRef<any>(null);
    const areaRectRef = useRef<any>(null);
    const areaTrRef = useRef<any>(null);

    const nodeMap = useRef<Record<string, any>>({});
    const registerNode = (id: string, node: any) => {
        if (node) nodeMap.current[id] = node;
        else delete nodeMap.current[id];
    };

    const ratio = CANVAS / TEMPLATE_SIZE;
    const dispW = CANVAS, dispH = CANVAS;
    const offX = 0, offY = 0;

    // Distance from collar calculation (cm)
    const distFromCollarCm = Math.max(0, ((sp.y - COLLAR_Y_PX) * 0.1)).toFixed(1);

    // Design layer transformer binding
    useEffect(() => {
        const tr = trRef.current; if (!tr) return;
        const node = selectedId ? nodeMap.current[selectedId] : null;
        if (node && typeof node.getStage === 'function' && node.getStage()) {
            tr.nodes([node]);
        } else {
            tr.nodes([]);
        }
        tr.getLayer()?.batchDraw();
        if (selectedId) setIsAreaSelected(false);
    }, [selectedId, layers, activeFace]);

    // Print Area Transformer binding
    useEffect(() => {
        const atr = areaTrRef.current; if (!atr) return;
        const rectNode = isAreaSelected ? areaRectRef.current : null;
        if (rectNode && typeof rectNode.getStage === 'function' && rectNode.getStage()) {
            atr.nodes([rectNode]);
        } else {
            atr.nodes([]);
        }
        // Đảm bảo Rect luôn giữ x=0, y=0, scaleX=1, scaleY=1 bên trong Group, không bị trôi lệch
        if (areaRectRef.current) {
            areaRectRef.current.x(0);
            areaRectRef.current.y(0);
            areaRectRef.current.scaleX(1);
            areaRectRef.current.scaleY(1);
        }
        atr.getLayer()?.batchDraw();
    }, [isAreaSelected, activeFace, sp.x, sp.y, sp.width, sp.height]);

    // Alignment helpers
    const centerHorizontally = () => {
        if (!selected) return;
        const w = (selected.baseW || 100) * selected.scale;
        updateLayer(selected.id, { x: sp.x + (sp.width - w) / 2 });
    };
    const centerVertically = () => {
        if (!selected) return;
        const h = (selected.baseH || 100) * selected.scale;
        updateLayer(selected.id, { y: sp.y + (sp.height - h) / 2 });
    };
    const centerBoth = () => {
        if (!selected) return;
        const w = (selected.baseW || 100) * selected.scale;
        const h = (selected.baseH || 100) * selected.scale;
        updateLayer(selected.id, { x: sp.x + (sp.width - w) / 2, y: sp.y + (sp.height - h) / 2 });
    };
    const alignLeft = () => { if (selected) updateLayer(selected.id, { x: sp.x }); };
    const alignRight = () => {
        if (!selected) return;
        const w = (selected.baseW || 100) * selected.scale;
        updateLayer(selected.id, { x: sp.x + sp.width - w });
    };
    const alignTop = () => { if (selected) updateLayer(selected.id, { y: sp.y }); };
    const alignBottom = () => {
        if (!selected) return;
        const h = (selected.baseH || 100) * selected.scale;
        updateLayer(selected.id, { y: sp.y + sp.height - h });
    };
    const applyAreaOverride = (key: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
        updateAreaOverride(key, patch);
        const currentSp = spaceOf(areaOf(key));
        const newSp = { ...currentSp, ...patch };
        const activeLayers = faces[key] || [];
        activeLayers.forEach(l => {
            const bw = l.baseW || 800;
            const bh = l.baseH || 800;
            // Tính toán scale vừa vặn 100% trong khổ in mới, giữ nguyên tỉ lệ ảnh gốc
            const s = Math.min(newSp.width / bw, newSp.height / bh);
            const nw = bw * s;
            const nh = bh * s;
            updateLayer(l.id, {
                scale: s,
                x: Math.round(newSp.x + (newSp.width - nw) / 2),
                y: Math.round(newSp.y + (newSp.height - nh) / 2),
                rotation: 0
            });
        });
    };

    const fitToPrintArea = () => {
        if (!selected) return;
        const bw = selected.baseW || 800;
        const bh = selected.baseH || 800;
        // Giữ nguyên tỉ lệ ảnh gốc, fit trọn vẹn bên trong khung in
        const s = Math.min(sp.width / bw, sp.height / bh);
        const w = bw * s;
        const h = bh * s;
        updateLayer(selected.id, {
            scale: s,
            x: Math.round(sp.x + (sp.width - w) / 2),
            y: Math.round(sp.y + (sp.height - h) / 2),
            rotation: 0
        });
    };
    const fillPrintArea = () => {
        if (!selected) return;
        const bw = selected.baseW || 800;
        const bh = selected.baseH || 800;
        const s = Math.max(sp.width / bw, sp.height / bh);
        const w = bw * s;
        const h = bh * s;
        updateLayer(selected.id, {
            scale: s,
            x: Math.round(sp.x + (sp.width - w) / 2),
            y: Math.round(sp.y + (sp.height - h) / 2),
            rotation: 0
        });
    };
    const toggleFlipH = () => {
        if (!selected) return;
        updateLayer(selected.id, { flipH: !selected.flipH });
    };

    let outOfBounds = false;
    if (selected && sp) {
        const bw = selected.baseW || 800;
        const bh = selected.baseH || 800;
        const w = bw * selected.scale;
        const h = bh * selected.scale;
        // Cho phép dung sai 1.5px để không bị lỗi làm tròn số thực
        outOfBounds = selected.x < sp.x - 1.5 || selected.y < sp.y - 1.5 || (selected.x + w) > (sp.x + sp.width + 1.5) || (selected.y + h) > (sp.y + sp.height + 1.5);
    }

    const selW = selected ? (selected.baseW || 800) * selected.scale : 0;
    const selH = selected ? (selected.baseH || 800) * selected.scale : 0;

    return (
        <div className="creator">
            {/* Flyout Panel: Seller Artwork Upload & Print Specs */}
            <aside className="creator-flyout" style={{ width: 280 }}>
                <div className="creator-tool-body">
                    <div className="flex items-center justify-between mb-3">
                        <div className="creator-flyout-title mb-0">Hình thiết kế của bạn</div>
                        <span className="text-[11px] text-stone-500 font-medium">{designs.length} ảnh</span>
                    </div>

                    <input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <button type="button" className="creator-upload-btn flex-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}{uploading ? 'Đang tải...' : 'Tải hình thiết kế lên'}
                        </button>
                        {resetAllDesigns && (
                            <button
                                type="button"
                                onClick={resetAllDesigns}
                                className="px-2.5 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Xóa tất cả vị trí hình thiết kế chưa lưu trên các mặt phôi"
                            >
                                <Trash2 size={13} /> Reset
                            </button>
                        )}
                    </div>

                    <div className="text-[11.5px] text-stone-500 mb-2">Bấm vào hình để chèn vào phôi:</div>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[320px]">
                        {designs.map((d: any) => (
                            <button type="button" key={d._id} className="group relative border border-stone-200 rounded-lg p-1.5 hover:border-[#1a6b1a] bg-stone-50 transition-all text-left" onClick={() => addImageDesign(d)}>
                                <img src={abs(d.file_url)} alt={d.name} className="w-full h-24 object-contain rounded bg-white mb-1" />
                                <span className="block text-[11px] font-medium text-stone-700 truncate">{d.name}</span>
                                <div className="absolute inset-0 bg-[#1a6b1a]/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                                    <span className="bg-[#1a6b1a] text-white text-[10px] font-bold px-2 py-1 rounded shadow">+ Chèn</span>
                                </div>
                            </button>
                        ))}
                        {designs.length === 0 && (
                            <div className="col-span-2 py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                                <ImageIcon size={24} className="mx-auto mb-1 text-stone-300" />
                                Chưa có hình thiết kế nào.
                            </div>
                        )}
                    </div>

                    {/* Print File Requirements Card */}
                    <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-200 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-1.5">
                            <Info size={14} className="text-[#1a6b1a]" />
                            <span>Yêu cầu file in (Print Specs)</span>
                        </div>
                        <ul className="text-[11px] text-stone-600 space-y-1 list-disc pl-4 leading-relaxed">
                            <li>Hỗ trợ file: JPG, PNG, SVG</li>
                            <li>Tối đa 100 MiB (JPG/PNG) hoặc 20 MiB (SVG)</li>
                            <li>Vùng in đang chọn: <b>{(sp.width * 0.1).toFixed(1)} × {(sp.height * 0.1).toFixed(1)} cm</b></li>
                            {isTshirt && <li>Cách gờ cổ áo: <b className="text-[#1a6b1a]">{distFromCollarCm} cm</b></li>}
                            <li>Kích thước phôi: <b>{blank.dimensions_info || 'Dài 72cm × Rộng 54cm'}</b></li>
                        </ul>
                    </div>
                </div>
            </aside>

            {/* Stage Canvas */}
            <div className="creator-canvas-wrap">
                {/* Print Area Presets & Interactive Toolbar */}
                <div className="flex flex-col gap-2 mb-2 p-2.5 bg-white rounded-xl border border-stone-200 shadow-sm">
                        <div className="flex items-center justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                                <Scaling size={15} className="text-[#1a6b1a]" />
                                <span>Kích thước & Khoảng cách vùng in:</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Collar Distance Control */}
                                {isTshirt && (
                                    <div className="flex items-center gap-1 text-xs bg-[#f0f7f0] border border-[#cce5cc] px-2 py-0.5 rounded-lg">
                                        <span className="text-stone-700 font-semibold">Cách cổ:</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.5}
                                            className="w-14 px-1 py-0.5 border border-stone-300 rounded text-xs font-bold text-[#1a6b1a] text-center outline-none focus:border-[#1a6b1a] bg-white"
                                            value={distFromCollarCm}
                                            onChange={(e) => {
                                                const cm = parseFloat(e.target.value) || 0;
                                                const newY = Math.round(COLLAR_Y_PX + cm * 10);
                                                applyAreaOverride(activeFace, { y: newY });
                                            }}
                                        />
                                        <span className="text-stone-600 font-medium">cm</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-stone-500 font-medium">Rộng:</span>
                                    <input
                                        type="number"
                                        min={10}
                                        max={50}
                                        step={0.5}
                                        className="w-14 px-1.5 py-0.5 border border-stone-300 rounded text-xs font-bold text-[#1a6b1a] text-center outline-none focus:border-[#1a6b1a]"
                                        value={(sp.width * 0.1).toFixed(1)}
                                        onChange={(e) => {
                                            const cm = parseFloat(e.target.value) || 20;
                                            applyAreaOverride(activeFace, { width: Math.round(cm * 10) });
                                        }}
                                    />
                                    <span className="text-stone-500 font-medium">cm</span>
                                </div>
                                <span className="text-stone-300">×</span>
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-stone-500 font-medium">Cao:</span>
                                    <input
                                        type="number"
                                        min={10}
                                        max={60}
                                        step={0.5}
                                        className="w-14 px-1.5 py-0.5 border border-stone-300 rounded text-xs font-bold text-[#1a6b1a] text-center outline-none focus:border-[#1a6b1a]"
                                        value={(sp.height * 0.1).toFixed(1)}
                                        onChange={(e) => {
                                            const cm = parseFloat(e.target.value) || 20;
                                            applyAreaOverride(activeFace, { height: Math.round(cm * 10) });
                                        }}
                                    />
                                    <span className="text-stone-500 font-medium">cm</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGuides(!showGuides)}
                                    className={`text-[11px] px-2 py-1 rounded border font-semibold flex items-center gap-1 transition-colors ${showGuides ? 'border-[#1a6b1a] bg-[#f0f7f0] text-[#1a6b1a]' : 'border-stone-200 text-stone-500 hover:text-stone-800'}`}
                                    title="Bật/Tắt đường chỉ gờ cổ áo và đường căn lề"
                                >
                                    <Eye size={12} /> {showGuides ? 'Hiện đường mốc' : 'Ẩn đường mốc'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Presets tailored for each blank type */}
                        {isTshirt && (
                            <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Khổ:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 250, height: 330, x: 275, y: 220 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Thân chuẩn (25×33)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 210, height: 300, x: 295, y: 235 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">A4 (21×30)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 280, height: 380, x: 260, y: 205 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">A3 (28×38)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 100, height: 100, x: 450, y: 240 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Ngực trái (10×10)</button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Vị trí:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { x: 275, y: 220 })} className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium">Trung tâm</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { x: 450, y: 240 })} className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium">Ngực trái</button>
                                    <button type="button" onClick={() => { resetAreaOverride(activeFace); applyAreaOverride(activeFace, { x: 275, y: 220, width: 250, height: 330 }); }} className="px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"><RefreshCw size={10} /> Mặc định</button>
                                </div>
                            </div>
                        )}

                        {isFrame && (
                            <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Khổ:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 390, height: 520, x: 205, y: 140 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Lòng tranh (30×40)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 273, height: 390, x: 263, y: 205 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">A4 (21×30)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 390, height: 390, x: 205, y: 205 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Vuông (30×30)</button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Vị trí:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { x: 205, y: 140, width: 390, height: 520 })} className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium">Trung tâm tranh</button>
                                    <button type="button" onClick={() => { resetAreaOverride(activeFace); applyAreaOverride(activeFace, { x: 205, y: 140, width: 390, height: 520 }); }} className="px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"><RefreshCw size={10} /> Mặc định</button>
                                </div>
                            </div>
                        )}

                        {isTote && (
                            <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Khổ:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 300, height: 330, x: 250, y: 320 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Thân túi (30×33)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 210, height: 300, x: 295, y: 335 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">A4 (21×30)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 150, height: 150, x: 325, y: 410 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Logo nhỏ (15×15)</button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Vị trí:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { x: 250, y: 320, width: 300, height: 330 })} className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium">Trung tâm túi</button>
                                    <button type="button" onClick={() => { resetAreaOverride(activeFace); applyAreaOverride(activeFace, { x: 250, y: 320, width: 300, height: 330 }); }} className="px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"><RefreshCw size={10} /> Mặc định</button>
                                </div>
                            </div>
                        )}

                        {(isMug || isWrap) && (
                            <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Khổ:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 440, height: 340, x: 180, y: 220 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Toàn thân ly (44×34)</button>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { width: 200, height: 200, x: 300, y: 290 })} className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium">Logo 1 mặt (20×20)</button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-400 font-medium">Vị trí:</span>
                                    <button type="button" onClick={() => applyAreaOverride(activeFace, { x: 180, y: 220, width: 440, height: 340 })} className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium">Chính diện ly</button>
                                    <button type="button" onClick={() => { resetAreaOverride(activeFace); applyAreaOverride(activeFace, { x: 180, y: 220, width: 440, height: 340 }); }} className="px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"><RefreshCw size={10} /> Mặc định</button>
                                </div>
                            </div>
                        )}
                    </div>

                {isWrap && <div className="creator-wrap-hint"><Sliders size={13} /> Bề mặt cuộn — hình thiết kế sẽ được uốn cong 3D ôm quanh thân ly khi tạo mockup.</div>}

                <div className="creator-stage-shell">
                    <Stage width={CANVAS} height={CANVAS} className="creator-stage"
                        onMouseDown={(e: any) => {
                            if (e.target === e.target.getStage()) {
                                setSelectedId(null);
                                setIsAreaSelected(false);
                            }
                        }}>
                        <Layer>
                            {/* Product Blank Image background */}
                            {blankImg && <KImage image={blankImg} x={offX} y={offY} width={dispW} height={dispH} listening={false} />}

                            {/* T-Shirt Collar Line & Measurement Ruler Guides */}
                            {isTshirt && showGuides && (
                                <Group listening={false}>
                                    {/* Red Dashed Collar Reference Line */}
                                    <KLine
                                        points={[offX + 150 * ratio, offY + COLLAR_Y_PX * ratio, offX + 650 * ratio, offY + COLLAR_Y_PX * ratio]}
                                        stroke="#ef4444"
                                        strokeWidth={1}
                                        dash={[4, 4]}
                                        opacity={0.8}
                                    />
                                    <KText
                                        text="— Gờ cổ áo"
                                        x={offX + 655 * ratio}
                                        y={offY + COLLAR_Y_PX * ratio - 6}
                                        fill="#ef4444"
                                        fontSize={10}
                                        fontStyle="bold"
                                    />

                                    {/* Dynamic Distance Ruler Line from Collar to Print Area */}
                                    {sp.y > COLLAR_Y_PX && (
                                        <Group x={offX + (sp.x - 24) * ratio} y={offY + COLLAR_Y_PX * ratio}>
                                            <KLine
                                                points={[0, 0, 0, (sp.y - COLLAR_Y_PX) * ratio]}
                                                stroke="#1a6b1a"
                                                strokeWidth={1.2}
                                                dash={[3, 3]}
                                            />
                                            <Rect
                                                x={-50}
                                                y={((sp.y - COLLAR_Y_PX) * ratio) / 2 - 9}
                                                width={48}
                                                height={18}
                                                fill="#1a6b1a"
                                                rx={3}
                                            />
                                            <KText
                                                text={`${distFromCollarCm}cm`}
                                                x={-46}
                                                y={((sp.y - COLLAR_Y_PX) * ratio) / 2 - 5}
                                                fill="#ffffff"
                                                fontSize={9.5}
                                                fontStyle="bold"
                                            />
                                        </Group>
                                    )}
                                </Group>
                            )}

                            {/* Moveable & Resizable Print Area Group */}
                            <Group
                                x={offX + sp.x * ratio}
                                y={offY + sp.y * ratio}
                                draggable={true}
                                onClick={() => { setSelectedId(null); setIsAreaSelected(true); }}
                                onTap={() => { setSelectedId(null); setIsAreaSelected(true); }}
                                onDragEnd={(e: any) => {
                                    if (e.target !== e.currentTarget) return;
                                    const newX = Math.round((e.target.x() - offX) / ratio);
                                    const newY = Math.round((e.target.y() - offY) / ratio);
                                    applyAreaOverride(activeFace, { x: newX, y: newY });
                                }}
                            >
                                <Rect
                                    ref={areaRectRef}
                                    x={0}
                                    y={0}
                                    width={sp.width * ratio}
                                    height={sp.height * ratio}
                                    stroke={isAreaSelected ? "#1a6b1a" : "#22c55e"}
                                    dash={isAreaSelected ? undefined : [7, 5]}
                                    strokeWidth={isAreaSelected ? 2.5 : 1.5}
                                    fill={isAreaSelected ? "rgba(26, 107, 26, 0.08)" : "rgba(34, 197, 94, 0.03)"}
                                    onTransformEnd={() => {
                                        const node = areaRectRef.current;
                                        if (!node) return;
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        const nodeX = node.x();
                                        const nodeY = node.y();

                                        // Reset toạ độ và scale cục bộ của Konva Node về 0 ngay lập tức
                                        node.scaleX(1);
                                        node.scaleY(1);
                                        node.x(0);
                                        node.y(0);

                                        const newW = Math.max(50, Math.round((node.width() * scaleX) / ratio));
                                        const newH = Math.max(50, Math.round((node.height() * scaleY) / ratio));
                                        const newX = Math.round(sp.x + nodeX / ratio);
                                        const newY = Math.round(sp.y + nodeY / ratio);

                                        applyAreaOverride(activeFace, { x: newX, y: newY, width: newW, height: newH });
                                    }}
                                />
                                <Group x={0} y={-22}>
                                    <Rect fill="#1a6b1a" height={20} width={180} rx={4} />
                                    <KText
                                        text={`Vùng in: ${(sp.width * 0.1).toFixed(1)}×${(sp.height * 0.1).toFixed(1)} cm`}
                                        fill="#ffffff"
                                        fontSize={11}
                                        fontStyle="bold"
                                        x={8}
                                        y={4}
                                    />
                                </Group>
                            </Group>

                            {/* Print Area Transformer for direct canvas handles */}
                            <Transformer
                                ref={areaTrRef}
                                rotateEnabled={false}
                                keepRatio={false}
                                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                                anchorStroke="#1a6b1a"
                                anchorFill="#ffffff"
                                anchorSize={10}
                                anchorCornerRadius={2}
                                borderStroke="#1a6b1a"
                                borderStrokeWidth={2}
                            />

                            {/* Design Layer Nodes */}
                            {layers.map((l: LayerItem) => (
                                <LayerNode key={l.id} layer={l} ratio={ratio} offX={offX} offY={offY}
                                    isSelected={l.id === selectedId} onSelect={() => { setIsAreaSelected(false); setSelectedId(l.id); }}
                                    onChange={(patch: any) => updateLayer(l.id, patch)} nodeRef={registerNode} />
                            ))}

                            {/* Design Layer Transformer */}
                            <Transformer ref={trRef} rotateEnabled keepRatio flipEnabled={false} anchorStroke="#1a6b1a" anchorFill="#fff" anchorSize={10} anchorCornerRadius={5} borderStroke="#1a6b1a" borderStrokeWidth={1.5} />
                        </Layer>
                    </Stage>
                    {layers.length === 0 && <div className="creator-canvas-hint"><ImageIcon size={32} /><p>Bấm vào hình thiết kế ở cột trái để chèn và căn chỉnh trên phôi</p></div>}
                </div>

                {areas.length > 1 && (
                    <div className="creator-face-pills">
                        {areas.map((a: any) => (
                            <button key={a.key} type="button" className={`creator-face-pill ${activeFace === a.key ? 'active' : ''}`} onClick={() => setActiveFace(a.key)}>
                                {a.label || a.key}{(faces[a.key] || []).length > 0 && <span className="creator-face-dot" />}
                            </button>
                        ))}
                    </div>
                )}
                <div className="creator-zoombar">
                    Phôi: <b>{blank.title}</b> ({blank.dimensions_info || '72×54cm'}) · Vùng in: {area?.label || area?.key} ({(sp.width * 0.1).toFixed(1)}×{(sp.height * 0.1).toFixed(1)}cm) {isTshirt && `· Cách cổ: ${distFromCollarCm}cm`}
                </div>
            </div>

            {/* Artwork Placement Controls */}
            <aside className="creator-props">
                <div className="creator-props-head">{blank.title}<span className="creator-props-area">Mặt: {area?.label || area?.key}</span></div>

                {selected ? (
                    <div className="flex flex-col gap-3 p-1">
                        <div className="text-xs font-bold text-stone-900 flex items-center justify-between border-b pb-2">
                            <span>Căn chỉnh & Kích thước hình</span>
                            <button type="button" onClick={() => { removeLayer(selected.id); setSelectedId(null); }} className="text-red-600 hover:text-red-700 text-[11.5px] font-semibold flex items-center gap-1">
                                <Trash2 size={13} /> Xoá hình
                            </button>
                        </div>

                        {/* Real-time Dimensions Readout */}
                        <div className="p-2 rounded bg-stone-50 border border-stone-200 text-xs text-stone-700 flex flex-col gap-1">
                            <div className="flex justify-between font-semibold">
                                <span>Kích thước hình in:</span>
                                <span className="text-[#1a6b1a]">{(selW * 0.1).toFixed(1)} × {(selH * 0.1).toFixed(1)} cm</span>
                            </div>
                            <div className="text-[11px] text-stone-500 flex justify-between">
                                <span>Độ phân giải:</span>
                                <span>{Math.round(selW)} × {Math.round(selH)} px</span>
                            </div>
                        </div>

                        {/* Quick Fit & Alignment Controls */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-stone-600">Căn vị trí hình trên vùng in:</span>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button type="button" onClick={centerHorizontally} className="p-2 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <AlignCenterHorizontal size={14} /> Ngang
                                </button>
                                <button type="button" onClick={centerVertically} className="p-2 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <AlignCenterVertical size={14} /> Dọc
                                </button>
                                <button type="button" onClick={centerBoth} className="p-2 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <Move size={14} /> Căn giữa
                                </button>
                                <button type="button" onClick={alignLeft} className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <AlignLeft size={14} /> Trái
                                </button>
                                <button type="button" onClick={alignRight} className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <AlignRight size={14} /> Phải
                                </button>
                                <button type="button" onClick={alignTop} className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <ChevronUp size={14} /> Trên
                                </button>
                                <button type="button" onClick={alignBottom} className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 flex items-center justify-center gap-1">
                                    <ChevronDown size={14} /> Dưới
                                </button>
                                <button type="button" onClick={toggleFlipH} className={`p-1.5 rounded border text-[11px] font-medium flex items-center justify-center gap-1 ${selected.flipH ? 'border-[#1a6b1a] bg-[#f0f7f0] text-[#1a6b1a]' : 'border-stone-200 bg-white text-stone-700'}`}>
                                    <FlipHorizontal size={14} /> Lật ngang
                                </button>
                                <button type="button" onClick={fitToPrintArea} className="col-span-1.5 p-2 rounded border border-[#cce5cc] bg-[#f0f7f0] text-[#1a6b1a] hover:bg-[#e0f0e0] text-[11px] font-bold flex items-center justify-center gap-1">
                                    <Maximize2 size={14} /> Vừa khung
                                </button>
                                <button type="button" onClick={fillPrintArea} className="col-span-1.5 p-2 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-[11px] font-bold flex items-center justify-center gap-1">
                                    <Sliders size={14} /> Tràn khung
                                </button>
                            </div>
                        </div>

                        {/* Scale slider */}
                        <div className="creator-field">
                            <label className="flex justify-between">Tỷ lệ phóng to <span>{Math.round(selected.scale * 100)}%</span></label>
                            <input type="range" min={5} max={300} value={Math.round(selected.scale * 100)} onChange={e => updateLayer(selected.id, { scale: Number(e.target.value) / 100 })} />
                        </div>

                        {/* Rotation slider & 90 deg rotate */}
                        <div className="creator-field">
                            <div className="flex items-center justify-between mb-1">
                                <label className="mb-0">Góc xoay <span>{Math.round(selected.rotation)}°</span></label>
                                <button type="button" onClick={() => updateLayer(selected.id, { rotation: (selected.rotation + 90) % 360 })} className="text-[11px] font-semibold text-[#1a6b1a] flex items-center gap-1">
                                    <RotateCw size={12} /> Xoay 90°
                                </button>
                            </div>
                            <input type="range" min={-180} max={180} value={Math.round(selected.rotation)} onChange={e => updateLayer(selected.id, { rotation: Number(e.target.value) })} />
                        </div>
                    </div>
                ) : (
                    <p className="creator-props-empty">Chọn một hình trên phôi hoặc bấm ảnh bên trái để căn chỉnh kích thước và vị trí.</p>
                )}

                {outOfBounds && <div className="creator-warn"><AlertTriangle size={14} /> Hình tràn ra ngoài khung in — phần thừa sẽ không được in.</div>}

                {layers.length > 0 && (
                    <div className="creator-layers">
                        <div className="creator-tool-label">Danh sách hình trên mặt in ({layers.length})</div>
                        {[...layers].reverse().map((l: LayerItem) => (
                            <div key={l.id} className={`creator-layer-row ${l.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(l.id)}>
                                <span className="creator-layer-thumb"><img src={abs(l.design?.file_url)} alt="" /></span>
                                <span className="creator-layer-name">{l.design?.name || 'Hình thiết kế'}</span>
                                <button onClick={(e) => { e.stopPropagation(); reorderLayer(l.id, 1); }} title="Lên trên"><ChevronUp size={13} /></button>
                                <button onClick={(e) => { e.stopPropagation(); reorderLayer(l.id, -1); }} title="Xuống dưới"><ChevronDown size={13} /></button>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); if (l.id === selectedId) setSelectedId(null); }} title="Xoá"><Trash2 size={13} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </aside>
        </div>
    );
}

export default Step2DesignEditor;
