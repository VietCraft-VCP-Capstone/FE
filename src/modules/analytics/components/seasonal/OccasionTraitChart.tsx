import React from 'react';
import { Calendar, CheckCircle2, Info, Sparkles } from 'lucide-react';
import type { OccasionTraitItem } from '../../types/evidence';
import { ConfidenceBadge } from '../evidence/ConfidenceBadge';
import { EvidenceTrigger } from '../evidence/EvidenceTrigger';

interface LaunchWindowLike {
  start?: string;
  rd_start?: string;
  traction_start?: string;
  peak_start?: string;
  peak_date?: string;
  end?: string;
  cut_off_date?: string;
}

interface ActiveCampLike {
  id?: string;
  name: string;
  event_date?: string;
  timing?: { days_to_event?: number; days_diff?: number };
  launch_window?: LaunchWindowLike;
}

interface TraitActionInput {
  priority: string;
  title: string;
  desc: string;
  traitKey?: string;
}

interface Props {
  occasionName: string;
  categoryName?: string;
  measuredCycles?: number;
  sampleSizeN?: number;
  traits: OccasionTraitItem[];
  activeCamp?: ActiveCampLike;
  traitActions?: TraitActionInput[];
  onPlanAction?: () => void;
  onOpenEvidence: (evidence: any) => void;
  className?: string;
}

function parseIso(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDayMonth(d: Date | null): string {
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function fmtNum(v: number | null | undefined, unit = '%'): string {
  if (v == null || Number.isNaN(v)) return '—';
  const rounded = Math.round(v * 10) / 10;
  const formatted = rounded.toLocaleString('vi-VN');
  return unit === 'ngày' ? `${formatted} ngày` : `${formatted}${unit}`;
}

export const OccasionTraitChart: React.FC<Props> = ({
  occasionName,
  traits,
  activeCamp,
  traitActions,
  onPlanAction,
  onOpenEvidence,
  className = '',
}) => {
  const traitMap: Record<string, any> = {};
  for (const t of traits || []) {
    traitMap[t.key] = t;
  }

  const ordersT = traitMap.ordersGrowth;
  const spendingT = traitMap.higherSpending;
  const earlyT = traitMap.earlyOrder;
  const peakT = traitMap.peakClustering;
  const comboT = traitMap.comboPurchase;
  const voucherT = traitMap.voucherSensitivity;

  const industryScale = (traits?.[0] as any)?.industryScale as
    | { productsCount?: number; sellersCount?: number; totalSold?: number; platforms?: string[] }
    | undefined;

  // Mốc thời gian động từ launch_window
  const lw = activeCamp?.launch_window;
  const peakDate = parseIso(lw?.peak_date || activeCamp?.event_date);
  const earlyDays = typeof (earlyT?.industryValue ?? earlyT?.baselineValue) === 'number'
    ? Math.round(earlyT.industryValue ?? earlyT.baselineValue)
    : null;
  const earlyStartDate = peakDate && earlyDays != null ? addDays(peakDate, -earlyDays) : parseIso(lw?.traction_start);
  const rdStart = parseIso(lw?.rd_start || lw?.start) || (earlyStartDate ? addDays(earlyStartDate, -20) : null);
  const tractionStart = parseIso(lw?.traction_start) || earlyStartDate;
  const peakStart = peakDate ? addDays(peakDate, -2) : parseIso(lw?.peak_start);
  const postEnd = peakDate ? addDays(peakDate, 7) : null;

  const today = new Date();
  const daysToEvent =
    typeof activeCamp?.timing?.days_to_event === 'number'
      ? activeCamp.timing.days_to_event
      : peakDate
      ? Math.max(0, Math.ceil((peakDate.getTime() - today.getTime()) / 86400000))
      : null;

  // Xác định giai đoạn hiện tại (0..3) khớp với 4 mốc trên
  const currentStageIdx = (() => {
    if (!peakDate) return 0;
    const t = today.getTime();
    if (t > peakDate.getTime()) return 3;
    if (earlyStartDate && t >= earlyStartDate.getTime()) return 2;
    if (!earlyStartDate && peakStart && t >= peakStart.getTime()) return 2;
    if (tractionStart && t >= tractionStart.getTime()) return 1;
    return 0;
  })();

  const peakShopOrInd = peakT?.shopValue ?? peakT?.industryValue ?? peakT?.baselineValue;

  const stages = [
    {
      label: 'Làm nóng',
      range: rdStart && tractionStart ? `${fmtDayMonth(rdStart)} – ${fmtDayMonth(addDays(tractionStart, -1))}` : 'Trước mở bán',
      note: 'Tối ưu ảnh, tiêu đề, nhập hàng',
    },
    {
      label: 'Mở bán sớm',
      range:
        tractionStart && earlyStartDate && tractionStart < earlyStartDate
          ? `${fmtDayMonth(tractionStart)} – ${fmtDayMonth(addDays(earlyStartDate, -1))}`
          : tractionStart && peakStart
          ? `${fmtDayMonth(tractionStart)} – ${fmtDayMonth(addDays(peakStart, -1))}`
          : 'Đón khách sớm',
      note: earlyStartDate ? `Gom đánh giá trước khi khách đặt rộ từ ${fmtDayMonth(earlyStartDate)}` : 'Khách ngành bắt đầu mua từ đây',
    },
    {
      label: 'Đặt rộ & Cao điểm',
      range:
        earlyStartDate && peakDate && earlyStartDate < peakStart!
          ? `${fmtDayMonth(earlyStartDate)} – ${fmtDayMonth(peakDate)}`
          : peakStart && peakDate
          ? `${fmtDayMonth(peakStart)} – ${fmtDayMonth(peakDate)}`
          : 'Cao điểm',
      note:
        peakStart && peakDate
          ? `Khách đặt rộ từ ${fmtDayMonth(earlyStartDate || peakStart)}; 3 ngày đỉnh ${fmtDayMonth(peakStart)}–${fmtDayMonth(peakDate)}`
          : 'Tập trung tồn kho & xử lý đơn',
    },
    {
      label: 'Sau sự kiện',
      range: peakDate && postEnd ? `${fmtDayMonth(addDays(peakDate, 1))} – ${fmtDayMonth(postEnd)}` : 'Hậu sự kiện',
      note: 'Giao hàng, đánh giá, chăm sóc khách',
    },
  ];

  // Tóm tắt 1 câu mở đầu (Kết luận trước)
  const behaviorList = [
    { key: 'peakClustering', short: 'mua dồn 3 ngày cao điểm', t: peakT },
    { key: 'voucherSensitivity', short: 'dùng mã giảm giá', t: voucherT },
    { key: 'comboPurchase', short: 'bán theo bộ (combo)', t: comboT },
  ].filter(item => item.t && item.t.shopValue != null && (item.t.industryValue ?? item.t.baselineValue) != null);

  const stronger = behaviorList.filter(x => x.t.shopValue >= (x.t.industryValue ?? x.t.baselineValue));
  const weaker = behaviorList.filter(x => x.t.shopValue < (x.t.industryValue ?? x.t.baselineValue));

  const summaryText = (() => {
    const parts: string[] = [];
    if (earlyDays != null) {
      parts.push(
        `Khách bắt đầu mua sớm khoảng ${earlyDays} ngày trước sự kiện${earlyStartDate ? ` (từ ${fmtDayMonth(earlyStartDate)})` : ''}.`
      );
    }
    if (stronger.length > 0) {
      const strongStr = stronger
        .map(x => `${x.short} (${fmtNum(x.t.shopValue)} so với ${fmtNum(x.t.industryValue ?? x.t.baselineValue)} toàn ngành)`)
        .join(' và ');
      parts.push(`Shop bạn mạnh ở ${strongStr}`);
    }
    if (weaker.length > 0) {
      const weakStr = weaker
        .map(x => `${x.short} (${fmtNum(x.t.shopValue)} so với ${fmtNum(x.t.industryValue ?? x.t.baselineValue)})`)
        .join(', ');
      parts.push(stronger.length > 0 ? `, nhưng còn yếu ở ${weakStr}.` : `Shop bạn cần cải thiện ${weakStr}.`);
    } else if (stronger.length > 0) {
      parts.push('.');
    } else {
      parts.push('Shop chưa có đủ đơn cùng kỳ để đối chiếu trực tiếp; đang dùng số liệu toàn ngành làm mốc chuẩn bị.');
    }
    return parts.join(' ').replace(' .', '.');
  })();

  // 4 thẻ KPI hàng đầu
  const ordersIndVal = ordersT?.industryValue ?? ordersT?.baselineValue;
  const spendingIndVal = spendingT?.industryValue ?? spendingT?.baselineValue;

  const kpiCards = [
    {
      title: 'Đơn hàng mỗi ngày cao điểm',
      value: ordersIndVal != null ? `${ordersIndVal > 0 ? '+' : ''}${fmtNum(ordersIndVal)}` : '—',
      sub: ordersIndVal != null ? 'so với ngày thường, toàn ngành' : 'Chưa đủ dữ liệu toàn ngành',
      confidence: ordersT?.confidence || 'preliminary',
      highlight: false,
    },
    {
      title: 'Giá trị mỗi đơn',
      value: spendingIndVal != null ? `${spendingIndVal > 0 ? '+' : ''}${fmtNum(spendingIndVal)}` : '—',
      sub: spendingIndVal != null ? 'so với ngày thường, toàn ngành' : 'Chưa đủ dữ liệu toàn ngành',
      confidence: spendingT?.confidence || 'preliminary',
      highlight: false,
    },
    {
      title: 'Khách đặt trước sự kiện',
      value: earlyDays != null ? `${earlyDays} ngày` : '—',
      sub: earlyStartDate ? `tức từ ${fmtDayMonth(earlyStartDate)}, toàn ngành` : 'Toàn ngành',
      confidence: earlyT?.confidence || 'preliminary',
      highlight: false,
    },
    {
      title: 'Đơn rơi vào 3 ngày cao điểm',
      value: peakT?.shopValue != null ? fmtNum(peakT.shopValue) : (peakShopOrInd != null ? fmtNum(peakShopOrInd) : '—'),
      sub:
        peakT?.shopValue != null
          ? `Shop bạn · toàn ngành ${fmtNum(peakT.industryValue ?? peakT.baselineValue)}`
          : `Shop chưa đủ đơn · toàn ngành ${fmtNum(peakShopOrInd)}`,
      confidence: peakT?.confidence || 'preliminary',
      highlight: peakT?.shopValue != null,
    },
  ];

  // Dữ liệu thanh ngang cặp đôi (Shop bạn vs Toàn ngành)
  const barTraits = [
    { key: 'peakClustering', title: 'Mua dồn vào 3 ngày cao điểm', t: peakT },
    { key: 'voucherSensitivity', title: 'Đơn có dùng mã giảm giá', t: voucherT },
    { key: 'comboPurchase', title: 'Đơn mua theo bộ (combo)', t: comboT },
  ].filter(b => b.t);

  // Việc nên làm xếp theo ưu tiên (ưu tiên dùng gợi ý từ Gemini LLM theo đúng dịp nếu có)
  const actionItems = (() => {
    if (Array.isArray(traitActions) && traitActions.length > 0) {
      return traitActions.map(a => {
        const pLow = (a.priority || '').toLowerCase();
        const badgeClass = pLow.includes('cao')
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : pLow.includes('vận hành')
          ? 'bg-sky-50 text-sky-800 border-sky-200'
          : 'bg-amber-50/70 text-amber-800 border-amber-200';
        const matchedEv = (a.traitKey && traitMap[a.traitKey]?.evidence) || ordersT?.evidence || earlyT?.evidence;
        return {
          priority: a.priority,
          badgeClass,
          title: a.title,
          desc: a.desc,
          evidence: matchedEv,
        };
      });
    }

    const list: Array<{
      priority: string;
      badgeClass: string;
      title: string;
      desc: string;
      evidence: any;
    }> = [];

    const comboShop = comboT?.shopValue;
    const comboInd = comboT?.industryValue ?? comboT?.baselineValue;
    if (comboInd != null && (comboShop == null || comboShop < comboInd)) {
      list.push({
        priority: 'Ưu tiên cao',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        title: 'Tạo combo quà tặng 2–3 món',
        desc:
          comboShop != null
            ? `Ngành tăng ${fmtNum(spendingIndVal)} giá trị mỗi đơn, còn tỷ lệ combo của shop (${fmtNum(comboShop)}) đang thấp hơn toàn ngành (${fmtNum(comboInd)}).`
            : `Ngành có ${fmtNum(comboInd)} đơn mua theo bộ và tăng ${fmtNum(spendingIndVal)} giá trị mỗi đơn dịp này.`,
        evidence: comboT?.evidence || spendingT?.evidence,
      });
    } else if (voucherT && voucherT.shopValue != null && (voucherT.industryValue ?? voucherT.baselineValue) != null) {
      const vShop = voucherT.shopValue;
      const vInd = voucherT.industryValue ?? voucherT.baselineValue;
      list.push({
        priority: 'Ưu tiên cao',
        badgeClass: 'bg-emerald-50 text-[#007700] border-emerald-200',
        title: vShop >= vInd ? 'Giữ voucher theo ngưỡng đơn để tối ưu biên lãi' : 'Tạo voucher theo ngưỡng đơn tối thiểu',
        desc: `Tỷ lệ đơn dùng mã của shop đang là ${fmtNum(vShop)} so với ${fmtNum(vInd)} toàn ngành.`,
        evidence: voucherT.evidence,
      });
    }

    if (earlyDays != null) {
      list.push({
        priority: 'Nên làm',
        badgeClass: 'bg-amber-50/70 text-amber-800 border-amber-200',
        title: earlyStartDate ? `Mở đặt trước từ ${fmtDayMonth(earlyStartDate)}` : `Mở đặt trước ${earlyDays} ngày`,
        desc: `Khách toàn ngành đặt sớm khoảng ${earlyDays} ngày trước sự kiện. Cần hoàn thiện ảnh và thẻ từ khóa trước mốc này.`,
        evidence: earlyT?.evidence,
      });
    }

    const peakRangeStr = peakStart && peakDate ? `${fmtDayMonth(peakStart)}–${fmtDayMonth(peakDate)}` : '3 ngày cao điểm';
    const peakInd = peakT?.industryValue ?? peakT?.baselineValue;
    list.push({
      priority: 'Vận hành',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      title: `Chuẩn bị tồn kho và nhân lực cho ${peakRangeStr}`,
      desc:
        peakT?.shopValue != null
          ? `${fmtNum(peakT.shopValue)} đơn của shop dồn vào 3 ngày cao điểm, cao hơn mức ${fmtNum(peakInd)} của toàn ngành.`
          : `Toàn ngành ghi nhận ${fmtNum(peakInd)} đơn tập trung vào 3 ngày cao điểm; cần chốt tồn kho trước hạn giao.`,
      evidence: peakT?.evidence,
    });

    return list;
  })();

  const timelineEvidence = earlyT?.evidence || ordersT?.evidence;

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-5 ${className}`}>
      {/* 1. Banner Tóm tắt cho shop của bạn (Kết luận trước) */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#007700]">
              <Sparkles size={13} /> Tóm tắt cho shop của bạn
            </span>
            {industryScale && (industryScale.productsCount ?? 0) > 0 && (
              <span className="text-[11px] text-stone-500">
                · Mẫu toàn ngành: {industryScale.productsCount?.toLocaleString('vi-VN')} sản phẩm ·{' '}
                {industryScale.sellersCount?.toLocaleString('vi-VN')} gian hàng ({(industryScale.platforms || ['Tiki', 'Printify', 'VietCraft']).join(', ')})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed font-medium">
            {summaryText}
          </p>
        </div>

        {onPlanAction && (
          <button
            type="button"
            onClick={onPlanAction}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#007700] hover:bg-[#005b00] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            Lập kế hoạch cho {occasionName}
          </button>
        )}
      </div>

      {/* 2. Hàng 4 thẻ KPI chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(card => (
          <div
            key={card.title}
            className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-3.5 flex flex-col justify-between gap-2"
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500">{card.title}</div>
              <div className={`mt-1 text-2xl font-black tracking-tight ${card.highlight ? 'text-[#007700]' : 'text-stone-900'}`}>
                {card.value}
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">{card.sub}</div>
            </div>
            <div>
              <ConfidenceBadge level={card.confidence} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Trục thời gian 4 giai đoạn theo ngày thực */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[#007700]" />
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                Lịch chuẩn bị theo giai đoạn
              </h4>
              {daysToEvent != null && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-[#007700]">
                  Còn {daysToEvent} ngày
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Hôm nay {fmtDayMonth(today)} · Mốc thời gian tính từ cửa sổ mùa vụ {occasionName}
            </p>
          </div>
          {timelineEvidence && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] font-semibold text-[#007700]">Xem căn cứ</span>
              <EvidenceTrigger evidence={timelineEvidence} onOpen={onOpenEvidence} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {stages.map((st, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isPast = idx < currentStageIdx;
            return (
              <div
                key={st.label}
                className={`rounded-lg border p-2.5 transition-colors ${
                  isCurrent
                    ? 'border-[#007700] bg-emerald-50/40'
                    : isPast
                    ? 'border-stone-200 bg-stone-50/70'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className={`h-1 w-full rounded-full mb-2 ${isCurrent || isPast ? 'bg-[#007700]' : 'bg-stone-200'}`} />
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-mono text-stone-500">{st.range}</span>
                  {isCurrent && (
                    <span className="rounded bg-[#007700] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      Hiện tại
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-bold text-stone-900">{st.label}</div>
                <div className="mt-0.5 text-[11px] text-stone-500 leading-snug">{st.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Thanh ngang cặp đôi (Shop vs Toàn ngành) + Việc nên làm trước dịp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột trái: Thanh ngang cặp đôi */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">
                Hành vi mua: shop bạn so với toàn ngành
              </h4>
              <div className="mt-1 flex items-center gap-4 text-[11px] text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#007700]" />
                  Shop bạn
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" />
                  Toàn ngành
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {barTraits.map(({ key, title, t }) => {
              const sVal = typeof t.shopValue === 'number' ? t.shopValue : null;
              const iVal = typeof (t.industryValue ?? t.baselineValue) === 'number'
                ? (t.industryValue ?? t.baselineValue)
                : null;
              const gap = sVal != null && iVal != null ? Math.round((sVal - iVal) * 10) / 10 : null;
              const pctRank = typeof t.percentileRank === 'number' && sVal != null ? Math.round(t.percentileRank) : null;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-stone-800">{title}</span>
                    {gap != null ? (
                      <span className={`font-bold ${gap >= 0 ? 'text-[#007700]' : 'text-rose-700'}`}>
                        {gap > 0 ? '+' : ''}{gap.toLocaleString('vi-VN')} điểm %
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400">Shop chưa đủ đơn</span>
                    )}
                  </div>

                  {/* Thanh Shop bạn */}
                  <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#007700] transition-all duration-300"
                      style={{ width: `${sVal != null ? Math.max(4, Math.min(100, sVal)) : 0}%` }}
                    />
                  </div>
                  {/* Thanh Toàn ngành */}
                  <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-300"
                      style={{ width: `${iVal != null ? Math.max(4, Math.min(100, iVal)) : 0}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-stone-500">
                    <span>
                      {sVal != null ? `${fmtNum(sVal)} so với ${fmtNum(iVal)}` : `Chưa đủ đơn cùng kỳ · toàn ngành ${fmtNum(iVal)}`}
                      {pctRank != null ? ` · cao hơn ${pctRank}% shop cùng ngành` : ''}
                    </span>
                    <EvidenceTrigger evidence={t.evidence} onOpen={onOpenEvidence} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Việc nên làm xếp theo ưu tiên */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-3">
          <div>
            <h4 className="font-bold text-stone-900 text-sm">
              Việc nên làm trước {occasionName}
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Xếp theo mức ưu tiên, mỗi gợi ý kèm căn cứ đối chiếu
            </p>
          </div>

          <div className="space-y-2.5">
            {actionItems.map((act, idx) => (
              <div
                key={act.title}
                className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                    <CheckCircle2 size={14} className="text-[#007700] shrink-0" />
                    <span>{idx + 1}. {act.title}</span>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${act.badgeClass}`}>
                    {act.priority}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed pl-5">
                  {act.desc}
                </p>
                {act.evidence && (
                  <div className="pl-5 flex items-center gap-1 text-[11px] font-semibold text-[#007700]">
                    <span>Xem căn cứ</span>
                    <EvidenceTrigger evidence={act.evidence} onOpen={onOpenEvidence} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Chú thích độ tin cậy & cỡ mẫu */}
      <div className="flex items-start gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
        <Info size={13} className="mt-0.5 shrink-0 text-stone-400" />
        <span>
          Độ tin cậy (Sơ bộ / Khá / Cao) được xác định dựa trên cỡ mẫu đơn hàng thực tế và số chu kỳ đã quan sát; các chỉ số hiển thị «—» do shop chưa phát sinh đủ đơn hàng trong kỳ để đo lường.
        </span>
      </div>
    </div>
  );
};
