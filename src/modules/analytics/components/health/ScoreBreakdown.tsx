import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ListingHealthItem } from '../../healthTypes';
import type { HealthAxis } from '../../types';
import { AXIS_INFO, AXIS_ORDER, effectiveWeights } from '../HealthParts';
import { AXIS_SHORT, BAND_COLOR, FOCUS, MOC, axisValue, bandOf } from './healthStats';

const HOW: Partial<Record<HealthAxis, string>> = {
  content: `Trung bình 3 phần: số ảnh so với ${MOC.images} ảnh, độ dài mô tả so với ${MOC.description} ký tự, số tag đã duyệt so với ${MOC.tags} tag. Đạt mốc là 100 điểm.`,
  freshness: `Đủ 100 điểm nếu sửa ảnh, mô tả hoặc tag trong ${MOC.freshDays} ngày gần đây, rồi giảm dần về 0 ở ngày ${MOC.zeroDays}.`,
};

function DetailLink({ id }: { id: string }) {
  return (
    <Link to={`/seller/insights/listings/${id}`} className={`inline-flex items-center gap-1 rounded text-xs font-semibold text-[#007700] no-underline hover:underline ${FOCUS}`}>
      Xem chi tiết cách chấm <ArrowRight size={12} aria-hidden />
    </Link>
  );
}

export function ScoreBreakdown({ item }: { item: ListingHealthItem }) {
  const counted = AXIS_ORDER.filter(a => axisValue(item, a) !== null);
  const weights = effectiveWeights(counted);
  return (
    <div className="w-80 space-y-2 text-[13px]">
      <p className="m-0 text-stone-600">Điểm tổng gộp 5 phần, phần nào quan trọng hơn thì chiếm nhiều hơn:</p>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-left text-[11.5px] text-stone-500">
            <th className="pb-1 font-medium">Phần</th>
            <th className="pb-1 text-right font-medium">Điểm</th>
            <th className="pb-1 text-right font-medium">Chiếm</th>
            <th className="pb-1 text-right font-medium">Góp</th>
          </tr>
        </thead>
        <tbody>
          {AXIS_ORDER.map(axis => {
            const v = axisValue(item, axis);
            const w = weights[axis];
            return (
              <tr key={axis} className={v === null ? 'text-stone-400' : 'text-stone-800'}>
                <td className="py-0.5">{AXIS_SHORT[axis].label}</td>
                <td className="py-0.5 text-right font-semibold tabular-nums" style={v === null ? undefined : { color: BAND_COLOR[bandOf(v)] }}>{v === null ? '—' : Math.round(v)}</td>
                <td className="py-0.5 text-right tabular-nums">{w ? `${Math.round(w * 100)}%` : 'chưa tính'}</td>
                <td className="py-0.5 text-right tabular-nums">{v === null || !w ? '' : `+${(v * w).toFixed(1)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {counted.length < AXIS_ORDER.length && (
        <p className="m-0 text-[11.5px] text-stone-500">Phần chưa đủ dữ liệu được bỏ ra, phần trăm chia lại cho các phần còn lại.</p>
      )}
      <DetailLink id={item.product_id} />
    </div>
  );
}

export function AxisHow({ item, axis }: { item: ListingHealthItem; axis: HealthAxis }) {
  return (
    <div className="w-72 space-y-2 text-[13px] text-stone-700">
      <p className="m-0">{HOW[axis] ?? AXIS_INFO[axis].measures}</p>
      <p className="m-0 text-stone-500">Đây chỉ là một phần của điểm tổng. Cách sửa: {AXIS_INFO[axis].improve}</p>
      <DetailLink id={item.product_id} />
    </div>
  );
}
