import { Info, TrendingUp } from 'lucide-react';
import { Popover } from 'antd';
import { decimal, scoreText } from '../../format';
import type { HealthBlocker, ListingHealth } from '../../healthTypes';
import type { HealthStatus } from '../../types';
import { ScoreRing } from './ScoreRing';
import { Chip } from '../ui';
import { isExcluded, statusInfo } from './factorState';
import { potentialGain } from './Recommendations';

const statusOf = (data: ListingHealth): HealthStatus | null => {
  if (data.status) return data.status;
  if (typeof data.score !== 'number') return null;
  if (data.score >= 80) return 'good';
  return data.score >= 50 ? 'needs_improvement' : 'poor';
};

function Blockers({ items }: { items: HealthBlocker[] }) {
  return (
    <div className="mt-3 w-full rounded-lg bg-red-50 p-3">
      <Chip tone="bad">Bị chặn bán</Chip>
      <ul className="m-0 mt-2 list-none space-y-1 p-0 text-sm text-red-800">
        {items.map(b => <li key={b.message}>{b.message}</li>)}
      </ul>
    </div>
  );
}

function verdict(points: number, weight: number): string {
  if (points >= weight) return 'đạt hết';
  if (points <= 0) return 'chưa đạt';
  return points * 2 >= weight ? 'đạt một phần' : 'mới đạt ít';
}

function Breakdown({ data }: { data: ListingHealth }) {
  const factors = data.factors ?? [];
  const counted = factors.filter(f => !isExcluded(f));
  const skipped = factors.filter(isExcluded);
  const got = counted.reduce((s, f) => s + f.points, 0);
  const max = counted.reduce((s, f) => s + f.weight, 0);
  return (
    <div className="w-72 space-y-2.5 text-xs leading-relaxed text-stone-700">
      <p className="m-0 text-sm font-semibold text-stone-900">{scoreText(data.score)} điểm = trang đã làm được {scoreText(data.score)}% phần đang chấm</p>
      <table className="w-full border-collapse">
        <tbody>
          {counted.map(f => (
            <tr key={f.key} className="border-b border-stone-100">
              <td className="py-1 font-semibold text-stone-900">{f.label}</td>
              <td className="py-1 text-right tabular-nums">{decimal(f.points, 1)}/{f.weight}</td>
              <td className={`py-1 pl-2 ${f.points >= f.weight ? 'text-[#007700]' : 'text-amber-700'}`}>{verdict(f.points, f.weight)}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-1.5 font-semibold text-stone-900">Cộng lại</td>
            <td className="pt-1.5 text-right font-semibold tabular-nums text-stone-900">{decimal(got, 1)}/{max}</td>
            <td className="pt-1.5 pl-2 font-semibold text-stone-900">= {scoreText(data.score)}%</td>
          </tr>
        </tbody>
      </table>
      <p className="m-0">Mỗi mục được so với các tin cùng loại. Trọng số do AI học: Ảnh, Mô tả, Giá từ dữ liệu bán Tiki; Tag, Đánh giá từ dữ liệu mô phỏng.</p>
      {skipped.length > 0 && <p className="m-0 text-stone-500">{skipped.map(f => f.label).join(', ')}: chưa đủ dữ liệu nên tạm chưa chấm, không bị trừ điểm.</p>}
    </div>
  );
}

export function ScoreHero({ data }: { data: ListingHealth }) {
  const info = statusInfo(statusOf(data));
  const { coverage } = data;
  const blockers = data.blockers ?? [];
  const gain = potentialGain(data);
  const target = Math.min(100, (data.score ?? 0) + gain);
  return (
    <div className="flex h-full flex-col items-center text-center">
      <p className="m-0 mb-3 text-xs font-semibold text-stone-500">Độ hoàn thiện trang sản phẩm</p>
      <ScoreRing score={data.score} size={140} />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Chip tone={info.tone}>{info.label}</Chip>
        {coverage && <span className="text-xs text-stone-500">Đánh giá {coverage.evaluated}/{coverage.total} tiêu chí</span>}
        {data.confidence && <span className="text-xs text-stone-500">Độ tin cậy: {data.confidence.level} (so với {data.confidence.peers} tin)</span>}
      </div>
      <Popover content={<Breakdown data={data} />} placement="bottom">
        <span className="mt-2 inline-flex cursor-help items-center gap-1 text-xs font-semibold text-stone-500 underline decoration-dotted underline-offset-2 hover:text-[#007700]">
          <Info size={13} aria-hidden />
          Vì sao {scoreText(data.score)} điểm?
        </span>
      </Popover>
      {gain >= 0.1 && (
        <div className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-[#007700]/[0.06] px-3 py-2.5 text-left">
          <TrendingUp size={18} className="shrink-0 text-[#007700]" aria-hidden />
          <p className="m-0 text-xs leading-snug text-stone-700">
            Làm xong <b>Nên làm trước</b> có thể lên <b className="text-sm text-[#007700]">{decimal(target, 0)} điểm</b>
          </p>
        </div>
      )}
      {blockers.length > 0 && <Blockers items={blockers} />}
    </div>
  );
}
