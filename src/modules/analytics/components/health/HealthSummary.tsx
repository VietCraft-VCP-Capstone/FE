import { Progress, Tag } from 'antd';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { decimal, scoreText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { healthTier } from '../intel/intelLabels';
import { ScoreLadder } from './ScoreLadder';
import { visibleTodos } from './visibleTodos';

export function HealthSummary({ data }: { data: ListingHealth }) {
  if (data.score === null) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs text-center text-sm text-stone-500">
        Chưa đủ dữ liệu để chấm điểm sức khoẻ sản phẩm này.
      </div>
    );
  }

  const tier = healthTier(data.score);
  const todos = visibleTodos(data);
  const potential = todos.length ? Math.min(100, data.score + todos.reduce((s, t) => s + t.impact, 0)) : null;
  const passedCount = data.breakdown.filter(row => row.sub_score >= 100).length;
  const potentialGain = potential !== null && potential > data.score ? potential - data.score : 0;

  const strokeColor =
    tier.tone === 'good'
      ? { '0%': '#10b981', '100%': '#007700' }
      : tier.tone === 'warn'
      ? { '0%': '#fbbf24', '100%': '#d97706' }
      : { '0%': '#f87171', '100%': '#dc2626' };

  const tierBadgeClass =
    tier.tone === 'good'
      ? 'bg-emerald-50 text-[#007700] border-emerald-200'
      : tier.tone === 'warn'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  const tierDotClass =
    tier.tone === 'good' ? 'bg-[#007700]' : tier.tone === 'warn' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-white to-stone-50/50 p-6 shadow-xs md:p-7">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            tier.tone === 'good' ? 'radial-gradient(circle, #94fc7e 0%, transparent 70%)' : 'radial-gradient(circle, #fde68a 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Score Dial & Tier Badge */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex items-center justify-center">
            <Progress
              type="dashboard"
              percent={data.score}
              strokeColor={strokeColor}
              strokeWidth={10}
              size={135}
              gapDegree={70}
              format={() => (
                <div className="flex flex-col items-center">
                  <span className="font-jakarta text-3xl font-extrabold tracking-tight tabular-nums text-stone-900">
                    {scoreText(data.score)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    / 100 điểm
                  </span>
                </div>
              )}
            />
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tierBadgeClass}`}>
                <span className={`h-2 w-2 rounded-full ${tierDotClass} animate-pulse`} />
                {tier.label}
              </span>
            </div>
            <h3 className="m-0 mt-2 font-jakarta text-lg font-bold text-stone-900">
              Điểm sức khoẻ tin đăng
            </h3>
            <p className="m-0 mt-0.5 max-w-sm text-xs leading-relaxed text-stone-500">
              Đánh giá chất lượng hình ảnh, nội dung, tag, đánh giá và giá cả so với tiêu chuẩn sàn.
            </p>
          </div>
        </div>

        {/* Right: Potential jump & Quick stats */}
        <div className="flex flex-1 flex-col gap-4 lg:max-w-xl">
          {potentialGain > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#007700]">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-jakarta text-xs font-bold text-[#005B00]">
                  <span>Cơ hội tăng điểm:</span>
                  <Tag color="green" className="!m-0 font-extrabold">
                    +{decimal(potentialGain, 1)} điểm
                  </Tag>
                  <span className="text-stone-600">→ lên khoảng</span>
                  <span className="font-extrabold text-[#005B00]">{scoreText(potential)} điểm</span>
                </div>
                <p className="m-0 mt-1 text-xs leading-relaxed text-stone-600">
                  Thực hiện <strong>{todos.length} việc cần làm</strong> bên dưới để nâng chất lượng listing lên mức cao hơn.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5">
              <CheckCircle2 size={18} className="shrink-0 text-[#007700]" />
              <p className="m-0 text-xs text-stone-700">
                Sản phẩm đang duy trì tiêu chuẩn rất tốt. Tiếp tục cập nhật giá và tồn kho định kỳ.
              </p>
            </div>
          )}

          {/* KPI metrics bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-stone-100 bg-white p-2.5 shadow-2xs">
              <span className="block font-jakarta text-base font-extrabold tabular-nums text-stone-900">
                {passedCount} / {data.breakdown.length}
              </span>
              <span className="text-[11px] text-stone-500">Tiêu chí đạt 100%</span>
            </div>
            <div className="rounded-xl border border-stone-100 bg-white p-2.5 shadow-2xs">
              <span className="block font-jakarta text-base font-extrabold tabular-nums text-[#007700]">
                {todos.length}
              </span>
              <span className="text-[11px] text-stone-500">Việc nên làm</span>
            </div>
            <div className="rounded-xl border border-stone-100 bg-white p-2.5 shadow-2xs">
              <span className="block font-jakarta text-base font-extrabold tabular-nums text-amber-600">
                {data.warnings.length}
              </span>
              <span className="text-[11px] text-stone-500">Cảnh báo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Score ladder track */}
      <div className="mt-6 border-t border-stone-100 pt-5">
        <ScoreLadder score={data.score} potential={potential} />
      </div>
    </section>
  );
}
