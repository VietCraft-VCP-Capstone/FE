import React from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import type { Evidence } from '../../../types/evidence';
import { ConfidenceBadge } from '../../evidence/ConfidenceBadge';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

export interface OccasionCalendarRow {
  id: string;
  name: string;
  eventDate: string;
  daysToEvent: number;
  expectedOrdersRange: string;
  coveragePct: number;
  confidence: 'high' | 'fair' | 'preliminary' | 'insufficient';
  nextDeadline: {
    title: string;
    date: string;
    daysLeft: number;
  };
  stages: {
    preparation: { start: string; end: string; status: 'active' | 'upcoming' | 'passed' };
    traction: { start: string; end: string; status: 'active' | 'upcoming' | 'passed' };
    peak: { start: string; end: string; status: 'active' | 'upcoming' | 'passed' };
    cutoff: { date: string; daysLeft: number; status: 'active' | 'upcoming' | 'passed' };
  };
  evidence: Evidence;
}

interface Props {
  rows: OccasionCalendarRow[];
  activeOccasionId?: string;
  onSelectOccasion: (id: string) => void;
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubCalendar120: React.FC<Props> = ({
  rows,
  activeOccasionId,
  onSelectOccasion,
  onOpenEvidence,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
            <Calendar size={16} />
          </span>
          <h3 className="font-bold text-stone-900 text-sm">Lịch sự kiện 120 ngày tới</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600">
            <tr>
              <th className="py-2.5 px-3">Dịp mua sắm</th>
              <th className="py-2.5 px-3">4 giai đoạn hành động</th>
              <th className="py-2.5 px-3">Hạn tiếp theo</th>
              <th className="py-2.5 px-3">Số đơn dự kiến</th>
              <th className="py-2.5 px-3">Độ tin cậy</th>
              <th className="py-2.5 px-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map(row => {
              const isSelected = row.id === activeOccasionId;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectOccasion(row.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/60 font-medium' : 'hover:bg-stone-50/60'
                  }`}
                >
                  {/* Tên dịp */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900 text-sm">{row.name}</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <span>{row.eventDate}</span>
                      <span className="text-stone-300">·</span>
                      <span className="text-[#007700]">còn {row.daysToEvent} ngày</span>
                    </div>
                  </td>

                  {/* 4 Giai đoạn */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 max-w-[280px]">
                      {/* 1. Chuẩn bị hàng */}
                      <div
                        title={`1. Chuẩn bị hàng (${row.stages.preparation.start} đến ${row.stages.preparation.end})`}
                        className={`h-2 flex-1 rounded-sm transition-all ${
                          row.stages.preparation.status === 'active'
                            ? 'bg-amber-500 ring-2 ring-amber-200'
                            : row.stages.preparation.status === 'passed'
                            ? 'bg-stone-300'
                            : 'bg-stone-200'
                        }`}
                      />
                      {/* 2. Tăng tốc */}
                      <div
                        title={`2. Tăng tốc (${row.stages.traction.start} đến ${row.stages.traction.end})`}
                        className={`h-2 flex-1 rounded-sm transition-all ${
                          row.stages.traction.status === 'active'
                            ? 'bg-sky-500 ring-2 ring-sky-200'
                            : row.stages.traction.status === 'passed'
                            ? 'bg-stone-300'
                            : 'bg-stone-200'
                        }`}
                      />
                      {/* 3. Cao điểm */}
                      <div
                        title={`3. Cao điểm (${row.stages.peak.start} đến ${row.stages.peak.end})`}
                        className={`h-2 flex-1 rounded-sm transition-all ${
                          row.stages.peak.status === 'active'
                            ? 'bg-emerald-600 ring-2 ring-emerald-200'
                            : row.stages.peak.status === 'passed'
                            ? 'bg-stone-300'
                            : 'bg-stone-200'
                        }`}
                      />
                      {/* 4. Hạn chốt đơn */}
                      <div
                        title={`4. Hạn chốt đơn: ${row.stages.cutoff.date}`}
                        className={`h-2 w-3 rounded-sm ${
                          row.stages.cutoff.status === 'active' ? 'bg-red-500' : 'bg-stone-300'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1 flex justify-between max-w-[280px]">
                      <span>Chuẩn bị</span>
                      <span>Tăng tốc</span>
                      <span>Cao điểm</span>
                      <span>Chốt</span>
                    </div>
                  </td>

                  {/* Hạn tiếp theo */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-stone-900">{row.nextDeadline.title}</div>
                    <div className="text-[11px] text-amber-700 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{row.nextDeadline.date} (còn {row.nextDeadline.daysLeft} ngày)</span>
                    </div>
                  </td>

                  {/* Số đơn dự kiến */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-stone-900">{row.expectedOrdersRange}</span>
                      <EvidenceTrigger evidence={row.evidence} onOpen={onOpenEvidence} />
                    </div>
                    <div className="text-[10px] text-stone-400">
                      (Độ phủ khoảng {row.coveragePct}%)
                    </div>
                  </td>

                  {/* Độ tin cậy */}
                  <td className="py-3 px-3">
                    <ConfidenceBadge level={row.confidence} />
                  </td>

                  {/* Nút hành động */}
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 text-xs font-bold text-[#007700] hover:text-[#005500]"
                    >
                      <span>Xem kế hoạch</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
