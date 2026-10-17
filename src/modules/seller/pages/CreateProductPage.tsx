import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { sellerPrinterService } from '../services/sellerPrinterService';
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
        description: 'Phôi áo thun 100% Cotton định lượng 250gsm dày dặn, phom dáng oversize Unisex mộc mạc chuẩn phong cách VietCraft.',
        category: 'Thời trang',
        dimensions_info: 'Dài 72cm × Rộng 54cm (Form Oversize Unisex)',
        default_image: '/images/AoMT.png',
        variations: [
            { sku: 'TSHIRT-BLK-S', color: 'Đen', size: 'S', base_cost: 85000 },
            { sku: 'TSHIRT-BLK-M', color: 'Đen', size: 'M', base_cost: 85000 },
            { sku: 'TSHIRT-BLK-L', color: 'Đen', size: 'L', base_cost: 85000 },
            { sku: 'TSHIRT-BLK-XL', color: 'Đen', size: 'XL', base_cost: 88000 },
            { sku: 'TSHIRT-WHT-S', color: 'Trắng', size: 'S', base_cost: 85000 },
            { sku: 'TSHIRT-WHT-M', color: 'Trắng', size: 'M', base_cost: 85000 },
            { sku: 'TSHIRT-WHT-L', color: 'Trắng', size: 'L', base_cost: 85000 },
            { sku: 'TSHIRT-WHT-XL', color: 'Trắng', size: 'XL', base_cost: 88000 },
            { sku: 'TSHIRT-BRN-M', color: 'Nâu Gỗ', size: 'M', base_cost: 87000 },
            { sku: 'TSHIRT-BRN-L', color: 'Nâu Gỗ', size: 'L', base_cost: 87000 }
        ],
        print_areas: [
            { key: 'front', label: 'Mặt trước (25×33cm)', image: '/images/AoMT.png', x: 275, y: 220, width: 250, height: 330, surface: 'flat' },
            { key: 'back', label: 'Mặt sau (25×33cm)', image: '/images/AoMS.png', x: 275, y: 220, width: 250, height: 330, surface: 'flat' }
        ],
        is_active: true
    },
    {
        _id: 'blank-mug-01',
        title: 'Ly / Cốc Sứ Trắng Men Mờ 330ml (In 3D Wrap)',
        description: 'Ly sứ men trắng mờ cao cấp nung ở 1300°C bền bỉ, an toàn thực phẩm. Hỗ trợ công nghệ in uốn cong 3D (Cylinder Warp) bao phủ toàn bộ thân ly.',
        category: 'Gia dụng & Quà tặng',
        dimensions_info: 'Cao 9.5cm × Đường kính 8.2cm (Dung tích 330ml)',
        default_image: '/images/Ly.png',
        variations: [
            { sku: 'MUG-WHT-330', color: 'Trắng Men Mờ', size: '330ml', material: 'Sứ cao cấp', base_cost: 45000 },
            { sku: 'MUG-BLK-330', color: 'Đen Huyền Bí', size: '330ml', material: 'Sứ cao cấp', base_cost: 48000 }
        ],
        print_areas: [
            {
                key: 'wrap',
                label: 'Vòng quanh ly (3D Wrap)',
                image: '/images/Ly.png',
                x: 180,
                y: 220,
                width: 440,
                height: 340,
                surface: 'wrap',
                template_w: 2475,
                template_h: 1155
            }
        ],
        is_active: true
    },
    {
        _id: 'blank-tote-01',
        title: 'Túi Tote Vải Bố Canvas Tự Nhiên',
        description: 'Túi xách vải bố Canvas dệt sợi bông tự nhiên màu kem mộc, quai may gia cường chịu lực đến 15kg.',
        category: 'Phụ kiện',
        dimensions_info: 'Rộng 35cm × Cao 40cm (Quai xách dài 28cm)',
        default_image: '/images/Tui.png',
        variations: [
            { sku: 'TOTE-NAT-STD', color: 'Kem tự nhiên', size: '35x40cm', material: 'Vải bố Canvas 320gsm', base_cost: 38000 },
            { sku: 'TOTE-BLK-STD', color: 'Đen mộc', size: '35x40cm', material: 'Vải bố Canvas 320gsm', base_cost: 42000 }
        ],
        print_areas: [
            {
                key: 'front',
                label: 'Thân túi (30×33cm)',
                image: '/images/Tui.png',
                x: 250,
                y: 320,
                width: 300,
                height: 330,
                surface: 'flat'
            }
        ],
        is_active: true
    },
    {
        _id: 'blank-frame-01',
        title: 'Tranh Treo Tường Khung Gỗ Sồi Canvas 30x40cm',
        description: 'Khung tranh gỗ sồi tự nhiên tinh chế mộc mạc, căng sẵn vải Canvas dệt nổi thô chuyên dụng cho hội họa.',
        category: 'Trang trí nhà cửa',
        dimensions_info: 'Khung 30 × 40 cm (Độ dày khung 2.5cm)',
        default_image: '/images/KhungTranh.png',
        variations: [
            { sku: 'FRAME-OAK-3040', color: 'Gỗ Sồi Tự Nhiên', size: '30x40cm', material: 'Gỗ Sồi & Canvas', base_cost: 115000 },
            { sku: 'FRAME-WAL-3040', color: 'Gỗ Nâu Óc Chó', size: '30x40cm', material: 'Gỗ Walnut & Canvas', base_cost: 125000 }
        ],
        print_areas: [
            {
                key: 'front',
                label: 'Lòng tranh (30×40cm)',
                image: '/images/KhungTranh.png',
                x: 205,
                y: 140,
                width: 390,
                height: 520,
                surface: 'flat'
            }
        ],
        is_active: true
    }
];

export function CreateProductPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [blanks, setBlanks] = useState<any[]>([]);
    const [designs, setDesigns] = useState<any[]>([]);
    const [loadErr, setLoadErr] = useState('');

    const [selectedPrinter, setSelectedPrinter] = useState('all');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [commissionPercent, setCommissionPercent] = useState<number | null>(null);
    const [blank, setBlank] = useState<any | null>(null);
    const [faces, setFaces] = useState<Record<string, L[]>>({});
    const [activeFace, setActiveFace] = useState<string>('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [connectedPrinter, setConnectedPrinter] = useState<any>(null);
    const [connectedPrinters, setConnectedPrinters] = useState<any[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, { on: boolean; markup: string; stock: string; color?: string; size?: string; base_cost?: number }>>({});
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState<string>('');
    const [areaOverrides, setAreaOverrides] = useState<Record<string, { x?: number; y?: number; width?: number; height?: number }>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Hoa hồng phụ thuộc danh mục + loại sản phẩm; hàng ở form này luôn là POD_TEMPLATE.
    useEffect(() => {
        let alive = true;
        productsService
            .getCommissionPercent(categoryId || null, 'POD_TEMPLATE')
            .then(p => alive && setCommissionPercent(p))
            .catch(() => alive && setCommissionPercent(null));
        return () => { alive = false; };
    }, [categoryId]);

    const reloadCategories = () => {
        productsService.getCategories().then(c => {
            setCategories(Array.isArray(c) ? c : []);
        }).catch(() => {});
    };

    useEffect(() => {
        Promise.allSettled([
            productsService.getCategories(),
            productsService.getTags(),
            productsService.getBlanks(),
            productsService.getMyDesigns(),
            sellerPrinterService.getSettings()
        ]).then(([catRes, tagRes, blankRes, desRes, printerRes]) => {
            const c = catRes.status === 'fulfilled' ? catRes.value : [];
            const t = tagRes.status === 'fulfilled' && Array.isArray(tagRes.value) ? tagRes.value : [];
            const b = blankRes.status === 'fulfilled' && Array.isArray(blankRes.value) ? blankRes.value : [];
            const d = desRes.status === 'fulfilled' ? desRes.value : [];
            const pData = printerRes.status === 'fulfilled' ? printerRes.value : null;
            const p = pData?.printer;
            const pList = pData?.printers && pData.printers.length > 0 ? pData.printers : (p?.is_connected ? [p] : []);

            setCategories(Array.isArray(c) ? c : []);
            setAvailableTags(t);
            setBlanks(Array.isArray(b) ? b : []);
            setDesigns(Array.isArray(d) ? d : []);
            setConnectedPrinter(p);
            setConnectedPrinters(pList);

            if (pList.length === 1) {
                setSelectedPrinter(pList[0].printer_id || 'all');
            }

            if (!p?.is_connected && pList.length === 0) {
                setLoadErr('Bạn chưa liên kết xưởng in nào. Vui lòng vào Cài đặt -> Xưởng in (POD) để hoàn tất thỏa thuận hợp tác và xác thực API Key trước khi tạo sản phẩm.');
            } else if (b.length === 0) {
                const names = pList.map((x: any) => x.printer_name).join(', ') || p?.printer_name;
                setLoadErr(`Đã kết nối xưởng "${names}" nhưng chưa nhận được phôi khả dụng từ xưởng.`);
            }
        }).catch(() => {
            setBlanks(DEFAULT_FRONTEND_BLANKS);
            setLoadErr('Không thể kết nối đến máy chủ xưởng in, đã tự động tải phôi mặc định.');
        });
    }, []);

    const dynamicPrinters = (connectedPrinters && connectedPrinters.length > 0) ? [
        ...(connectedPrinters.length > 1 ? [{
            id: 'all',
            name: 'Tất cả xưởng in',
            desc: `Tổng hợp toàn bộ phôi in từ ${connectedPrinters.length} xưởng đối tác`,
            badge: `${blanks.length} Phôi in`
        }] : []),
        ...connectedPrinters.map(p => ({
            id: p.printer_id || 'connected-workshop',
            name: p.printer_name,
            desc: `Đã kết nối qua API Key (${p.seller_printing_email || 'Seller POD'})`,
            badge: 'Đã xác thực API'
        }))
    ] : (connectedPrinter?.is_connected ? [
        { 
            id: connectedPrinter.printer_id || 'connected-workshop', 
            name: connectedPrinter.printer_name, 
            desc: `Đã kết nối qua API Key (${connectedPrinter.seller_printing_email || 'Seller POD'})`, 
            badge: 'Đã xác thực API' 
        }
    ] : PRINTERS);

    const displayedBlanks = (selectedPrinter === 'all' || !selectedPrinter)
        ? blanks
        : blanks.filter(b => b.printer_id === selectedPrinter);

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
        return {
            x: override.x ?? (a.x ?? 200),
            y: override.y ?? (a.y ?? 200),
            width: override.width ?? (a.width ?? 300),
            height: override.height ?? (a.height ?? 300)
        };
    };

    const chooseBlank = (b: any) => {
        if (!b) return;
        let normalized = { ...b };
        if (!normalized.print_areas || normalized.print_areas.length === 0) {
            normalized.print_areas = [{
                key: 'front',
                label: 'Mặt trước',
                image: normalized.default_image,
                x: 275,
                y: 220,
                width: 250,
                height: 330,
                surface: 'flat'
            }];
        }
        setBlank(normalized);
        setAreaOverrides({});
        const initV: Record<string, any> = {};
        (normalized.variations || []).forEach((v: any) => {
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
        setSelectedImages([]);
        setCoverImage('');
        const initF: Record<string, L[]> = {};
        (normalized.print_areas || []).forEach((a: any) => { if (a?.key) initF[a.key] = []; });
        setFaces(initF);
        setActiveFace(normalized.print_areas?.[0]?.key || 'front');
        setSelectedId(null);
    };

    useEffect(() => {
        const urlTitle = searchParams.get('title');
        const urlBlankId = searchParams.get('blankId');
        if (urlTitle) setTitle(urlTitle);
        if (urlBlankId && blanks.length > 0) {
            const target = blanks.find((x: any) => x._id === urlBlankId);
            if (target) {
                chooseBlank(target);
            }
        }
    }, [searchParams, blanks]);

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
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: Math.round(a.x + (a.width - baseW * s) / 2), y: Math.round(a.y + (a.height - baseH * s) / 2), scale: s, rotation: 0 });
        };
        img.onerror = () => {
            const baseW = 800, baseH = 800;
            const s = 0.5;
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: Math.round(a.x + (a.width - baseW * s) / 2), y: Math.round(a.y + (a.height - baseH * s) / 2), scale: s, rotation: 0 });
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
        type: 'image',
        design_id: l.design?._id,
        designUrl: l.design?.file_url,
        width: l.baseW,
        x: l.x,
        y: l.y,
        scale: l.scale,
        rotation: l.rotation
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
        const designPlacements = placedFaces().map(([key, ls]: [string, L[]]) => {
            const a = areaOf(key);
            const sp = spaceOf(a);
            return {
                print_area_key: key,
                area: sp,
                layers: ls.map(toApiLayer)
            };
        });
        let finalImages = Array.from(new Set(selectedImages.filter(Boolean)));
        if (coverImage && finalImages.includes(coverImage)) {
            finalImages = [coverImage, ...finalImages.filter(img => img !== coverImage)];
        } else if (coverImage) {
            finalImages = [coverImage, ...finalImages];
        }

        const tagIds = availableTags
            .filter((t: any) => selectedTags.some(st => st.trim().toLowerCase() === (t.name || '').trim().toLowerCase()))
            .map((t: any) => t._id);
        const newTagNames = selectedTags.filter(st =>
            !availableTags.some((t: any) => (t.name || '').trim().toLowerCase() === st.trim().toLowerCase())
        );

        try {
            await productsService.create({ 
                title, 
                description, 
                categoryId, 
                tagIds,
                newTagNames,
                blankId: blank._id, 
                printerId: blank.printer_id || connectedPrinter?.printer_id || 'vietcraft-direct',
                printerName: blank.printer_name || connectedPrinter?.printer_name || 'Xưởng in đối tác',
                images: finalImages,
                thumbnail: coverImage || finalImages[0],
                variants, 
                designPlacements 
            });
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
                        printers={dynamicPrinters}
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
                        setSelectedVariants={setSelectedVariants}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        coverImage={coverImage}
                        setCoverImage={setCoverImage}
                        spaceOf={spaceOf}
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
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                        onCategoryProposed={reloadCategories}
                        blank={blank}
                        selectedVariants={selectedVariants}
                        setSelectedVariants={setSelectedVariants}
                        selectedImages={selectedImages}
                        coverImage={coverImage}
                        commissionPercent={commissionPercent}
                    />
                )}
            </div>
        </div>
    );
}

export default CreateProductPage;
