import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check, RotateCcw, FileClock, X } from 'lucide-react';
import { productsService, absImg, type MockupColorPreview } from '../../product/services/productsService';
import { sellerPrinterService } from '../services/sellerPrinterService';
import Step1PrinterAndBlank from '../components/create-product/Step1PrinterAndBlank';
import Step2DesignEditor from '../components/create-product/Step2DesignEditor';
import Step3MockupPreview from '../components/create-product/Step3MockupPreview';
import Step4ProductDetails from '../components/create-product/Step4ProductDetails';
import {
    designSignature, formatVnd, groupColors, printBoxOf, type LayerItem, type VariantMap,
} from '../components/create-product/podShared';

const genId = () => Math.random().toString(36).slice(2, 9);
const DRAFT_KEY = 'vc:pod-draft:v1';

const STEPS = [
    { label: 'Chọn phôi', next: 'Thiết kế' },
    { label: 'Thiết kế', next: 'Xem mockup' },
    { label: 'Mockup & màu', next: 'Thông tin & giá' },
    { label: 'Thông tin & giá', next: '' },
];

interface Draft {
    savedAt: number;
    blankId: string;
    step: number;
    faces: Record<string, LayerItem[]>;
    selectedVariants: VariantMap;
    title: string; description: string; categoryId: string;
    selectedTags: string[]; materials: string[];
}

function readDraft(): Draft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const d = raw ? JSON.parse(raw) : null;
        return d && typeof d.blankId === 'string' ? d : null;
    } catch { return null; }
}
function writeDraft(d: Draft) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* bộ nhớ đầy / chế độ riêng tư */ } }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* bỏ qua */ } }

/** Các phôi thiếu vùng in thì coi cả ảnh là một mặt in trước. */
function normalizeBlank(b: any) {
    if (b?.print_areas?.length) return b;
    return {
        ...b,
        print_areas: [{ key: 'front', label: 'Mặt trước', image: b.default_image, x: 275, y: 220, width: 250, height: 330, surface: 'flat' }],
    };
}

export function CreateProductPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1);

    // Dữ liệu nền
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState('');
    const [noPrinter, setNoPrinter] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [blanks, setBlanks] = useState<any[]>([]);
    const [designs, setDesigns] = useState<any[]>([]);
    const [printers, setPrinters] = useState<{ id: string; name: string }[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState('all');

    // Sản phẩm đang tạo
    const [blank, setBlank] = useState<any | null>(null);
    const [faces, setFaces] = useState<Record<string, LayerItem[]>>({});
    const [activeFace, setActiveFace] = useState('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<VariantMap>({});
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [materials, setMaterials] = useState<string[]>([]);
    const [commissionPercent, setCommissionPercent] = useState<number | null>(null);

    // Ảnh xem trước theo màu, giữ ở đây để quay lại bước 3 không phải render lại
    const [previews, setPreviews] = useState<{ sig: string; byColor: MockupColorPreview[] } | null>(null);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [draft, setDraft] = useState<Draft | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const submittedRef = useRef(false);

    // Hoa hồng phụ thuộc danh mục + loại sản phẩm; hàng ở form này luôn là POD_TEMPLATE.
    useEffect(() => {
        let alive = true;
        productsService.getCommissionPercent(categoryId || null, 'POD_TEMPLATE')
            .then(p => alive && setCommissionPercent(p))
            .catch(() => alive && setCommissionPercent(null));
        return () => { alive = false; };
    }, [categoryId]);

    const loadAll = useCallback(() => {
        setLoading(true);
        setLoadErr('');
        Promise.allSettled([
            productsService.getCategories(),
            productsService.getTags(),
            productsService.getBlanks(),
            productsService.getMyDesigns(),
            sellerPrinterService.getSettings(),
        ]).then(([catRes, tagRes, blankRes, desRes, printerRes]) => {
            setCategories(catRes.status === 'fulfilled' && Array.isArray(catRes.value) ? catRes.value : []);
            setAvailableTags(tagRes.status === 'fulfilled' && Array.isArray(tagRes.value) ? tagRes.value : []);
            setDesigns(desRes.status === 'fulfilled' && Array.isArray(desRes.value) ? desRes.value : []);

            const pData = printerRes.status === 'fulfilled' ? printerRes.value : null;
            const p = pData?.printer;
            const pList: any[] = pData?.printers?.length ? pData.printers : (p?.is_connected ? [p] : []);
            setNoPrinter(pList.length === 0);
            setPrinters(pList.map(x => ({ id: x.printer_id || 'connected', name: x.printer_name || 'Xưởng in' })));
            if (pList.length === 1) setSelectedPrinter(pList[0].printer_id || 'all');

            if (blankRes.status === 'rejected') {
                setLoadErr('Không tải được danh sách phôi từ xưởng in. Kiểm tra kết nối rồi thử lại.');
                setBlanks([]);
            } else {
                setBlanks(Array.isArray(blankRes.value) ? blankRes.value : []);
            }
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const reloadCategories = () => {
        productsService.getCategories().then(c => setCategories(Array.isArray(c) ? c : [])).catch(() => {});
    };

    const areaOf = (key: string) => (blank?.print_areas || []).find((a: any) => a.key === key) || blank?.print_areas?.[0];

    const chooseBlank = (raw: any) => {
        if (!raw) return;
        const b = normalizeBlank(raw);
        if (blank?._id === b._id) return;
        setBlank(b);
        const initV: VariantMap = {};
        (b.variations || []).forEach((v: any) => {
            if (!v?.sku) return;
            initV[v.sku] = { on: v.in_stock !== false, color: v.color || '', size: v.size || '', base_cost: v.base_cost || 0, markup: '30000', stock: '100' };
        });
        setSelectedVariants(initV);
        setSelectedImages([]);
        setCoverImage('');
        setPreviews(null);
        const initF: Record<string, LayerItem[]> = {};
        (b.print_areas || []).forEach((a: any) => { if (a?.key) initF[a.key] = []; });
        setFaces(initF);
        setActiveFace(b.print_areas?.[0]?.key || 'front');
        setSelectedId(null);
        setMaxStep(1);
    };

    // Mở từ link có sẵn phôi (ý tưởng mùa vụ, sao chép...) hoặc gợi ý khôi phục bản nháp
    useEffect(() => {
        if (!blanks.length) return;
        const urlTitle = searchParams.get('title');
        const urlBlankId = searchParams.get('blankId');
        if (urlTitle) setTitle(urlTitle);
        if (urlBlankId) {
            const target = blanks.find((x: any) => String(x._id) === urlBlankId);
            if (target) chooseBlank(target);
            return;
        }
        const d = readDraft();
        if (d && blanks.some((x: any) => String(x._id) === d.blankId)) setDraft(d);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, blanks]);

    const restoreDraft = () => {
        if (!draft) return;
        const target = blanks.find((x: any) => String(x._id) === draft.blankId);
        if (!target) { setDraft(null); return; }
        chooseBlank(target);
        // ghi đè giá trị mặc định chooseBlank vừa đặt
        setFaces(draft.faces || {});
        setSelectedVariants(v => ({ ...v, ...(draft.selectedVariants || {}) }));
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setCategoryId(draft.categoryId || '');
        setSelectedTags(draft.selectedTags || []);
        setMaterials(draft.materials || []);
        const s = Math.min(Math.max(1, draft.step || 1), 3); // ảnh mockup phải render lại
        setStep(s);
        setMaxStep(s);
        setDraft(null);
    };

    // Lưu nháp tự động (trên máy này)
    useEffect(() => {
        if (!blank || submittedRef.current) return;
        const t = window.setTimeout(() => writeDraft({
            savedAt: Date.now(), blankId: String(blank._id), step, faces, selectedVariants,
            title, description, categoryId, selectedTags, materials,
        }), 600);
        return () => window.clearTimeout(t);
    }, [blank, step, faces, selectedVariants, title, description, categoryId, selectedTags, materials]);

    // Cảnh báo khi rời trang giữa chừng
    useEffect(() => {
        if (!blank) return;
        const onUnload = (e: BeforeUnloadEvent) => {
            if (submittedRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [blank]);

    // ---------- Thao tác layer ----------
    const addLayer = (l: LayerItem) => { setFaces(prev => ({ ...prev, [activeFace]: [...(prev[activeFace] || []), l] })); setSelectedId(l.id); };
    const updateLayer = (id: string, patch: Partial<LayerItem>) =>
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).map(l => l.id === id ? { ...l, ...patch } : l) }));
    const removeLayer = (id: string) => {
        setFaces(prev => ({ ...prev, [activeFace]: (prev[activeFace] || []).filter(l => l.id !== id) }));
        setSelectedId(cur => (cur === id ? null : cur));
    };
    const duplicateLayer = (id: string) => {
        const src = (faces[activeFace] || []).find(l => l.id === id);
        if (src) addLayer({ ...src, id: genId(), x: src.x + 16, y: src.y + 16 });
    };
    const reorderLayer = (id: string, dir: 1 | -1) => setFaces(prev => {
        const arr = [...(prev[activeFace] || [])]; const i = arr.findIndex(l => l.id === id);
        const j = i + dir; if (i < 0 || j < 0 || j >= arr.length) return prev;
        [arr[i], arr[j]] = [arr[j], arr[i]]; return { ...prev, [activeFace]: arr };
    });
    const clearFace = () => { setFaces(prev => ({ ...prev, [activeFace]: [] })); setSelectedId(null); };

    const addImageDesign = (d: any) => {
        if (!d?.file_url) return;
        const a = printBoxOf(areaOf(activeFace));
        const place = (baseW: number, baseH: number) => {
            let s = Math.min((a.width * 0.8) / baseW, (a.height * 0.8) / baseH);
            if (!isFinite(s) || s <= 0) s = 0.5;
            addLayer({ id: genId(), type: 'image', design: d, baseW, baseH, x: Math.round(a.x + (a.width - baseW * s) / 2), y: Math.round(a.y + (a.height - baseH * s) / 2), scale: s, rotation: 0 });
        };
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => place(img.naturalWidth || 800, img.naturalHeight || 800);
        img.onerror = () => place(800, 800);
        img.src = absImg(d.file_url);
    };

    const doUpload = async (file: File) => {
        setUploading(true); setError('');
        try {
            const d = await productsService.uploadDesign(file);
            setDesigns(prev => [d, ...prev]);
            addImageDesign(d);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Tải ảnh thiết kế thất bại');
        } finally { setUploading(false); }
    };

    const placedFaces = () => Object.entries(faces).filter(([, ls]) => ls.length > 0);

    const toApiLayer = (l: LayerItem) => ({
        type: 'image',
        design_id: l.design?._id,
        width: l.baseW,
        x: l.x, y: l.y, scale: l.scale, rotation: l.rotation,
        flip_h: l.flipH || undefined,
    });

    const designPlacements = () => placedFaces().map(([key, ls]) => ({
        print_area_key: key,
        area: printBoxOf(areaOf(key)),
        layers: ls.map(toApiLayer),
    }));

    const colorGroups = useMemo(() => groupColors(blank?.variations || []), [blank]);
    const sig = blank ? designSignature(String(blank._id), faces) : '';

    // ---------- Kiểm tra từng bước ----------
    const stepError = (s: number): string => {
        if (s === 1 && !blank) return 'Chọn một phôi để bắt đầu.';
        if (s === 2 && placedFaces().length === 0) return 'Chèn ít nhất 1 hình thiết kế lên phôi.';
        if (s === 3) {
            if (!Object.values(selectedVariants).some(v => v.on)) return 'Bật ít nhất 1 màu để bán.';
            if (!selectedImages.length) return 'Chọn ít nhất 1 ảnh mockup cho sản phẩm.';
        }
        if (s === 4) {
            if (title.trim().length < 3) return 'Tên sản phẩm cần ít nhất 3 ký tự.';
            if (!categoryId) return 'Chọn danh mục cho sản phẩm.';
            if (description.trim().length < 10) return 'Mô tả cần ít nhất 10 ký tự.';
        }
        return '';
    };

    const goTo = (s: number) => {
        setError('');
        setSelectedId(null);
        setStep(s);
        setMaxStep(m => Math.max(m, s));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goNext = () => {
        const err = stepError(step);
        if (err) { setError(err); return; }
        if (step < 4) goTo(step + 1);
        else submit();
    };

    const submit = async () => {
        for (const s of [1, 2, 3, 4]) {
            const err = stepError(s);
            if (err) { setError(err); setStep(s); return; }
        }
        setSaving(true); setError('');
        const variants = Object.entries(selectedVariants).filter(([, v]) => v.on).map(([sku, v]) => ({
            sku, color: v.color, size: v.size,
            base_cost: Number(v.base_cost) || undefined,
            markup: Number(v.markup) || 0,
            stock: Number(v.stock) || 0,
        }));
        let finalImages = Array.from(new Set(selectedImages.filter(Boolean)));
        if (coverImage) finalImages = [coverImage, ...finalImages.filter(i => i !== coverImage)];

        // Ảnh đại diện cho từng màu: khách chọn màu nào thấy đúng ảnh màu đó
        const colorImages: Record<string, string> = {};
        for (const p of previews?.byColor || []) {
            const pick = p.images.find(u => u === coverImage) || p.images.find(u => finalImages.includes(u));
            if (pick) colorImages[p.color] = pick;
        }

        const tagIds = availableTags
            .filter((t: any) => selectedTags.some(st => st.trim().toLowerCase() === (t.name || '').trim().toLowerCase()))
            .map((t: any) => t._id);
        const newTagNames = selectedTags.filter(st =>
            !availableTags.some((t: any) => (t.name || '').trim().toLowerCase() === st.trim().toLowerCase()));
        const sourceIdeaId = searchParams.get('source_idea_id') || undefined;

        try {
            await productsService.create({
                title, description, categoryId, tagIds, newTagNames, materials,
                blankId: blank._id,
                printerId: blank.printer_id,
                printerName: blank.printer_name,
                images: finalImages,
                thumbnail: coverImage || finalImages[0],
                colorImages,
                variants,
                designPlacements: designPlacements(),
                ...(sourceIdeaId ? { source_idea_id: sourceIdeaId } : {}),
            });
            submittedRef.current = true;
            clearDraft();
            navigate('/seller/products');
        } catch (e: any) {
            const d = e.response?.data;
            setError(d?.errors ? d.errors.join('; ') : (d?.error || 'Tạo sản phẩm thất bại'));
        } finally { setSaving(false); }
    };

    const layers = faces[activeFace] || [];
    const selected = layers.find(l => l.id === selectedId) || null;

    // Tóm tắt ở thanh thao tác
    const onSkus = Object.values(selectedVariants).filter(v => v.on);
    const onColors = new Set(onSkus.map(v => v.color)).size;
    const minPrice = onSkus.length ? Math.min(...onSkus.map(v => (Number(v.base_cost) || 0) + (Number(v.markup) || 0))) : 0;

    return (
        <div className="creator-page animate-fade-in flex flex-col">
            <div className="creator-page-head">
                <button className="creator-back" onClick={() => navigate('/seller/products')}><ArrowLeft size={16} /> Sản phẩm</button>
                <h1>Tạo sản phẩm in theo yêu cầu</h1>
            </div>

            {/* Thanh bước: bấm để quay lại bước đã qua */}
            <ol className="flex items-center gap-1 sm:gap-2 mb-5 overflow-x-auto" aria-label="Các bước tạo sản phẩm">
                {STEPS.map((s, i) => {
                    const n = i + 1;
                    const done = n < step;
                    const active = n === step;
                    const reachable = n <= maxStep && !saving;
                    return (
                        <li key={s.label} className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {i > 0 && <span className={`w-6 sm:w-10 h-px ${n <= maxStep ? 'bg-admin-brand' : 'bg-stone-300'}`} />}
                            <button
                                type="button"
                                disabled={!reachable}
                                onClick={() => reachable && n !== step && goTo(n)}
                                aria-current={active ? 'step' : undefined}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${active ? 'bg-admin-brand-050 text-admin-brand' : reachable ? 'text-stone-700 hover:bg-stone-100' : 'text-stone-400 cursor-not-allowed'}`}
                            >
                                <span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${active ? 'bg-admin-brand text-white' : done ? 'bg-admin-brand/15 text-admin-brand' : 'bg-stone-200 text-stone-500'}`}>
                                    {done ? <Check size={13} /> : n}
                                </span>
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>

            {draft && step === 1 && !blank && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-sky-200 bg-sky-50 text-sm text-sky-900">
                    <FileClock size={18} className="shrink-0" />
                    <span className="flex-1 min-w-[200px]">
                        Bạn có bản nháp chưa xong ({new Date(draft.savedAt).toLocaleString('vi-VN')}). Tiếp tục từ chỗ đã dừng?
                    </span>
                    <button type="button" onClick={restoreDraft} className="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800">Tiếp tục bản nháp</button>
                    <button type="button" onClick={() => { clearDraft(); setDraft(null); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 hover:bg-sky-100">Bỏ nháp</button>
                </div>
            )}

            {loadErr && (
                <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                    <span className="flex-1">{loadErr}</span>
                    <button type="button" onClick={loadAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold hover:bg-red-100"><RotateCcw size={13} /> Thử lại</button>
                </div>
            )}

            <div className="creator-page-body flex-1">
                {step === 1 && (
                    <Step1PrinterAndBlank
                        loading={loading}
                        noPrinter={noPrinter}
                        printers={printers}
                        selectedPrinter={selectedPrinter}
                        setSelectedPrinter={setSelectedPrinter}
                        blanks={blanks}
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
                        duplicateLayer={duplicateLayer}
                        reorderLayer={reorderLayer}
                        clearFace={clearFace}
                        addImageDesign={addImageDesign}
                        uploading={uploading}
                        onUpload={doUpload}
                        fileRef={fileRef}
                        areaOf={areaOf}
                    />
                )}
                {step === 3 && blank && (
                    <Step3MockupPreview
                        blank={blank}
                        colorGroups={colorGroups}
                        signature={sig}
                        placements={designPlacements}
                        previews={previews}
                        setPreviews={setPreviews}
                        selectedVariants={selectedVariants}
                        setSelectedVariants={setSelectedVariants}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        coverImage={coverImage}
                        setCoverImage={setCoverImage}
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
                        materials={materials}
                        setMaterials={setMaterials}
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

            {/* Thanh thao tác bám đáy vùng nội dung (không đè lên sidebar) */}
            <div className="sticky bottom-6 z-30 mt-6 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)]">
                <div className="px-3 sm:px-4 py-2.5 flex items-center gap-3">
                    {step > 1 ? (
                        <button type="button" disabled={saving} onClick={() => goTo(step - 1)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-stone-700 border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50">
                            <ArrowLeft size={15} /> <span className="hidden sm:inline">Quay lại</span>
                        </button>
                    ) : <span />}

                    <div className="flex-1 min-w-0 text-[12.5px] text-stone-600 truncate">
                        {error ? (
                            <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                                <X size={14} className="shrink-0" /> {error}
                            </span>
                        ) : blank ? (
                            <>
                                <b className="text-stone-800">{blank.title}</b>
                                <span className="hidden md:inline"> · {onColors}/{colorGroups.length} màu · {onSkus.length} SKU{minPrice > 0 && <> · giá từ <b className="text-admin-brand">{formatVnd(minPrice)}</b></>}</span>
                            </>
                        ) : 'Chọn phôi để bắt đầu'}
                    </div>

                    <button type="button" onClick={goNext} disabled={saving || (step === 1 && !blank)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-sm font-semibold text-white bg-admin-brand hover:bg-admin-brand-700 shadow-[0_4px_12px_rgba(26,107,26,0.22)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap">
                        {step < 4 ? <>Tiếp: {STEPS[step - 1].next} <ArrowRight size={15} /></> : (
                            saving ? <><Loader2 size={15} className="animate-spin" /> Đang tạo…</> : <><Check size={15} /> Tạo & đăng bán</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateProductPage;
