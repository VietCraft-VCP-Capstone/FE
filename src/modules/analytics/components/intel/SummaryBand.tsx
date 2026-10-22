import { decimal } from '../../format';
import type { ListingIntel } from '../../intelTypes';
import { AXIS_KEYS, AXIS_SIMPLE, GROUP_LABEL, healthTier, TIER_COLOR } from './intelLabels';
import { ScoreRing } from './ScoreRing';

function nextStep(data: ListingIntel): string {
  const easy = data.advice.filter(a => a.effort === 1).length;
  const good = healthTier(data.score).tone === 'good';
  if (data.advice.length === 0) return 'Sản phẩm đã ổn, chưa cần sửa gì.';
  if (easy > 0) return `Làm ${easy} việc dễ để ${good ? 'giữ mức Tốt' : 'tăng điểm'}.`;
  return `Còn ${data.advice.length} việc nên làm, bắt đầu từ việc đầu tiên.`;
}

function PartRow({ label, score }: { label: string; score: number | null }) {
  const tier = healthTier(score);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_56px_28px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_96px_28px]">
      <dt className="truncate text-[13px] text-stone-600">{label}</dt>
      <dd className="m-0 h-1.5">
        {score !== null && <span className="block h-full rounded-full bg-stone-300" style={{ width: `${Math.max(4, score)}%` }} />}
      </dd>
      <dd className="m-0 text-right text-[13px] font-semibold tabular-nums" style={{ color: TIER_COLOR[tier.tone] }}>
        {score === null ? '-' : Math.round(score)}
      </dd>
    </div>
  );
}

export function SummaryBand({ data, compact = false }: { data: ListingIntel; compact?: boolean }) {
  const tier = healthTier(data.score);
  const group = data.peers.group ? GROUP_LABEL[data.peers.group] ?? data.peers.group : null;
  const gain = data.advice.reduce((s, a) => s + Math.max(0, a.impact ?? 0), 0);
  const noImageGain = data.advice.find(a => a.code === 'no_images')?.impact ?? null;
  const cols = compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,300px)]';
  return (
    <section className={`grid items-center gap-x-8 gap-y-5 rounded-xl border border-stone-200 bg-white px-4 py-5 sm:px-6 ${cols}`}>
      <ScoreRing score={data.score} size={104} />
      <div className="min-w-0">
        <p className="m-0 text-sm font-semibold" style={{ color: TIER_COLOR[tier.tone] }}>{tier.label}</p>
        <p className="m-0 mt-1 font-jakarta text-xl font-bold leading-snug tracking-tight text-stone-900 [text-wrap:balance]">{nextStep(data)}</p>
        <p className="m-0 mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-stone-500">
          {gain > 0 ? `Làm hết có thể tăng khoảng +${decimal(gain, 0)} điểm. ` : ''}
          {group ? `So với sản phẩm cùng nhóm ${group}.` : ''}
        </p>
        {data.capped_reason === 'no_images' && (
          <p className="m-0 mt-2 text-[13px] font-medium text-amber-800">
            Điểm thấp vì sản phẩm chưa có ảnh.
            {noImageGain !== null && noImageGain > 0 ? ` Thêm ảnh rõ nét có thể tăng khoảng +${decimal(noImageGain, 0)} điểm.` : ' Thêm ít nhất 3 ảnh rõ nét.'}
          </p>
        )}
      </div>
      <dl className="m-0 grid gap-2 md:col-span-2 lg:col-span-1 lg:border-l lg:border-stone-100 lg:pl-8">
        {AXIS_KEYS.map(k => <PartRow key={k} label={AXIS_SIMPLE[k]} score={data.axes[k].score} />)}
      </dl>
    </section>
  );
}
