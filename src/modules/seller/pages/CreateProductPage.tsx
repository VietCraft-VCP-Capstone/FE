import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { abs } from '../components/create-product/useHTMLImage';
import { Step1PrinterAndBlank } from '../components/create-product/Step1PrinterAndBlank';
import { Step2DesignEditor, LayerItem } from '../components/create-product/Step2DesignEditor';
import { Step3MockupPreview } from '../components/create-product/Step3MockupPreview';
import { Step4ProductDetails } from '../components/create-product/Step4ProductDetails';

const PRINTERS = [
    { id: 'all', name: 'Tất cả xưởng in', desc: 'Tất cả phôi khả dụng từ các xưởng đã liên kết API', badge: 'Hệ thống API' },
    { id: 'vietcraft-direct', name: 'Xưởng In VietCraft Direct', desc: 'Xưởng in chính hãng VietCraft - Tự động đồng bộ vận đơn', badge: 'API Web Printer' },
    { id: 'nam-dinh-pod', name: 'Xưởng In Nam Định POD', desc: 'Chuyên phôi Áo thun Oversize & Hoodie Cotton Premium', badge: 'API Web Printer' },
    { id: 'sai-gon-hub', name: 'Xưởng In Sài Gòn PrintHub', desc: 'Chuyên ly sứ, túi tote & quà tặng in 3D uốn cong', badge: 'API Web Printer' },
];

const STEPS = ['Chọn xưởng & phôi', 'Thiết kế phôi', 'Xem trước', 'Thông tin & giá'];
const genId = () => Math.random().toString(36).slice(2, 9);

export function CreateProductPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<any[]>([]);
    const [blanks, setBlanks] = useState<any[]>([]);
    const [designs, setDesigns] = useState<any[]>([]);
    const [loadErr, setLoadErr] = useState('');

    const [selectedPrinter, setSelectedPrinter] = useState('all');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [blank, setBlank] = useState<any | null>(null);
    const [faces, setFaces] = useState<Record<string, LayerItem[]>>({});
    const [activeFace, setActiveFace] = useState<string>('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, { on: boolean; markup: string; stock: string }>>({});
    const [areaOverrides, setAreaOverrides] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([productsService.getCategories(), productsService.getBlanks(), productsService.getMyDesigns()])
            .then(([c, b, d]) => { setCategories(c); setBlanks(b); setDesigns(d); })
            .catch((e) => setLoadErr(e.response?.data?.error || 'Không tải được dữ liệu (phôi/danh mục).'));
    }, []);

    const filteredBlanks = blanks.filter((b: any) => {
        if (selectedPrinter === 'vietcraft-direct') return b._id.includes('tshirt');
        if (selectedPrinter === 'nam-dinh-pod') return b._id.includes('tshirt') || b._id.includes('tote');
        if (selectedPrinter === 'sai-gon-hub') return b._id.includes('mug') || b._id.includes('frame');
        return true;
    });

    const areaOf = (key: string) => (blank?.print_areas || []).find((a: any) => a.key === key) || blank?.print_areas?.[0];
    const spaceOf = (a: any) => {
        if (!a) return { x: 250, y: 220, width: 300, height: 380 };
        if (a.surface === 'wrap') return { x: 0, y: 0, width: a.template_w || 2475, height: a.template_h || 1155 };
        const ov = areaOverrides[a.key];
        if (ov) return ov;
        return { x: a.x, y: a.y, width: a.width, height: a.height };
    };

    const updateAreaOverride = (key: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
        const cur = spaceOf(areaOf(key));
        setAreaOverrides(prev => ({ ...prev, [key]: { ...cur, ...patch } }));
    };

    const resetAreaOverride = (key: string) => {
        setAreaOverrides(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    };

    const chooseBlank = (b: any) => {
        setBlank(b);
        const initV: Record<string, any> = {};
        b.variations.forEach((v: any) => { initV[v.sku] = { on: true, markup: '30000', stock: '100' }; });
        setSelectedVariants(initV);
        const initF: Record<string, LayerItem[]> = {};
        (b.print_areas || []).forEach((a: any) => { initF[a.key] = []; });
        setFaces(initF); setActiveFace(b.print_areas?.[0]?.key || 'front'); setSelectedId(null);
    };

    const addLayer = (l: LayerItem) => { setFaces(prev => ({ ...prev, [activeFace]: [...(prev[activeFace] || []), l] })); setSelectedId(l.id); };
    const updateLayer = (id: string, patch: Partial<LayerItem>) =>
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).map(l => l.id === id ? { ...l, ...patch } : l) }));
    const removeLayer = (id: string) =>
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).filter(l => l.id !== id) }));
    const reorderLayer = (id: string, dir: 1 | -1) => setFaces(prev => {
        const arr = [...(prev[activeFace] || [])]; const i = arr.findIndex(l => l.id === id);
        const j = i + dir; if (i < 0 || j < 0 || j >= arr.length) return prev;
        [arr[i], arr[j]] = [arr[j], arr[i]]; return { ...prev, [activeFace]: arr };
    });

    const addImageDesign = (d: any) => {
        const a = spaceOf(areaOf(activeFace));
        const img = new window.Image(); img.crossOrigin = 'anonymous'; img.src = abs(d.file_url);
        img.onload = () => {
            const baseW = img.naturalWidth, baseH = img.naturalHeight;
            const s = Math.min((a.width * 0.8) / baseW, (a.height * 0.8) / baseH);
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: a.x + (a.width - baseW * s) / 2, y: a.y + (a.height - baseH * s) / 2, scale: s, rotation: 0 });
        };
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
        if (step === 1) return !!blank;
        if (step === 2) return placedFaces().length > 0;
        if (step === 3) return true;
        if (step === 4) return !!title.trim() && description.trim().length >= 10 && !!categoryId && Object.values(selectedVariants).some(v => v.on);
        return true;
    };

    const toApiLayer = (l: LayerItem) => ({
        type: 'image', design_id: l.design._id, width: l.baseW, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation
    });

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
                    {step > 1 && <button className="inline-flex items-center justify-center gap-[7px] bg-white text-stone-700 border border-stone-300 px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] hover:bg-stone-50" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Quay lại</button>}
                    {step < 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" disabled={!canNext()} onClick={() => setStep(step + 1)}>Tiếp <ArrowRight size={15} /></button>}
                    {step === 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" disabled={!canNext() || saving} onClick={submit}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Tạo & Publish</button>}
                </div>
            </div>

            {/* Stepper Navigation */}
            <div className="pod-steps creator-page-steps">
                {STEPS.map((label, i) => (
                    <div key={i} className={`pod-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
                        <span className="pod-step-num">{i + 1}</span>
                        <span className="pod-step-label">{label}</span>
                    </div>
                ))}
            </div>

            {loadErr && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{loadErr}</div>}
            {error && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{error}</div>}

            <div className="creator-page-content">
                {step === 1 && (
                    <Step1PrinterAndBlank
                        printers={PRINTERS}
                        selectedPrinter={selectedPrinter}
                        setSelectedPrinter={setSelectedPrinter}
                        blanks={filteredBlanks}
                        blank={blank}
                        chooseBlank={chooseBlank}
                    />
                )}
                {step === 2 && blank && (
                    <Step2DesignEditor
                        blank={blank}
                        designs={designs}
                        faces={faces}
                        activeFace={activeFace}
                        setActiveFace={(k: string) => { setActiveFace(k); setSelectedId(null); }}
                        layers={layers}
                        selected={selected}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        updateLayer={updateLayer}
                        removeLayer={removeLayer}
                        reorderLayer={reorderLayer}
                        addImageDesign={addImageDesign}
                        uploading={uploading}
                        onUpload={doUpload}
                        fileRef={fileRef}
                        areaOf={areaOf}
                        spaceOf={spaceOf}
                        updateAreaOverride={updateAreaOverride}
                        resetAreaOverride={resetAreaOverride}
                    />
                )}
                {step === 3 && blank && (
                    <Step3MockupPreview
                        blank={blank}
                        faces={faces}
                        toApiLayer={toApiLayer}
                        selectedVariants={selectedVariants}
                    />
                )}
                {step === 4 && blank && (
                    <Step4ProductDetails
                        title={title} setTitle={setTitle}
                        description={description} setDescription={setDescription}
                        categories={categories} categoryId={categoryId} setCategoryId={setCategoryId}
                        blank={blank} selectedVariants={selectedVariants} setSelectedVariants={setSelectedVariants}
                    />
                )}
            </div>
        </div>
    );
}

export default CreateProductPage;
