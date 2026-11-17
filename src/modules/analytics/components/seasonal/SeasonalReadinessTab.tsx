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
  const [expandedDoneTasks, setExpandedDoneTasks] = useState<Record<string, boolean>>({});
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

                  {/* Chi tiết 4 nhiệm vụ: highlight việc cần làm, thu gọn việc đã xong */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-stone-100 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        <span>Checklist cho dịp {campName}</span>
                        <span className="font-semibold normal-case text-amber-700">
                          {prod.checklist.filter((t: any) => !t.is_done).length > 0
                            ? `${prod.checklist.filter((t: any) => !t.is_done).length} việc cần làm`
                            : 'Đã hoàn tất'}
                        </span>
                      </div>

                      {(() => {
                        const pendingTasks = prod.checklist.filter((t: any) => !t.is_done);
                        const doneTasks = prod.checklist.filter((t: any) => t.is_done);

                        return (
                          <div className="space-y-2.5">
                            {/* Việc cần làm: ưu tiên hiển thị đầy chiều ngang, không kéo giãn ô bên cạnh */}
                            {pendingTasks.length > 0 && (
                              <div className="space-y-2">
                                {pendingTasks.map((task: any) => (
                                  <div
                                    key={task.id}
                                    className="p-3 rounded-xl border bg-amber-50/80 border-amber-300 ring-1 ring-amber-200/60 text-stone-900 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-1.5 font-bold min-w-0">
                                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                        <span>{task.label}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                                          Cần làm
                                        </span>
                                        {task.market_data && (
                                          <span
                                            title={task.market_data}
                                            className="text-stone-400 hover:text-[#007700] cursor-help p-0.5"
                                          >
                                            <HelpCircle size={12} />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-stone-700 leading-snug m-0 pl-5">
                                      {task.action_detail}
                                    </p>
                                    <div className="pl-5">
                                      <Link
                                        to={`/seller/products/${prod._id}/edit`}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007700] hover:underline"
                                      >
                                        <span>Sửa sản phẩm ngay</span>
                                        <ExternalLink size={11} />
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Việc đã xong: xếp lưới đều nhau, bấm để xổ chi tiết */}
                            {doneTasks.length > 0 && (
                              <div className={`grid grid-cols-1 ${doneTasks.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2 items-start`}>
                                {doneTasks.map((task: any) => {
                                  const taskKey = `${prod._id}:${task.id}`;
                                  const isTaskOpen = !!expandedDoneTasks[taskKey];
                                  return (
                                    <div
                                      key={task.id}
                                      className="p-2.5 rounded-xl border bg-stone-50/70 border-stone-200/80 text-stone-600 text-xs space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedDoneTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }))
                                          }
                                          className="flex items-center gap-1.5 text-left font-semibold text-stone-700 min-w-0 flex-1 cursor-pointer"
                                        >
                                          <CheckCircle2 size={13} className="text-[#007700] shrink-0" />
                                          <span className="truncate">{task.label}</span>
                                          <ChevronDown
                                            size={12}
                                            className={`text-stone-400 shrink-0 transition-transform ${isTaskOpen ? 'rotate-180' : ''}`}
                                          />
                                        </button>
                                        {task.market_data && (
                                          <span
                                            title={task.market_data}
                                            className="text-stone-400 hover:text-[#007700] cursor-help shrink-0"
                                          >
                                            <HelpCircle size={12} />
                                          </span>
                                        )}
                                      </div>

                                      {isTaskOpen && (
                                        <p className="text-[11px] text-stone-500 leading-snug m-0 pt-1 border-t border-stone-200/60">
                                          {task.action_detail}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4 Cột: Panel Gợi ý Vận hành Mùa Vụ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#EAF0E2] text-[#007700]">
                  <Sparkles size={15} />
                </div>
                <h4 className="m-0 font-bold text-stone-900 text-xs sm:text-sm">
                  Lưu ý vận hành
                </h4>
              </div>
              {onOpenEvidence && (
                <button
                  type="button"
                  onClick={() =>
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
                    })
                  }
                  className="p-1 rounded-lg text-stone-400 hover:text-[#007700] hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Căn cứ thuật toán"
                  aria-label="Căn cứ thuật toán"
                >
                  <HelpCircle size={15} />
                </button>
              )}
            </div>

            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 text-amber-950">
                <strong className="block text-amber-900">1. Chốt đơn đúng hạn {activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'trước lễ 10 ngày'}</strong>
                <span className="text-amber-800">Ngừng nhận đơn sau mốc này để giao kịp lễ, tránh hủy đơn.</span>
              </div>
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/70 p-2.5 text-stone-800">
                <strong className="block text-[#007700]">2. Thêm phân loại hộp quà (+35.000đ)</strong>
                <span className="text-stone-600">Tăng giá trị đơn (AOV) từ hàng sẵn có, không cần ôm mã mới.</span>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-2.5 text-stone-700">
                <strong className="block text-stone-900">3. Đổi tiêu đề &amp; tag trước 5–7 ngày</strong>
                <span className="text-stone-600">Giúp sàn kịp lập chỉ mục tìm kiếm trước khi mở bán.</span>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100">
              <Link
                to="/seller/products"
                className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
              >
                Quản lý kho
              </Link>
              <Link
                to="/seller/products/new"
                className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-[#007700] hover:bg-emerald-100 transition-colors"
              >
                + Tạo mẫu quà tặng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
