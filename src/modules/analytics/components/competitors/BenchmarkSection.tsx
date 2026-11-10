/**
 * F33 — radar so sánh shop (SRS 3.9.2), hiện ở kiểu xem "Radar" của bảng so sánh với đối thủ.
 * Đúng SRS: 5 trục, shop bạn tô nổi, 5 shop doanh thu cao nhất màu nhạt, bấm chú thích để ẩn/hiện, rê chuột thấy số thật.
 * Mỗi trục chuẩn hoá min–max trên các shop đang so nên chênh nhỏ cũng hiện lớn; số thật nằm ở dạng Bảng.
 */

import { money } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { RADAR_COLORS, RADAR_ME_COLOR, RadarCompare } from '../charts/RadarCompare';
import { decimal } from '../../format';
import type { InsightState } from '../../hooks/useInsight';
import { categoryLabel } from '../../labels';
import { MSG } from '../../services/analyticsApi';
import type { ShopComparison } from '../../types';

const so = (v: number) => decimal(v, Number.isInteger(v) ? 0 : 1);
// Giá trung bình làm tròn tới nghìn: "366.322đ" chỉ làm rối mắt người bán.
const nghin = (v: number) => money(Math.round(v / 1000) * 1000);

/** Tên ngắn trên radar (tên dài bị cắt ở màn hẹp) và cách đọc số thật của từng trục. */
const AXIS: Record<string, { ngan: string; fmt: (v: number) => string }> = {
  listing_count: { ngan: 'Số sản phẩm', fmt: v => `${so(v)} sản phẩm` },
  avg_rating: { ngan: 'Đánh giá', fmt: v => `${decimal(v, 1)} / 5` },
  // Service lưu ÂM để chuẩn hoá đúng chiều; ở đây luôn dùng trị tuyệt đối (phút).
  response_speed: { ngan: 'Phản hồi', fmt: v => `${decimal(v, 0)} phút` },
  avg_price: { ngan: 'Giá', fmt: nghin },
  product_diversity: { ngan: 'Đa dạng', fmt: v => `${so(v)} loại` },
};

const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Math.abs(v) : null);

export function RadarSRS({ state, reload }: { state: InsightState<ShopComparison>; reload: () => void }) {
  return (
    <InsightBlock state={state} onRetry={reload} errorText={MSG[138]}>
      {data => {
        const rawCua = (raw: Record<string, number | null> | undefined) =>
          data.axes.map(a => {
            const v = num(raw?.[a]);
            return v === null || !AXIS[a] ? 'chưa có' : AXIS[a].fmt(v);
          });
        return (
          <div className="space-y-3">
            {/* SRS 3.9.2: tiêu đề màn hình kèm nhãn phân khúc. */}
            <p className="m-0 text-[13px] font-semibold text-stone-800">
              So sánh shop với đối thủ cùng phân khúc · {categoryLabel(data.segment, data.segment_name)}
            </p>
            <RadarCompare
              axes={data.axes.map((a, i) => AXIS[a]?.ngan ?? data.axes_vi[i])}
              bangSoThat
              series={[
                { name: 'Shop của bạn', values: data.me, color: RADAR_ME_COLOR, primary: true, raw: rawCua(data.me_raw) },
                ...data.competitors.map((c, i) => ({ name: c.shop_name, values: c.values, color: RADAR_COLORS[i % RADAR_COLORS.length], raw: rawCua(c.raw) })),
              ]}
            />
            <p className="m-0 text-xs text-stone-500">
              {data.ranked_by === 'reviews'
                ? 'Sàn chưa có đơn đã giao trong 90 ngày nên 5 shop được chọn theo số đánh giá. '
                : '5 shop có doanh thu 90 ngày cao nhất danh mục. '}
              Mỗi tiêu chí được chuẩn hoá min–max theo các shop đang so, nên chênh lệch nhỏ cũng hiển thị lớn; số liệu thực xem ở dạng Bảng.
            </p>
          </div>
        );
      }}
    </InsightBlock>
  );
}
