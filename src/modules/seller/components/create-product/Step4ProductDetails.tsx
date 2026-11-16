import { useState } from 'react';
import { Star, Plus, X, Tag as TagIcon, Sparkles } from 'lucide-react';
import { abs } from './useHTMLImage';
import SmartProductAiModal from '../SmartProductAiModal';
import { IntelPreviewSection } from './IntelPreviewSection';
import { ProposeCategoryModal } from './ProposeCategoryModal';
import { VariantPricingTable, type SelectedVariants } from './VariantPricingTable';

interface Step4Props {
    title: string;
    setTitle: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    categories: any[];
    categoryId: string;
    setCategoryId: (val: string) => void;
    availableTags?: any[];
    selectedTags?: string[];
    setSelectedTags?: React.Dispatch<React.SetStateAction<string[]>>;
    materials?: string[];
    setMaterials?: (val: string[]) => void;
    onCategoryProposed?: () => void;
    blank: any;
    selectedVariants: SelectedVariants;
    setSelectedVariants: React.Dispatch<React.SetStateAction<SelectedVariants>>;
    selectedImages?: string[];
    coverImage?: string;
    /** % hoa hồng sàn. null = chưa tải được, khi đó không hiện giá niêm yết dự kiến. */
    commissionPercent: number | null;
}

export function Step4ProductDetails({
    title, setTitle,
    description, setDescription,
    categories, categoryId, setCategoryId,
    availableTags = [],
    selectedTags = [],
    setSelectedTags = () => {},
    materials = [],
    setMaterials = () => {},
    onCategoryProposed,
    blank, selectedVariants, setSelectedVariants,
    selectedImages = [],
    coverImage = '',
    commissionPercent,
}: Step4Props) {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const baseBlankCost = blank?.variations?.[0]?.print_cost_vnd || blank?.variations?.[0]?.price || 0;
    const [newTagInput, setNewTagInput] = useState('');

    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const handleAddTag = (nameToAdd?: string) => {
        const val = (nameToAdd ?? newTagInput).trim();
        if (!val) return;
        if (!selectedTags.includes(val)) {
            setSelectedTags(prev => [...prev, val]);
        }
        if (!nameToAdd) setNewTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setSelectedTags(prev => prev.filter(t => t !== tagToRemove));
    };

    const suggestedTags = availableTags.filter((t: any) => !selectedTags.includes(t.name)).slice(0, 8);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Ảnh sản phẩm đã chọn từ bước 3 */}
            {selectedImages && selectedImages.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-stone-900">Ảnh Sản Phẩm Khả Dụng ({selectedImages.length})</h2>
                            <span className="text-xs bg-[#edf5ed] text-[#1a6b1a] font-bold px-2.5 py-0.5 rounded-full">
                                Đã duyệt từ Bước 3
                            </span>
                        </div>
                        {coverImage && (
                            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                                Ảnh có gắn huy hiệu <span className="text-[#1a6b1a] font-bold">⭐</span> sẽ là ảnh đại diện chính khi lên sàn
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {selectedImages.map((src, i) => (
                            <div
                                key={i}
                                className={`relative w-20 h-20 rounded-xl border overflow-hidden shrink-0 bg-stone-50 p-1 transition-all ${
                                    coverImage === src
                                        ? 'border-[#1a6b1a] ring-2 ring-[#1a6b1a]/20 shadow-xs'
                                        : 'border-stone-200'
                                }`}
                            >
                                <img
                                    src={abs(src)}
                                    alt="mockup"
                                    className="w-full h-full object-contain"
                                />
                                {coverImage === src && (
                                    <span className="absolute top-1 left-1 bg-[#1a6b1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                        <Star size={9} fill="currentColor" /> Bìa
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form đặt tên và thông tin */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-bold text-stone-900">1. Đặt tên & Thông tin sản phẩm</h2>
                    <button
                        type="button"
                        onClick={() => setIsAiModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
                    >
                        <Sparkles size={14} className="text-amber-300 animate-pulse" />
                        <span>✨ AI Gợi ý tên, giá & từ khóa hot</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[13px] font-semibold text-stone-800 mb-[7px]">Tên sản phẩm POD *</label>
                        <input
                            type="text"
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)]"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`VD: ${blank?.title ? `${blank.title} Nghệ Thuật` : 'Sản phẩm POD sáng tạo...'}`}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-[7px]">
                            <label className="text-[13px] font-semibold text-stone-800">Danh mục sản phẩm *</label>
                            <button
                                type="button"
                                onClick={() => setShowCategoryModal(true)}
                                className="text-xs font-semibold text-[#007700] hover:text-[#005B00] hover:underline flex items-center gap-1"
                            >
                                <Plus size={13} /> Đề xuất danh mục
                            </button>
                        </div>
                        <select
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] text-stone-900 bg-white outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)]"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">— Chọn danh mục —</option>
                            {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-[7px]">
                            <label className="text-[13px] font-semibold text-stone-800">Thẻ sản phẩm (Tags)</label>
                            <span className="text-[11px] text-stone-400">Chọn hoặc nhập thẻ mới</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)]"
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                placeholder="Gõ thẻ & Enter (ví dụ: vintage, cotton...)"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTag()}
                                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-[9px] transition-colors"
                            >
                                Thêm
                            </button>
                        </div>
                    </div>

                    {/* Vùng hiển thị thẻ đã chọn */}
                    <div className="md:col-span-2">
                        {selectedTags.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                                <span className="text-xs font-semibold text-stone-500 mr-1">Thẻ đã gắn:</span>
                                {selectedTags.map(tag => {
                                    const isExisting = availableTags.some((t: any) => t.name.toLowerCase() === tag.toLowerCase());
                                    return (
                                        <span
                                            key={tag}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                isExisting
                                                    ? 'bg-[#EAF0E2] text-[#005B00] border border-[#007700]/20'
                                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                                            }`}
                                        >
                                            <TagIcon size={11} />
                                            {tag}
                                            {!isExisting && <span className="text-[10px] opacity-75 font-normal">(chờ duyệt)</span>}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-red-600 transition-colors ml-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-xs text-stone-400 italic">Chưa gắn thẻ nào cho sản phẩm này.</div>
                        )}

                        {/* Gợi ý thẻ có sẵn */}
                        {suggestedTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-[11px] text-stone-400">Gợi ý thẻ có sẵn:</span>
                                {suggestedTags.map((t: any) => (
                                    <button
                                        key={t._id}
                                        type="button"
                                        onClick={() => handleAddTag(t.name)}
                                        className="text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full transition-colors"
                                    >
                                        + {t.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[13px] font-semibold text-stone-800 mb-[7px]">Mô tả sản phẩm * (ít nhất 10 ký tự)</label>
                        <textarea
                            rows={3}
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)] resize-y"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Nhập chi tiết về sản phẩm, chất liệu, cách bảo quản..."
                        />
                    </div>

                    <IntelPreviewSection
                        source={{ title, description, categories, categoryId, tags: selectedTags, materials, images: selectedImages, blank, selectedVariants, commissionPercent }}
                        onMaterialsChange={setMaterials}
                    />
                </div>
            </div>

            <ProposeCategoryModal
                open={showCategoryModal}
                categories={categories}
                onClose={() => setShowCategoryModal(false)}
                onProposed={onCategoryProposed}
            />

            <VariantPricingTable
                blank={blank}
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
                commissionPercent={commissionPercent}
            />

            {/* Modal Gợi Ý Thông Minh AI */}
            <SmartProductAiModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                categories={categories}
                initialCategory={categoryId}
                initialTitle={title || (blank?.title ? `${blank.title} Nghệ Thuật` : '')}
                initialMaterial={blank?.material || blank?.variations?.[0]?.material || ''}
                blankCost={baseBlankCost}
                isPod={true}
                onApplyTitle={setTitle}
                onApplyDescription={setDescription}
                onApplyMarkup={(markupVal) => {
                    setSelectedVariants((prev: any) => {
                        const next = { ...prev };
                        Object.keys(next).forEach(sku => {
                            next[sku] = { ...next[sku], markup: String(markupVal) };
                        });
                        return next;
                    });
                }}
                onApplyAll={(aiData) => {
                    if (aiData.title) setTitle(aiData.title);
                    if (aiData.description) setDescription(aiData.description);
                    if (aiData.categoryId) setCategoryId(aiData.categoryId);
                    if (aiData.markup && aiData.markup > 0) {
                        setSelectedVariants((prev: any) => {
                            const next = { ...prev };
                            Object.keys(next).forEach(sku => {
                                next[sku] = { ...next[sku], markup: String(aiData.markup) };
                            });
                            return next;
                        });
                    }
                }}
            />
        </div>
    );
}

export default Step4ProductDetails;
