import type { ReactNode } from 'react';
import { Calendar, Flame, TrendingUp, Sparkles, Gift } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortDate } from '../../format';
import type { IntelTimelinePoint } from '../../intelTypes';

interface ChartPoint {
  week_start: string;
  score: number;
  baseScore: number;
  events: string[];
  isEventWeek: boolean;
  eventBoostPct: number;
}

function eventBoost(events: string[]): number {
  if (events.some(e => e.includes('12/12') || e.includes('Siêu sale'))) return 1.35;
  if (events.some(e => e.includes('Black Friday'))) return 1.28;
  if (events.some(e => e.includes('Giáng Sinh') || e.includes('Noel'))) return 1.22;
  if (events.some(e => e.includes('Nhà giáo') || e.includes('20/11'))) return 1.16;
  return 1.0;
}

function eventIcon(name: string) {
  if (name.includes('Black Friday')) return <Flame size={12} className="text-rose-500 shrink-0" />;
  if (name.includes('Giáng Sinh') || name.includes('Noel')) return <Gift size={12} className="text-emerald-600 shrink-0" />;
  return <Sparkles size={12} className="text-amber-500 shrink-0" />;
}

function TipBox({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-2.5 text-xs shadow-md space-y-1">
      <div className="flex items-center gap-1.5 font-bold text-stone-900">
        <span className="h-2 w-2 rounded-full bg-[#007700]" />
        <span>Tuần {shortDate(p.week_start)}: {p.score} điểm sức mua</span>
      </div>
      {p.isEventWeek ? (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
          <Flame size={11} />
          <span>{p.events.join(', ')} (Đợt cao điểm +{p.eventBoostPct}%)</span>
        </div>
      ) : (
        <span className="text-[11px] text-stone-400 block">Tuần mua sắm tiêu chuẩn</span>
      )}
    </div>
  );
}

export function SeasonPanel({
  points,
  children,
}: {
  points: IntelTimelinePoint[];
  children?: ReactNode;
  bare?: boolean;
}) {
  const scored = points.filter((p): p is IntelTimelinePoint & { score: number } => p.score !== null);
  if (scored.length < 2) {
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center text-xs text-stone-400">
        <Calendar size={20} className="mx-auto mb-1 text-stone-300" />
        <p className="m-0">Chưa có dữ liệu dự báo mùa vụ theo tuần.</p>
      </div>
    );
  }

  const baseAvg = Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length);
  const chartData: ChartPoint[] = scored.map(p => {
    const rawScore = p.score;
    const boost = eventBoost(p.events);
    const hasEvent = p.events.length > 0;
    const finalScore = Math.min(100, Math.round(rawScore * boost));
    return {
      week_start: p.week_start,
      score: finalScore,
      baseScore: rawScore,
      events: p.events,
      isEventWeek: hasEvent,
      eventBoostPct: Math.round((boost - 1) * 100),
    };
  });

  const eventPoints = chartData.filter(p => p.isEventWeek);
  const allScores = chartData.map(p => p.score);
  const minVal = Math.min(...allScores);
  const maxVal = Math.max(...allScores);
  const yMin = Math.max(0, Math.floor((minVal - 15) / 10) * 10);
  const yMax = Math.min(100, Math.ceil((maxVal + 15) / 10) * 10);
  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];

  return (
    <div className="space-y-4">
      {/* 1. Header Bar: Status & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-stone-50 border border-stone-200/80 p-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#007700] text-white shrink-0">
            <TrendingUp size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-stone-900">
                Sức mua nền tảng: <b className="text-[#007700]">{baseAvg}/100</b>
              </span>
              <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.2 text-[10px] font-bold border border-blue-200/60">
                Ổn định
              </span>
            </div>
            <p className="m-0 text-[11px] text-stone-500">
              Dự báo lực cầu sẽ tăng vọt vào 4 đợt Siêu Sale và sự kiện lễ hội sắp tới
            </p>
          </div>
        </div>
        <div className="shrink-0">{children}</div>
      </div>

      {/* 2. Key Upcoming Shopping Holidays */}
      {eventPoints.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {eventPoints.map(p => (
            <div
              key={p.week_start}
              className="rounded-xl border border-stone-200/90 bg-white p-2.5 transition-all hover:border-emerald-300 hover:shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-stone-400 font-medium">Tuần {shortDate(p.week_start)}</span>
                <span className="inline-flex items-center gap-0.5 font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60 text-[10px]">
                  +{p.eventBoostPct}% đà mua
                </span>
              </div>
              <div className="font-bold text-xs text-stone-900 truncate flex items-center gap-1.5" title={p.events.join(', ')}>
                {eventIcon(p.events[0] || '')}
                <span className="truncate">{p.events[0]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Smooth Dynamic Forecast Curve with Milestones */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/40 p-3 pt-3.5">
        <div className="flex items-center justify-between mb-2 text-xs text-stone-500 px-1">
          <span className="font-semibold text-stone-700">Đồ thị diễn biến đà mua sắm 8 tuần tới</span>
          <span className="text-[11px] text-stone-400">Đỉnh sóng phản ánh lực cầu mùa Siêu Sale</span>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="seasonAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007700" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#007700" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="3 3" />
              <XAxis
                dataKey="week_start"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: '#78716c' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={yTicks}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<TipBox />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#007700"
                strokeWidth={2.5}
                fill="url(#seasonAreaGrad)"
                dot={(props: any) => {
                  const { cx = 0, cy = 0, payload } = props;
                  const isEvent = payload?.isEventWeek;
                  return (
                    <circle
                      key={payload?.week_start || `${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={isEvent ? 5 : 3.5}
                      fill={isEvent ? '#e11d48' : '#007700'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#007700', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
