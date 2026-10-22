import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { SellerAntd } from '../../seller/components/SellerAntd';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { commonIssues } from '../components/health/commonIssues';
import { HealthList, TIERS, type TierFilter } from '../components/intel/HealthList';
import { healthTier } from '../components/intel/intelLabels';
import { NextEventBanner } from '../components/intel/NextEventBanner';
import { ShopOverview } from '../components/intel/ShopOverview';
import { RankingView } from '../components/ranking/RankingView';
import { SourceFooter } from '../components/SourceFooter';
import { InsightCard, Note } from '../components/ui';
import { useInsight, type InsightState } from '../hooks/useInsight';
import type { HealthRow, ListingHealthList } from '../healthTypes';

function summary(state: InsightState<ListingHealthList>): string {
  if (state.kind !== 'ready' || state.data.items.length === 0) return 'Chấm từng sản phẩm 0–100 theo 5 yếu tố: ảnh, mô tả, tag, đánh giá và giá. Từ 80 là Tốt, 50–79 là Cần cải thiện, dưới 50 là Kém.';
  const scored = state.data.items.filter(i => i.score !== null);
  if (scored.length === 0) return 'Chưa chấm được sản phẩm nào, thử tải lại sau.';
  const weak = scored.filter(i => healthTier(i.score).tone !== 'good').length;
  const pending = state.data.items.length - scored.length;
  const waiting = pending ? ` ${pending} sản phẩm đang chờ chấm.` : '';
  return weak > 0
    ? `Có ${weak}/${scored.length} sản phẩm chưa đạt mức Tốt (từ 80 điểm). Bắt đầu từ sản phẩm điểm thấp nhất ở đầu bảng.${waiting}`
    : `${pending ? 'Các sản phẩm đã chấm đều đạt mức Tốt.' : 'Mọi sản phẩm đã đạt mức Tốt.'}${waiting}`;
}

const ABOUT = (
  <>
    <strong>Sức khoẻ sản phẩm cho biết sản phẩm nào đăng chưa tốt và nên sửa gì trước.</strong>
    <ul className="m-0 mt-1.5 list-disc space-y-1 pl-4">
      <li>Mỗi sản phẩm có điểm 0–100 từ 5 yếu tố: ảnh, mô tả, tag, đánh giá của người mua và giá. Từ 80 là Tốt, 50–79 là Cần cải thiện, dưới 50 là Kém.</li>
      <li>Yếu tố thiếu dữ liệu được 0 điểm, và các yếu tố còn lại không được chia lại trọng số.</li>
      <li>Bấm tên sản phẩm để xem việc cần làm và phân tích chi tiết.</li>
      <li>Tab Bảng xếp hạng: sản phẩm nào bán chạy, được xem, được thích nhiều.</li>
    </ul>
    <p className="m-0 mt-1.5">Điểm chỉ để bạn tự cải thiện, không ảnh hưởng thứ hạng tìm kiếm và không phải cam kết bán được.</p>
  </>
);

function toRows(items: ListingHealthList['items']): HealthRow[] {
  return items.map(i => ({
    product_id: i.product_id,
    title: i.title,
    thumbnail: i.thumbnail,
    score: i.score,
    top_todo: i.todos[0]?.message ?? i.warnings[0]?.message ?? null,
  }));
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'ranking' ? 'ranking' : 'health';
  const health = useInsight<ListingHealthList>(view === 'health' ? '/listings/health' : null);
  const raw = params.get('muc') ?? '';
  const filter: TierFilter = (TIERS as readonly string[]).includes(raw) ? (raw as TierFilter) : '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <SellerAntd>
      <InsightPage
        title="Sức khoẻ sản phẩm"
        info={ABOUT}
        question={view === 'ranking' ? 'Xếp hạng giữa các sản phẩm trong shop bạn và gợi ý để có thêm khách. Cột Hạng toàn sàn chỉ cho biết vị trí so với sản phẩm cùng danh mục của mọi shop.' : summary(health.state)}
      >
        <Tabs
          activeKey={view}
          onChange={key => setParams(key === 'ranking' ? new URLSearchParams({ view: 'ranking' }) : new URLSearchParams(), { replace: true })}
          items={[{ key: 'health', label: 'Điểm sức khoẻ & việc cần làm' }, { key: 'ranking', label: 'Bảng xếp hạng' }]}
          className="!-mb-1"
        />
        {view === 'ranking' ? (
          <RankingView params={params} setParam={setParam} />
        ) : (
          <InsightBlock state={health.state} onRetry={health.reload}>
            {(data, meta) => {
              const rows = toRows(data.items);
              return (
                <div className="space-y-4">
                  <ShopOverview items={rows} issues={commonIssues(data.items)} onFilter={t => setParam('muc', t)}>
                    <NextEventBanner />
                  </ShopOverview>
                  <InsightCard footer={<SourceFooter meta={meta} />} bodyClassName="p-0">
                    {data.items.length === 0
                      ? <div className="p-4"><Note>Shop chưa có sản phẩm nào để chấm.</Note></div>
                      : <HealthList items={rows} filter={filter} onFilter={t => setParam('muc', t)} />}
                  </InsightCard>
                </div>
              );
            }}
          </InsightBlock>
        )}
      </InsightPage>
    </SellerAntd>
  );
}
