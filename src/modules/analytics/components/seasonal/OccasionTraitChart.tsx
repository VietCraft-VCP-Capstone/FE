import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronDown, Info } from 'lucide-react';
import type { OccasionTraitItem } from '../../types/evidence';
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
  onOpenEvidence,
  className = '',
}) => {
  const [expandedActions, setExpandedActions] = useState<Record<number, boolean>>({});
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
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

  const spendingIndVal = spendingT?.industryValue ?? spendingT?.baselineValue;

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
    <div className={`rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 ${className}`}>
      {/* Bố cục 2 cột cân đối: Trái (Hành vi mua - trọng tâm) | Phải (Việc nên làm + Lịch chuẩn bị thu gọn) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Cột trái (7/12): Thanh ngang cặp đôi */}
        <div className="lg:col-span-7 rounded-xl border border-stone-200/90 bg-white p-4 flex flex-col justify-between gap-3.5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="m-0 font-bold text-stone-900 text-sm">
                Hành vi mua: shop bạn so với toàn ngành
              </h4>
              <div className="flex items-center gap-3 text-[11px] text-stone-600">
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

            {(() => {
              const gaps = barTraits
                .map(({ title, t }) => {
                  const s = typeof t.shopValue === 'number' ? t.shopValue : null;
                  const ind = typeof (t.industryValue ?? t.baselineValue) === 'number' ? (t.industryValue ?? t.baselineValue) : null;
                  return s != null && ind != null ? { title, gap: Math.round((s - ind) * 10) / 10 } : null;
                })
                .filter((x): x is { title: string; gap: number } => x !== null);
              const best = [...gaps].sort((a, b) => b.gap - a.gap)[0];
              const worst = [...gaps].sort((a, b) => a.gap - b.gap)[0];
              if (!best) return null;
              return (
                <p className="m-0 text-xs text-stone-600 leading-relaxed">
                  Mạnh nhất: <strong className="text-[#007700]">{best.title}</strong> ({best.gap > 0 ? '+' : ''}{best.gap.toLocaleString('vi-VN')} điểm %)
                  {worst && worst.gap < 0 && (
                    <>
                      {' '}· cần cải thiện: <strong className="text-rose-700">{worst.title}</strong> ({worst.gap.toLocaleString('vi-VN')} điểm %)
                    </>
                  )}.
                </p>
              );
            })()}
          </div>

          <div className="space-y-3.5">
            {barTraits.map(({ key, title, t }) => {
              const sVal = typeof t.shopValue === 'number' ? t.shopValue : null;
              const iVal = typeof (t.industryValue ?? t.baselineValue) === 'number'
                ? (t.industryValue ?? t.baselineValue)
                : null;
              const gap = sVal != null && iVal != null ? Math.round((sVal - iVal) * 10) / 10 : null;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-stone-800">{title}</span>
                    <div className="flex items-center gap-1.5">
                      {gap != null ? (
                        <span className={`font-bold ${gap >= 0 ? 'text-[#007700]' : 'text-rose-700'}`}>
                          {gap > 0 ? '+' : ''}{gap.toLocaleString('vi-VN')} điểm %
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Chưa đủ đơn</span>
                      )}
                      <EvidenceTrigger evidence={t.evidence} onOpen={onOpenEvidence} />
                    </div>
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

                  <div className="text-[11px] text-stone-500">
                    {sVal != null ? `${fmtNum(sVal)} so với ${fmtNum(iVal)}` : `Toàn ngành ${fmtNum(iVal)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải (5/12): Việc nên làm + Lịch chuẩn bị thu gọn */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Việc nên làm */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="m-0 font-bold text-stone-900 text-sm">
                Việc nên làm trước {occasionName}
              </h4>
              <span className="text-[11px] text-stone-400">{actionItems.length} việc</span>
            </div>

            <div className="space-y-1.5">
              {actionItems.map((act, idx) => {
                const isOpen = !!expandedActions[idx];
                return (
                  <div
                    key={act.title}
                    className="rounded-xl border border-stone-200/90 bg-stone-50/40 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="flex items-center gap-1.5 font-semibold text-xs text-stone-900 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <CheckCircle2 size={13} className="text-[#007700] shrink-0" />
                        <span className="truncate">{idx + 1}. {act.title}</span>
                        <ChevronDown size={12} className={`text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${act.badgeClass}`}>
                          {act.priority}
                        </span>
                        {act.evidence && (
                          <EvidenceTrigger evidence={act.evidence} onOpen={onOpenEvidence} />
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <p className="m-0 px-3 pb-2 pt-1 text-[11px] text-stone-600 leading-relaxed border-t border-stone-200/60">
                        {act.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lịch chuẩn bị thu gọn (thông tin phụ, không chiếm diện tích lớn) */}
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/40 p-3 space-y-2 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#007700]" />
                <h4 className="m-0 font-semibold text-stone-800 text-xs">
                  Lịch chuẩn bị
                </h4>
                {daysToEvent != null && (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-[#007700]">
                    Còn {daysToEvent} ngày
                  </span>
                )}
              </div>
              {timelineEvidence && (
                <EvidenceTrigger evidence={timelineEvidence} onOpen={onOpenEvidence} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {stages.map((st, idx) => {
                const isCurrent = idx === currentStageIdx;
                const isPast = idx < currentStageIdx;
                const isStageOpen = expandedStage === idx;
                return (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setExpandedStage(isStageOpen ? null : idx)}
                    className={`rounded-lg border px-2 py-1.5 text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-[#007700] bg-white'
                        : isPast
                        ? 'border-stone-200/80 bg-stone-100/50'
                        : 'border-stone-200/80 bg-white hover:bg-stone-50'
                    }`}
                    title={st.note}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-mono text-stone-500">{st.range}</span>
                      {isCurrent && (
                        <span className="rounded bg-[#007700] px-1 py-0.2 text-[9px] font-bold text-white">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <span className={`text-[11px] font-semibold truncate ${isCurrent ? 'text-[#007700]' : 'text-stone-800'}`}>
                        {st.label}
                      </span>
                      <ChevronDown size={11} className={`text-stone-400 shrink-0 transition-transform ${isStageOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStageOpen && (
                      <div className="mt-1 text-[10px] text-stone-500 leading-snug">{st.note}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chú thích gọn */}
      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 pt-1 border-t border-stone-100">
        <Info size={12} className="shrink-0" />
        <span>Độ tin cậy tính theo cỡ mẫu đơn thực tế của shop; «—» khi chưa đủ đơn đo lường.</span>
      </div>
    </div>
  );
};
