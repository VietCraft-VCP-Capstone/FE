import React, { useState } from 'react';
import { AlertTriangle, Award, CheckCircle2, ChevronDown, Truck } from 'lucide-react';
import type { Evidence } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

export interface RouteRiskItem {
  route: string;
  carrier: string;
  delayRatePct: number | null;
  cancelRatePct: number | null;
  /** Số ngày từ lúc đặt tới lúc giao xong (trung vị, p90) đo từ đơn đã giao */
  deliveryDaysP50?: number | null;
  deliveryDaysP90?: number | null;
  sampleOrders: number;
  insufficientData?: boolean;
  isReferenceBenchmark?: boolean;
  criticalDayNotice: string;
  evidence: Evidence;
}

export interface ScorecardMetric {
  title: string;
  actualRatePct: number | null;
  targetRatePct: number;
  comparedWithBaselineText: string;
  totalEvaluatedCases: number | null;
  evidence: Evidence;
}

interface Props {
  risks: RouteRiskItem[];
  scorecard: ScorecardMetric[];
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubRisksAndScorecard: React.FC<Props> = ({
  risks,
  scorecard,
  onOpenEvidence,
  className = '',
}) => {
  const [openRisk, setOpenRisk] = useState<number | null>(null);
  const [openScore, setOpenScore] = useState<number | null>(null);

  const measuredRisks = risks.filter(
    r => typeof r.delayRatePct === 'number' && typeof r.cancelRatePct === 'number'
  );
  const topRisk = [...measuredRisks].sort(
    (a, b) => (b.delayRatePct ?? 0) + (b.cancelRatePct ?? 0) - ((a.delayRatePct ?? 0) + (a.cancelRatePct ?? 0))
  )[0];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch ${className}`}>
      {/* Khối G: Rủi ro giao hàng (chỉ hiện % khi tuyến có >= 10 đơn thật trong 90 ngày) */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-amber-700" />
              <h3 className="m-0 font-bold text-stone-900 text-xs sm:text-sm">Rủi ro giao hàng theo tuyến</h3>
            </div>
            <span className="text-[11px] text-stone-400">{risks.length} tuyến</span>
          </div>

          {topRisk ? (
            <p className="m-0 text-[11px] text-stone-500">
              Cần chú ý: <strong className="text-stone-800">{topRisk.route}</strong> (trễ {topRisk.delayRatePct}%, hủy {topRisk.cancelRatePct}%).
            </p>
          ) : (
            <p className="m-0 text-[11px] text-stone-500">
              Chưa đủ 10 đơn hoàn tất mỗi tuyến trong 90 ngày để tính tỷ lệ % — nhấn vào từng tuyến để xem lưu ý mùa vụ.
            </p>
          )}

          <div className="space-y-1.5">
            {risks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-[11px] text-stone-500">
                Chưa có dữ liệu giao hàng theo vùng.
              </div>
            ) : (
              risks.map((risk, i) => {
                const isOpen = openRisk === i;
                const hasMeasuredRates =
                  typeof risk.deliveryDaysP50 === 'number' && typeof risk.cancelRatePct === 'number';
                return (
                  <div key={i} className="rounded-lg border border-stone-200/80 bg-stone-50/40 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setOpenRisk(isOpen ? null : i)}
                        className="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="font-semibold text-stone-900 truncate">{risk.route}</span>
                        {risk.carrier && (
                          <span className="text-[10px] text-stone-400 shrink-0 hidden sm:inline">({risk.carrier})</span>
                        )}
                      </button>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        {hasMeasuredRates ? (
                          <>
                            <span className="text-stone-600" title="Trung vị · 90% đơn giao xong trong">
                              Giao {risk.deliveryDaysP50!.toLocaleString('vi-VN')} ngày (p90 {risk.deliveryDaysP90?.toLocaleString('vi-VN')})
                            </span>
                            <span className="text-stone-300">·</span>
                            <span className={risk.cancelRatePct! > 5 ? 'font-bold text-rose-700' : 'text-stone-600'}>
                              Hủy {risk.cancelRatePct}%
                            </span>
                          </>
                        ) : (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                            Chưa đủ mẫu ({risk.sampleOrders}/10 đơn đã giao)
                          </span>
                        )}
                        <EvidenceTrigger evidence={risk.evidence} onOpen={onOpenEvidence} />
                        <button
                          type="button"
                          onClick={() => setOpenRisk(isOpen ? null : i)}
                          className="text-stone-400 hover:text-stone-700 cursor-pointer"
                          aria-label="Xem chi tiết tuyến"
                        >
                          <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-2.5 pb-2 pt-1.5 border-t border-stone-200/60 flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/60">
                        <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          {risk.criticalDayNotice}{' '}
                          <span className="text-stone-500">(n = {risk.sampleOrders} đơn đã giao trong 90 ngày)</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Khối H: Độ tin cậy dự báo (thu gọn) */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-[#007700]" />
              <h3 className="m-0 font-bold text-stone-900 text-xs sm:text-sm">Độ tin cậy dự báo</h3>
            </div>
            <span className="text-[11px] text-stone-400">{scorecard.length} chỉ số</span>
          </div>

          {scorecard[0] && (
            <p className="m-0 text-[11px] text-stone-500">
              {scorecard[0].actualRatePct != null ? (
                <>
                  Đánh giá trên {scorecard[0].totalEvaluatedCases ?? '—'} chuỗi dữ liệu · đạt{' '}
                  <strong className="text-[#007700]">{scorecard[0].actualRatePct}%</strong> (mục tiêu{' '}
                  {scorecard[0].targetRatePct}%).
                </>
              ) : (
                'Chưa có số liệu backtest cho mô hình dự báo.'
              )}
            </p>
          )}

          <div className="space-y-1.5">
            {scorecard.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-[11px] text-stone-500">
                Đang tổng hợp dữ liệu đối soát sau kỳ cao điểm.
              </div>
            ) : (
              scorecard.map((item, i) => {
                const isOpen = openScore === i;
                return (
                  <div key={i} className="rounded-lg border border-stone-200/80 bg-stone-50/40 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setOpenScore(isOpen ? null : i)}
                        className="font-semibold text-stone-800 text-left truncate flex-1 min-w-0 cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </button>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        {item.actualRatePct != null ? (
                          <>
                            <strong className="text-[#007700] tabular-nums">{item.actualRatePct}%</strong>
                            <span className="text-stone-400">/ {item.targetRatePct}%</span>
                          </>
                        ) : (
                          <span className="text-stone-400">N/A</span>
                        )}
                        <EvidenceTrigger evidence={item.evidence} onOpen={onOpenEvidence} />
                        <button
                          type="button"
                          onClick={() => setOpenScore(isOpen ? null : i)}
                          className="text-stone-400 hover:text-stone-700 cursor-pointer"
                          aria-label="Xem chi tiết chỉ số"
                        >
                          <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-2.5 pb-2 pt-1.5 border-t border-stone-200/60 flex items-start gap-1.5 text-[11px] text-stone-600 bg-emerald-50/40">
                        <CheckCircle2 size={12} className="text-[#007700] shrink-0 mt-0.5" />
                        <span>{item.comparedWithBaselineText}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
