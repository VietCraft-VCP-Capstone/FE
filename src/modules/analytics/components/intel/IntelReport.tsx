import { decimal } from '../../format';
import type { ListingIntel } from '../../intelTypes';
import { InfoTip, InsightCard, Note } from '../ui';
import { AdviceList } from './AdviceList';
import { AxisRadar } from './AxisRadar';
import { GROUP_LABEL } from './intelLabels';
import { ImagePanel } from './ImagePanel';
import { KeywordPanel } from './KeywordPanel';
import { MarketPanel } from './MarketPanel';
import { ModelCard } from './ModelCard';
import { TagPanel } from './TagPanel';
import { TrendTimeline } from './TrendTimeline';

function NoImageNotice({ data }: { data: ListingIntel }) {
  if (data.capped_reason !== 'no_images') return null;
  const impact = data.advice.find(a => a.code === 'no_images')?.impact ?? null;
  return (
    <Note tone="warn">
      <strong>Điểm tổng thấp vì sản phẩm chưa có ảnh.</strong>{' '}
      {impact !== null && impact > 0
        ? `Thêm ảnh rõ nét có thể tăng khoảng +${decimal(impact, 1)} điểm (ước tính theo ảnh trung vị của listing bán chạy cùng nhóm).`
        : 'Thêm ít nhất 3 ảnh rõ nét để được chấm đầy đủ.'}
    </Note>
  );
}

function ScoreCard({ data }: { data: ListingIntel }) {
  const label = data.peers.group ? GROUP_LABEL[data.peers.group] ?? data.peers.group : null;
  const n = data.peers.size.toLocaleString('vi-VN');
  return (
    <InsightCard bodyClassName="px-4 py-4">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="font-jakarta text-4xl font-extrabold leading-none tabular-nums text-stone-900">{decimal(data.score, 0)}</span>
        <span className="pb-1 text-sm text-stone-500">/ 100</span>
        <span className="mb-1 min-w-0 text-[13px] text-stone-700">
          Phân vị so với listing Tiki tham chiếu{label ? ` nhóm ${label}` : ''}; tag và trend so với {n} listing VietCraft{label ? ' cùng nhóm' : ' trên toàn sàn'}.{' '}
          <InfoTip wide label="Giải thích điểm tổng" text="Điểm tổng là phân vị do mô hình ước tính: sản phẩm cao hơn bao nhiêu phần trăm listing Tiki cùng nhóm trong dữ liệu tham chiếu. Trục tag và trend so với các listing VietCraft. Các trục là chỉ báo riêng lẻ, không cộng lại thành điểm tổng, nên điểm trục không nhất thiết trung bình ra điểm tổng." />
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        <NoImageNotice data={data} />
        <Note>
          {data.base !== null && data.demand_factor !== null
            ? `Điểm gốc ${decimal(data.base, 0)}, nhân hệ số nhu cầu ×${decimal(data.demand_factor, 2)} ở thời điểm đang xem.`
            : 'Chưa tách được điểm gốc và hệ số nhu cầu.'}{' '}
          Điểm là phân vị ước tính, không phải cam kết bán được.
        </Note>
      </div>
    </InsightCard>
  );
}

export function IntelReport({ data, compact = false }: { data: ListingIntel; compact?: boolean }) {
  const cols = compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2';
  return (
    <div className="space-y-3">
      <ScoreCard data={data} />
      <div className={`grid items-start gap-3 ${cols}`}>
        <AxisRadar axes={data.axes} />
        <AdviceList advice={data.advice} />
      </div>
      <ImagePanel images={data.images} />
      <div className={`grid items-start gap-3 ${cols}`}>
        <KeywordPanel keywords={data.keywords} material={data.material} />
        <TagPanel tags={data.tags} suggested={data.suggested_tags} />
      </div>
      <div className={`grid items-start gap-3 ${cols}`}>
        <MarketPanel market={data.market} />
        <ModelCard model={data.model} />
      </div>
      <TrendTimeline points={data.score_timeline} />
    </div>
  );
}
