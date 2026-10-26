import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { Flame, TrendingUp, Sparkles } from 'lucide-react';
import { decimal, shortDate } from '../../format';
import type { IntelTimelinePoint } from '../../intelTypes';
import { InsightCard, Note } from '../ui';

function DemandBadge({ factor }: { factor: number | null }) {
  if (factor === null) {
    return <span className="text-stone-400">-</span>;
  }
  if (factor >= 1.0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <Flame size={12} className="text-rose-600" />
        <span>Rất cao (Đỉnh điểm)</span>
      </span>
    );
  }
  if (factor >= 0.9) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <TrendingUp size={12} className="text-emerald-700" />
        <span>Tăng mạnh (+15%)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-600">
      Bình thường
    </span>
  );
}

export function TrendTimeline({
  points,
  bare = false,
}: {
  points: IntelTimelinePoint[];
  bare?: boolean;
}) {
  const marked = points.filter(p => p.events.length > 0);

  // Compute adaptive Y-domain so the curve isn't a squished flat line
  const scores = points.map(p => p.score).filter((s): s is number => s !== null);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 100;
  const yMin = Math.max(0, Math.floor(minScore - 10));
  const yMax = Math.min(100, Math.ceil(maxScore + 20));

  return (
    <InsightCard
      bare={bare}
      title="Dự báo đà mua sắm theo tuần & Sự kiện Siêu Sale"
      info="Dự báo mức độ quan tâm của người mua qua các tuần và các sự kiện mua sắm lớn sắp tới để shop chuẩn bị tồn kho và khuyến mãi."
    >
      {points.length === 0 ? (
        <Note>Chưa có dữ liệu theo tuần.</Note>
      ) : (
        <div className="space-y-5">
          {/* Actionable E-commerce Campaign Calendar Box */}
          <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-2">
              <Sparkles size={14} className="text-emerald-700" />
              <span>Kế hoạch chuẩn bị cho các đợt Siêu Sale trong 8 tuần tới:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                <span className="font-bold text-stone-900 block">Siêu Sale 11/11 (09/11)</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Đợt sale lớn đầu quý 4. Nên chuẩn bị đủ tồn kho và tạo mã giảm giá trước 05/11 để khách cho vào giỏ hàng.
                </span>
              </div>
              <div className="p-2.5 rounded bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                <span className="font-bold text-stone-900 block">Black Friday (23/11)</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Cơ hội xả kho các mẫu cũ và chạy combo mua 2 giảm 10% để kéo doanh thu.
                </span>
              </div>
              <div className="p-2.5 rounded bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                <span className="font-bold text-stone-900 block">Siêu Sale 12/12 (07/12)</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Đỉnh điểm mua sắm quà tặng và đồ diện Tết. Tỷ lệ khách chốt đơn cao nhất năm.
                </span>
              </div>
            </div>
          </div>

          {/* Adaptive Line Chart */}
          <div className="border border-stone-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-stone-800">
                Xu hướng điểm tiềm năng qua các tuần (Đường kẻ đỏ đánh dấu đợt Siêu Sale)
              </span>
              <span className="text-stone-400 text-[11px]">Đơn vị: Điểm sức mua (0–100)</span>
            </div>

            <div role="img" aria-label="Biểu đồ điểm theo tuần" className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 16, right: 16, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#007700" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#007700" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F4F4F3" vertical={false} />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={shortDate}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                  />
                  <Tooltip
                    labelFormatter={(v: any) => `Tuần từ ngày ${shortDate(String(v))}`}
                    formatter={(v: any) => [v == null ? '-' : `${decimal(Number(v), 0)} điểm`, 'Sức mua']}
                  />
                  {marked.map((p, i) => (
                    <ReferenceLine
                      key={p.week_start}
                      x={p.week_start}
                      stroke="#E11D48"
                      strokeDasharray="3 3"
                      label={{
                        value: `${i + 1}. ${p.events[0]}`,
                        fontSize: 10,
                        fontWeight: 600,
                        fill: '#BE123C',
                        position: 'top',
                      }}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#007700"
                    strokeWidth={2.5}
                    fill="url(#scoreAreaGradient)"
                    dot={{ r: 4, fill: '#FFFFFF', stroke: '#007700', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table of Events and Demand */}
          <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Tuần bắt đầu</th>
                  <th className="py-2.5 px-3.5 text-center">Điểm sức mua</th>
                  <th className="py-2.5 px-3.5">Mức nhu cầu thị trường</th>
                  <th className="py-2.5 px-3.5">Sự kiện kích cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {points.map((p) => {
                  const hasEvent = p.events.length > 0;
                  return (
                    <tr
                      key={p.week_start}
                      className={`transition-colors duration-150 ${
                        hasEvent ? 'bg-amber-50/20 font-medium' : 'hover:bg-stone-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-stone-800">
                        Tuần {shortDate(p.week_start)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold font-mono text-stone-900">
                        {p.score !== null ? decimal(p.score, 0) : '-'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <DemandBadge factor={p.demand_factor} />
                      </td>
                      <td className="py-2.5 px-3.5">
                        {hasEvent ? (
                          <span className="font-semibold text-rose-700">
                            {p.events.join(', ')}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </InsightCard>
  );
}
