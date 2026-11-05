import React from 'react';
import { AlertTriangle, Award, CheckCircle2, Truck } from 'lucide-react';
import type { Evidence } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

export interface RouteRiskItem {
  route: string;
  carrier: string;
  delayRatePct: number;
  cancelRatePct: number;
  sampleOrders: number;
  criticalDayNotice: string;
  evidence: Evidence;
}

export interface ScorecardMetric {
  title: string;
  actualRatePct: number;
  targetRatePct: number;
  comparedWithBaselineText: string;
  totalEvaluatedCases: number;
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
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Khối G: Rủi ro giao hàng */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-50 text-amber-700">
              <Truck size={16} />
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Rủi ro giao hàng theo tuyến</h3>
              <p className="text-xs text-stone-500">
                Thống kê đơn trễ &amp; hủy ở các dịp trước (tối thiểu 50 đơn/tuyến)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {risks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
              Chưa phát hiện rủi ro quá tải hoặc chậm trễ bất thường trên các tuyến vận chuyển chính trong dịp này.
            </div>
          ) : (
            risks.map((risk, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <span>{risk.route}</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      ({risk.carrier} · n = {risk.sampleOrders} đơn)
                    </span>
                  </div>
                  <EvidenceTrigger evidence={risk.evidence} onOpen={onOpenEvidence} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-stone-700 bg-white p-2 rounded-lg border border-stone-100">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Tỷ lệ giao trễ:</span>
                    <strong className={risk.delayRatePct > 10 ? 'text-amber-700' : 'text-stone-800'}>
                      {risk.delayRatePct}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Tỷ lệ hủy / thất bại:</span>
                    <strong className={risk.cancelRatePct > 5 ? 'text-red-700' : 'text-stone-800'}>
                      {risk.cancelRatePct}%
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-stone-600 text-[11px] bg-amber-50/80 p-2 rounded-md border border-amber-200/60">
                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                  <span>{risk.criticalDayNotice}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Khối H: Dự báo đúng đến đâu */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-50 text-purple-700">
              <Award size={16} />
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Dự báo đúng đến đâu (Bảng chấm điểm)</h3>
              <p className="text-xs text-stone-500">
                Công khai kết quả thử nghiệm trên các dịp đã qua để seller tự kiểm chứng
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {scorecard.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
              Đang đối soát số liệu thực tế sau chu kỳ cao điểm để cập nhật bảng điểm dự báo.
            </div>
          ) : (
            scorecard.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-2 text-xs shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{item.title}</h4>
                    <span className="text-[11px] text-stone-400">
                      Đã kiểm nghiệm trên {item.totalEvaluatedCases} dịp mua sắm thực tế
                    </span>
                  </div>
                  <EvidenceTrigger evidence={item.evidence} onOpen={onOpenEvidence} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#007700]">
                    {item.actualRatePct}%
                  </span>
                  <span className="text-stone-500 text-xs">
                    (Mục tiêu cam kết: {item.targetRatePct}%)
                  </span>
                </div>

                <p className="text-stone-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#007700] shrink-0" />
                  <span>{item.comparedWithBaselineText}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
