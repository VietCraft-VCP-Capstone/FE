import { useParams } from 'react-router-dom';
import { TodoItem, WarningItem } from '../components/HealthParts';
import { HealthHistory } from '../components/HealthHistory';
import { HealthPreviewPanel } from '../components/HealthPreviewPanel';
import { CriteriaTable } from '../components/health/CriteriaTable';
import { ListingHeader } from '../components/health/ListingHeader';
import { ScoreSummary } from '../components/health/ScoreSummary';
import { VariantStock } from '../components/health/VariantStock';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { InfoTip, InsightCard, Note } from '../components/ui';
import type { ListingHealthDetailFull } from '../healthTypes';
import { useInsight } from '../hooks/useInsight';
import type { HealthTodo } from '../types';

function gainOf(todos: HealthTodo[]): number {
  return todos.reduce((s, t) => s + Math.max(0, t.impact ?? 0), 0);
}

function headline(score: number | null, todos: HealthTodo[]): string {
  const gain = gainOf(todos);
  if (todos.length === 0) return 'Sản phẩm đã ổn, chưa cần sửa gì.';
  if (score === null || gain <= 0) return `Làm ${todos.length} việc bên phải để sản phẩm dễ bán hơn.`;
  return `Làm hết việc nên làm, điểm lên khoảng ${Math.round(Math.min(100, score + Math.round(gain)))}.`;
}

function TodoCard({ productId, todos, warnings, score }: {
  productId: string;
  todos: HealthTodo[];
  warnings: HealthTodo[];
  score: number | null;
}) {
  const gain = gainOf(todos);
  return (
    <InsightCard
      title="Việc nên làm"
      info={todos.length ? 'Việc dễ làm mà được nhiều điểm xếp trước. "+N điểm" là điểm tăng thêm nếu làm đúng việc đó. Bấm Sửa để mở đúng ô cần sửa.' : undefined}
      action={gain > 0 && score !== null ? (
        <span className="whitespace-nowrap text-xs font-semibold text-[#005B00]">Làm hết: +{Math.round(gain)} điểm</span>
      ) : undefined}
      bodyClassName="px-4 py-2"
    >
      {todos.length > 0 && (
        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
          {todos.map(t => <TodoItem key={`${t.type}-${t.field}-${t.message}`} todo={t} productId={productId} />)}
        </ul>
      )}
      {warnings.length > 0 && (
        <section className="my-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <h3 className="m-0 flex items-center gap-1.5 text-[13px] font-bold text-amber-900">
            Cần kiểm tra <InfoTip text="Không trừ điểm, nhưng có thể khiến bạn bán lỗ hoặc sản phẩm không được hiển thị." label="Vì sao cần kiểm tra" />
          </h3>
          <ul className="m-0 list-none p-0">
            {warnings.map(w => <WarningItem key={`w-${w.field}-${w.message}`} todo={w} productId={productId} />)}
          </ul>
        </section>
      )}
      {todos.length === 0 && warnings.length === 0 && (
        <div className="py-2"><Note>Không còn việc nào. Thỉnh thoảng xem lại ảnh, mô tả và giá để giữ điểm.</Note></div>
      )}
    </InsightCard>
  );
}

export function ListingDetailPage() {
  const { id = '' } = useParams();
  const health = useInsight<ListingHealthDetailFull>(id ? `/listings/${id}/health` : null);
  const ready = health.state.kind === 'ready' ? health.state.data : null;
  const title = ready?.title || 'Sản phẩm';

  return (
    <InsightPage
      title={title}
      breadcrumb={[
        { label: 'Sức khoẻ sản phẩm', to: '/seller/insights/listings' },
        { label: title },
      ]}
      header={ready ? <ListingHeader data={ready} /> : undefined}
    >
      <InsightBlock state={health.state} onRetry={health.reload}>
        {(data, meta) => {
          const todos = data.todos.filter(t => t.type !== 'warning');
          const warnings = data.todos.filter(t => t.type === 'warning');
          return (
            <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,1fr)]">
              <div className="min-w-0 space-y-3">
                <ScoreSummary score={data.score} status={data.status} headline={headline(data.score, todos)} salesPending={data.axes_missing.includes('conversion')} />
                <CriteriaTable
                  axes={data.axes}
                  missing={data.axes_missing}
                  inputs={data.inputs}
                  conversionDetail={data.conversion_detail}
                  score={data.score}
                />
                <HealthHistory productId={id} />
              </div>
              <div className="min-w-0 space-y-3">
                <TodoCard productId={id} todos={todos} warnings={warnings} score={data.score} />
                <VariantStock productId={id} product={data.product} />
                <HealthPreviewPanel productId={id} inputs={data.inputs} todos={todos} score={data.score} status={data.status} />
                <SourceFooter meta={meta} />
              </div>
            </div>
          );
        }}
      </InsightBlock>
      {id && <ListingTraffic id={id} conversionDetail={ready?.conversion_detail ?? null} />}
    </InsightPage>
  );
}
