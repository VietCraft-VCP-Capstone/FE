import { decimal } from '../../format';
import type { HealthInputs } from '../../healthTypes';
import type { ConversionDetail, HealthAxis } from '../../types';
import { AXIS_ORDER, AXIS_WEIGHT, effectiveWeights } from '../HealthParts';
import { InfoTip } from '../ui';
import { BAND_COLOR, bandOf, MOC } from './healthStats';

const part = (value: number, target: number) => Math.round(Math.min(100, Math.max(0, (value / target) * 100)));

const NAME: Record<HealthAxis, string> = {
  content: 'Nội dung', inventory: 'Tồn kho', freshness: 'Độ cập nhật', rating: 'Đánh giá', conversion: 'Tỉ lệ mua',
};

interface Row { axis: HealthAxis; current: React.ReactNode; target: string; how: React.ReactNode }

function rows(inputs: HealthInputs, detail: ConversionDetail | null | undefined): Row[] {
  const days = inputs.days_since_content_change;
  const views = detail?.views_30d ?? 0;
  const minViews = detail?.min_views ?? 100;
  return [
    {
      axis: 'content',
      current: (
        <>
          {inputs.n_images} ảnh · {inputs.description_length} ký tự · {inputs.n_approved_tags} tag
          {inputs.n_pending_tags > 0 && <span className="ml-1 text-xs text-amber-700">(+{inputs.n_pending_tags} chờ duyệt)</span>}
        </>
      ),
      target: `${MOC.images} ảnh · ${MOC.description} ký tự · ${MOC.tags} tag`,
      how: (
        <>
          Ảnh, mô tả và tag mỗi phần chấm theo % so với mốc, rồi lấy trung bình.
          <br />Hiện tại: ảnh {part(inputs.n_images, MOC.images)} · mô tả {part(inputs.description_length, MOC.description)} · tag {part(inputs.n_approved_tags, MOC.tags)} điểm.
          {inputs.n_pending_tags > 0 && <><br />Tag đang chờ duyệt chưa được tính vì người mua chưa thấy.</>}
        </>
      ),
    },
    {
      axis: 'inventory',
      current: inputs.in_stock_ratio_pct === null ? null : `${inputs.n_variants_in_stock}/${inputs.n_variants} phân loại còn hàng`,
      target: 'Tất cả còn hàng',
      how: 'Tỉ lệ phân loại (màu, kích cỡ) còn hàng. Chỉ tính cho hàng có sẵn, không tính hàng làm theo yêu cầu.',
    },
    {
      axis: 'freshness',
      current: days === null ? null : days === 0 ? 'Sửa hôm nay' : `Sửa ${days} ngày trước`,
      target: `Sửa trong ${MOC.freshDays} ngày`,
      how: `Đủ 100 điểm trong ${MOC.freshDays} ngày kể từ lần sửa ảnh, mô tả hoặc tag gần nhất, sau đó giảm dần về 0 ở ngày ${MOC.zeroDays}. Sửa giá hay tồn kho không tính.`,
    },
    {
      axis: 'rating',
      current: inputs.n_reviews === 0
        ? 'Chưa có đánh giá'
        : `${inputs.avg_rating !== null ? `${decimal(inputs.avg_rating, 1)}★ · ` : ''}${inputs.n_reviews} đánh giá`,
      target: 'Gần 5★',
      how: '5★ = 100 điểm, 3★ = 50, 1★ = 0. Sản phẩm ít đánh giá được kéo về mức chung của sàn, để vài đánh giá đầu không quyết định tất cả.',
    },
    {
      axis: 'conversion',
      current: detail?.conversion_rate != null
        ? `${decimal(detail.conversion_rate * 100, 1)}% · ${detail.orders_30d} đơn / ${views} lượt xem`
        : `${views}/${minViews} lượt xem`,
      target: `Từ ${minViews} lượt xem / 30 ngày`,
      how: 'Trong số người xem, bao nhiêu người mua, so với sản phẩm cùng loại: bằng mức chung = 50 điểm, gấp đôi trở lên = 100.',
    },
  ];
}

function whyMissing(axis: HealthAxis, detail: ConversionDetail | null | undefined): string {
  if (axis === 'rating') return 'Chưa có người mua đánh giá. Có đánh giá đầu tiên là được tính.';
  if (axis === 'inventory') return 'Hàng làm theo yêu cầu hoặc in theo mẫu không có tồn kho để chấm.';
  if (axis === 'conversion') {
    if (!detail || detail.reason === 'not_enough_views') return `Cần ít nhất ${detail?.min_views ?? 100} lượt xem trong 30 ngày, ít hơn thì tỉ lệ mua chưa đáng tin.`;
    return detail.reason === 'not_enough_peers' ? 'Đủ lượt xem nhưng sàn chưa đủ sản phẩm cùng loại để so.' : 'Sản phẩm cùng loại chưa có đơn nào để so.';
  }
  return 'Chưa đủ dữ liệu.';
}

function ScoreCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-sm bg-stone-100">
        <div className="h-1.5 rounded-sm" style={{ width: `${Math.max(3, Math.min(100, score))}%`, background: BAND_COLOR[bandOf(score)] }} />
      </div>
      <span className="font-semibold tabular-nums text-stone-900">{Math.round(score)}</span>
    </div>
  );
}

const NotCounted = ({ axis, detail }: { axis: HealthAxis; detail: ConversionDetail | null | undefined }) => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-stone-500">
    Chưa tính <InfoTip text={whyMissing(axis, detail)} label={`Vì sao ${NAME[axis]} chưa tính`} />
  </span>
);

export function CriteriaTable({ axes, missing, inputs, conversionDetail, score }: {
  axes: Partial<Record<HealthAxis, number | null>>;
  missing: string[];
  inputs: HealthInputs;
  conversionDetail?: ConversionDetail | null;
  score: number | null;
}) {
  const counted = AXIS_ORDER.filter(a => axes[a] != null && !missing.includes(a));
  const weights = effectiveWeights(counted);
  const formula = counted.map(a => `${Math.round(axes[a] as number)} × ${Math.round((weights[a] ?? 0) * 100)}%`).join(' + ');
  const data = rows(inputs, conversionDetail);
  const headerInfo = (
    <>
      Mỗi tiêu chí chấm 0–100, rồi cộng theo tỉ trọng.
      {score !== null && formula && <><br />{formula} ≈ <strong>{decimal(score, 1)}</strong></>}
      <br />Tiêu chí chưa đủ dữ liệu không bị cho 0 điểm: tỉ trọng của nó chia lại cho các tiêu chí còn lại.
    </>
  );
  const weightInfo = `Tỉ trọng gốc: ${AXIS_ORDER.map(a => `${NAME[a]} ${Math.round(AXIS_WEIGHT[a] * 100)}%`).join(', ')}.`;

  return (
    <section className="rounded-md border border-stone-200 bg-white">
      <header className="border-b border-stone-100 px-4 py-3">
        <h2 className="m-0 flex items-center gap-1.5 text-sm font-bold text-stone-900">
          5 tiêu chí chấm điểm <InfoTip text={headerInfo} label="Điểm được cộng thế nào" />
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px] text-stone-700">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold text-stone-600 [&>th]:px-3 [&>th]:py-2">
              <th scope="col" className="!pl-4">Tiêu chí</th>
              <th scope="col">Hiện tại</th>
              <th scope="col">Cần đạt</th>
              <th scope="col">Điểm</th>
              <th scope="col" className="!pr-4 text-right">
                <span className="inline-flex items-center gap-1">Tỉ trọng <InfoTip text={weightInfo} label="Tỉ trọng gốc" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-stone-100 [&>tr:last-child]:border-b-0 [&_td]:px-3 [&_td]:py-2.5">
            {data.map(row => {
              const isCounted = counted.includes(row.axis);
              const value = axes[row.axis];
              return (
                <tr key={row.axis} className={isCounted ? '' : 'text-stone-500'}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2.5 pl-4 font-semibold text-stone-900">
                    <span className="inline-flex items-center gap-1.5">{NAME[row.axis]} <InfoTip text={row.how} label={`Cách chấm ${NAME[row.axis]}`} /></span>
                  </th>
                  <td>{row.current ?? '—'}</td>
                  <td className="text-stone-600">{row.target}</td>
                  <td>{isCounted && value != null ? <ScoreCell score={value} /> : <NotCounted axis={row.axis} detail={conversionDetail} />}</td>
                  <td className="!pr-4 text-right font-semibold tabular-nums text-stone-900">
                    {isCounted ? `${Math.round((weights[row.axis] ?? 0) * 100)}%` : <span className="font-normal text-stone-400">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
