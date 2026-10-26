import { useState, useEffect, useMemo } from 'react';
import { Loader2, Check, Star, Palette, Image as ImageIcon, Eye, Layers } from 'lucide-react';
import { productsService, MockupColorPreview } from '../../../product/services/productsService';
import { abs } from './useHTMLImage';
import { VideoAdCard } from './VideoAdCard';

interface ColorGroup {
    color: string;
    color_hex: string;
    skus: string[];
    sizes: string[];
    base_cost: number;
}

interface Step3Props {
    blank: any;
    faces: Record<string, any[]>;
    toApiLayer: (layer: any) => any;
    selectedVariants: Record<string, { on: boolean; markup: string; stock: string; color?: string; size?: string; base_cost?: number }>;
    setSelectedVariants?: React.Dispatch<React.SetStateAction<Record<string, { on: boolean; markup: string; stock: string; color?: string; size?: string; base_cost?: number }>>>;
    selectedImages: string[];
    setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
    coverImage: string;
    setCoverImage: React.Dispatch<React.SetStateAction<string>>;
    spaceOf?: (area: any) => { x: number; y: number; width: number; height: number };
}

const COLOR_HEX_MAP: Record<string, string> = {
    'đen': '#18181b',
    'black': '#18181b',
    'đen huyền bí': '#18181b',
    'đen mộc': '#27272a',
    'trắng': '#ffffff',
    'white': '#ffffff',
    'trắng men mờ': '#ffffff',
    'kem tự nhiên': '#fdfbf7',
    'kem': '#fef3c7',
    'be': '#f5f5dc',
    'beige': '#f5f5dc',
    'nâu': '#78350f',
    'nâu gỗ': '#6b4226',
    'nâu đất': '#5c3a21',
    'gỗ sồi tự nhiên': '#d4a373',
    'gỗ nâu óc chó': '#582f0e',
    'xám': '#6b7280',
    'xám melange': '#9ca3af',
    'ghi': '#9ca3af',
    'xám tiêu': '#9ca3af',
    'xanh navy': '#1e3a8a',
    'navy': '#1e3a8a',
    'xanh than': '#172554',
    'xanh rêu': '#14532d',
    'xanh lá': '#15803d',
    'xanh dương': '#2563eb',
    'đỏ': '#dc2626',
    'đỏ đô': '#991b1b',
    'vàng': '#ca8a04',
    'hồng': '#db2777',
    'cam': '#ea580c',
    'tím': '#7e22ce'
};

const resolveHex = (colorName?: string, hex?: string) => {
    if (hex && typeof hex === 'string' && /^#[0-9a-f]{3,6}$/i.test(hex.trim())) return hex.trim();
    if (!colorName) return '#ffffff';
    return COLOR_HEX_MAP[colorName.trim().toLowerCase()] || '#d1d5db';
};

export function Step3MockupPreview({
    blank,
    faces,
    toApiLayer,
    selectedVariants,
    setSelectedVariants,
    selectedImages,
    setSelectedImages,
    coverImage,
    setCoverImage,
    spaceOf
}: Step3Props) {
    if (!blank) return null;
    const printAreas = blank.print_areas || [];
    const variations = blank.variations || [];
    const areas = printAreas.filter((a: any) => (faces[a.key] || []).length > 0);

    const [colorPreviews, setColorPreviews] = useState<MockupColorPreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    // Active color and active face for the Hero preview
    const [activeColorIdx, setActiveColorIdx] = useState(0);
    const [activeFaceIdx, setActiveFaceIdx] = useState(0);

    // Group variations by color
    const colorGroups = useMemo<ColorGroup[]>(() => {
        const groups: ColorGroup[] = [];
        const map = new Map<string, ColorGroup>();

        (variations || []).forEach((v: any) => {
            const cName = (v.color || 'Màu mặc định').trim();
            if (!map.has(cName)) {
                const cg: ColorGroup = {
                    color: cName,
                    color_hex: resolveHex(cName, v.color_hex),
                    skus: [],
                    sizes: [],
                    base_cost: v.base_cost || 0
                };
                map.set(cName, cg);
                groups.push(cg);
            }
            const cg = map.get(cName)!;
            if (v.sku && !cg.skus.includes(v.sku)) cg.skus.push(v.sku);
            if (v.size && !cg.sizes.includes(v.size)) cg.sizes.push(v.size);
            if (v.base_cost && (!cg.base_cost || v.base_cost < cg.base_cost)) cg.base_cost = v.base_cost;
        });

        if (groups.length === 0) {
            groups.push({
                color: 'Màu mặc định',
                color_hex: '#ffffff',
                skus: [],
                sizes: [],
                base_cost: 0
            });
        }
        return groups;
    }, [variations]);

    // Check which colors are currently selected based on selectedVariants
    const isColorActive = (cg: ColorGroup) => {
        if (!cg.skus.length) return true;
        return cg.skus.some(sku => selectedVariants[sku]?.on);
    };

    // Call backend API to generate mockups for all distinct colors
    useEffect(() => {
        const placements = areas.map((a: any) => ({
            print_area_key: a.key,
            area: spaceOf ? spaceOf(a) : a,
            layers: (faces[a.key] || []).map(toApiLayer)
        }));

        setLoading(true);
        setErr('');

        const colorsPayload = colorGroups.map(cg => ({
            color: cg.color,
            color_hex: cg.color_hex
        }));

        productsService.previewMockup(blank._id, placements, { colors: colorsPayload })
            .then((res) => {
                const byCol = res.byColor && res.byColor.length > 0
                    ? res.byColor
                    : colorGroups.map((cg, idx) => ({
                        color: cg.color,
                        color_hex: cg.color_hex,
                        images: res.images && res.images[idx] ? [res.images[idx]] : []
                    }));

                setColorPreviews(byCol);

                // Auto initialize selected images from active colors
                const activeColPreviews = byCol.filter(cp => {
                    const cg = colorGroups.find(g => g.color === cp.color);
                    return cg ? isColorActive(cg) : true;
                });
                const activeImgs = Array.from(new Set(activeColPreviews.flatMap(c => c.images).filter(Boolean)));
                if (activeImgs.length > 0) {
                    setSelectedImages(activeImgs);
                    if (!coverImage || !activeImgs.includes(coverImage)) {
                        setCoverImage(activeImgs[0]);
                    }
                }
            })
            .catch((e: any) => {
                const data = e.response?.data;
                const msg = data?.errors?.join('; ') || data?.error || 'Không tạo được xem trước mockup';
                setErr(msg);
                const fallbackList = colorGroups.map(cg => ({
                    color: cg.color,
                    color_hex: cg.color_hex,
                    images: [blank.default_image]
                }));
                setColorPreviews(fallbackList);
            })
            .finally(() => setLoading(false));
    }, [blank._id, faces, colorGroups]);

    // Handle toggle color on/off
    const toggleColor = (cg: ColorGroup, enable: boolean) => {
        if (!setSelectedVariants) return;
        setSelectedVariants(prev => {
            const next = { ...prev };
            cg.skus.forEach(sku => {
                if (next[sku]) {
                    next[sku] = { ...next[sku], on: enable };
                }
            });
            return next;
        });

        // Also update selectedImages
        const colPrev = colorPreviews.find(cp => cp.color === cg.color);
        const colImages = colPrev ? colPrev.images : [];
        if (enable) {
            setSelectedImages(prev => Array.from(new Set([...prev, ...colImages])));
            if (!coverImage && colImages.length > 0) setCoverImage(colImages[0]);
        } else {
            setSelectedImages(prev => {
                const filtered = prev.filter(img => !colImages.includes(img));
                if (colImages.includes(coverImage)) {
                    setCoverImage(filtered[0] || '');
                }
                return filtered;
            });
        }
    };

    // Toggle individual image selection
    const toggleImageSelection = (imgUrl: string) => {
        if (selectedImages.includes(imgUrl)) {
            const remaining = selectedImages.filter(i => i !== imgUrl);
            setSelectedImages(remaining);
            if (coverImage === imgUrl) {
                setCoverImage(remaining[0] || '');
            }
        } else {
            setSelectedImages(prev => Array.from(new Set([...prev, imgUrl])));
            if (!coverImage) setCoverImage(imgUrl);
        }
    };

    // Set an image as cover image
    const handleSetCover = (imgUrl: string) => {
        setCoverImage(imgUrl);
        if (!selectedImages.includes(imgUrl)) {
            setSelectedImages(prev => Array.from(new Set([imgUrl, ...prev])));
        }
    };

    // Select all colors
    const selectAllColors = (enable: boolean) => {
        if (!setSelectedVariants) return;
        setSelectedVariants(prev => {
            const next = { ...prev };
            colorGroups.forEach(cg => {
                cg.skus.forEach(sku => {
                    if (next[sku]) next[sku] = { ...next[sku], on: enable };
                });
            });
            return next;
        });

        if (enable) {
            const all = colorPreviews.flatMap(cp => cp.images);
            setSelectedImages(all);
            if (!coverImage && all.length > 0) setCoverImage(all[0]);
        } else {
            setSelectedImages([]);
            setCoverImage('');
        }
    };

    // Calculate minimum retail price
    const chosenVariants = Object.entries(selectedVariants || {}).filter(([, v]: any) => v.on);
    const prices = (chosenVariants.length ? chosenVariants : variations.map((v: any) => [v.sku, { markup: '0' }]))
        .map(([sku, v]: any) => {
            const bv = variations.find((x: any) => x.sku === sku);
            return bv ? (bv.base_cost || 0) + (Number(v.markup) || 0) : 0;
        })
        .filter((n: number) => n > 0);
    const minPrice = prices.length
        ? Math.min(...prices)
        : (variations.length ? Math.min(...variations.map((v: any) => v.base_cost || 0)) : 0);

    const activeColorGroup = colorGroups[activeColorIdx] || colorGroups[0];
    const activeColorPreview = colorPreviews[activeColorIdx] || colorPreviews[0];
    const heroImage = (activeColorPreview?.images && activeColorPreview.images[activeFaceIdx])
        || activeColorPreview?.images?.[0]
        || blank.default_image;

    const selectedColorsCount = colorGroups.filter(isColorActive).length;
    const selectedSkusCount = Object.values(selectedVariants || {}).filter((v: any) => v.on).length;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {err && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700">
                    {err}
                </div>
            )}

            {/* 1. HERO PREVIEW SECTION */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left: Big Hero Image Canvas */}
                    <div className="lg:col-span-7 bg-[#f6f7f6] p-6 flex flex-col items-center justify-center relative min-h-[440px] border-b lg:border-b-0 lg:border-r border-stone-200">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-stone-500">
                                <Loader2 size={36} className="animate-spin text-[#1a6b1a]" />
                                <span className="text-sm font-semibold">Đang tự động áp thiết kế lên các màu phôi của xưởng...</span>
                                <span className="text-xs text-stone-400">Vui lòng chờ trong giây lát</span>
                            </div>
                        ) : (
                            <>
                                <div className="relative group max-w-[420px] w-full aspect-square flex items-center justify-center">
                                    <img
                                        src={abs(heroImage)}
                                        alt={blank.title}
                                        className="w-full h-full object-contain rounded-xl drop-shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
                                    />
                                    {coverImage === heroImage && (
                                        <div className="absolute top-3 left-3 bg-[#1a6b1a] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> Ảnh đại diện chính
                                        </div>
                                    )}
                                </div>

                                {/* Face Thumbnails (Front / Back / Wrap) */}
                                {areas.length > 1 && (
                                    <div className="flex items-center gap-2 mt-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-stone-200 shadow-xs">
                                        <Layers size={14} className="text-stone-500" />
                                        <span className="text-xs font-bold text-stone-600 mr-1">Mặt in:</span>
                                        {areas.map((a: any, i: number) => (
                                            <button
                                                key={a.key}
                                                type="button"
                                                onClick={() => setActiveFaceIdx(i)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                                                    activeFaceIdx === i
                                                        ? 'bg-[#1a6b1a] text-white shadow-xs'
                                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                                }`}
                                            >
                                                {a.label || a.key}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Info, Price & Color Picker Quick Bar */}
                    <div className="lg:col-span-5 p-6 flex flex-col justify-between">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#edf5ed] text-[#1a6b1a] mb-2.5 border border-[#cbe3cb]">
                                <Check size={13} /> Thiết kế đã render thành công
                            </div>
                            <h2 className="text-xl font-bold text-stone-900 leading-tight mb-2">{blank.title}</h2>
                            <p className="text-xs text-stone-500 mb-4 line-clamp-2">{blank.description}</p>

                            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 mb-5">
                                <span className="text-xs font-semibold text-stone-500 block mb-0.5">Giá bán dự kiến từ:</span>
                                <span className="text-2xl font-extrabold text-[#1a6b1a]">
                                    {minPrice.toLocaleString()}đ
                                </span>
                                <span className="text-xs text-stone-400 ml-1.5 font-medium">(Đã gồm tiền phôi + tiền lời)</span>
                            </div>

                            {/* Live Color Switcher for Hero Preview */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                                        <Palette size={14} className="text-[#1a6b1a]" />
                                        Xem nhanh theo màu sắc ({colorGroups.length} màu):
                                    </label>
                                    <span className="text-xs font-bold text-[#1a6b1a]">
                                        {activeColorGroup?.color}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {colorGroups.map((cg, idx) => {
                                        const isSelected = isColorActive(cg);
                                        const isCurrentHero = activeColorIdx === idx;
                                        return (
                                            <button
                                                key={cg.color}
                                                type="button"
                                                onClick={() => {
                                                    setActiveColorIdx(idx);
                                                    setActiveFaceIdx(0);
                                                }}
                                                className={`relative px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                                                    isCurrentHero
                                                        ? 'border-[#1a6b1a] bg-[#f0f7f0] text-[#1a6b1a] ring-2 ring-[#1a6b1a]/20 shadow-xs'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                                                }`}
                                            >
                                                <span
                                                    className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                                                    style={{ backgroundColor: cg.color_hex }}
                                                />
                                                <span>{cg.color}</span>
                                                {isSelected && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b1a]" title="Màu này đang được chọn bán" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons for Current Hero Image */}
                        <div className="pt-4 border-t border-stone-200 flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => handleSetCover(heroImage)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                    coverImage === heroImage
                                        ? 'bg-[#1a6b1a] text-white border-[#1a6b1a]'
                                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                }`}
                            >
                                <Star size={13} fill={coverImage === heroImage ? 'currentColor' : 'none'} />
                                {coverImage === heroImage ? 'Đang là ảnh đại diện' : 'Đặt làm ảnh đại diện'}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleImageSelection(heroImage)}
                                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                    selectedImages.includes(heroImage)
                                        ? 'bg-[#edf5ed] text-[#1a6b1a] border-[#cbe3cb]'
                                        : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                            >
                                <ImageIcon size={13} />
                                {selectedImages.includes(heroImage) ? 'Đã chọn ảnh này' : 'Bỏ chọn ảnh này'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MULTI-COLOR MOCKUP SELECTION MATRIX */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-stone-900">
                                2. Tùy chọn Màu Sắc & Ảnh Mockup Đưa Vào Bán Hàng
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#edf5ed] text-[#1a6b1a]">
                                {colorGroups.length} màu từ xưởng
                            </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            Hệ thống đã tự động phối thiết kế của bạn lên các màu phôi do xưởng in khai báo. Hãy tick chọn các màu và ảnh bạn muốn mở bán.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            type="button"
                            onClick={() => selectAllColors(true)}
                            className="px-3 py-1.5 text-xs font-bold text-[#1a6b1a] bg-[#edf5ed] hover:bg-[#e1ede1] rounded-lg transition-colors"
                        >
                            Chọn tất cả màu
                        </button>
                        <button
                            type="button"
                            onClick={() => selectAllColors(false)}
                            className="px-3 py-1.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            Bỏ chọn tất cả
                        </button>
                    </div>
                </div>

                {/* Color Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {colorGroups.map((cg, idx) => {
                        const isSelected = isColorActive(cg);
                        const preview = colorPreviews.find(cp => cp.color === cg.color) || colorPreviews[idx];
                        const imgs = preview?.images || [blank.default_image];
                        const mainColImg = imgs[0] || blank.default_image;
                        const isHero = activeColorIdx === idx;

                        return (
                            <div
                                key={cg.color}
                                className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                                    isHero ? 'ring-2 ring-[#1a6b1a]/40 border-[#1a6b1a] ' : ''
                                }${
                                    isSelected
                                        ? 'bg-white border-stone-300 shadow-xs'
                                        : 'bg-stone-50/70 border-dashed border-stone-200 opacity-60'
                                }`}
                            >
                                <div>
                                    {/* Card Header: Color Swatch + Checkbox */}
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-[#1a6b1a] rounded cursor-pointer"
                                                checked={isSelected}
                                                onChange={e => toggleColor(cg, e.target.checked)}
                                            />
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                                                    style={{ backgroundColor: cg.color_hex }}
                                                />
                                                <span className="font-bold text-sm text-stone-900">{cg.color}</span>
                                            </div>
                                        </label>

                                        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                            {cg.sizes.length ? `${cg.sizes.length} sizes: ${cg.sizes.join(', ')}` : 'Biến thể'}
                                        </span>
                                    </div>

                                    {/* Card Body: Mockup Image Preview */}
                                    <div className="relative group rounded-xl overflow-hidden bg-[#f7f8f7] border border-stone-200 aspect-square flex items-center justify-center p-2 mb-3">
                                        <img
                                            src={abs(mainColImg)}
                                            alt={cg.color}
                                            className="w-full h-full object-contain"
                                        />

                                        {/* Cover badge if main image is cover */}
                                        {coverImage === mainColImg && (
                                            <div className="absolute top-2 left-2 bg-[#1a6b1a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                                                <Star size={11} fill="currentColor" /> Ảnh bìa
                                            </div>
                                        )}

                                        {/* Hover overlay with action buttons */}
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveColorIdx(idx);
                                                    setActiveFaceIdx(0);
                                                }}
                                                className="p-2 bg-white text-stone-800 rounded-lg text-xs font-bold shadow hover:bg-stone-100 flex items-center gap-1"
                                                title="Xem to trên khung lớn"
                                            >
                                                <Eye size={13} /> Xem to
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSetCover(mainColImg)}
                                                className={`p-2 rounded-lg text-xs font-bold shadow flex items-center gap-1 ${
                                                    coverImage === mainColImg
                                                        ? 'bg-[#1a6b1a] text-white'
                                                        : 'bg-white text-stone-800 hover:bg-stone-100'
                                                }`}
                                                title="Đặt làm ảnh đại diện sản phẩm"
                                            >
                                                <Star size={13} fill={coverImage === mainColImg ? 'currentColor' : 'none'} />
                                                Đặt ảnh bìa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Multi-face thumbnail strips if there are multiple images for this color */}
                                    {imgs.length > 1 && (
                                        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                                            {imgs.map((im, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setActiveColorIdx(idx);
                                                        setActiveFaceIdx(i);
                                                    }}
                                                    className={`relative w-12 h-12 rounded-lg border overflow-hidden cursor-pointer shrink-0 p-0.5 bg-white ${
                                                        coverImage === im ? 'border-[#1a6b1a] ring-2 ring-[#1a6b1a]/30' : 'border-stone-200'
                                                    }`}
                                                >
                                                    <img src={abs(im)} alt="mặt in" className="w-full h-full object-contain" />
                                                    {coverImage === im && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#1a6b1a] text-white rounded-tl flex items-center justify-center">
                                                            <Star size={7} fill="currentColor" />
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer: Status & Price info */}
                                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                                    <span className={`inline-flex items-center gap-1 font-semibold ${isSelected ? 'text-[#1a6b1a]' : 'text-stone-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#1a6b1a]' : 'bg-stone-300'}`} />
                                        {isSelected ? 'Đã bật màu này' : 'Chưa bật'}
                                    </span>

                                    <span className="font-bold text-stone-700">
                                        Tiền phôi: <b className="text-[#1a6b1a]">{(cg.base_cost || 0).toLocaleString()}đ</b>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Summary Bar */}
                <div className="mt-6 p-4 rounded-xl bg-[#fafcfa] border border-[#e2ede2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Check size={18} className="text-[#1a6b1a] shrink-0" />
                        <span className="text-xs text-stone-700">
                            Sẵn sàng chuyển sang Bước 4: Đã chọn <b>{selectedColorsCount}/{colorGroups.length}</b> màu ({selectedSkusCount} biến thể SKU) & <b>{selectedImages.length}</b> ảnh mockup đã duyệt.
                        </span>
                    </div>

                    <div className="text-xs text-stone-500 font-medium">
                        Bấm <b>Tiếp</b> ở góc trên để cấu hình chi tiết giá & tên sản phẩm.
                    </div>
                </div>
            </div>

            {/* 3. VIDEO QUẢNG CÁO AI (bấm nút mới tốn phí) */}
            {!loading && !err && (coverImage || heroImage) && (
                <VideoAdCard imageUrl={coverImage || heroImage} title={blank.title} />
            )}
        </div>
    );
}

export default Step3MockupPreview;
