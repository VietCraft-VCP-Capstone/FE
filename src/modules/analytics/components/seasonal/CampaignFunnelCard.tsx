import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import type { CampaignFunnel, ChannelBreakdownItem, MotivationBreakdown } from '../../types';
import type { Evidence } from '../../types/evidence';
import { money } from '../../../../shared/utils/format';

const MOTIVATION_PALETTE = [
  { stroke: '#007700', bg: 'bg-[#007700]', text: 'text-[#007700]' },
  { stroke: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600' },
  { stroke: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600' },
  { stroke: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-600' },
];

const DEFAULT_CHANNEL_RULES: Record<string, string> = {
  organic_listing: 'Khách tìm kiếm từ khóa trên sàn và bấm vào xem sản phẩm tự nhiên.',
  campaign_promo: 'Đơn hàng áp dụng voucher giảm giá hoặc phát sinh qua cổng chiến dịch sàn.',
  direct_social: 'Khách truy cập từ liên kết chia sẻ bên ngoài sàn (Facebook, TikTok, Zalo) có gắn mã theo dõi.',
  repeat_buyers: 'Khách hàng (buyer_id) đã từng có ít nhất 1 đơn hàng thành công trước đó tại shop.',
};

const DEFAULT_CHANNEL_CHECKLISTS: Record<string, string[]> = {
  organic_listing: [
    'Tối ưu ảnh bìa (cover) mang không khí mùa vụ để kích thích khách bấm xem.',
    'Gắn 5 thẻ tag ngách điểm cao nhất theo gợi ý mùa vụ vào tiêu đề & mô tả.',
    'Hoàn thiện bảng thông số kỹ thuật và ảnh thật sản phẩm để tăng điểm chất lượng SEO sàn.',
  ],
  campaign_promo: [
    'Đăng ký tham gia cổng Flash Sale và Mega Sale của sàn trước hạn chốt an toàn.',
    'Tạo mã giảm giá shop độc quyền cho đơn đạt mức tối thiểu để kích thích chốt giỏ hàng.',
    'Thiết lập Deal sốc hoặc Mua kèm để tối ưu giá trị trung bình đơn (AOV).',
  ],
  direct_social: [
    'Đăng video unboxing/hướng dẫn chọn quà lên TikTok Reels kèm gắn link gian hàng.',
    'Chia sẻ bộ sưu tập lên nhóm Zalo/Facebook khách hàng thân thiết để gom đơn sớm.',
    'Gắn tham số nguồn truy cập (traffic_source=social) khi chia sẻ link sản phẩm.',
  ],
  repeat_buyers: [
    'Gửi tin nhắn chăm sóc tự động kèm mã tri ân khách cũ nhân dịp lễ hội.',
    'Gợi ý các mẫu quà tặng mới nhất phù hợp với sở thích mua sắm của khách.',
    'Cảnh báo hạn chốt giao hàng sớm để khách quen đặt trước, tránh trễ hẹn mùa lễ.',
  ],
};

interface Props {
  funnel?: CampaignFunnel;
  channels?: ChannelBreakdownItem[];
  motivation?: MotivationBreakdown;
  occasionName: string;
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const CampaignFunnelCard: React.FC<Props> = ({
  funnel,
  channels = [],
  motivation,
  occasionName,
  onOpenEvidence,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const currentFunnel: CampaignFunnel = funnel || { orders: 0 };

  // 100% số đo THẬT từ product_events (`view`, `add_to_cart`) + orders (`orders`)
  const actualViews =
    typeof currentFunnel.actual?.views === 'number'
      ? currentFunnel.actual.views
      : typeof currentFunnel.actual?.clicks === 'number'
      ? currentFunnel.actual.clicks
      : 0;
  const actualCartAdds =
    typeof currentFunnel.actual?.cart_adds === 'number' ? currentFunnel.actual.cart_adds : 0;

  const hasActualChannelOrders = channels.some(
    c => c.source_type === 'shop_actual' && c.orders_count > 0
  );
  const totalActualOrdersFromChannels = hasActualChannelOrders
    ? channels.reduce((acc, c) => acc + (c.orders_count || 0), 0)
    : 0;
  const totalActualGmv = hasActualChannelOrders
    ? channels.reduce((acc, c) => acc + (c.gmv_vnd || 0), 0)
    : currentFunnel.actual?.gmv_vnd || 0;

  const actualOrders =
    typeof currentFunnel.actual?.orders === 'number'
      ? currentFunnel.actual.orders
      : totalActualOrdersFromChannels;

  const targetOrders = typeof currentFunnel.orders === 'number' && currentFunnel.orders > 0 ? currentFunnel.orders : 0;
  const basis = currentFunnel.target_basis;
  const baselineEnd = basis?.baseline_end ? new Date(basis.baseline_end).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'ngày mở bán';
  const targetNote = !basis
    ? null
    : basis.missing === 'baseline_history'
      ? `Chưa có mức ngày thường: shop cần ít nhất 14 ngày có đơn trước ngày mở bán (${baselineEnd}).`
      : basis.missing === 'baseline_orders'
        ? `Chưa có mức ngày thường: trước ${baselineEnd} shop mới có ${basis.baseline_orders ?? 0} đơn, cần ít nhất 5 đơn.`
        : basis.missing === 'uplift'
          ? 'Chưa có mức ngày thường cho dịp này.'
          : basis.daily_rate != null
            ? `Mức ngày thường = ${basis.daily_rate.toLocaleString('vi-VN')} đơn/ngày (${basis.baseline_orders ?? '?'} đơn trong ${basis.baseline_days ?? '?'} ngày trước ${baselineEnd}) × ${basis.window_days} ngày.`
              + (basis.search_uplift != null
                ? ` Tham khảo: lượt tìm kiếm dịp này gấp ${basis.search_uplift.toLocaleString('vi-VN')} lần ngày thường (lượt tìm, không phải số đơn).`
                : '')
            : null;
  const baselineOverlapNote = basis && basis.missing == null && basis.baseline_overlaps?.length
    ? `Lưu ý: khoảng ngày thường dùng làm nền trùng kỳ bán của ${basis.baseline_overlaps.join(', ')}, nên mục tiêu có thể đang cao hơn mức thực tế.`
    : null;
  const statusBreakdown = currentFunnel.actual?.status_breakdown;
  const directOrders = currentFunnel.actual?.direct_orders;
  const ordersBreakdownNote = statusBreakdown && actualOrders > 0
    ? [
        `Đã giao ${statusBreakdown.delivered}`,
        `Đang giao ${statusBreakdown.shipping}`,
        `Đang xử lý ${statusBreakdown.processing}`,
        statusBreakdown.cod_unpaid > 0 ? `COD chưa thu tiền ${statusBreakdown.cod_unpaid}` : null,
        typeof directOrders === 'number' ? `Đúng hàng của dịp ${directOrders}/${actualOrders}` : null,
      ].filter(Boolean).join(' · ')
    : null;
  const targetViews =
    typeof currentFunnel.views === 'number' && currentFunnel.views > 0
      ? currentFunnel.views
      : typeof currentFunnel.clicks === 'number' && currentFunnel.clicks > 0
      ? currentFunnel.clicks
      : null;
  const targetCartAdds =
    typeof currentFunnel.cart_adds === 'number' && currentFunnel.cart_adds > 0
      ? currentFunnel.cart_adds
      : null;

  const actualAov =
    typeof currentFunnel.aov === 'number' && currentFunnel.aov > 0
      ? currentFunnel.aov
      : actualOrders > 0 && totalActualGmv > 0
      ? Math.round(totalActualGmv / actualOrders)
      : 0;

  const hasActualTraffic = actualViews > 0 || actualCartAdds > 0 || actualOrders > 0;

  const realCartRatePct =
    typeof currentFunnel.real_cart_rate_pct === 'number'
      ? currentFunnel.real_cart_rate_pct
      : actualViews > 0
      ? Math.round((actualCartAdds / actualViews) * 1000) / 10
      : null;
  const realOrderRatePct =
    typeof currentFunnel.real_order_rate_pct === 'number'
      ? currentFunnel.real_order_rate_pct
      : actualCartAdds > 0
      ? Math.round((actualOrders / actualCartAdds) * 1000) / 10
      : null;
  const realViewToOrderPct =
    typeof currentFunnel.real_view_to_order_pct === 'number'
      ? currentFunnel.real_view_to_order_pct
      : actualViews > 0
      ? Math.round((actualOrders / actualViews) * 1000) / 10
      : null;

  // Đồng nhất 1 ý nghĩa cho cả 3 thanh:
  // - Khi có mục tiêu: cả 3 thanh đều biểu diễn TIẾN ĐỘ (Thực tế / Mục tiêu), tỷ lệ chuyển đổi nằm ở dòng nối giữa các tầng.
  // - Khi chưa có mục tiêu: cả 3 thanh biểu diễn hình phễu tương đối so với Lượt xem (100% -> Thêm giỏ -> Đơn).
  const hasTargets = Boolean(targetOrders > 0 && targetViews && targetCartAdds);

  const viewRawPct = hasTargets
    ? Math.round((actualViews / targetViews!) * 100)
    : actualViews > 0
    ? 100
    : 0;
  const cartRawPct = hasTargets
    ? Math.round((actualCartAdds / targetCartAdds!) * 100)
    : actualViews > 0
    ? Math.round((actualCartAdds / actualViews) * 1000) / 10
    : actualCartAdds > 0
    ? 100
    : 0;
  const orderRawPct =
    targetOrders > 0
      ? Math.round((actualOrders / targetOrders) * 100)
      : actualViews > 0
      ? Math.round((actualOrders / actualViews) * 1000) / 10
      : actualOrders > 0
      ? 100
      : 0;

  const viewBarPct = Math.min(100, viewRawPct);
  const cartBarPct = Math.min(100, cartRawPct);
  const orderBarPct = Math.min(100, orderRawPct);

  const diagnosticsList = currentFunnel.diagnostics || [];
  const scenariosList = currentFunnel.scenarios || [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const windowStart = currentFunnel.actual?.window_start || todayIso;
  const windowEnd = currentFunnel.actual?.window_end || todayIso;

  const funnelEvidence: Evidence = {
    id: 'ev_campaign_funnel',
    definition: `Phễu chuyển đổi 3 tầng thực tế cho dịp ${occasionName}: Lượt xem sản phẩm (view) ➔ Thêm giỏ hàng (add_to_cart) ➔ Đơn đặt trong kỳ dịp (orders, tính từ ngày mở bán tới ngày lễ, không gồm đơn hủy/hoàn tiền).`,
    sources: ['Bảng sự kiện thực tế product_events (view, add_to_cart)', 'Bảng đơn hàng thực tế orders (loại đơn mô phỏng)'],
    howObtained:
      'Đếm trực tiếp số event `view` và `add_to_cart` của các sản phẩm thuộc shop trong kỳ dịp và đối chiếu với số đơn đặt hợp lệ trong cùng kỳ. Không suy ngược lượt hiển thị (impression) giả định.',
    period: [windowStart, windowEnd],
    n: actualViews + actualOrders,
    formula:
      actualViews > 0
        ? `Thêm giỏ = ${actualCartAdds}/${actualViews} (${realCartRatePct ?? 0}%). Chốt đơn từ giỏ = ${actualOrders}/${actualCartAdds} (${realOrderRatePct ?? 'N/A'}%).`
        : 'Chưa ghi nhận lượt xem hoặc đơn hàng trong cửa sổ dịp.',
    confidence: actualViews >= 30 || actualOrders >= 10 ? 'high' : hasActualTraffic ? 'fair' : 'preliminary',
    confidenceReason: hasActualTraffic
      ? `Đo trực tiếp từ ${actualViews.toLocaleString('vi-VN')} lượt xem, ${actualCartAdds.toLocaleString('vi-VN')} lượt thêm giỏ và ${actualOrders.toLocaleString('vi-VN')} đơn hàng thật.`
      : 'Cửa sổ dịp chưa phát sinh lượt xem hoặc đơn hàng thực tế.',
    mayBeWrongBecause: [
      'Event product_events lưu tối đa 90 ngày (TTL 90d) và loại trừ bot + lượt xem của chính chủ shop.',
    ],
    updatedAt: todayIso,
  };

  const hasRealMotivation =
    motivation?.source_type === 'shop_actual' && Array.isArray(motivation.top_reasons) && motivation.top_reasons.length > 0;

  const motivationSlices = useMemo(() => {
    if (!hasRealMotivation || !motivation?.top_reasons?.length) return [];
    let cumulative = 0;
    return motivation.top_reasons.map((r, i) => {
      const pct = Math.max(0, Math.min(100, r.pct));
      const color = MOTIVATION_PALETTE[i % MOTIVATION_PALETTE.length];
      const slice = {
        ...r,
        pct,
        color,
        dashArray: `${pct} ${Math.max(0, 100 - pct)}`,
        dashOffset: -cumulative,
      };
      cumulative += pct;
      return slice;
    });
  }, [hasRealMotivation, motivation]);

  const topMotivation = useMemo(() => {
    if (!motivationSlices.length) return null;
    return [...motivationSlices].sort((a, b) => b.pct - a.pct)[0];
  }, [motivationSlices]);

  const getShortMotivationLabel = (reason?: string) => {
    if (!reason) return 'Mục đích';
    const lower = reason.toLowerCase();
    if (lower.includes('tặng') || lower.includes('quà')) return 'Mua tặng';
    if (lower.includes('dùng') || lower.includes('tự')) return 'Tự dùng';
    return 'Chủ đạo';
  };

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm space-y-5 transition-all ${
        isExpanded ? 'ring-1 ring-[#007700]/30 shadow-md' : ''
      } ${className}`}
    >
      {/* 1. Header Khối & Nút điều khiển */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Layers size={16} className="text-[#007700]" />
          <h3 className="m-0 font-bold text-stone-950 text-base sm:text-lg">
            Phễu chuyển đổi {occasionName}
          </h3>
          {currentFunnel?.actual?.window_label && (
            <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              {currentFunnel.actual.window_label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenEvidence(funnelEvidence)}
            className="text-stone-400 hover:text-[#007700] inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-stone-100/70 transition-colors cursor-pointer"
            title="Căn cứ con số"
            aria-label="Căn cứ con số"
          >
            <HelpCircle size={15} />
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              showDetails
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Hiển thị thêm các tỷ lệ chuyển đổi giữa từng tầng"
          >
            <Eye size={12} />
            <span>Chi tiết</span>
          </button>

          {(diagnosticsList.length > 0 || scenariosList.length > 0) && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isExpanded
                  ? 'bg-[#007700] text-white border-[#007700]'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Một dòng tóm tắt trọng tâm */}
      <p className="m-0 text-xs sm:text-[13px] text-stone-600 leading-relaxed">
        {hasActualTraffic ? (
          <>
            Đo thực tế:{' '}
            <strong className="font-semibold text-stone-900">{actualViews.toLocaleString('vi-VN')} lượt xem</strong> ➔{' '}
            <strong className="font-semibold text-stone-900">{actualCartAdds.toLocaleString('vi-VN')} thêm giỏ</strong> ➔{' '}
            <strong className="font-semibold text-[#007700]">{actualOrders.toLocaleString('vi-VN')} đơn trong kỳ</strong>
            {targetOrders > 0 && <> (ngày thường {targetOrders.toLocaleString('vi-VN')} đơn)</>}
            {realCartRatePct !== null && (
              <>
                {' '}· Tỷ lệ thêm giỏ <strong className="font-semibold text-stone-900">{realCartRatePct}%</strong>
              </>
            )}
            {realOrderRatePct !== null && (
              <>
                , chốt đơn từ giỏ <strong className="font-semibold text-stone-900">{realOrderRatePct}%</strong>
              </>
            )}
            .
          </>
        ) : (
          <>
            Chưa ghi nhận lượt xem, lượt thêm giỏ hay đơn hàng thực tế trong cửa sổ dịp {occasionName}
            {targetOrders > 0 ? (
              <>
                {' '}· Nếu bán như ngày thường: <strong className="font-semibold text-[#007700]">{targetOrders.toLocaleString('vi-VN')} đơn</strong>.
              </>
            ) : (
              '. Dữ liệu sẽ tự cập nhật ngay khi có khách xem sản phẩm hoặc phát sinh đơn.'
            )}
          </>
        )}
      </p>

      {/* 3. Phễu 3 tầng đo thật từ product_events + orders */}
      <div className="space-y-2.5 pt-1">
        {showDetails && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-1.5 text-[11px] text-stone-600 border border-stone-200/70">
            <span>
              <strong className="text-stone-900">Thực tế</strong> = số đo thật của shop trong kỳ ·{' '}
              <strong className="text-stone-700">Mục tiêu</strong> = ước tính theo nhịp đơn shop × mùa vụ
            </span>
          </div>
        )}

        {/* Tầng 1: Lượt xem sản phẩm */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-stone-700">1. Lượt xem sản phẩm</span>
            {showDetails ? (
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-stone-900 font-bold">
                  Thực tế: {actualViews.toLocaleString('vi-VN')}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">
                  Mục tiêu: {targetViews ? targetViews.toLocaleString('vi-VN') : 'Chưa có'}
                </span>
              </div>
            ) : (
              <span className="text-stone-600 tabular-nums" title="Thực tế / Mục tiêu">
                <strong className="text-stone-900">{actualViews.toLocaleString('vi-VN')}</strong>
                {targetViews ? ` / ${targetViews.toLocaleString('vi-VN')} mục tiêu` : ' lượt xem'}
              </span>
            )}
          </div>
          <div className="h-5 w-full rounded-lg bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500 bg-[#008f5a]"
              style={{ width: `${actualViews > 0 ? Math.max(12, viewBarPct) : 0}%` }}
            >
              {actualViews > 0 && (
                <span className="text-[11px] font-bold text-white tabular-nums">
                  {hasTargets && viewRawPct > 100 ? `${viewRawPct}% mục tiêu` : `${viewRawPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="flex flex-wrap items-center gap-2 pl-3 text-[11px] text-stone-500">
            <span>
              Tỷ lệ Xem ➔ Thêm giỏ:{' '}
              <strong className="text-stone-800">{realCartRatePct !== null ? `${realCartRatePct}%` : 'Chưa có dữ liệu'}</strong>
            </span>
          </div>
        )}

        {/* Tầng 2: Thêm vào giỏ hàng */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-stone-700">2. Thêm vào giỏ hàng</span>
            {showDetails ? (
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-stone-900 font-bold">
                  Thực tế: {actualCartAdds.toLocaleString('vi-VN')}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">
                  Mục tiêu: {targetCartAdds ? targetCartAdds.toLocaleString('vi-VN') : 'Chưa có'}
                </span>
              </div>
            ) : (
              <span className="text-stone-600 tabular-nums" title="Thực tế / Mục tiêu">
                <strong className="text-stone-900">{actualCartAdds.toLocaleString('vi-VN')}</strong>
                {targetCartAdds ? ` / ${targetCartAdds.toLocaleString('vi-VN')} mục tiêu` : ' lượt thêm giỏ'}
              </span>
            )}
          </div>
          <div className="h-5 w-full rounded-lg bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500 bg-[#007700]"
              style={{ width: `${actualCartAdds > 0 ? Math.max(12, cartBarPct) : 0}%` }}
            >
              {actualCartAdds > 0 && (
                <span className="text-[11px] font-bold text-white tabular-nums">
                  {hasTargets && cartRawPct > 100 ? `${cartRawPct}% mục tiêu` : `${cartRawPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="flex flex-wrap items-center gap-3 pl-3 text-[11px] text-stone-500">
            <span>
              Tỷ lệ Giỏ ➔ Đơn:{' '}
              <strong className="text-stone-800">{realOrderRatePct !== null ? `${realOrderRatePct}%` : 'Chưa có dữ liệu'}</strong>
            </span>
            {realViewToOrderPct !== null && (
              <span>
                · Chuyển đổi Xem ➔ Đơn: <strong className="text-[#007700]">{realViewToOrderPct}%</strong>
              </span>
            )}
          </div>
        )}

        {/* Tầng 3: Đơn đặt trong kỳ dịp (không gồm hủy/hoàn tiền) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-stone-700" title="Đơn đặt từ ngày mở bán tới ngày lễ, không gồm đơn hủy, hoàn tiền hay PayOS chưa thanh toán.">
              3. Đơn trong kỳ dịp
            </span>
            {showDetails ? (
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-[#007700] font-bold">
                  Thực tế: {actualOrders.toLocaleString('vi-VN')} đơn
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500" title={targetNote ?? undefined}>
                  Mức ngày thường: {targetOrders > 0 ? `${targetOrders.toLocaleString('vi-VN')} đơn` : 'Chưa có'}
                </span>
              </div>
            ) : (
              <span className="text-stone-600 tabular-nums" title="Thực tế / Mục tiêu">
                <strong className="text-[#007700]">{actualOrders.toLocaleString('vi-VN')}</strong>
                {targetOrders > 0 ? ` đơn · ngày thường ${targetOrders.toLocaleString('vi-VN')}` : ' đơn'}
              </span>
            )}
          </div>
          <div className="h-5 w-full rounded-lg bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500 bg-[#005B00]"
              style={{ width: `${actualOrders > 0 ? Math.max(12, orderBarPct) : 0}%` }}
            >
              {actualOrders > 0 && (
                <span className="text-[11px] font-bold text-white tabular-nums">
                  {targetOrders > 0 && orderRawPct > 100 ? `gấp ${(actualOrders / targetOrders).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} lần ngày thường` : `${orderRawPct}%`}
                </span>
              )}
            </div>
          </div>
          {ordersBreakdownNote && (
            <p className="text-[11px] text-stone-500 tabular-nums">{ordersBreakdownNote}</p>
          )}
          {(showDetails || targetOrders === 0) && targetNote && (
            <p className="text-[11px] text-stone-500">{targetNote}</p>
          )}
          {showDetails && baselineOverlapNote && (
            <p className="text-[11px] text-amber-700">{baselineOverlapNote}</p>
          )}
        </div>
      </div>

      {/* 4. Khối Phân Tích Chuyên Sâu Khi Mở Rộng */}
      {isExpanded && (diagnosticsList.length > 0 || scenariosList.length > 0) && (
        <div className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Chẩn đoán chuyển đổi &amp; Kịch bản doanh thu
            </h4>
            {actualAov > 0 && (
              <span className="text-[11px] text-stone-500">
                AOV thực tế: {money(actualAov)}
              </span>
            )}
          </div>

          {diagnosticsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diagnosticsList.map((d, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-white p-3 border border-stone-200/80 shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-stone-800">{d.title}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          d.status === 'healthy'
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/60'
                            : d.status === 'critical'
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-stone-700 bg-stone-100'
                        }`}
                      >
                        {d.badge_label || (d.dropoff_rate_pct != null ? `Rơi rụng ${d.dropoff_rate_pct}%` : 'Chưa có dữ liệu')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{d.metric_label}</p>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] p-2 rounded mt-2 text-emerald-900 bg-emerald-50/60">
                    <Lightbulb size={12} className="shrink-0 mt-0.5 text-[#007700]" />
                    <span>{d.ai_recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scenariosList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              {scenariosList.map((sc, idx) => (
                <div
                  key={sc.key || idx}
                  className={`rounded-lg bg-white p-2.5 border space-y-1.5 flex flex-col justify-between ${
                    sc.key === 'breakthrough'
                      ? 'border-emerald-200/80 shadow-2xs'
                      : sc.key === 'peak'
                      ? 'border-amber-200/80 shadow-2xs'
                      : 'border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-700">{sc.name}</span>
                      <span
                        className={`font-extrabold ${
                          sc.key === 'breakthrough'
                            ? 'text-emerald-700'
                            : sc.key === 'peak'
                            ? 'text-amber-700'
                            : 'text-[#007700]'
                        }`}
                      >
                        {sc.orders} đơn
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 leading-snug">{sc.condition_note}</div>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex flex-col gap-0.5">
                    <div
                      className={`text-xs font-bold ${
                        sc.key === 'breakthrough'
                          ? 'text-emerald-800'
                          : sc.key === 'peak'
                          ? 'text-amber-900'
                          : 'text-stone-900'
                      }`}
                    >
                      Dự thu: {money(sc.projected_gmv)}
                    </div>
                    <div className="text-[11px] text-stone-400">Căn cứ: {sc.formula_basis}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Bảng Chi Tiết Từng Kênh Phân Phối */}
      {channels.length > 0 && (
        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="m-0 font-bold text-stone-900 text-sm">
                Doanh số theo kênh bán
              </h4>
              {!hasActualChannelOrders && (
                <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                  Chưa phát sinh đơn trong kỳ
                </span>
              )}
            </div>
            {hasActualChannelOrders && (() => {
              const topCh = [...channels].sort((a, b) => b.gmv_vnd - a.gmv_vnd || b.orders_count - a.orders_count)[0];
              if (!topCh || topCh.orders_count <= 0) return null;
              return (
                <p className="m-0 text-xs text-stone-600">
                  Kênh dẫn đầu: <strong className="font-semibold text-stone-900">{topCh.name}</strong>{' '}
                  (<strong className="font-semibold text-[#007700]">{topCh.orders_count} đơn · {money(topCh.gmv_vnd)}</strong>, chiếm {topCh.share_pct}%).
                </p>
              );
            })()}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-semibold text-stone-500 bg-stone-50/70">
                  <th className="py-2 px-3">Kênh bán</th>
                  <th className="py-2 px-3">Doanh thu</th>
                  <th className="py-2 px-3">Đơn hàng</th>
                  <th className="py-2 px-3">Sản phẩm</th>
                  <th className="py-2 px-3">TB / đơn</th>
                  <th className="py-2 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {channels.map(ch => {
                  const isExpandedRow = expandedChannel === ch.channel_key;
                  const visibleOrders = (ch.sample_orders || []).slice(0, 4);

                  return (
                    <React.Fragment key={ch.channel_key}>
                      <tr
                        className={`hover:bg-stone-50/80 transition-colors ${
                          isExpandedRow ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-stone-900 block">{ch.name}</span>
                          {showDetails && ch.action_tip && (
                            <span className="text-[11px] text-stone-400 block mt-0.5">{ch.action_tip}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 tabular-nums">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                            <span>{ch.orders_count > 0 ? money(ch.gmv_vnd) : '0đ'}</span>
                            <span className="text-[11px] font-medium text-stone-400">
                              ({ch.orders_count > 0 ? `${ch.share_pct}%` : '0%'})
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 tabular-nums">
                          <span className="font-semibold text-stone-900 block">{ch.orders_count} đơn</span>
                          {showDetails && ch.orders_count > 0 && (
                            <span className="text-[11px] text-stone-400 block">{ch.sku_orders} mã SKU</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 tabular-nums text-stone-700">{ch.items_sold} sp</td>

                        <td className="py-2.5 px-3 tabular-nums font-semibold text-[#007700]">
                          {ch.orders_count > 0 ? money(ch.aov_vnd) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedChannel(isExpandedRow ? null : ch.channel_key)}
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors cursor-pointer ${
                              isExpandedRow
                                ? 'bg-[#007700] text-white border-[#007700]'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span>{isExpandedRow ? 'Thu gọn' : ch.orders_count > 0 ? 'Chi tiết' : 'Chuẩn bị'}</span>
                            {isExpandedRow ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </td>
                      </tr>

                      {isExpandedRow && (
                        <tr className="bg-stone-50/90 border-b border-stone-200">
                          <td colSpan={6} className="p-3.5">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                              <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5 bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-2xs h-full">
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                                      <PackageCheck size={14} className="text-[#007700]" />
                                      <span>Quy tắc nhận diện kênh</span>
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                      {ch.orders_count > 0 ? `Đạt ${ch.orders_count} đơn thực tế` : 'Chưa có đơn'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-600 leading-relaxed bg-stone-50/80 p-2 rounded-lg border border-stone-100">
                                    {ch.criteria_rule || DEFAULT_CHANNEL_RULES[ch.channel_key] || 'Đơn hàng phân bổ theo luồng truy cập của sàn.'}
                                  </p>

                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[11px] font-bold text-stone-800 block">
                                      Checklist hành động đề xuất cho seller:
                                    </span>
                                    <div className="space-y-1.5">
                                      {(ch.action_checklist && ch.action_checklist.length > 0
                                        ? ch.action_checklist
                                        : DEFAULT_CHANNEL_CHECKLISTS[ch.channel_key] || []
                                      ).map((task, tidx) => (
                                        <div key={tidx} className="flex items-start gap-2 text-[11px] text-stone-700 leading-snug">
                                          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-50 text-[#007700] text-[11px] font-bold shrink-0 mt-0.5 border border-emerald-200">
                                            {tidx + 1}
                                          </span>
                                          <span>{task}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5 bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-2xs h-full">
                                <div className="space-y-2.5 flex-1 flex flex-col">
                                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                      <ShieldCheck size={14} />
                                      <span>Đơn hàng đối soát ({ch.orders_count} đơn)</span>
                                    </div>
                                    {ch.orders_count > 0 && (
                                      <a
                                        href="/seller/orders"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007700] hover:text-emerald-800 hover:underline"
                                      >
                                        <span>Quản lý đơn hàng</span>
                                        <ExternalLink size={11} />
                                      </a>
                                    )}
                                  </div>

                                  {visibleOrders.length > 0 ? (
                                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {visibleOrders.map((ord, idx) => (
                                          <div
                                            key={idx}
                                            className="rounded-lg bg-stone-50/90 p-2 border border-stone-200/80 hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors"
                                          >
                                            <div className="flex items-center justify-between text-[11px]">
                                              <a
                                                href={`/seller/orders?search=${encodeURIComponent(ord.order_code)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-mono font-bold text-stone-900 hover:text-[#007700] hover:underline"
                                              >
                                                {ord.order_code}
                                              </a>
                                              <span className="font-bold text-[#007700] shrink-0">
                                                {money(ord.total_amount || 0)}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-stone-500 truncate mt-0.5" title={ord.item_summary}>
                                              {ord.item_summary}
                                            </p>
                                          </div>
                                        ))}
                                      </div>

                                      {ch.orders_count > 4 && (
                                        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                                          <span>Hiển thị 4/{ch.orders_count} đơn đối soát gần nhất</span>
                                          <a
                                            href="/seller/orders"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-semibold text-[#007700] hover:underline flex items-center gap-1"
                                          >
                                            <span>Xem toàn bộ {ch.orders_count} đơn</span>
                                            <ExternalLink size={10} />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center text-xs text-stone-500 bg-stone-50/60 rounded-lg border border-dashed border-stone-200 space-y-2">
                                      <div className="p-2 rounded-full bg-stone-100 text-stone-500">
                                        <PackageCheck size={18} />
                                      </div>
                                      <p className="font-semibold text-stone-800">
                                        Chưa phát sinh đơn hàng thuộc kênh này trong kỳ.
                                      </p>
                                      <p className="text-[11px] text-stone-500 max-w-sm">
                                        Khi có đơn hàng phát sinh trong cửa sổ dịp {occasionName}, hệ thống sẽ tự động đối soát và hiển thị tại đây.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Phân Bổ Mục Đích Mua Sắm (chỉ vẽ biểu đồ khi có >= 3 đơn thực tế của shop) */}
      {hasRealMotivation ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-stone-50/60 p-4 border border-stone-200/70">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e7e5e4" strokeWidth="3.6" />
                {motivationSlices.map((slice, i) => {
                  if (slice.pct <= 0) return null;
                  return (
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color.stroke}
                      strokeWidth="3.6"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className={`text-[11px] font-black ${topMotivation?.color.text || 'text-stone-900'}`}>
                  {topMotivation ? `${topMotivation.pct}%` : '—'}
                </span>
                <span className="text-[7.5px] font-semibold text-stone-500 leading-none mt-0.5">
                  {getShortMotivationLabel(topMotivation?.reason)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-900 text-xs block">Mục đích mua sắm thực tế</span>
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded border text-emerald-800 bg-emerald-50 border-emerald-200/60">
                  Dữ liệu shop
                </span>
              </div>
              <span className="text-[11px] text-stone-500">
                {motivation?.source_description || `Bóc tách từ ${actualOrders} đơn thực tế của shop`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {motivationSlices.map((slice, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs"
              >
                <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${slice.color.bg}`} />
                <span className="text-stone-600 font-medium">{slice.reason}:</span>
                <strong className={`ml-0.5 font-bold ${slice.color.text}`}>{slice.pct}%</strong>
              </div>
            ))}
          </div>
        </div>
      ) : motivation?.source_description ? (
        <div className="rounded-xl bg-stone-50/60 px-3.5 py-2.5 border border-stone-200/70 text-[11px] text-stone-500 flex items-center justify-between gap-2">
          <span>
            <strong className="text-stone-700">Mục đích mua sắm (Tự dùng / Mua tặng):</strong> {motivation.source_description}
          </span>
        </div>
      ) : null}
    </div>
  );
};
