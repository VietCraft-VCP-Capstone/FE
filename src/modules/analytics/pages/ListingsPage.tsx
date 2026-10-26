import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { HealthTheme } from '../components/health/HealthTheme';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { commonIssues } from '../components/health/commonIssues';
import { HealthList, TIERS, type TierFilter } from '../components/intel/HealthList';
import { healthTier } from '../components/intel/intelLabels';
import { ShopOverview } from '../components/intel/ShopOverview';
import { RankingView } from '../components/ranking/RankingView';
import { SourceFooter } from '../components/SourceFooter';
import { Note } from '../components/ui';
import { useInsight, type InsightState } from '../hooks/useInsight';
import type { HealthRow, ListingHealthList } from '../healthTypes';

function summary(state: InsightState<ListingHealthList>): string {
  if (state.kind !== 'ready' || state.data.items.length === 0)
    return 'Đánh giá độ chỉn chu của từng tin đăng từ 0 đến 100 điểm. Từ 80 là Tốt, 50 đến 79 là Cần cải thiện, dưới 50 là Cần chú ý.';
  const scored = state.data.items.filter(i => i.score !== null);
  if (scored.length === 0) return 'Chưa chấm được sản phẩm nào, thử tải lại sau.';
  const weak = scored.filter(i => healthTier(i.score).tone !== 'good').length;
  const pending = state.data.items.length - scored.length;
  const waiting = pending ? ` ${pending} sản phẩm đang chờ chấm.` : '';
  return weak > 0
    ? `Có ${weak}/${scored.length} sản phẩm cần hoàn thiện thêm để đạt chuẩn tốt (từ 80 điểm). Bắt đầu từ những sản phẩm cần chú ý ở đầu bảng.${waiting}`
    : `${pending ? 'Các sản phẩm đã chấm đều đạt mức Tốt.' : 'Mọi sản phẩm trong gian hàng đều đã đạt mức Tốt.'}${waiting}`;
}

const ABOUT = (
  <>
    <strong>Sức khoẻ sản phẩm cho biết sản phẩm nào đăng chưa tốt và nên sửa gì trước.</strong>
    <ul className="m-0 mt-1.5 list-disc space-y-1 pl-4">
      <li>Mỗi sản phẩm có điểm 0 đến 100 từ 6 tiêu chuẩn: ảnh, mô tả, từ khoá, chất liệu, đánh giá và giá cả. Từ 80 là Tốt, 50 đến 79 là Cần cải thiện, dưới 50 là Cần chú ý.</li>
      <li>Yếu tố chưa có dữ liệu được 0 điểm; điểm tối đa của các yếu tố khác giữ nguyên.</li>
      <li>Bấm tên sản phẩm để xem việc cần làm và phân tích chi tiết.</li>
      <li>Tab Bảng xếp hạng: sản phẩm nào bán chạy, được xem, được thích nhiều.</li>
    </ul>
    <p className="m-0 mt-1.5">Điểm chỉ để bạn tự cải thiện, không ảnh hưởng thứ hạng tìm kiếm và không phải cam kết bán được.</p>
  </>
);

function deriveTopAction(todos: ListingHealthList['items'][number]['todos'] = [], warnings: ListingHealthList['items'][number]['warnings'] = []) {
  const urgent = warnings.find(w => w.type === 'warning');
  if (urgent) {
    return {
      top_todo: urgent.message,
      top_impact: null,
      top_field: urgent.field ?? null,
    };
  }
  const actionable = todos.filter(t => (t.impact ?? 0) >= 0.5 && t.field && t.field !== 'review');
  if (actionable.length > 0) {
    return {
      top_todo: actionable[0].message,
      top_impact: (actionable[0].impact ?? null) as number | null,
      top_field: actionable[0].field ?? null,
    };
  }
  const review = todos.find(t => (t.field === 'review' || !t.field) && (t.impact ?? 0) >= 0.5);
  if (review) {
    return {
      top_todo: review.message,
      top_impact: (review.impact ?? null) as number | null,
      top_field: review.field ?? null,
    };
  }
  return {
    top_todo: null,
    top_impact: null,
    top_field: null,
  };
}

function toRows(items: ListingHealthList['items']): HealthRow[] {
  return items.map(i => {
    const action = deriveTopAction(i.todos, i.warnings);
    return {
      product_id: i.product_id,
      title: i.title,
      thumbnail: i.thumbnail,
      score: i.score,
      top_todo: action.top_todo,
      top_impact: action.top_impact,
      top_field: action.top_field,
      issue_fields: [
        ...new Set([
          ...i.todos.map(t => t.field).filter((f): f is string => Boolean(f)),
          ...i.warnings.map(w => w.field).filter((f): f is string => Boolean(f)),
        ]),
      ],
    };
  });
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'ranking' ? 'ranking' : 'health';
  const health = useInsight<ListingHealthList>(view === 'health' ? '/listings/health' : null);
  const raw = params.get('muc') ?? '';
  const filter: TierFilter = (TIERS as readonly string[]).includes(raw) ? (raw as TierFilter) : '';
  const issueParam = params.get('van_de') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <HealthTheme>
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
              const issues = commonIssues(data.items);
              const activeIssueObj = issues.find(iss => iss.code === issueParam);
              const issueLabel = activeIssueObj?.message;
              const filteredRows = issueParam
                ? rows.filter(r => r.issue_fields?.includes(issueParam) || r.top_field === issueParam)
                : rows;

              return (
                <div className="space-y-6">
                  {data.items.length === 0 ? (
                    <Note>Shop chưa có sản phẩm nào để chấm.</Note>
                  ) : (
                    <>
                      <ShopOverview
                        items={rows}
                        issues={issues}
                        onFilter={t => setParam('muc', t)}
                        activeFilter={filter}
                        activeIssue={issueParam}
                        onIssueFilter={code => setParam('van_de', code)}
                      />
                      <HealthList
                        items={filteredRows}
                        filter={filter}
                        onFilter={t => setParam('muc', t)}
                        activeIssue={issueParam}
                        onClearIssue={() => setParam('van_de', '')}
                        issueLabel={issueLabel}
                      />
                    </>
                  )}
                  <SourceFooter meta={meta} />
                </div>
              );
            }}
          </InsightBlock>
        )}
      </InsightPage>
    </HealthTheme>
  );
}
