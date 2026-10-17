import { HEALTH_STATUS_LABEL, decimal } from '../../format';
import type { HealthStatus } from '../../types';
import { healthTone } from '../HealthParts';
import { Chip, InfoTip } from '../ui';
import { BAND_COLOR, bandOf } from './healthStats';

const SCORE_TEXT: Record<HealthStatus, string> = { good: '#1a6b1a', needs_improvement: '#b45309', poor: '#b91c1c' };

const WHAT_IS_IT = (
  <>
    <strong>Điểm sức khoẻ</strong> (0–100) cho biết sản phẩm đã sẵn sàng để bán tới đâu: ảnh, mô tả, tag, tồn kho,
    độ cập nhật; khi có đủ dữ liệu sẽ tính thêm đánh giá và tỉ lệ người xem mua hàng.
    <br />Tốt từ 80 · Cần cải thiện 50–79 · Kém dưới 50.
    <br />Không ảnh hưởng thứ hạng tìm kiếm. Sửa sản phẩm xong khoảng 1 phút điểm cập nhật.
  </>
);

const BAND_MEANING: Record<HealthStatus, string> = {
  poor: 'Sản phẩm còn thiếu nhiều thông tin: người mua khó tìm thấy và khó yên tâm đặt mua.',
  needs_improvement: 'Sản phẩm bán được nhưng còn thiếu vài thứ, sửa thêm để dễ tìm thấy và dễ chốt đơn hơn.',
  good: 'Sản phẩm đã trình bày đầy đủ, người mua dễ tìm thấy và dễ quyết định mua.',
};

function BandScale({ score }: { score: number }) {
  const left = Math.max(0, Math.min(100, score));
  return (
    <div className="mt-3" aria-hidden>
      <div className="relative flex h-2">
        <span className="h-2 rounded-l-sm" style={{ width: '50%', background: BAND_COLOR.poor, opacity: 0.85 }} />
        <span className="h-2" style={{ width: '30%', background: BAND_COLOR.needs_improvement, opacity: 0.85 }} />
        <span className="h-2 rounded-r-sm" style={{ width: '20%', background: BAND_COLOR.good, opacity: 0.85 }} />
        <span className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-sm bg-stone-900 ring-2 ring-white" style={{ left: `${left}%` }} />
      </div>
      <div className="mt-1 flex text-[11px] text-stone-500">
        <span style={{ width: '50%' }}>Kém</span>
        <span style={{ width: '30%' }}>50 · Cần cải thiện</span>
        <span style={{ width: '20%' }}>80 · Tốt</span>
      </div>
    </div>
  );
}

export function ScoreSummary({ score, status, headline, salesPending }: {
  score: number | null;
  status: HealthStatus | null;
  headline: string;
  salesPending?: boolean;
}) {
  const band = status ?? (score !== null ? bandOf(score) : null);
  return (
    <section className="rounded-md border border-stone-200 bg-white p-4">
      <h2 className="m-0 flex items-center gap-1.5 text-sm font-bold text-stone-900">
        Điểm sức khoẻ <InfoTip text={WHAT_IS_IT} label="Điểm sức khoẻ là gì?" />
      </h2>
      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="font-jakarta text-5xl font-extrabold leading-none tabular-nums" style={{ color: band ? SCORE_TEXT[band] : '#57534e' }}>
          {score === null ? '—' : decimal(score, 1)}
        </span>
        <span className="pb-1 text-sm text-stone-500">/ 100</span>
        {band && <Chip tone={healthTone(band)} className="mb-1">{HEALTH_STATUS_LABEL[band] ?? band}</Chip>}
        <span className="mb-1 ml-auto text-[13px] font-semibold text-stone-800">{headline}</span>
      </div>
      {band && <p className="m-0 mt-2 text-[13px] text-stone-600">{BAND_MEANING[band]}</p>}
      {salesPending && (
        <p className="m-0 mt-2 rounded-md bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-600">
          Điểm chưa tính tỉ lệ mua vì sản phẩm chưa đủ 100 lượt xem trong 30 ngày, nên mới phản ánh nội dung, chưa phản ánh bán hàng.
        </p>
      )}
      {score !== null && <BandScale score={score} />}
    </section>
  );
}
