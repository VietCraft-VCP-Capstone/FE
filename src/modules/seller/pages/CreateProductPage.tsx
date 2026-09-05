import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2, Upload, ArrowRight, ArrowLeft, Check, Type, Shapes, LayoutTemplate,
    Sticker, Trash2, Image as ImageIcon, AlertTriangle, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Stage, Layer, Image as KImage, Rect, Ellipse, RegularPolygon, Star, Path, Text as KText, Group, Transformer } from 'react-konva';
import { productsService } from '../../product/services/productsService';

const API_ORIGIN = 'http://localhost:8080';
const abs = (u: string) => (u?.startsWith('http') ? u : `${API_ORIGIN}${u}`);
const CANVAS = 460;
const genId = () => Math.random().toString(36).slice(2, 9);

const FONTS = ['Poppins', 'Montserrat', 'Oswald', 'Bebas Neue', 'Lobster', 'Pacifico', 'Anton', 'Dancing Script', 'Playfair Display', 'Roboto Slab', 'Caveat', 'Permanent Marker'];
const FONT_WEIGHTS = '400;700';
let fontsInjected = false;
function ensureFontsLoaded(onReady: () => void) {
    if (!fontsInjected) {
        fontsInjected = true;
        const fam = FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@${FONT_WEIGHTS}`).join('&');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
        document.head.appendChild(link);
    }
    if ((document as any).fonts?.ready) {
        (document as any).fonts.ready.then(() => onReady());
        FONTS.forEach(f => { (document as any).fonts.load(`700 40px "${f}"`).then(() => onReady()).catch(() => {}); });
    } else { setTimeout(onReady, 800); }
}
const SWATCHES = ['#1a1a1a', '#ffffff', '#e11d48', '#f59e0b', '#facc15', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];
const SHAPES = [
    { key: 'rect', label: 'Chữ nhật' }, { key: 'circle', label: 'Tròn' },
    { key: 'triangle', label: 'Tam giác' }, { key: 'star', label: 'Sao' }, { key: 'heart', label: 'Tim' },
];
const HEART_PATH = 'M16 29 C16 29 2 20 2 11 C2 6 6 3 10 3 C13 3 15 5 16 7 C17 5 19 3 22 3 C30 20 16 29 16 29 Z';

interface L {
    id: string; type: 'image' | 'text' | 'shape';
    x: number; y: number; scale: number; rotation: number;
    design?: any; baseW?: number; baseH?: number;
    text?: string; fontFamily?: string; fontSize?: number; fontWeight?: string; color?: string;
    shape?: string; fill?: string; stroke?: string; strokeWidth?: number; w?: number; h?: number;
}

function useHTMLImage(src?: string) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        if (!src) { setImg(null); return; }
        const i = new window.Image(); i.crossOrigin = 'anonymous'; i.src = abs(src);
        i.onload = () => setImg(i);
    }, [src]);
    return img;
}

const STEPS = ['Chọn phôi', 'Thiết kế', 'Xem trước', 'Biến thể & giá'];

export function CreateProductPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<any[]>([]);
    const [blanks, setBlanks] = useState<any[]>([]);
    const [designs, setDesigns] = useState<any[]>([]);
    const [loadErr, setLoadErr] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [blank, setBlank] = useState<any | null>(null);
    const [faces, setFaces] = useState<Record<string, L[]>>({});
    const [activeFace, setActiveFace] = useState<string>('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, { on: boolean; markup: string; stock: string }>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([productsService.getCategories(), productsService.getBlanks(), productsService.getMyDesigns()])
            .then(([c, b, d]) => { setCategories(c); setBlanks(b); setDesigns(d); })
            .catch((e) => setLoadErr(e.response?.data?.error || 'Không tải được dữ liệu (phôi/danh mục).'));
    }, []);

    const areaOf = (key: string) => (blank?.print_areas || []).find((a: any) => a.key === key) || blank?.print_areas?.[0];
    const spaceOf = (a: any) => a?.surface === 'wrap'
        ? { x: 0, y: 0, width: a.template_w || 2475, height: a.template_h || 1155 }
        : { x: a.x, y: a.y, width: a.width, height: a.height };

    const chooseBlank = (b: any) => {
        setBlank(b);
        const initV: Record<string, any> = {};
        b.variations.forEach((v: any) => { initV[v.sku] = { on: false, markup: '30000', stock: '100' }; });
        setSelectedVariants(initV);
        const initF: Record<string, L[]> = {};
        (b.print_areas || []).forEach((a: any) => { initF[a.key] = []; });
        setFaces(initF); setActiveFace(b.print_areas?.[0]?.key || 'front'); setSelectedId(null);
    };

    const addLayer = (l: L) => { setFaces(prev => ({ ...prev, [activeFace]: [...(prev[activeFace] || []), l] })); setSelectedId(l.id); };
    const updateLayer = (id: string, patch: Partial<L>) =>
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).map(l => l.id === id ? { ...l, ...patch } : l) }));
    const removeLayer = (id: string) =>
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).filter(l => l.id !== id) }));
    const reorderLayer = (id: string, dir: 1 | -1) => setFaces(prev => {
        const arr = [...(prev[activeFace] || [])]; const i = arr.findIndex(l => l.id === id);
        const j = i + dir; if (i < 0 || j < 0 || j >= arr.length) return prev;
        [arr[i], arr[j]] = [arr[j], arr[i]]; return { ...prev, [activeFace]: arr };
    });

    const addText = () => {
        const a = spaceOf(areaOf(activeFace));
        addLayer({ id: genId(), type: 'text', text: 'Chữ của bạn', fontFamily: 'Arial', fontSize: Math.round(a.height * 0.14), fontWeight: 'bold', color: '#1a1a1a', x: a.x + a.width * 0.1, y: a.y + a.height * 0.42, scale: 1, rotation: 0 });
    };
    const addShape = (shape: string, fill = '#7c3aed') => {
        const a = spaceOf(areaOf(activeFace)); const s = Math.min(a.width, a.height) * 0.5;
        addLayer({ id: genId(), type: 'shape', shape, fill, stroke: 'none', strokeWidth: 0, w: s, h: s, x: a.x + (a.width - s) / 2, y: a.y + (a.height - s) / 2, scale: 1, rotation: 0 });
    };
    const addImageDesign = (d: any) => {
        const a = spaceOf(areaOf(activeFace));
        const img = new window.Image(); img.crossOrigin = 'anonymous'; img.src = abs(d.file_url);
        img.onload = () => {
            const baseW = img.naturalWidth, baseH = img.naturalHeight;
            const s = Math.min(a.width / baseW, a.height / baseH);
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: a.x + (a.width - baseW * s) / 2, y: a.y + (a.height - baseH * s) / 2, scale: s, rotation: 0 });
        };
    };
    const applyTemplate = (tpl: string) => {
        const a = spaceOf(areaOf(activeFace)); const cx = a.x + a.width / 2, cy = a.y + a.height / 2;
        const base = { scale: 1, rotation: 0 };
        const dim = Math.min(a.width, a.height);
        const centeredText = (text: string, fontSize: number, opts: Partial<L>): L => {
            const w = fontSize * text.length * 0.62;
            return { id: genId(), type: 'text', text, fontSize, fontWeight: 'bold', color: '#1a1a1a', x: cx - w / 2, ...base, ...opts } as L;
        };
        let layers: L[] = [];
        if (tpl === 'badge') {
            const s = dim * 0.82;
            layers = [
                { id: genId(), type: 'shape', shape: 'circle', fill: '#ffffff', stroke: '#1a1a1a', strokeWidth: 8, w: s, h: s, x: cx - s / 2, y: cy - s / 2, ...base },
                centeredText('VIETCRAFT', Math.round(dim * 0.13), { fontFamily: 'Oswald', y: cy - dim * 0.08 }),
            ];
        } else if (tpl === 'star') {
            const s = dim * 0.88;
            layers = [
                { id: genId(), type: 'shape', shape: 'star', fill: '#facc15', stroke: '#f59e0b', strokeWidth: 4, w: s, h: s, x: cx - s / 2, y: cy - s / 2, ...base },
                centeredText('BEST', Math.round(dim * 0.15), { fontFamily: 'Anton', y: cy - dim * 0.09 }),
            ];
        } else if (tpl === 'text') {
            layers = [
                centeredText('TIÊU ĐỀ', Math.round(dim * 0.18), { fontFamily: 'Anton', color: '#e11d48', y: cy - dim * 0.16 }),
                centeredText('phụ đề ở đây', Math.round(dim * 0.09), { fontFamily: 'Poppins', fontWeight: 'normal', y: cy + dim * 0.04 }),
            ];
        } else if (tpl === 'frame') {
            const fw = a.width * 0.82, fh = a.height * 0.82;
            layers = [
                { id: genId(), type: 'shape', shape: 'rect', fill: 'none', stroke: '#1a1a1a', strokeWidth: 6, w: fw, h: fh, x: cx - fw / 2, y: cy - fh / 2, ...base },
                centeredText('HANDMADE', Math.round(dim * 0.11), { fontFamily: 'Bebas Neue', y: cy - dim * 0.06 }),
            ];
        }
        setFaces(prev => ({ ...prev, [activeFace]: [...(prev[activeFace] || []), ...layers] }));
        setSelectedId(layers[layers.length - 1]?.id || null);
    };

    const doUpload = async (file: File) => {
        setUploading(true); setError('');
        try {
            const d = await productsService.uploadDesign(file, file.name);
            setDesigns(prev => [d, ...prev]); addImageDesign(d);
        } catch (e: any) { setError(e.response?.data?.error || 'Upload thất bại'); }
        finally { setUploading(false); }
    };

    const placedFaces = () => Object.entries(faces).filter(([, ls]) => ls.length > 0);

    const canNext = () => {
        if (step === 1) return !!title.trim() && description.trim().length >= 10 && !!categoryId && !!blank;
        if (step === 2) return placedFaces().length > 0;
        if (step === 3) return true;
        if (step === 4) return Object.values(selectedVariants).some(v => v.on);
        return true;
    };

    const toApiLayer = (l: L) => {
        const base = { x: l.x, y: l.y, scale: l.scale, rotation: l.rotation };
        if (l.type === 'image') return { type: 'image', design_id: l.design._id, width: l.baseW, ...base };
        if (l.type === 'text') return { type: 'text', text: l.text, font_family: l.fontFamily, font_size: l.fontSize, font_weight: l.fontWeight, color: l.color, ...base };
        return { type: 'shape', shape: l.shape, fill: l.fill, stroke: l.stroke, stroke_width: l.strokeWidth, width: l.w, height: l.h, ...base };
    };

    const submit = async () => {
        setSaving(true); setError('');
        const variants = Object.entries(selectedVariants).filter(([, v]) => v.on)
            .map(([sku, v]) => ({ sku, markup: Number(v.markup) || 0, stock: Number(v.stock) || 0 }));
        const designPlacements = placedFaces().map(([key, ls]) => ({ print_area_key: key, layers: ls.map(toApiLayer) }));
        try {
            await productsService.create({ title, description, categoryId, blankId: blank._id, variants, designPlacements });
            navigate('/seller/products');
        } catch (e: any) {
            const d = e.response?.data;
            setError(d?.errors ? d.errors.join('; ') : (d?.error || 'Tạo sản phẩm thất bại'));
            setStep(4);
        } finally { setSaving(false); }
    };

    const layers = faces[activeFace] || [];
    const selected = layers.find(l => l.id === selectedId) || null;

    return (
        <div className="creator-page animate-fade-in">
            {/* Header */}
            <div className="creator-page-head">
                <button className="creator-back" onClick={() => navigate('/seller/products')}><ArrowLeft size={16} /> Sản phẩm</button>
                <h1>Tạo sản phẩm POD</h1>
                <div className="creator-page-head-actions">
                    {step > 1 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-admin-brand focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Quay lại</button>}
                    {step < 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-admin-brand focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed" disabled={!canNext()} onClick={() => setStep(step + 1)}>Tiếp <ArrowRight size={15} /></button>}
                    {step === 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-admin-brand focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed" disabled={!canNext() || saving} onClick={submit}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Tạo & Publish</button>}
                </div>
            </div>

            {/* Stepper Navigation */}
            <div className="pod-steps creator-page-steps">
                {STEPS.map((label, i) => (
                    <div key={i} className={`pod-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
                        <span className="pod-step-num">{step > i + 1 ? <Check size={13} /> : i + 1}</span> {label}
                    </div>
                ))}
            </div>

            {loadErr && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{loadErr}</div>}
            {error && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{error}</div>}

            {/* Step Body */}
            <div className="creator-page-body">
                {step === 1 && (
                    <Step1 title={title} setTitle={setTitle} description={description} setDescription={setDescription}
                        categories={categories} categoryId={categoryId} setCategoryId={setCategoryId}
                        blanks={blanks} blank={blank} chooseBlank={chooseBlank} />
                )}
                {step === 2 && blank && (
                    <DesignStep
                        blank={blank} designs={designs} faces={faces} activeFace={activeFace}
                        setActiveFace={(k: string) => { setActiveFace(k); setSelectedId(null); }}
                        layers={layers} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId}
                        updateLayer={updateLayer} removeLayer={removeLayer} reorderLayer={reorderLayer}
                        addText={addText} addShape={addShape} addImageDesign={addImageDesign} applyTemplate={applyTemplate}
                        uploading={uploading} onUpload={doUpload} fileRef={fileRef} areaOf={areaOf} spaceOf={spaceOf}
                    />
                )}
                {step === 3 && blank && <PreviewStep blank={blank} faces={faces} toApiLayer={toApiLayer} title={title} selectedVariants={selectedVariants} />}
                {step === 4 && blank && <VariantStep blank={blank} selectedVariants={selectedVariants} setSelectedVariants={setSelectedVariants} />}
            </div>
        </div>
    );
}

// Step 1 Component
function Step1({ title, setTitle, description, setDescription, categories, categoryId, setCategoryId, blanks, blank, chooseBlank }: any) {
    return (
        <div className="creator-step1">
            <div className="creator-step1-form">
                <div className="mb-[18px] last:mb-0"><label className="block text-[13px] font-semibold text-admin-ink mb-[7px]">Tên sản phẩm *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Áo thun mèo cute..." /></div>
                <div className="mb-[18px] last:mb-0"><label className="block text-[13px] font-semibold text-admin-ink mb-[7px]">Mô tả * (≥10 ký tự)</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></div>
                <div className="mb-[18px] last:mb-0"><label className="block text-[13px] font-semibold text-admin-ink mb-[7px]">Danh mục *</label>
                    <select className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] text-admin-ink bg-white outline-none box-border transition-[border-color,box-shadow] duration-150 focus:border-admin-brand focus:shadow-[0_0_0_3px_rgba(26,107,26,0.1)]" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                        <option value="">— Chọn danh mục —</option>
                        {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select></div>
            </div>
            <div className="creator-step1-blanks">
                <label className="creator-blank-label">Chọn phôi in *</label>
                <div className="blank-picker-grid">
                    {blanks.map((b: any) => {
                        const minCost = Math.min(...b.variations.map((v: any) => v.base_cost));
                        const faceCount = (b.print_areas || []).length;
                        return (
                            <button type="button" key={b._id} className={`blank-pick-card ${blank?._id === b._id ? 'selected' : ''}`} onClick={() => chooseBlank(b)}>
                                <img src={abs(b.default_image)} alt={b.title} />
                                <span className="blank-pick-title">{b.title}</span>
                                <span className="blank-pick-cost">Tiền phôi chỉ từ {minCost.toLocaleString()}đ</span>
                                {faceCount > 1 && <span className="blank-pick-faces">{faceCount} mặt in</span>}
                            </button>
                        );
                    })}
                    {blanks.length === 0 && <p className="text-admin-muted">Chưa có phôi nào từ xưởng in.</p>}
                </div>
            </div>
        </div>
    );
}

// Konva Layer Node
function LayerNode({ layer, ratio, offX, offY, onSelect, onChange, nodeRef }: any) {
    const ref = useRef<any>(null);
    useEffect(() => { if (ref.current) nodeRef(layer.id, ref.current); }, [layer.id, layer.type]);
    const designImg = useHTMLImage(layer.type === 'image' ? layer.design?.file_url : undefined);

    const groupProps = {
        ref,
        x: offX + layer.x * ratio, y: offY + layer.y * ratio,
        scaleX: layer.scale * ratio, scaleY: layer.scale * ratio, rotation: layer.rotation,
        draggable: true,
        onClick: onSelect, onTap: onSelect,
        onDragEnd: (e: any) => onChange({ x: (e.target.x() - offX) / ratio, y: (e.target.y() - offY) / ratio }),
        onTransformEnd: () => {
            const n = ref.current; if (!n) return;
            onChange({ scale: n.scaleX() / ratio, rotation: n.rotation(), x: (n.x() - offX) / ratio, y: (n.y() - offY) / ratio });
        },
    };

    let child = null;
    let hitW = 0, hitH = 0;
    if (layer.type === 'image') { child = designImg ? <KImage image={designImg} width={layer.baseW} height={layer.baseH} /> : null; hitW = layer.baseW || 0; hitH = layer.baseH || 0; }
    else if (layer.type === 'text') {
        child = <KText text={layer.text} fontFamily={layer.fontFamily} fontSize={layer.fontSize} fontStyle={layer.fontWeight === 'bold' ? 'bold' : 'normal'} fill={layer.color} />;
        hitW = (layer.fontSize || 40) * (layer.text?.length || 4) * 0.62; hitH = (layer.fontSize || 40) * 1.3;
    }
    else {
        const w = layer.w, h = layer.h, fill = layer.fill === 'none' ? undefined : layer.fill, stroke = layer.stroke === 'none' ? undefined : layer.stroke, sw = layer.strokeWidth || 0;
        hitW = w || 0; hitH = h || 0;
        if (layer.shape === 'circle') child = <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
        else if (layer.shape === 'triangle') child = <RegularPolygon x={w / 2} y={h / 2} sides={3} radius={w / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
        else if (layer.shape === 'star') child = <Star x={w / 2} y={h / 2} numPoints={5} innerRadius={w * 0.2} outerRadius={w / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
        else if (layer.shape === 'heart') child = <Path data={HEART_PATH} scaleX={w / 32} scaleY={h / 32} fill={fill} stroke={stroke} strokeWidth={sw} />;
        else child = <Rect width={w} height={h} cornerRadius={Math.min(w, h) * 0.04} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    return (
        <Group {...groupProps}>
            <Rect width={hitW} height={hitH} fill="rgba(0,0,0,0.001)" />
            {child}
        </Group>
    );
}

// Step 2 Component: Design Editor
function DesignStep({ blank, designs, faces, activeFace, setActiveFace, layers, selected, selectedId, setSelectedId,
    updateLayer, removeLayer, reorderLayer, addText, addShape, addImageDesign, applyTemplate, uploading, onUpload, fileRef, areaOf, spaceOf }: any) {
    const areas = blank.print_areas || [];
    const area = areaOf(activeFace);
    const isWrap = area?.surface === 'wrap';
    const sp = spaceOf(area);
    const [leftTab, setLeftTab] = useState<'add' | 'uploads' | 'templates' | 'clipart'>('add');

    const blankImg = useHTMLImage(isWrap ? undefined : (area?.image || blank.default_image));
    const trRef = useRef<any>(null);
    const nodeMap = useRef<Record<string, any>>({});
    const registerNode = (id: string, node: any) => { nodeMap.current[id] = node; };
    const [, setFontTick] = useState(0);

    useEffect(() => { ensureFontsLoaded(() => setFontTick(t => t + 1)); }, []);

    const natW = isWrap ? sp.width : (blankImg?.naturalWidth || 800);
    const natH = isWrap ? sp.height : (blankImg?.naturalHeight || 800);
    const ratio = CANVAS / Math.max(natW, natH);
    const dispW = natW * ratio, dispH = natH * ratio;
    const offX = (CANVAS - dispW) / 2, offY = (CANVAS - dispH) / 2;

    useEffect(() => {
        const tr = trRef.current; if (!tr) return;
        const node = selectedId ? nodeMap.current[selectedId] : null;
        tr.nodes(node ? [node] : []); tr.getLayer()?.batchDraw();
    }, [selectedId, layers, activeFace]);

    let outOfBounds = false;
    if (selected && sp) {
        const w = (selected.type === 'image' ? (selected.baseW || 100) : selected.type === 'shape' ? (selected.w || 100) : (selected.fontSize || 40) * (selected.text?.length || 4) * 0.6) * selected.scale;
        const h = (selected.type === 'image' ? (selected.baseH || 100) : selected.type === 'shape' ? (selected.h || 100) : (selected.fontSize || 40) * 1.3) * selected.scale;
        outOfBounds = selected.x < sp.x - 2 || selected.y < sp.y - 2 || selected.x + w > sp.x + sp.width + 2 || selected.y + h > sp.y + sp.height + 2;
    }

    return (
        <div className="creator">
            {/* Tool Rail Navigation */}
            <nav className="creator-rail">
                {[
                    { k: 'add', icon: <Shapes size={19} />, label: 'Thêm' },
                    { k: 'templates', icon: <LayoutTemplate size={19} />, label: 'Mẫu' },
                    { k: 'clipart', icon: <Sticker size={19} />, label: 'Clipart' },
                    { k: 'uploads', icon: <ImageIcon size={19} />, label: 'Ảnh' },
                ].map(t => (
                    <button key={t.k} type="button" className={`creator-rail-btn ${leftTab === t.k ? 'active' : ''}`} onClick={() => setLeftTab(t.k as any)}>
                        {t.icon}<span>{t.label}</span>
                    </button>
                ))}
            </nav>

            {/* Tool Flyout Panel */}
            <aside className="creator-flyout">
                {leftTab === 'add' && (
                    <div className="creator-tool-body">
                        <div className="creator-flyout-title">Thêm nội dung</div>
                        <button type="button" className="creator-tool-btn" onClick={addText}><Type size={16} /> Thêm chữ</button>
                        <div className="creator-tool-label">Hình khối</div>
                        <div className="creator-shape-grid">
                            {SHAPES.map(s => <button key={s.key} type="button" className="creator-shape-btn" title={s.label} onClick={() => addShape(s.key)}><ShapeIcon shape={s.key} /></button>)}
                        </div>
                    </div>
                )}
                {leftTab === 'templates' && (
                    <div className="creator-tool-body">
                        <div className="creator-flyout-title">Mẫu thiết kế sẵn</div>
                        <button type="button" className="creator-tpl-btn" onClick={() => applyTemplate('text')}>Tiêu đề + phụ đề</button>
                        <button type="button" className="creator-tpl-btn" onClick={() => applyTemplate('badge')}>Huy hiệu tròn</button>
                        <button type="button" className="creator-tpl-btn" onClick={() => applyTemplate('star')}>Ngôi sao BEST</button>
                        <button type="button" className="creator-tpl-btn" onClick={() => applyTemplate('frame')}>Khung chữ nhật</button>
                    </div>
                )}
                {leftTab === 'clipart' && (
                    <div className="creator-tool-body">
                        <div className="creator-flyout-title">Clipart nhanh</div>
                        <div className="creator-shape-grid">
                            {[{ s: 'heart', c: '#e11d48' }, { s: 'star', c: '#facc15' }, { s: 'circle', c: '#0ea5e9' }, { s: 'triangle', c: '#22c55e' }, { s: 'heart', c: '#ec4899' }, { s: 'star', c: '#f59e0b' }].map((c, i) =>
                                <button key={i} type="button" className="creator-shape-btn" onClick={() => addShape(c.s, c.c)} style={{ color: c.c }}><ShapeIcon shape={c.s} /></button>)}
                        </div>
                    </div>
                )}
                {leftTab === 'uploads' && (
                    <div className="creator-tool-body">
                        <div className="creator-flyout-title">Ảnh của bạn</div>
                        <input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                        <button type="button" className="creator-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}{uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                        </button>
                        <div className="creator-asset-grid">
                            {designs.map((d: any) => (
                                <button type="button" key={d._id} className="creator-asset" onClick={() => addImageDesign(d)} title={d.name}>
                                    <img src={abs(d.file_url)} alt={d.name} />
                                </button>
                            ))}
                            {designs.length === 0 && <div className="creator-asset-empty"><ImageIcon size={26} /><span>Chưa có ảnh</span></div>}
                        </div>
                    </div>
                )}
            </aside>

            {/* Central Stage Canvas */}
            <div className="creator-canvas-wrap">
                {isWrap && <div className="creator-wrap-hint"><LayoutTemplate size={13} /> Bề mặt cuộn — thiết kế trải phẳng toàn thân, tràn viền để phủ kín khi cuộn quanh cốc.</div>}
                <div className="creator-stage-shell">
                    <Stage width={CANVAS} height={CANVAS} className="creator-stage"
                        onMouseDown={(e: any) => { if (e.target === e.target.getStage()) setSelectedId(null); }}>
                        <Layer>
                            {isWrap
                                ? <Rect x={offX} y={offY} width={dispW} height={dispH} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} listening={false} />
                                : (blankImg && <KImage image={blankImg} x={offX} y={offY} width={dispW} height={dispH} listening={false} />)}
                            <Rect x={offX + sp.x * ratio} y={offY + sp.y * ratio} width={sp.width * ratio} height={sp.height * ratio} stroke="#1a6b1a" dash={[7, 5]} strokeWidth={1.5} opacity={0.55} listening={false} />
                            {layers.map((l: L) => (
                                <LayerNode key={l.id} layer={l} ratio={ratio} offX={offX} offY={offY}
                                    isSelected={l.id === selectedId} onSelect={() => setSelectedId(l.id)}
                                    onChange={(patch: any) => updateLayer(l.id, patch)} nodeRef={registerNode} />
                            ))}
                            <Transformer ref={trRef} rotateEnabled keepRatio flipEnabled={false} anchorStroke="#1a6b1a" anchorFill="#fff" anchorSize={10} anchorCornerRadius={5} borderStroke="#1a6b1a" borderStrokeWidth={1.5} />
                        </Layer>
                    </Stage>
                    {layers.length === 0 && <div className="creator-canvas-hint"><Shapes size={30} /><p>Thêm chữ, hình khối, mẫu hoặc ảnh để bắt đầu</p></div>}
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
                <div className="creator-zoombar"><span>{Math.round(ratio * 100 / (CANVAS / Math.max(natW, natH)))}%</span> · Vùng in {Math.round(sp.width)}×{Math.round(sp.height)}px</div>
            </div>

            {/* Properties & Layers Panel */}
            <aside className="creator-props">
                <div className="creator-props-head">{blank.title}<span className="creator-props-area">Đang chỉnh: {area?.label || area?.key}</span></div>

                {selected ? <LayerProps layer={selected} update={(p: any) => updateLayer(selected.id, p)} onDelete={() => { removeLayer(selected.id); setSelectedId(null); }} /> :
                    <p className="creator-props-empty">Chọn một lớp trên canvas để chỉnh, hoặc thêm nội dung từ cột trái.</p>}

                {outOfBounds && <div className="creator-warn"><AlertTriangle size={14} /> Lớp đang chọn tràn ra ngoài vùng in — phần thừa sẽ không được in.</div>}

                {layers.length > 0 && (
                    <div className="creator-layers">
                        <div className="creator-tool-label">Các lớp ({layers.length})</div>
                        {[...layers].reverse().map((l: L) => (
                            <div key={l.id} className={`creator-layer-row ${l.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(l.id)}>
                                <span className="creator-layer-thumb"><LayerThumb layer={l} /></span>
                                <span className="creator-layer-name">{l.type === 'text' ? (l.text || 'Chữ') : l.type === 'image' ? (l.design?.name || 'Ảnh') : (SHAPES.find(s => s.key === l.shape)?.label || 'Hình')}</span>
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

function LayerThumb({ layer }: { layer: L }) {
    if (layer.type === 'image') return <img src={abs(layer.design?.file_url)} alt="" />;
    if (layer.type === 'text') return <Type size={14} />;
    return <span style={{ color: layer.fill && layer.fill !== 'none' ? layer.fill : '#1a6b1a' }}><ShapeIcon shape={layer.shape || 'rect'} /></span>;
}

function ShapeIcon({ shape }: { shape: string }) {
    const p: any = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'currentColor' };
    if (shape === 'circle') return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
    if (shape === 'triangle') return <svg {...p}><polygon points="12,3 21,20 3,20" /></svg>;
    if (shape === 'star') return <svg {...p}><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" /></svg>;
    if (shape === 'heart') return <svg {...p}><path d="M12 21 C12 21 3 14 3 8 C3 5 5 3 8 3 C10 3 11 4 12 6 C13 4 14 3 16 3 C19 3 21 5 21 8 C21 14 12 21 12 21 Z" /></svg>;
    return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /></svg>;
}

function LayerProps({ layer, update, onDelete }: any) {
    return (
        <div className="creator-layerprops">
            {layer.type === 'text' && (
                <>
                    <div className="creator-field"><label>Nội dung chữ</label>
                        <input value={layer.text} onChange={e => update({ text: e.target.value })} /></div>
                    <div className="creator-field"><label>Font chữ</label>
                        <select className="creator-font-select" value={layer.fontFamily} onChange={e => update({ fontFamily: e.target.value })} style={{ fontFamily: layer.fontFamily }}>
                            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f, fontSize: 15 }}>{f}</option>)}
                        </select></div>
                    <div className="creator-field"><label>Cỡ chữ <span>{layer.fontSize}px</span></label>
                        <input type="range" min={12} max={200} value={layer.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })} /></div>
                    <div className="creator-field"><label>Kiểu</label>
                        <div className="creator-btn-group">
                            <button className={layer.fontWeight === 'normal' ? 'active' : ''} onClick={() => update({ fontWeight: 'normal' })}>Thường</button>
                            <button className={layer.fontWeight === 'bold' ? 'active' : ''} onClick={() => update({ fontWeight: 'bold' })}>Đậm</button>
                        </div></div>
                    <ColorField label="Màu chữ" value={layer.color} onChange={(c: string) => update({ color: c })} />
                </>
            )}
            {layer.type === 'shape' && (
                <>
                    <ColorField label="Màu nền" value={layer.fill} onChange={(c: string) => update({ fill: c })} allowNone />
                    <ColorField label="Màu viền" value={layer.stroke} onChange={(c: string) => update({ stroke: c })} allowNone />
                    <div className="creator-field"><label>Độ dày viền <span>{layer.strokeWidth || 0}px</span></label>
                        <input type="range" min={0} max={30} value={layer.strokeWidth || 0} onChange={e => update({ strokeWidth: Number(e.target.value) })} /></div>
                </>
            )}
            {layer.type === 'image' && <div className="creator-thumb-dim">Ảnh {layer.baseW} × {layer.baseH} px</div>}

            <div className="creator-field"><label>Kích thước <span>{Math.round(layer.scale * 100)}%</span></label>
                <input type="range" min={5} max={300} value={Math.round(layer.scale * 100)} onChange={e => update({ scale: Number(e.target.value) / 100 })} /></div>
            <div className="creator-field"><label>Xoay <span>{Math.round(layer.rotation)}°</span></label>
                <input type="range" min={-180} max={180} value={Math.round(layer.rotation)} onChange={e => update({ rotation: Number(e.target.value) })} /></div>
            <button type="button" className="creator-delete-btn" onClick={onDelete}><Trash2 size={14} /> Xoá lớp này</button>
        </div>
    );
}

function ColorField({ label, value, onChange, allowNone }: any) {
    return (
        <div className="creator-field">
            <label>{label}</label>
            <div className="creator-swatches">
                {allowNone && <button className={`creator-swatch none ${value === 'none' ? 'active' : ''}`} onClick={() => onChange('none')} title="Không màu">/</button>}
                {SWATCHES.map(c => <button key={c} className={`creator-swatch ${value === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange(c)} />)}
                <label className="creator-swatch custom" title="Màu tuỳ chọn">
                    <input type="color" value={value && value !== 'none' ? value : '#000000'} onChange={e => onChange(e.target.value)} />+
                </label>
            </div>
        </div>
    );
}

// Step 3 Component: Product Preview
function PreviewStep({ blank, faces, toApiLayer, title, selectedVariants }: any) {
    const areas = (blank.print_areas || []).filter((a: any) => (faces[a.key] || []).length > 0);
    const [images, setImages] = useState<string[] | null>(null);
    const [active, setActive] = useState(0);
    const [err, setErr] = useState('');

    useEffect(() => {
        const placements = areas.map((a: any) => ({ print_area_key: a.key, layers: (faces[a.key] || []).map(toApiLayer) }));
        setImages(null); setErr('');
        productsService.previewMockup(blank._id, placements)
            .then(setImages)
            .catch((e: any) => setErr(e.response?.data?.error || 'Không tạo được xem trước'));
    }, [blank._id]);

    const chosen = Object.entries(selectedVariants || {}).filter(([, v]: any) => v.on);
    const prices = (chosen.length ? chosen : blank.variations.map((v: any) => [v.sku, { markup: '0' }]))
        .map(([sku, v]: any) => { const bv = blank.variations.find((x: any) => x.sku === sku); return bv ? bv.base_cost + (Number(v.markup) || 0) : 0; })
        .filter((n: number) => n > 0);
    const minPrice = prices.length ? Math.min(...prices) : Math.min(...blank.variations.map((v: any) => v.base_cost));

    return (
        <div className="preview-step">
            {err && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{err}</div>}
            {!images && !err && <div className="preview-loading"><Loader2 size={26} className="animate-spin" /><span>Đang tạo mockup thật...</span></div>}
            {images && (
                <div className="preview-showcase">
                    {/* Gallery View */}
                    <div className="preview-gallery">
                        <div className="preview-hero">
                            <img src={abs(images[active] || images[0])} alt="mockup" />
                        </div>
                        {images.length > 1 && (
                            <div className="preview-thumbs">
                                {images.map((src, i) => (
                                    <button key={i} type="button" className={`preview-thumb ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
                                        <img src={abs(src)} alt={areas[i]?.label} />
                                        <span>{areas[i]?.label || areas[i]?.key}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Details Panel */}
                    <div className="preview-info">
                        <div className="preview-info-badge"><Check size={13} /> Xem trước như khách hàng thấy</div>
                        <h2 className="preview-info-title">{title || 'Sản phẩm POD'}</h2>
                        <div className="preview-info-price">
                            <span className="preview-info-from">Giá bán chỉ từ</span>
                            <span className="preview-info-amount">{minPrice.toLocaleString()}đ</span>
                        </div>
                        <div className="preview-info-meta">
                            <div className="preview-info-row"><span>Phôi in</span><b>{blank.title}</b></div>
                            <div className="preview-info-row"><span>Số mặt thiết kế</span><b>{areas.length} mặt</b></div>
                            <div className="preview-info-row"><span>Biến thể đang bán</span><b>{chosen.length || 'chưa chọn'}</b></div>
                        </div>
                        <div className="preview-info-faces">
                            {areas.map((a: any, i: number) => (
                                <span key={a.key} className={`preview-face-chip ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
                                    <Check size={12} /> {a.label || a.key}
                                </span>
                            ))}
                        </div>
                        <p className="preview-info-note">Mockup được tạo tự động từ thiết kế của bạn. Bấm <b>Tiếp</b> để đặt giá và xuất bản.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 4 Component: Pricing & Variants
function VariantStep({ blank, selectedVariants, setSelectedVariants }: any) {
    const setV = (sku: string, f: string, val: any) => setSelectedVariants((prev: any) => ({ ...prev, [sku]: { ...prev[sku], [f]: val } }));
    return (
        <div className="pod-variant-step">
            <p className="text-admin-muted mb-2.5">Chọn biến thể muốn bán và đặt tiền lời (markup). Giá bán = tiền phôi + markup.</p>
            <table className="w-full border-collapse text-[13.5px] text-left [&_thead_th]:bg-[#fafcfa] [&_thead_th]:px-[18px] [&_thead_th]:py-3 [&_thead_th]:text-[11.5px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-admin-muted [&_thead_th]:border-b [&_thead_th]:border-admin-line [&_thead_th]:whitespace-nowrap [&_tbody_td]:px-[18px] [&_tbody_td]:py-[14px] [&_tbody_td]:border-b [&_tbody_td]:border-admin-line-soft [&_tbody_td]:text-admin-body [&_tbody_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#fafdfa] [&_td:last-child]:text-right pod-variant-table">
                <thead><tr><th></th><th>Biến thể</th><th>Tiền phôi</th><th>Markup (đ)</th><th>Giá bán</th><th>Kho</th></tr></thead>
                <tbody>
                    {blank.variations.map((v: any) => {
                        const sv = selectedVariants[v.sku] || { on: false, markup: '0', stock: '0' };
                        const retail = v.base_cost + (Number(sv.markup) || 0);
                        return (
                            <tr key={v.sku} className={sv.on ? '' : 'row-off'}>
                                <td><input type="checkbox" checked={sv.on} onChange={e => setV(v.sku, 'on', e.target.checked)} /></td>
                                <td>{[v.color, v.size].filter(Boolean).join(' / ') || v.sku}</td>
                                <td className="text-admin-muted">{v.base_cost.toLocaleString()}đ</td>
                                <td><input type="number" value={sv.markup} disabled={!sv.on} onChange={e => setV(v.sku, 'markup', e.target.value)} style={{ width: 90 }} /></td>
                                <td className="pod-retail">{retail.toLocaleString()}đ</td>
                                <td><input type="number" value={sv.stock} disabled={!sv.on} onChange={e => setV(v.sku, 'stock', e.target.value)} style={{ width: 70 }} /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default CreateProductPage;
