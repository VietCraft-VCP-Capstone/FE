import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
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
  /** % hoa hồng sàn cộng lên giá seller nhận → giá niêm yết. POD: lời = giá niêm yết bỏ hoa hồng − giá phôi */
  commissionPercent?: number | null;
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
  commissionPercent = null,
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
  // Seller tự chọn mức giá: không bắt buộc lấy giá AI đề xuất
  const [priceChoice, setPriceChoice] = useState<'rec' | 'p25' | 'p50' | 'p75' | 'custom'>('rec');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedField, setAppliedField] = useState<string | null>(null);

  const markApplied = (field: string) => {
    setAppliedField(field);
    setTimeout(() => setAppliedField(null), 2200);
  };

  // Huỷ lượt gọi trước khi gọi lượt mới: đổi danh mục nhanh thì phản hồi cũ về sau không được đè kết quả mới
  const inflightRef = useRef<AbortController | null>(null);

  const fetchSuggestion = useCallback(async (overrides?: { catId?: string; kw?: string; mat?: string }) => {
    inflightRef.current?.abort();
    const controller = new AbortController();
    inflightRef.current = controller;
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
      }, controller.signal);

      if (result) {
        setData(result);
        if (result.suggested_titles?.length > 0) {
          setChosenTitle(result.suggested_titles[0]);
        }
        if (result.pricing_insight) {
          setChosenPrice(result.pricing_insight.recommended_price);
          setPriceChoice('rec');
          setCustomPrice('');
          setChosenMarkup(isPod && blankCost > 0
            ? markupFor(result.pricing_insight.recommended_price)
            : result.pricing_insight.recommended_markup);
        }
        if (result.suggested_tags) {
          // Chọn sẵn 5 thẻ đầu (AI đã xếp thẻ sát sản phẩm lên trước) — seller bấm để bỏ/chọn thêm
          setSelectedTags(result.suggested_tags.slice(0, 5));
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
      if (controller.signal.aborted) return;
      console.error('Failed to fetch AI product suggestion:', err);
      setError('Chưa lấy được gợi ý, vui lòng thử lại.');
    } finally {
      if (inflightRef.current === controller) setLoading(false);
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

  const selectPrice = (choice: 'rec' | 'p25' | 'p50' | 'p75' | 'custom', value: number) => {
    setPriceChoice(choice);
    setChosenPrice(value);
    // POD: giá bán = giá phôi + markup → đổi mức giá thì markup đổi theo
    if (isPod && blankCost > 0) setChosenMarkup(markupFor(value));
  };

  /** Tiền lời của seller ở giá niêm yết `listPrice`: bỏ hoa hồng sàn rồi trừ giá phôi. */
  const markupFor = (listPrice: number) =>
    Math.max(0, Math.round(listPrice / (1 + (Number(commissionPercent) || 0) / 100)) - blankCost);

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

  const sameTag = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.some(t => sameTag(t, tag)) ? prev.filter(t => !sameTag(t, tag)) : [...prev, tag]);
  const addCustomTag = () => {
    const tag = customTagInput.replace(/#/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 30);
    if (tag && !selectedTags.some(t => sameTag(t, tag))) setSelectedTags(prev => [...prev, tag]);
    setCustomTagInput('');
  };

  // Chỉ áp dụng đúng những thẻ seller đang chọn (trước đây không chọn gì thì đẩy hết mọi thẻ vào form)
  const handleApplySingleTags = () => {
    if (selectedTags.length > 0 && onApplyTags) {
      onApplyTags(selectedTags);
      markApplied('tags');
    }
  };

  const handleApplyAllChanges = () => {
    const finalPrice = chosenPrice || data?.pricing_insight?.recommended_price || 0;
    const finalMarkup = chosenMarkup || data?.pricing_insight?.recommended_markup || 0;
    const finalTitle = chosenTitle || (data?.suggested_titles?.[0] ?? '');
    const finalDesc = data?.seo_description || '';
    const finalTags = selectedTags;
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
                Gợi ý đăng sản phẩm
              </h3>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
              Tên sản phẩm, giá bán, thẻ tag và mô tả
            </p>
          </div>

          <button
            onClick={onClose}
            title={mode === 'inline' ? 'Thu gọn' : 'Đóng'}
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
                placeholder="Tên sản phẩm (VD: Bình hoa gốm men rạn)"
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
                <span>{loading ? 'Đang tải...' : 'Gợi ý lại'}</span>
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
              <h4 className="text-sm font-bold text-stone-800">Đang chuẩn bị gợi ý...</h4>
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
              {data.ai_engine_status?.notice && (
                <p className="p-3 rounded-2xl border bg-amber-50/70 border-amber-200/80 text-[11px] text-amber-900">
                  {data.ai_engine_status.notice}
                </p>
              )}

              {/* Tên sản phẩm sau khi làm gọn — kết quả lọc tiêu đề seller nhập */}
              {data.input_analysis && data.input_analysis.clean_title && (
                <div className="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10.5px] font-black text-stone-700 uppercase tracking-wider">Tên sản phẩm của bạn</span>
                    {data.input_analysis.clean_title !== keywordIdea.trim() && (
                      <button
                        type="button"
                        onClick={() => setKeywordIdea(data.input_analysis!.clean_title)}
                        className="text-[10.5px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Dùng tên này
                      </button>
                    )}
                  </div>
                  <p className="font-bold text-stone-900">{data.input_analysis.clean_title}</p>
                  {Object.keys(data.input_analysis.attributes || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(data.input_analysis.attributes).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10.5px] text-stone-700">
                          {k}: <strong className="text-stone-900">{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {data.input_analysis.issues?.length > 0 && (
                    <ul className="space-y-0.5">
                      {data.input_analysis.issues.map((it, i) => (
                        <li key={i} className="text-[10.5px] text-amber-800 leading-snug">⚠ {it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Category Confirmation Alert if needed */}
              {data.category?.needs_confirmation && data.category?.resolved_name && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs flex items-center justify-between gap-3 text-amber-950">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">
                      Danh mục phù hợp: <span className="underline font-extrabold">{data.category.resolved_name}</span>
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

              {/* SECTION 1: Thẻ tag */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Thẻ tag
                  </h4>
                  {onApplyTags && (
                    <button
                      type="button"
                      onClick={handleApplySingleTags}
                      disabled={selectedTags.length === 0}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{appliedField === 'tags' ? 'Đã thêm vào form' : `Thêm ${selectedTags.length} thẻ vào form`}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ...(data.suggested_tags ?? []),
                    ...selectedTags.filter(t => !(data.suggested_tags ?? []).some(s => sameTag(s, t))),   // thẻ seller tự thêm
                  ].map(tag => {
                    const on = selectedTags.some(t => sameTag(t, tag));
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleTag(tag)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          on
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        <span>{on ? '✓' : '+'} {tag}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                    maxLength={30}
                    placeholder="Thêm thẻ khác..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* SECTION 2: Tên sản phẩm */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Tên sản phẩm
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

              {/* SECTION 3: Giá bán */}
              {data.pricing_insight && (
                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Giá bán
                    </h4>
                  </div>

                  {data.pricing_insight.recommended_price <= 0 || data.pricing_insight.method === 'none' ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-1.5">
                      <p className="text-xs font-bold text-stone-700">
                        Chưa tìm thấy đủ sản phẩm tương tự để gợi ý giá
                      </p>
                      <p className="text-[11px] text-stone-500 max-w-lg mx-auto">
                        Bạn thử ghi tên sản phẩm rõ hơn (loại, chất liệu, thương hiệu) rồi bấm "Gợi ý lại".
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Thẻ Giá Đề Xuất */}
                        <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider">
                              {priceChoice === 'rec' ? 'Giá gợi ý' : 'Giá bạn chọn'}
                            </span>
                            <div className="text-xl font-black text-emerald-700">
                              {(chosenPrice || data.pricing_insight.recommended_price).toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                          {onApplyPrice && !isPod && (
                            <button
                              type="button"
                              onClick={handleApplySinglePrice}
                              className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <span>{appliedField === 'price' ? 'Đã áp dụng' : 'Áp dụng giá này'}</span>
                            </button>
                          )}
                        </div>

                        {/* Thẻ Khoảng Giá Thị Trường */}
                        <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                          <span className="text-[10px] uppercase font-black text-stone-500 tracking-wider">
                            Giá phổ biến
                          </span>
                          <div className="text-sm font-black text-stone-800">
                            {data.pricing_insight.price_range.low.toLocaleString('vi-VN')}đ — {data.pricing_insight.price_range.high.toLocaleString('vi-VN')}đ
                          </div>
                        </div>

                        {/* Thẻ Lợi Nhuận Markup (POD) */}
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider">
                              {isPod ? 'Tiền lời mỗi sản phẩm' : 'Giá hàng cao cấp'}
                            </span>
                            <div className="text-xl font-black text-amber-700">
                              {isPod 
                                ? `${chosenMarkup.toLocaleString('vi-VN')}đ`
                                : `${data.pricing_insight.price_range.premium.toLocaleString('vi-VN')}đ`}
                            </div>
                            {isPod && blankCost > 0 && (
                              <p className="text-[10px] text-amber-800/80 font-medium">
                                Giá phôi {blankCost.toLocaleString('vi-VN')}đ{commissionPercent ? `, đã trừ phí sàn ${commissionPercent}%` : ''}
                              </p>
                            )}
                          </div>
                          {isPod && onApplyMarkup && (
                            <button
                              type="button"
                              onClick={handleApplySingleMarkup}
                              className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-[11px] shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <span>{appliedField === 'markup' ? 'Đã áp dụng' : 'Áp dụng tiền lời này'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CHỌN MỨC GIÁ MONG MUỐN */}
                      {(() => {
                        const pi = data.pricing_insight;
                        const median = pi.price_range.median || pi.recommended_price;
                        const options: { key: 'p25' | 'rec' | 'p50' | 'p75'; label: string; sub: string; value: number }[] = [
                          { key: 'p25', label: 'Dễ bán', sub: '', value: pi.price_range.low },
                          { key: 'rec', label: 'Gợi ý', sub: pi.demand_signal?.direction === 'up' ? 'Đang được tìm nhiều' : pi.demand_signal?.direction === 'down' ? 'Đang ít người tìm' : '', value: pi.recommended_price },
                          ...(median !== pi.recommended_price ? [{ key: 'p50' as const, label: 'Trung bình', sub: '', value: median }] : []),
                          { key: 'p75', label: 'Cao cấp', sub: '', value: pi.price_range.high },
                        ];
                        const shown = priceChoice === 'custom' ? (Number(customPrice) || 0) : chosenPrice;
                        const warn = shown > 0 && blankCost > 0 && shown < blankCost
                          ? 'Giá thấp hơn giá vốn, bạn sẽ bán lỗ.'
                          : shown > 0 && shown < pi.price_range.low
                            ? 'Rẻ hơn hầu hết sản phẩm tương tự.'
                            : shown > (pi.price_range.premium || pi.price_range.high)
                              ? 'Đắt hơn hầu hết sản phẩm tương tự.'
                              : '';
                        return (
                          <div className="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2.5">
                            <span className="text-[10.5px] font-black text-stone-700 uppercase tracking-wider block">
                              Chọn mức giá bạn muốn
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {options.map(o => (
                                <button
                                  key={o.key}
                                  type="button"
                                  onClick={() => selectPrice(o.key, o.value)}
                                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${priceChoice === o.key ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-stone-200 hover:border-emerald-300'}`}
                                >
                                  <span className="text-[10px] font-black text-stone-600 uppercase block">{o.label}</span>
                                  <span className="text-sm font-black text-stone-900 block">{o.value.toLocaleString('vi-VN')}đ</span>
                                  {o.sub && <span className="text-[9.5px] text-stone-500 block">{o.sub}</span>}
                                </button>
                              ))}
                              <div className={`p-2 rounded-xl border ${priceChoice === 'custom' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-stone-200'}`}>
                                <span className="text-[10px] font-black text-stone-600 uppercase block">Tự nhập</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="VD: 120000"
                                  value={customPrice}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setCustomPrice(raw);
                                    selectPrice('custom', Number(raw) || 0);
                                  }}
                                  className="w-full mt-0.5 text-sm font-black text-stone-900 bg-transparent outline-none border-b border-stone-300 focus:border-emerald-500"
                                />
                                <span className="text-[9.5px] text-stone-500 block">đồng</span>
                              </div>
                            </div>
                            {warn && <p className="text-[11px] font-semibold text-amber-700">⚠ {warn}</p>}
                          </div>
                        );
                      })()}

                      {/* Sản phẩm tương tự đang bán */}
                        {data.pricing_insight.comparables && data.pricing_insight.comparables.length > 0 && (
                          <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-2">
                            <span className="text-[10.5px] font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                              <ShoppingBag size={12} className="text-stone-500" />
                              Sản phẩm tương tự đang bán
                            </span>

                            <div className="space-y-1.5">
                              {data.pricing_insight.comparables.map((item, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-stone-200 text-xs shadow-2xs hover:border-emerald-200 transition"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="font-semibold text-stone-800 truncate text-[11px]">
                                      {item.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-black text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      {item.price.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                                      item.source?.toLowerCase().includes('vietcraft')
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-sky-50 text-sky-800 border-sky-200'
                                    }`}>
                                      {item.source?.toLowerCase().includes('vietcraft') ? 'VietCraft' : 'Sàn khác'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
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
                    </>
                  )}
                </div>
              )}

              {/* SECTION 4: Mô tả */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Mô tả sản phẩm
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
                        <span>{appliedField === 'desc' ? 'Đã áp dụng' : 'Áp dụng vào form'}</span>
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
            {mode === 'inline' ? 'Thu gọn' : 'Đóng'}
          </button>

          <button
            type="button"
            onClick={handleApplyAllChanges}
            disabled={!data || loading}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>Áp dụng tất cả vào form</span>
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
