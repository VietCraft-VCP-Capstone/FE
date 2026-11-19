import { Tabs } from 'antd';
import { Sparkles, Trophy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SCORE_MEANING } from '../components/health/factorState';
import { HealthTheme } from '../components/health/HealthTheme';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { commonIssues, issueCodes, URGENT } from '../components/health/commonIssues';
import { MIN_IMPACT } from '../components/health/visibleTodos';
import { HealthList, TIERS, type TierFilter } from '../components/intel/HealthList';
import { ShopOverview } from '../components/intel/ShopOverview';
import { RankingView } from '../components/ranking/RankingView';
import { Note } from '../components/ui';
import { useInsight } from '../hooks/useInsight';
import type { HealthRow, ListingHealthItem, ListingHealthList } from '../healthTypes';

const ABOUT = (
  <>
    <strong>{SCORE_MEANING}</strong>
    <ul className="m-0 mt-1.5 list-disc space-y-1 pl-4">
      <li>Mỗi sản phẩm được chấm 5 tiêu chí, mỗi tiêu chí tối đa 20 điểm: ảnh, mô tả, từ khoá và tag, đánh giá, giá.</li>
      <li>Chưa điền một tiêu chí thì tiêu chí đó được 0 điểm. Tiêu chí chưa có dữ liệu để chấm (chưa có đánh giá, không áp dụng, chưa đánh giá được) không được tính; điểm quy về thang 100 trên các tiêu chí còn lại, và dòng dưới điểm hiện số tiêu chí đã chấm.</li>
      <li>Xếp loại: Tốt từ 80 điểm; Cần cải thiện từ 50 đến 79; Kém dưới 50.</li>
      <li>Bị chặn bán: sản phẩm có lỗi phải sửa ngay, ví dụ tên có chữ thừa hoặc thông tin liên hệ, chất liệu không khớp, bị từ chối kiểm duyệt, chưa có ảnh, giá bán không cao hơn giá vốn, hoặc không có biến thể còn hàng. Số này đếm riêng, không phụ thuộc điểm.</li>
      <li>Cột Việc nên làm trước hiện việc nên làm đầu tiên; bấm tên sản phẩm để xem chi tiết.</li>
      <li>Điểm được tính lại mỗi 24 giờ và khi bạn lưu thay đổi sản phẩm.</li>
      <li>Tab Xếp hạng bán hàng trong shop: sản phẩm nào trong shop bạn bán chạy, được xem, được thích nhiều.</li>
    </ul>
  </>
);

function topAction(i: ListingHealthItem): { text: string | null; field: string | null } {
  const rec = i.top_recommendation;
  if (rec) return { text: rec.title, field: rec.field };
  const legacy =
    i.warnings.find(w => w.type === 'warning') ??
    i.todos.find(t => (t.impact ?? 0) >= MIN_IMPACT && t.field && t.field !== 'review') ??
    i.todos.find(t => (t.impact ?? 0) >= MIN_IMPACT);
  return { text: legacy?.message ?? null, field: legacy?.field ?? null };
}

function toRows(items: ListingHealthList['items']): HealthRow[] {
  return items.map(i => {
    const action = topAction(i);
    return {
      product_id: i.product_id,
      title: i.title,
      thumbnail: i.thumbnail,
      score: i.score,
      status: i.status,
      coverage: i.coverage ?? null,
      blockers: i.blockers ?? [],
      top_todo: action.text,
      top_field: action.field,
      issue_fields: issueCodes(i),
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
        title="Tối ưu sản phẩm"
        info={ABOUT}
        question={view === 'ranking' ? 'Xếp hạng bán hàng giữa các sản phẩm trong shop bạn và gợi ý để có thêm khách. Cột Hạng toàn sàn chỉ cho biết vị trí so với sản phẩm cùng danh mục của mọi shop.' : 'Trang sản phẩm nào còn thiếu ảnh rõ, từ khoá khách hay tìm hoặc mô tả, và nên sửa gì trước. Muốn biết sản phẩm nào bán chạy, xem tab Xếp hạng bán hàng trong shop.'}
      >
        <Tabs
          activeKey={view}
          onChange={key => setParams(key === 'ranking' ? new URLSearchParams({ view: 'ranking' }) : new URLSearchParams(), { replace: true })}
          items={[
            {
              key: 'health',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs py-0.5">
                  <Sparkles size={13} className="text-[#007700]" />
                  <span>Độ hoàn thiện trang sản phẩm</span>
                </span>
              ),
            },
            {
              key: 'ranking',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs py-0.5">
                  <Trophy size={13} />
                  <span>Xếp hạng bán hàng trong shop</span>
                </span>
              ),
            },
          ]}
          className="!-mb-1"
        />
        {view === 'ranking' ? (
          <RankingView params={params} setParam={setParam} />
        ) : (
          <InsightBlock state={health.state} onRetry={health.reload}>
            {data => {
              const rows = toRows(data.items);
              const issues = commonIssues(data.items);
              const activeIssueObj = issues.find(iss => iss.code === issueParam);
              const issueLabel = activeIssueObj?.message;
              const filteredRows = issueParam
                ? rows.filter(r => (issueParam === URGENT ? r.blockers.length > 0 : r.issue_fields.includes(issueParam)))
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
                </div>
              );
            }}
          </InsightBlock>
        )}
      </InsightPage>
    </HealthTheme>
  );
}
