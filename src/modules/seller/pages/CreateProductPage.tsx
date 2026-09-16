import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import Step1PrinterAndBlank from '../components/create-product/Step1PrinterAndBlank';
import Step2DesignEditor from '../components/create-product/Step2DesignEditor';
import Step3MockupPreview from '../components/create-product/Step3MockupPreview';
import Step4ProductDetails from '../components/create-product/Step4ProductDetails';

const API_ORIGIN = 'http://localhost:8080';
const abs = (u: string) => (u?.startsWith('http') ? u : `${API_ORIGIN}${u}`);
const genId = () => Math.random().toString(36).slice(2, 9);

const PRINTERS = [
    { id: 'all', name: 'Tất cả xưởng in', desc: 'Tất cả phôi khả dụng từ các xưởng đã liên kết API', badge: 'Hệ thống API' },
    { id: 'vietcraft-direct', name: 'Xưởng In VietCraft Direct', desc: 'Xưởng in chính hãng VietCraft - Tự động đồng bộ vận đơn', badge: 'API Web Printer' },
    { id: 'nam-dinh-pod', name: 'Xưởng In Nam Định POD', desc: 'Chuyên phôi Áo thun Oversize & Hoodie Cotton Premium', badge: 'API Web Printer' },
    { id: 'sai-gon-hub', name: 'Xưởng In Sài Gòn PrintHub', desc: 'Chuyên ly sứ, túi tote & quà tặng in 3D uốn cong', badge: 'API Web Printer' },
];

interface L {
    id: string; type: 'image';
    x: number; y: number; scale: number; rotation: number;
    design?: any; baseW?: number; baseH?: number;
}

const STEPS = ['Chọn xưởng & phôi', 'Thiết kế phôi', 'Xem trước', 'Thông tin & giá'];

const DEFAULT_FRONTEND_BLANKS = [
    {
        _id: 'blank-tshirt-01',
        title: 'Áo thun Oversize Cotton Premium 250gsm',
        description: 'Phôi áo thun 100% Cotton Unisex.',
        category: 'Thời trang',
        dimensions_info: 'Dài 72cm × Rộng 54cm',
        default_image: '/images/AoMT.png',
        variations: [
            { sku: 'TSHIRT-BLK-S', color: 'Đen', size: 'S', base_cost: 85000 },
            { sku: 'TSHIRT-BLK-M', color: 'Đen', size: 'M', base_cost: 85000 },
            { sku: 'TSHIRT-WHT-M', color: 'Trắng', size: 'M', base_cost: 85000 }
        ],
        print_areas: [
            { key: 'front', label: 'Mặt trước (25×33cm)', image: '/images/AoMT.png', x: 275, y: 220, width: 250, height: 330, surface: 'flat' },
            { key: 'back', label: 'Mặt sau (25×33cm)', image: '/images/AoMS.png', x: 275, y: 220, width: 250, height: 330, surface: 'flat' }
        ]
    }
];

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
    const [faces, setFaces] = useState<Record<string, L[]>>({});
    const [activeFace, setActiveFace] = useState<string>('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, { on: boolean; markup: string; stock: string }>>({});
    const [areaOverrides, setAreaOverrides] = useState<Record<string, { x?: number; y?: number; width?: number; height?: number }>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.allSettled([
            productsService.getCategories(),
            productsService.getBlanks(),
            productsService.getMyDesigns()
        ]).then(([catRes, blankRes, desRes]) => {
            const c = catRes.status === 'fulfilled' ? catRes.value : [];
            const b = blankRes.status === 'fulfilled' && Array.isArray(blankRes.value) && blankRes.value.length ? blankRes.value : DEFAULT_FRONTEND_BLANKS;
            const d = desRes.status === 'fulfilled' ? desRes.value : [];
            setCategories(Array.isArray(c) ? c : []);
            setBlanks(Array.isArray(b) ? b : DEFAULT_FRONTEND_BLANKS);
            setDesigns(Array.isArray(d) ? d : []);
            if (blankRes.status === 'rejected' || catRes.status === 'rejected') {
                setLoadErr('Không thể kết nối đến máy chủ xưởng in, đã tự động tải phôi mặc định.');
            }
        }).catch(() => {
            setBlanks(DEFAULT_FRONTEND_BLANKS);
            setLoadErr('Không thể kết nối đến máy chủ xưởng in, đã tự động tải phôi mặc định.');
        });
    }, []);

    const filteredBlanks = (blanks || []).filter((b: any) => {
        if (!b?._id) return false;
        if (selectedPrinter === 'vietcraft-direct') return b._id.includes('tshirt');
        if (selectedPrinter === 'nam-dinh-pod') return b._id.includes('tshirt') || b._id.includes('tote');
        if (selectedPrinter === 'sai-gon-hub') return b._id.includes('mug') || b._id.includes('frame');
        return true;
    });

    const displayedBlanks = filteredBlanks.length > 0 ? filteredBlanks : blanks;

    const updateAreaOverride = (key: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
        setAreaOverrides(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
    };

    const resetAreaOverride = (key: string) => {
        setAreaOverrides(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    };

    const areaOf = (key: string) => (blank?.print_areas || []).find((a: any) => a.key === key) || blank?.print_areas?.[0];

    const spaceOf = (a: any) => {
        if (!a) return { x: 200, y: 200, width: 400, height: 400 };
        const override = areaOverrides[a.key] || {};
        if (a.surface === 'wrap') {
            return {
                x: override.x ?? 0,
                y: override.y ?? 0,
                width: override.width ?? (a.template_w || 2475),
                height: override.height ?? (a.template_h || 1155)
            };
        }
        return {
            x: override.x ?? (a.x ?? 200),
            y: override.y ?? (a.y ?? 200),
            width: override.width ?? (a.width ?? 300),
            height: override.height ?? (a.height ?? 300)
        };
    };

    const chooseBlank = (b: any) => {
        if (!b) return;
        setBlank(b);
        setAreaOverrides({});
        const initV: Record<string, any> = {};
        (b.variations || []).forEach((v: any) => {
            if (!v?.sku) return;
            initV[v.sku] = {
                on: true,
                color: v.color || '',
                size: v.size || '',
                base_cost: v.base_cost || 0,
                markup: '30000',
                stock: '100'
            };
        });
        setSelectedVariants(initV);
        const initF: Record<string, L[]> = {};
        (b.print_areas || []).forEach((a: any) => { if (a?.key) initF[a.key] = []; });
        setFaces(initF);
        setActiveFace(b.print_areas?.[0]?.key || 'front');
        setSelectedId(null);
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

    const addImageDesign = (d: any) => {
        if (!d || !d.file_url) return;
        const a = spaceOf(areaOf(activeFace));
        const img = new window.Image(); img.crossOrigin = 'anonymous'; img.src = abs(d.file_url);
        img.onload = () => {
            const baseW = img.naturalWidth || 800, baseH = img.naturalHeight || 800;
            let s = Math.min((a.width * 0.8) / baseW, (a.height * 0.8) / baseH);
            if (!isFinite(s) || s <= 0) s = 0.5;
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: a.x + (a.width - baseW * s) / 2, y: a.y + (a.height - baseH * s) / 2, scale: s, rotation: 0 });
        };
        img.onerror = () => {
            const baseW = 800, baseH = 800;
            const s = 0.5;
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: a.x + (a.width - baseW * s) / 2, y: a.y + (a.height - baseH * s) / 2, scale: s, rotation: 0 });
        };
    };

    const resetAllDesigns = () => {
        setFaces({});
        setSelectedId(null);
    };

    const doUpload = async (file: File) => {
        setUploading(true); setError('');
        try {
            const d = await productsService.uploadDesign(file);
            setDesigns((prev: any[]) => [d, ...prev]);
            addImageDesign(d);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Tải ảnh thất bại');
        } finally { setUploading(false); }
    };

    const placedFaces = () => Object.entries(faces).filter(([, ls]) => ls.length > 0);

    const canNextFromStep2 = () => {
        if (blank?.print_areas?.length > 0 && placedFaces().length === 0) {
            setError('Bạn cần chèn ít nhất 1 hình thiết kế lên mặt phôi');
            return false;
        }
        return true;
    };

    const goNext = () => {
        setError('');
        if (step === 1) {
            if (!blank) { setError('Vui lòng chọn 1 phôi sản phẩm'); return; }
            setStep(2);
        } else if (step === 2) {
            if (canNextFromStep2()) setStep(3);
        } else if (step === 3) {
            setStep(4);
        } else if (step === 4) {
            submit();
        }
    };

    const toApiLayer = (l: L) => ({
        type: 'image', design_id: l.design._id, width: l.baseW, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation
    });

    const submit = async () => {
        setSaving(true); setError('');
        const variants = Object.entries(selectedVariants).filter(([, v]: any) => v.on)
            .map(([sku, v]: any) => ({
                sku,
                color: v.color,
                size: v.size,
                base_cost: Number(v.base_cost) || undefined,
                markup: Number(v.markup) || 0,
                stock: Number(v.stock) || 0
            }));
        const designPlacements = placedFaces().map(([key, ls]: [string, L[]]) => ({ print_area_key: key, layers: ls.map(toApiLayer) }));
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
                    {step < 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" onClick={goNext}>Tiếp <ArrowRight size={15} /></button>}
                    {step === 4 && <button className="inline-flex items-center justify-center gap-[7px] bg-admin-brand text-white border border-admin-brand px-4 py-[9px] text-[13.5px] font-semibold leading-none rounded-[9px] whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving} onClick={submit}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Tạo & Publish</button>}
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

            {/* Step Content */}
            <div className="creator-page-body">
                {step === 1 && (
                    <Step1PrinterAndBlank
                        printers={PRINTERS}
                        selectedPrinter={selectedPrinter}
                        setSelectedPrinter={setSelectedPrinter}
                        blanks={displayedBlanks}
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
                        resetAllDesigns={resetAllDesigns}
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
                        title={title}
                        setTitle={setTitle}
                        description={description}
                        setDescription={setDescription}
                        categories={categories}
                        categoryId={categoryId}
                        setCategoryId={setCategoryId}
                        blank={blank}
                        selectedVariants={selectedVariants}
                        setSelectedVariants={setSelectedVariants}
                    />
                )}
            </div>
        </div>
    );
}

export default CreateProductPage;
