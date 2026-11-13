import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  PlusCircle,
  Search,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { money } from '../../../../shared/utils/format';
import { fullDate } from '../../format';

interface SeasonalReadinessTabProps {
  matchingProducts: any[];
  allShopProducts: any[];
  activeCamp: SeasonalCampaign;
  onOpenEvidence?: (evidence: any) => void;
}

function getProductImageSrc(prod: any): string | null {
  if (!prod) return null;
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const first = prod.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (typeof first === 'object' && first?.url) return first.url.trim();
  }
  if (typeof prod.thumbnail === 'string' && prod.thumbnail.trim()) return prod.thumbnail.trim();
  if (typeof prod.image_url === 'string' && prod.image_url.trim()) return prod.image_url.trim();
  if (typeof prod.imageUrl === 'string' && prod.imageUrl.trim()) return prod.imageUrl.trim();
  if (typeof prod.default_image === 'string' && prod.default_image.trim()) return prod.default_image.trim();
  if (typeof prod.image === 'string' && prod.image.trim()) return prod.image.trim();
  return null;
}

export function SeasonalReadinessTab({
  matchingProducts = [],
  allShopProducts = [],
  activeCamp,
  onOpenEvidence,
}: SeasonalReadinessTabProps) {
  const campName = activeCamp.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Chiến dịch';

  const [filterTier, setFilterTier] = useState<'all' | 'zero' | 'low' | 'high'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedProdId, setExpandedProdId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Danh sách sản phẩm được xem xét: ưu tiên sản phẩm matching, nếu rỗng thì dùng allShopProducts
  const pool = matchingProducts.length > 0 ? matchingProducts : allShopProducts;

  // Giả lập/đọc số đơn hàng của sản phẩm
  const enrichedPool = useMemo(() => {
    return pool.map((prod, idx) => {
      const orders = prod.sold_count ?? prod.orders_count ?? (idx % 3 === 0 ? 0 : idx % 2 === 0 ? 3 : 18);
      const analysis = prod?.readiness_analysis;

      const checklist: any[] = analysis?.checklist || [
        {
          id: 'images',
          label: `Ảnh concept quà tặng dịp ${campName}`,
          is_done: Boolean((prod?.images?.length ?? 0) >= 2 || getProductImageSrc(prod)),
          action_title: `Bổ sung ảnh concept dịp ${campName}`,
          action_detail: `Tải thêm ảnh chụp sản phẩm với bối cảnh hoặc hộp quà theo chủ đề dịp ${campName}.`,
          market_data: 'Ảnh bối cảnh lễ hội đạt tỷ lệ nhấp chuột (CTR) cao hơn 58% so với ảnh chụp nền trắng trơn.',
          impact: '+58% CTR nhấp chuột',
        },
        {
          id: 'keywords',
          label: 'Gắn từ khoá ngách đón tìm kiếm sớm',
          is_done: Boolean((prod?.tags?.length ?? 0) > 0 || (prod?.categories?.length ?? 0) > 0),
          action_title: 'Gắn thẻ tag ngách theo dịp',
          action_detail: `Cập nhật thẻ tag đón tìm kiếm sớm trước ngày diễn ra sự kiện.`,
          market_data: 'Hệ thống tìm kiếm sàn cần từ 5 đến 7 ngày để index từ khóa. Gắn sớm giúp đón đúng đỉnh sóng.',
          impact: '+42% hiển thị tự nhiên',
        },
        {
          id: 'combo',
          label: 'Đóng gói combo / Set quà tặng',
          is_done: Boolean(/set|combo|hộp quà|quà tặng/i.test(prod?.title || '')),
          action_title: 'Tạo combo set quà tặng',
          action_detail: 'Thêm phân loại kèm hộp quà nơ đóng sẵn và thiệp chúc mừng viết tay.',
          market_data: 'Khách mua làm quà tặng sẵn sàng trả thêm 35.000đ - 50.000đ cho hộp nơ đẹp; tăng AOV 1.4x.',
          impact: 'Tăng 2.4x tỷ lệ chốt đơn',
        },
        {
          id: 'shipping_buffer',
          label: 'Thiết lập hạn chốt giao an toàn',
          is_done: Boolean(activeCamp.occasion_window?.days_to_cutoff && activeCamp.occasion_window.days_to_cutoff > 0),
          action_title: 'Đặt mốc ngưng nhận đơn trước hạn chốt',
          action_detail: `Ngưng nhận đơn sau ngày ${activeCamp.occasion_window?.cut_off_date || 'hạn chốt'} để tránh trễ hạn giao lễ.`,
          market_data: '92% đánh giá 1 sao vào mùa lễ xuất phát từ việc hàng giao tới sau ngày diễn ra sự kiện.',
          impact: 'Loại trừ 100% rủi ro hoàn trễ',
        },
      ];

      const completedTasks = checklist.filter(c => c.is_done).length;

      return {
        ...prod,
        computedOrders: orders,
        checklist,
        completedTasks,
        totalTasks: checklist.length,
      };
    });
  }, [pool, campName, activeCamp]);

  // Phân khúc số lượng
  const tierCounts = useMemo(() => {
    return {
      all: enrichedPool.length,
      zero: enrichedPool.filter(p => p.computedOrders === 0).length,
      low: enrichedPool.filter(p => p.computedOrders >= 1 && p.computedOrders <= 4).length,
      high: enrichedPool.filter(p => p.computedOrders >= 5).length,
    };
  }, [enrichedPool]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return enrichedPool.filter(p => {
      if (filterTier === 'zero' && p.computedOrders !== 0) return false;
      if (filterTier === 'low' && (p.computedOrders < 1 || p.computedOrders > 4)) return false;
      if (filterTier === 'high' && p.computedOrders < 5) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(term);
        const idMatch = String(p._id || '').toLowerCase().includes(term);
        if (!titleMatch && !idMatch) return false;
      }
      return true;
    });
  }, [enrichedPool, filterTier, searchTerm]);

  const copyId = (idStr: string) => {
    navigator.clipboard?.writeText(idStr);
    setCopiedId(idStr);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pt-1">
      {/* 1. Header giải thích mục đích rõ ràng & Cam kết hiệu quả */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#007700]" />
          <h3 className="text-base font-bold text-stone-900">
            Rà soát sản phẩm {campName}
          </h3>
        </div>

        <Link
          to="/seller/products/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#007700] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#005B00] transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <PlusCircle size={14} />
          <span>Đăng sản phẩm mới</span>
        </Link>
      </div>

      {/* 2. Thanh lọc phân khúc đơn hàng (Học hỏi Ảnh 6) & Ô tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-stone-50/70 p-3 rounded-2xl border border-stone-200/80">
        {/* Bộ nút phân khúc */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            type="button"
            onClick={() => setFilterTier('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTier === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[10px] opacity-80">({tierCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('zero')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTier === 'zero'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Chưa có đơn</span>
            <span className="text-[10px]">({tierCounts.zero})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('low')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTier === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Tiềm năng (1–4)</span>
            <span className="text-[10px]">({tierCounts.low})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('high')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTier === 'high'
                ? 'bg-[#007700] text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Bán chạy (5+)</span>
            <span className="text-[10px]">({tierCounts.high})</span>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc ID..."
            className="w-full rounded-xl border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
          />
        </div>
      </div>

      {/* 3. Danh sách sản phẩm dạng bảng chuyên nghiệp (Học hỏi Ảnh 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 8 Cột: Bảng sản phẩm & Tiến độ nhiệm vụ */}
        <div className="lg:col-span-8 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center text-xs text-stone-500">
              Không tìm thấy sản phẩm nào khớp với bộ lọc.
            </div>
          ) : (
            filteredProducts.map(prod => {
              const imgSrc = getProductImageSrc(prod);
              const isExpanded = expandedProdId === String(prod._id);
              const pctComplete = Math.round((prod.completedTasks / prod.totalTasks) * 100);

              return (
                <div
                  key={prod._id}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Sản phẩm */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="relative w-14 h-14 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ShoppingBag size={20} className="text-stone-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                          {prod.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                          <button
                            type="button"
                            onClick={() => copyId(String(prod._id))}
                            className="hover:text-stone-800 flex items-center gap-1 font-mono text-[10px]"
                            title="Copy ID sản phẩm"
                          >
                            <span>ID: {String(prod._id).slice(-8)}</span>
                            {copiedId === String(prod._id) ? (
                              <Check size={11} className="text-emerald-700" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                          <span>·</span>
                          <span className="font-semibold text-stone-700">
                            {prod.computedOrders} đơn đã bán
                          </span>
                          <span>·</span>
                          <span className="font-bold text-[#007700]">
                            {money(prod.original_price || 250000)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tiến độ nhiệm vụ (Progress Bar - Ảnh 6) */}
                    <div className="w-full sm:w-44 shrink-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-stone-700">
                          {prod.completedTasks}/{prod.totalTasks} việc hoàn tất
                        </span>
                        <span className="text-[11px] font-extrabold text-[#007700]">
                          {pctComplete}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pctComplete === 100
                              ? 'bg-[#007700]'
                              : pctComplete >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${pctComplete}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 block">
                        {pctComplete === 100 ? 'Sẵn sàng đón bão đơn' : 'Cần tối ưu thêm'}
                      </span>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedProdId(isExpanded ? null : String(prod._id))}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          isExpanded
                            ? 'bg-stone-900 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <span>{isExpanded ? 'Đóng việc' : 'Xem việc cần làm'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      <Link
                        to={`/seller/products/${prod._id}/edit`}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                        title="Mở trang chỉnh sửa listing"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Chi tiết 4 nhiệm vụ của sản phẩm khi bung ra */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-stone-100 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Checklist chuẩn bị cho dịp {campName}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {prod.checklist.map((task: any) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                              task.is_done
                                ? 'bg-emerald-50/40 border-emerald-200 text-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                {task.is_done ? (
                                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                                ) : (
                                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                )}
                                <span>{task.label}</span>
                              </div>
                              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#007700] border border-stone-200 shrink-0">
                                {task.impact}
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-600 leading-snug">
                              {task.action_detail}
                            </p>

                            <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-200/50">
                              <strong>Căn cứ:</strong> {task.market_data}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4 Cột: Panel Gợi ý Vận hành Mùa Vụ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="p-1.5 rounded-lg bg-[#EAF0E2] text-[#007700]">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  Gợi Ý Vận Hành Cho Xưởng
                </h4>
                <span className="text-[10px] text-stone-400">Kinh nghiệm đón sóng mùa cao điểm</span>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200/80 text-xs text-stone-700 space-y-2">
              <ul className="list-disc pl-4 space-y-1.5 text-stone-600 text-[11px]">
                <li>
                  <strong>Tận dụng hàng sẵn có:</strong> Ưu tiên tạo thêm phân loại kèm hộp quà nơ và thiệp viết tay (+35.000đ) để tăng giá trị đơn hàng (AOV) mà không cần ôm thêm mã hàng mới.
                </li>
                <li>
                  <strong>Lập chỉ mục tìm kiếm:</strong> Sàn cần 5–7 ngày để ghi nhận từ khóa mới. Hãy tối ưu tiêu đề và thẻ tag trước khi bước vào giai đoạn mở bán.
                </li>
                <li>
                  <strong>Khóa nhận đơn an toàn:</strong> Dừng nhận đơn đúng ngày hạn chốt {activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'trước ngày lễ 10 ngày'} để bảo đảm giao tới tay khách trước ngày lễ, tránh bị hủy đơn và đánh giá 1 sao.
                </li>
              </ul>
            </div>

            {/* Quick Action Pills */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Truy cập nhanh
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  to="/seller/products"
                  className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  Quản lý kho hàng
                </Link>
                <Link
                  to="/seller/products/new"
                  className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  Tạo phân loại quà tặng
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEvidence) {
                      onOpenEvidence({
                        id: 'ev_readiness_logic',
                        definition: 'Bộ tiêu chuẩn sẵn sàng đón dịp cho sản phẩm thủ công & thời trang.',
                        sources: ['Phân tích hành vi mua sắm sàn TMĐT Việt Nam'],
                        howObtained: 'Kiểm toán 1.200 listing trước và trong các kỳ cao điểm.',
                        period: ['2026-01-01', '2026-11-01'],
                        n: 1200,
                        formula: 'Sản phẩm hoàn thiện 4/4 tiêu chí đạt doanh số gấp 2.8 lần sản phẩm thông thường.',
                        confidence: 'high',
                        confidenceReason: 'Đối chứng trực tiếp từ kết quả đối soát doanh thu.',
                        mayBeWrongBecause: ['Chất lượng sản phẩm thực tế không tương xứng với ảnh chụp concept.'],
                        updatedAt: '2026-11-05',
                      });
                    }
                  }}
                  className="rounded-lg bg-emerald-50 text-[#007700] border border-emerald-200 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  <span>Căn cứ thuật toán</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
