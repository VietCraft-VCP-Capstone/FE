import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Flame, Tag, Coins, FileText, Check, Copy, 
  RefreshCw, X, Lightbulb, CheckCircle2, ArrowRight
} from 'lucide-react';
import { analyticsApi, SmartProductSuggestionResult } from '../../analytics/services/analyticsApi';

export interface SmartProductAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'modal' | 'inline';
  categories?: any[];
  initialCategory?: string;
  initialTitle?: string;
  blankCost?: number;
  isPod?: boolean;
  onApplyTitle?: (title: string) => void;
  onApplyPrice?: (price: number) => void;
  onApplyMarkup?: (markup: number) => void;
  onApplyDescription?: (desc: string) => void;
  onApplyTags?: (tagNames: string[]) => void;
  onApplyAll?: (data: {
    title: string;
    price: number;
    markup?: number;
    description: string;
    tags: string[];
    categoryId?: string;
  }) => void;
}

export function SmartProductAiModal({
  isOpen,
  onClose,
  mode = 'modal',
  categories = [],
  initialCategory = '',
  initialTitle = '',
  blankCost = 0,
  isPod = false,
  onApplyTitle,
  onApplyPrice,
  onApplyMarkup,
  onApplyDescription,
  onApplyTags,
  onApplyAll,
}: SmartProductAiModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [keywordIdea, setKeywordIdea] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SmartProductSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User selections inside modal
  const [chosenTitle, setChosenTitle] = useState('');
  const [chosenPrice, setChosenPrice] = useState<number>(0);
  const [chosenMarkup, setChosenMarkup] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Find category name if categoryId was given
      const matchedCat = categories.find(c => c._id === selectedCategory || c.name === selectedCategory);
      const catName = matchedCat?.name || selectedCategory;

      const result = await analyticsApi.getSmartProductSuggestion({
        category_id: selectedCategory,
        category_name: catName,
        keywords: keywordIdea.trim(),
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
      }
    } catch (err: any) {
      console.error('Failed to fetch AI product suggestion:', err);
      setError('Chưa thể lấy dữ liệu phân tích từ AI lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, keywordIdea, blankCost, categories]);

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
      setSelectedCategory(initialCategory);
      setKeywordIdea(extractCoreTopic(initialTitle));
      fetchSuggestion();
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
  };

  const handleApplyAllChanges = () => {
    const finalPrice = chosenPrice || data?.pricing_insight?.recommended_price || 0;
    const finalMarkup = chosenMarkup || data?.pricing_insight?.recommended_markup || 0;
    const finalTitle = chosenTitle || (data?.suggested_titles?.[0] ?? '');
    const finalDesc = data?.seo_description || '';
    const finalTags = selectedTags.length > 0 ? selectedTags : (data?.suggested_tags ?? []);

    if (onApplyAll) {
      onApplyAll({
        title: finalTitle,
        price: finalPrice,
        markup: finalMarkup,
        description: finalDesc,
        tags: finalTags,
        categoryId: selectedCategory || undefined,
      });
    } else {
      if (onApplyTitle && finalTitle) onApplyTitle(finalTitle);
      if (onApplyPrice && finalPrice > 0) onApplyPrice(finalPrice);
      if (onApplyMarkup && finalMarkup > 0) onApplyMarkup(finalMarkup);
      if (onApplyDescription && finalDesc) onApplyDescription(finalDesc);
      if (onApplyTags && finalTags.length > 0) onApplyTags(finalTags);
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="text-amber-300 animate-pulse" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  VietCraft AI Studio
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-xs">
                  Market Intelligence
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                Gợi ý Tên chuẩn SEO, Giá bán tối ưu & Từ khóa Hot từ 5.000+ đối thủ TMĐT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title={mode === 'inline' ? 'Thu gọn trợ lý' : 'Đóng'}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

          {/* Quick Search & Filter Toolbar */}
          <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Ý tưởng hoặc chủ đề (VD: anime, hoa sen, vintage...)"
                value={keywordIdea}
                onChange={e => setKeywordIdea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSuggestion()}
                className="w-full px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs text-white placeholder:text-emerald-200/70 focus:outline-none focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-400 transition"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
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
              <button
                type="button"
                onClick={fetchSuggestion}
                disabled={loading}
                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang phân tích...' : 'Phân tích lại'}
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
              <h4 className="text-sm font-bold text-stone-800">AI đang quét dữ liệu thị trường & đối thủ...</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Đang phân tích chỉ số nhu cầu Google Trends, phân vị giá bán chạy và từ khóa hot có tỷ lệ chuyển đổi cao.
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={fetchSuggestion}
                className="text-xs font-bold text-rose-600 underline hover:text-rose-800"
              >
                Bấm để thử lại
              </button>
            </div>
          ) : data ? (
            <>
              {/* SECTION 1: Từ Khóa & Xu Hướng Hot */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="text-orange-500 fill-orange-500" size={16} />
                    Từ Khóa Hot Đang Có Nhu Cầu Cao (Google Trends & TMĐT)
                  </h4>
                  <span className="text-[11px] text-stone-400 font-medium">Bấm vào tag để bổ sung</span>
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
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        item.is_hot
                          ? 'bg-orange-50/80 text-orange-800 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span>{item.keyword}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        item.growth.startsWith('+') ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200/70 text-stone-600'
                      }`}>
                        {item.growth}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Gợi Ý Tiêu Đề Chuẩn SEO */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="text-emerald-600" size={16} />
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
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
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
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition"
                            title="Sao chép tiêu đề"
                          >
                            {copiedField === `title_${idx}` ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplySingleTitle(titleOption);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
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
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="text-amber-500" size={16} />
                      Định Giá Bán Tối Ưu Lợi Nhuận
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Tỷ lệ chuyển đổi cao nhất
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Thẻ Giá Đề Xuất */}
                    <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider">
                        Giá Bán Đề Xuất
                      </span>
                      <div className="text-xl font-black text-emerald-700">
                        {data.pricing_insight.recommended_price.toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-[10px] text-emerald-800/80 font-medium">
                        Điểm cân bằng giữa số lượng bán & lợi nhuận
                      </p>
                    </div>

                    {/* Thẻ Khoảng Giá Thị Trường (P25 - P75) */}
                    <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-black text-stone-500 tracking-wider">
                        Biên Giá Cạnh Tranh (P25 - P75)
                      </span>
                      <div className="text-sm font-black text-stone-800">
                        {data.pricing_insight.price_range.low.toLocaleString('vi-VN')}đ — {data.pricing_insight.price_range.high.toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-[10px] text-stone-500">
                        Vùng giá chiếm 50% doanh số các shop bán chạy
                      </p>
                    </div>

                    {/* Thẻ Lợi Nhuận Markup (POD) */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider">
                        {isPod ? 'Lợi Nhuận Markup Đề Xuất' : 'Giá Phân Khúc Cao Cấp'}
                      </span>
                      <div className="text-xl font-black text-amber-700">
                        {isPod 
                          ? `${data.pricing_insight.recommended_markup.toLocaleString('vi-VN')}đ`
                          : `${data.pricing_insight.price_range.premium.toLocaleString('vi-VN')}đ`}
                      </div>
                      <p className="text-[10px] text-amber-800/80 font-medium">
                        {isPod && blankCost > 0 
                          ? `(Giá phôi ${blankCost.toLocaleString('vi-VN')}đ + Lời ${data.pricing_insight.recommended_markup.toLocaleString('vi-VN')}đ)`
                          : 'Dành cho mẫu thiết kế độc quyền'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Text Insight */}
                  <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 flex items-start gap-2 border border-stone-150">
                    <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] leading-relaxed">
                      {data.pricing_insight.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 4: Gợi Ý Mô Tả & Thẻ Tags */}
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="text-indigo-600" size={16} />
                    Mô Tả Sản Phẩm & Thẻ Tags Tối Ưu
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.seo_description, 'desc')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    {copiedField === 'desc' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedField === 'desc' ? 'Đã chép mô tả' : 'Sao chép mô tả'}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={data.seo_description}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 font-mono leading-relaxed resize-none focus:outline-none"
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
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Áp Dụng Tất Cả Vào Form</span>
            <ArrowRight size={13} />
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
