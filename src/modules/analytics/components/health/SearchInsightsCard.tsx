import { Link } from 'react-router-dom';
import { Check, ChevronRight, Info, Search, X } from 'lucide-react';
import { Tooltip } from 'antd';
import { useInsight } from '../../hooks/useInsight';
import type { SearchInsights, SearchQueryInsight, ZeroResultQuery } from '../../healthTypes';
import { InsightBlock } from '../InsightBlock';
import { editLink } from '../HealthParts';
import { Chip } from '../ui';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const LIMIT = 'Vị trí là chỗ sản phẩm của bạn đang hiện khi khách gõ đúng từ đó trên ô tìm kiếm của sàn. Thêm từ vào tên hoặc tag thì sản phẩm được xếp cao hơn, nhưng lên đến vị trí nào còn tuỳ sản phẩm của các shop khác, nên không đoán trước được.';
const TITLE_GAIN = 5;

const TOP_RANK = 3;
const rankText = (rank: number | null) => (rank === null ? 'Ngoài 48 kết quả đầu' : `Vị trí #${rank}`);
const gainText = (gain: number) => (gain >= TITLE_GAIN ? 'Thêm vào tên để được xếp cao hơn' : 'Thêm vào tag để được xếp cao hơn');

function QueryRow({ q }: { q: SearchQueryInsight }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
      <span className="min-w-0 flex-1 text-sm font-semibold text-stone-900">{q.query}</span>
      <span className="text-xs tabular-nums text-stone-500">{q.searches} lượt tìm</span>
      <Chip tone={q.covered ? 'good' : 'warn'} icon={q.covered ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}>
        {q.covered ? 'Có trong tên/tag' : 'Chưa có trong tên/tag'}
      </Chip>
      <Chip tone={q.actual_rank !== null && q.actual_rank <= TOP_RANK ? 'good' : 'neutral'}>{rankText(q.actual_rank)}</Chip>
      {q.match_gain > 0 && <span className="text-xs font-semibold text-[#005B00]">{gainText(q.match_gain)}</span>}
    </li>
  );
}

function ZeroResults({ items }: { items: ZeroResultQuery[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="m-0 text-xs font-semibold text-stone-700">Khách tìm nhưng không ra kết quả</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map(z => <Chip key={z.query}>{z.query} · {z.searches} lượt tìm</Chip>)}
      </div>
    </div>
  );
}

function SearchBody({ data, productId }: { data: SearchInsights; productId: string }) {
  const queries = data.queries ?? [];
  const zeroResult = data.zero_result ?? [];
  const hasGap = queries.some(q => !q.covered) || zeroResult.length > 0;
  const empty = queries.length === 0 && zeroResult.length === 0;
  return (
    <>
      <p className="m-0 text-sm text-stone-700">
        {data.category
          ? `${data.days} ngày qua, khách tìm các từ này rồi bấm vào sản phẩm cùng danh mục "${data.category}". Chỉ thêm từ đúng với sản phẩm của bạn.`
          : 'Sản phẩm chưa có danh mục nên chưa xem được tìm kiếm của danh mục.'}
      </p>
      {empty && data.category && <p className="m-0 mt-3 text-sm text-stone-500">Chưa có lượt tìm nào dẫn tới sản phẩm cùng danh mục.</p>}
      {queries.length > 0 && (
        <ul className="m-0 mt-2 list-none divide-y divide-stone-100 p-0">
          {queries.map(q => <QueryRow key={q.query} q={q} />)}
        </ul>
      )}
      <ZeroResults items={zeroResult} />
      {hasGap && (
        <Link to={editLink(productId, 'tags')} className="mt-3 inline-flex items-center gap-0.5 text-sm font-semibold text-[#007700] no-underline">
          Thêm từ khoá vào tag
          <ChevronRight size={14} aria-hidden />
        </Link>
      )}
    </>
  );
}

export function SearchInsightsCard({ productId }: { productId: string }) {
  const { state, reload } = useInsight<SearchInsights>(`/listings/${productId}/search-insights`);
  const queries = state.kind === 'ready' ? state.data.queries ?? [] : [];
  const covered = queries.filter(q => q.covered).length;
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 inline-flex items-center gap-2 text-base font-bold text-stone-900">
          <Search size={18} className="text-[#007700]" aria-hidden />
          Giúp khách tìm thấy
          <Tooltip title={LIMIT}><Info size={14} className="cursor-help text-stone-400" aria-label="Vị trí là gì" /></Tooltip>
        </h2>
        {queries.length > 0 && (
          <span className="text-sm text-stone-600">
            <b className={`text-base font-bold ${covered === queries.length ? 'text-[#007700]' : 'text-amber-700'}`}>{covered}/{queries.length}</b> từ khoá khách hay tìm đã có trong tên/tag
          </span>
        )}
      </div>
      <div className="mt-3">
        <InsightBlock state={state} onRetry={reload} compact>
          {data => <SearchBody data={data} productId={productId} />}
        </InsightBlock>
      </div>
    </section>
  );
}
