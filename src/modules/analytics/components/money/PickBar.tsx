import { shortDate } from '../../format';
import type { DayPoint, Win } from './dailyData';

interface Props { points: DayPoint[]; view: Win; zoomed: boolean; onReset: () => void; onPick: (from: string, to: string) => void }

export function PickBar({ points, view, zoomed, onReset, onPick }: Props) {
  const a = points[Math.max(0, Math.round(view.s))];
  const b = points[Math.min(points.length - 1, Math.round(view.e))];
  const btn = 'shrink-0 text-xs font-semibold text-[#005B00] hover:underline';
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-xs text-stone-500">
        {zoomed
          ? 'Kéo biểu đồ hoặc thanh bên dưới để xem ngày khác, bấm đúp để xem toàn bộ.'
          : 'Kéo chuột trên biểu đồ để khoanh một đoạn, hoặc lăn chuột để phóng to.'}
      </p>
      {zoomed && a && b && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={onReset} className={btn}>Xem toàn bộ</button>
          <button
            type="button"
            onClick={() => onPick(a.key, b.end)}
            className="shrink-0 rounded-lg bg-[#007700] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#005B00]"
          >
            Tính lại số liệu {shortDate(a.key)} – {shortDate(b.end)}
          </button>
        </div>
      )}
    </div>
  );
}
