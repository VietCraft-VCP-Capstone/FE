import { useState, useEffect, useCallback } from 'react';
import { analyticsApi, SmartProductSuggestionResult } from '../../analytics/services/analyticsApi';

export interface SmartProductAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'modal' | 'inline';
  categories?: any[];
  initialCategory?: string;
  initialTitle?: string;
  initialMaterial?: string;
  blankCost?: number;
  isPod?: boolean;
  onApplyTitle?: (title: string) => void;
  onApplyPrice?: (price: number) => void;
  onApplyMarkup?: (markup: number) => void;
  onApplyDescription?: (desc: string) => void;
  onApplyTags?: (tagNames: string[]) => void;
  onApplyMaterial?: (material: string) => void;
  onApplyAll?: (data: {
    title: string;
    price: number;
    markup?: number;
    description: string;
    tags: string[];
    categoryId?: string;
    material?: string;
  }) => void;
}

export function SmartProductAiModal({
  isOpen,
  onClose,
  mode = 'modal',
  categories = [],
  initialCategory = '',
  initialTitle = '',
  initialMaterial = '',
  blankCost = 0,
  isPod = false,
  onApplyTitle,
  onApplyPrice,
  onApplyMarkup,
  onApplyDescription,
  onApplyTags,
  onApplyMaterial,
  onApplyAll,
}: SmartProductAiModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [keywordIdea, setKeywordIdea] = useState(initialTitle);
  const [material, setMaterial] = useState(initialMaterial);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SmartProductSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User selections inside modal
  const [chosenTitle, setChosenTitle] = useState('');
  const [chosenPrice, setChosenPrice] = useState<number>(0);
  const [chosenMarkup, setChosenMarkup] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedField, setAppliedField] = useState<string | null>(null);

  const markApplied = (field: string) => {
    setAppliedField(field);
    setTimeout(() => setAppliedField(null), 2200);
  };

  const fetchSuggestion = useCallback(async (overrides?: { catId?: string; kw?: string; mat?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const catToUse = overrides?.catId !== undefined ? overrides.catId : selectedCategory;
      const kwToUse = overrides?.kw !== undefined ? overrides.kw : keywordIdea;
      const matToUse = overrides?.mat !== undefined ? overrides.mat : material;

      // Find category name if categoryId was given
      const matchedCat = categories.find(c => c._id === catToUse || c.name === catToUse);
      const catName = matchedCat?.name || catToUse;

      const result = await analyticsApi.getSmartProductSuggestion({
        category_id: catToUse,
        category_name: catName,
        keywords: kwToUse.trim(),
        material: matToUse.trim(),
        blank_cost: blankCost,
      });

      if (result) {
        setData(result);
        if (result.suggested_titles?.length > 0) {
          setChosenTitle(result.suggested_titles[0]);
        }
        if (result.pricing_insight) {
          setChosenPrice(result.pricing_insight.recommended_price);
          setChosenMarkup(result.pricing_insight.recommended_markup);
        }
        if (result.suggested_tags) {
          setSelectedTags(result.suggested_tags.slice(0, 6));
        }

        // Tự động nhận diện và khớp danh mục nếu người bán chưa chọn
        if (!catToUse) {
          const autoCat = categories.find(c =>
            c._id === result.category?.resolved_id ||
            c.name?.toLowerCase() === (result.category_detected || result.category?.resolved_name || '').toLowerCase()
          );
          if (autoCat) {
            setSelectedCategory(autoCat._id || autoCat.id);
          }
        }

        // Tự động điền chất liệu nếu người bán để trống nhưng AI đã nhận diện được từ tiêu đề
        if (!matToUse && result.detected_material) {
          setMaterial(result.detected_material);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch AI product suggestion:', err);
      setError('Chưa thể lấy dữ liệu phân tích lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, keywordIdea, material, blankCost, categories]);

  // Lược bỏ các phần hậu tố (- ...) nếu mở lại từ một tiêu đề đã gợi ý trước đó
  const extractCoreTopic = (rawTitle: string): string => {
    if (!rawTitle) return '';
    let t = rawTitle.trim();
    for (const sep of [' - ', ' – ', ' — ', ' | ', ' / ']) {
      if (t.includes(sep)) t = t.split(sep)[0].trim();
    }
    return t.replace(/\(.*?\)/g, '').trim();
  };

  useEffect(() => {
    if (isOpen) {
      const coreTopic = extractCoreTopic(initialTitle);
      setSelectedCategory(initialCategory);
      setKeywordIdea(coreTopic);
      setMaterial(initialMaterial);
      fetchSuggestion({ catId: initialCategory, kw: coreTopic, mat: initialMaterial });
    }
  }, [isOpen]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplySingleTitle = (title: string) => {
    setChosenTitle(title);
    onApplyTitle?.(title);
    markApplied('title');
  };

  const handleApplySinglePrice = () => {
    const p = chosenPrice || data?.pricing_insight?.recommended_price || 0;
    if (p > 0 && onApplyPrice) {
      onApplyPrice(p);
      markApplied('price');
    }
  };

  const handleApplySingleMarkup = () => {
    const m = chosenMarkup || data?.pricing_insight?.recommended_markup || 0;
    if (m > 0 && onApplyMarkup) {
      onApplyMarkup(m);
      markApplied('markup');
    }
  };

  const handleApplySingleDescription = () => {
    const desc = data?.seo_description || '';
    if (desc && onApplyDescription) {
      onApplyDescription(desc);
      markApplied('desc');
    }
  };

  const handleApplySingleTags = () => {
    const tagsToApply = selectedTags.length > 0 ? selectedTags : (data?.suggested_tags ?? []);
    if (tagsToApply.length > 0 && onApplyTags) {
      onApplyTags(tagsToApply);
      markApplied('tags');
    }
  };

  const handleApplyAllChanges = () => {
    const finalPrice = chosenPrice || data?.pricing_insight?.recommended_price || 0;
    const finalMarkup = chosenMarkup || data?.pricing_insight?.recommended_markup || 0;
    const finalTitle = chosenTitle || (data?.suggested_titles?.[0] ?? '');
    const finalDesc = data?.seo_description || '';
    const finalTags = selectedTags.length > 0 ? selectedTags : (data?.suggested_tags ?? []);
    const finalMaterial = material.trim();
    const finalCatId = selectedCategory || categories.find(c =>
      c.name?.toLowerCase() === (data?.category_detected || data?.category?.resolved_name || '').toLowerCase()
    )?._id;

    if (onApplyAll) {
      onApplyAll({
        title: finalTitle,
        price: finalPrice,
        markup: finalMarkup,
        description: finalDesc,
        tags: finalTags,
        categoryId: finalCatId || undefined,
        material: finalMaterial || undefined,
      });
    } else {
      if (onApplyTitle && finalTitle) onApplyTitle(finalTitle);
      if (onApplyPrice && finalPrice > 0) onApplyPrice(finalPrice);
      if (onApplyMarkup && finalMarkup > 0) onApplyMarkup(finalMarkup);
      if (onApplyDescription && finalDesc) onApplyDescription(finalDesc);
      if (onApplyTags && finalTags.length > 0) onApplyTags(finalTags);
      if (onApplyMaterial && finalMaterial) onApplyMaterial(finalMaterial);
    }
    onClose();
  };

  if (!isOpen) return null;

  const cardContent = (
    <div className={`bg-white overflow-hidden flex flex-col font-sans ${
      mode === 'inline'
        ? 'rounded-2xl border-2 border-emerald-500/40 shadow-sm w-full animate-fade-in'
        : 'rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 max-h-[92vh] my-auto'
    }`}>
      {/* Header với Gradient nổi bật */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                VietCraft AI Studio
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-xs">
                Trợ Lý Niêm Yết
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
              Gợi ý Tên chuẩn SEO, Định giá thị trường & Thẻ tag phổ biến trên sàn
            </p>
          </div>

          <button
            onClick={onClose}
            title={mode === 'inline' ? 'Thu gọn trợ lý' : 'Đóng'}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer text-base font-bold"
          >
            ✕
          </button>
        </div>

          {/* Quick Search & Filter Toolbar */}
          <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="Ý tưởng / chủ đề (VD: hoa sen, vintage...)"
                value={keywordIdea}
                onChange={e => setKeywordIdea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSuggestion()}
                className="w-full px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs text-white placeholder:text-emerald-200/70 focus:outline-none focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-400 transition"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedCategory(val);
                  fetchSuggestion({ catId: val });
                }}
                className="w-full px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:bg-white focus:text-stone-900 transition cursor-pointer"
              >
                <option value="" className="text-stone-900">— Mọi ngành hàng —</option>
                {categories.map((c: any) => (
                  <option key={c._id || c.id} value={c._id || c.id} className="text-stone-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Chất liệu (VD: Men rạn, Tơ tằm, Da thật...)"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSuggestion()}
                className="w-full px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs text-white placeholder:text-emerald-200/70 focus:outline-none focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-400 transition"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => fetchSuggestion()}
                disabled={loading}
                className="w-full py-2 px-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <span>{loading ? 'Đang phân tích...' : 'Phân tích lại'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal/Inline Body */}
        <div className={`overflow-y-auto p-4 sm:p-5 space-y-5 bg-stone-50/50 ${
          mode === 'inline' ? 'max-h-[460px]' : 'flex-1'
        }`}>
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-stone-800">Đang tổng hợp dữ liệu ngành hàng...</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Đang phân tích phân vị giá thị trường, thẻ tag phổ biến và đề xuất tiêu đề SEO chuẩn mực.
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => fetchSuggestion()}
                className="text-xs font-bold text-rose-600 underline hover:text-rose-800"
              >
                Bấm để thử lại
              </button>
            </div>
          ) : data ? (
            <>
              {/* STATUS & TRANSPARENCY NOTICE */}
              {data.ai_engine_status && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  data.ai_engine_status.is_ai_live
                    ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    data.ai_engine_status.is_ai_live ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                  }`} />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[11px] uppercase tracking-wider">
                        Phân Tích Chuyên Sâu
                      </span>
                      {data.pricing_insight?.source_label && !data.pricing_insight.source_label.toLowerCase().includes('ước lượng') && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-stone-200/60 font-semibold text-stone-700">
                          {data.pricing_insight.source_label}
                        </span>
                      )}
                    </div>
                    {data.ai_engine_status.notice && (
                      <p className="text-[11px] text-amber-900/90 leading-tight">
                        {data.ai_engine_status.notice}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Category Confirmation Alert if needed */}
              {data.category?.needs_confirmation && data.category?.resolved_name && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs flex items-center justify-between gap-3 text-amber-950">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">
                      Hệ thống ước lượng ngành hàng: <span className="underline font-extrabold">{data.category.resolved_name}</span>
                    </p>
                    <p className="text-[10px] text-amber-800">
                      Độ chắc chắn chưa cao. Bạn có thể chọn để xác nhận ngành hàng này hoặc tự chọn lại.
                    </p>
                  </div>
                  {data.category.resolved_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(data.category!.resolved_id!);
                      }}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer transition shadow-xs"
                    >
                      Xác nhận
                    </button>
                  )}
                </div>
              )}

              {/* SECTION 1: Thẻ Tags Phổ Biến */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Thẻ Tag Khai Thác Từ Ngành Hàng
                  </h4>
                  {onApplyTags && (
                    <button
                      type="button"
                      onClick={handleApplySingleTags}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{appliedField === 'tags' ? 'Đã áp dụng thẻ!' : 'Áp dụng thẻ vào form'}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.trending_keywords?.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const kw = item.keyword;
                        if (!chosenTitle.toLowerCase().includes(kw.toLowerCase())) {
                          setChosenTitle(prev => `${prev} - ${kw}`);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        item.is_hot
                          ? 'bg-orange-50/80 text-orange-800 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span>{item.keyword}</span>
                      {item.growth && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-stone-200/70 text-stone-700">
                          {item.growth}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Gợi Ý Tiêu Đề Chuẩn SEO */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Gợi Ý Tiêu Đề Chuẩn SEO (Chọn 1 tiêu đề tối ưu nhất)
                  </h4>
                </div>

                <div className="space-y-2">
                  {data.suggested_titles?.map((titleOption, idx) => {
                    const isSelected = chosenTitle === titleOption;
                    return (
                      <div
                        key={idx}
                        onClick={() => setChosenTitle(titleOption)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-stone-50/50 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isSelected ? 'border-emerald-600 bg-white' : 'border-stone-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                          </div>
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950 font-extrabold' : 'text-stone-800'}`}>
                            {titleOption}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(titleOption, `title_${idx}`);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
                            title="Sao chép tiêu đề"
                          >
                            <span>{copiedField === `title_${idx}` ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplySingleTitle(titleOption);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {isSelected ? 'Đang chọn' : 'Chọn'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Phân Tích Giá & Lợi Nhuận Thị Trường */}
              {data.pricing_insight && (
                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Định Giá Bán & Phân Khúc Thị Trường
                    </h4>
                    <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                      {data.pricing_insight.source_label || (data.pricing_insight.market_sample_count > 0 
                        ? `Dữ liệu từ ${data.pricing_insight.market_sample_count} sản phẩm cùng ngành`
                        : 'Căn cứ dữ liệu phân tích')}
                    </span>
                  </div>

                  {data.pricing_insight.recommended_price <= 0 || data.pricing_insight.method === 'none' ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-1.5">
                      <p className="text-xs font-bold text-stone-700">
                        Chưa đủ dữ liệu thị trường để đề xuất mức giá chuẩn xác
                      </p>
                      <p className="text-[11px] text-stone-500 max-w-lg mx-auto">
                        Hệ thống không tự ý đưa ra mức giá mặc định khi thiếu căn cứ so sánh. Vui lòng cung cấp tiêu đề chi tiết hơn hoặc nhập giá vốn (nếu là sản phẩm sản xuất / POD) để tính giá theo chi phí (Cost-Plus).
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Thẻ Giá Đề Xuất */}
                        <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider">
                              Giá Bán Đề Xuất Hợp Lý
                            </span>
                            <div className="text-xl font-black text-emerald-700">
                              {data.pricing_insight.recommended_price.toLocaleString('vi-VN')}đ
                            </div>
                            <p className="text-[10px] text-emerald-800/80 font-medium">
                              Mức giá cân bằng, tối ưu tỉ lệ chốt đơn
                            </p>
                          </div>
                          {onApplyPrice && !isPod && (
                            <button
                              type="button"
                              onClick={handleApplySinglePrice}
                              className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <span>{appliedField === 'price' ? 'Đã áp dụng giá!' : 'Áp dụng giá này'}</span>
                            </button>
                          )}
                        </div>

                        {/* Thẻ Khoảng Giá Thị Trường */}
                        <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                          <span className="text-[10px] uppercase font-black text-stone-500 tracking-wider">
                            Khoảng Giá Phổ Biến Thị Trường
                          </span>
                          <div className="text-sm font-black text-stone-800">
                            {data.pricing_insight.price_range.low.toLocaleString('vi-VN')}đ — {data.pricing_insight.price_range.high.toLocaleString('vi-VN')}đ
                          </div>
                          <p className="text-[10px] text-stone-500">
                            Dải giá người tiêu dùng sẵn sàng chi trả
                          </p>
                        </div>

                        {/* Thẻ Lợi Nhuận Markup (POD) */}
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider">
                              {isPod ? 'Lợi Nhuận Markup Đề Xuất' : 'Phân Khúc Cao Cấp'}
                            </span>
                            <div className="text-xl font-black text-amber-700">
                              {isPod 
                                ? `${data.pricing_insight.recommended_markup.toLocaleString('vi-VN')}đ`
                                : `${data.pricing_insight.price_range.premium.toLocaleString('vi-VN')}đ`}
                            </div>
                            <p className="text-[10px] text-amber-800/80 font-medium">
                              {isPod && blankCost > 0 
                                ? `(Giá phôi ${blankCost.toLocaleString('vi-VN')}đ + Lời ${data.pricing_insight.recommended_markup.toLocaleString('vi-VN')}đ)`
                                : 'Dành cho hàng cao cấp hoặc đóng gói đặc biệt'}
                            </p>
                          </div>
                          {isPod && onApplyMarkup && (
                            <button
                              type="button"
                              onClick={handleApplySingleMarkup}
                              className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-[11px] shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <span>{appliedField === 'markup' ? 'Đã áp dụng markup!' : 'Áp dụng markup này'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hộp Căn cứ phân tích thị trường & định giá */}
                      {data.pricing_insight.summary && (
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-1 text-xs">
                          <span className="text-[10.5px] uppercase font-black text-emerald-900 tracking-wider">
                            Căn cứ phân tích mức giá:
                          </span>
                          <p className="text-stone-700 font-medium leading-relaxed">
                            {data.pricing_insight.summary}
                          </p>
                        </div>
                      )}

                      {/* Warnings if any */}
                      {data.pricing_insight.warnings && data.pricing_insight.warnings.length > 0 && (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1">
                          {data.pricing_insight.warnings.map((w, wIdx) => (
                            <p key={wIdx} className="text-[11px] font-medium text-amber-900 leading-tight">
                              • {w}
                            </p>
                          ))}
                        </div>
                      )}
                      {/* Yếu tố cấu thành giá (nếu có) */}
                      {data.pricing_insight.value_factors && data.pricing_insight.value_factors.length > 0 && (
                        <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 flex flex-wrap items-center gap-1.5 border border-stone-200/60">
                          <span className="text-[10.5px] font-bold text-stone-500">Yếu tố cấu thành giá:</span>
                          {data.pricing_insight.value_factors.map((factor, fIdx) => (
                            <span 
                              key={fIdx}
                              className="inline-flex items-center text-[10px] font-bold bg-amber-100/70 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* SECTION 4: Gợi Ý Mô Tả & Thẻ Tags */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Mô Tả Sản Phẩm & Thẻ Tags Tối Ưu
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(data.seo_description, 'desc')}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded-lg hover:bg-stone-100 border border-stone-200 transition cursor-pointer"
                    >
                      <span>{copiedField === 'desc' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                    {onApplyDescription && (
                      <button
                        type="button"
                        onClick={handleApplySingleDescription}
                        className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        <span>{appliedField === 'desc' ? 'Đã áp dụng mô tả!' : 'Áp dụng vào form'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={7}
                    value={data.seo_description}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 font-sans leading-relaxed resize-y max-h-64 focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            {mode === 'inline' ? 'Thu gọn trợ lý' : 'Đóng'}
          </button>

          <button
            type="button"
            onClick={handleApplyAllChanges}
            disabled={!data || loading}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>Áp Dụng Tất Cả Vào Form</span>
          </button>
        </div>

      </div>
  );

  if (mode === 'inline') {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      {cardContent}
    </div>
  );
}

export default SmartProductAiModal;
