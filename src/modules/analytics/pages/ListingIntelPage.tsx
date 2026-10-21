import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { IntelTable } from '../components/intel/IntelTable';
import { TrendCalendar } from '../components/intel/TrendCalendar';
import { SourceFooter } from '../components/SourceFooter';
import { InsightCard, Note } from '../components/ui';
import { useInsight } from '../hooks/useInsight';
import type { IntelList } from '../intelTypes';

export function ListingIntelPage() {
  const { state, reload } = useInsight<IntelList>('/listings/intel');
  return (
    <InsightPage
      title="Phân tích listing"
      question="Chấm từng sản phẩm theo ảnh, từ khoá, tag, thị hiếu và mùa vụ, kèm việc nên sửa. Bắt đầu từ sản phẩm điểm thấp nhất ở đầu bảng."
    >
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <InsightBlock state={state} onRetry={reload}>
            {(data, meta) => (
              <InsightCard
                title={`Danh sách sản phẩm (${data.total})`}
                footer={<SourceFooter meta={meta} />}
              >
                {data.items.length === 0 ? <Note>Shop chưa có sản phẩm nào để phân tích.</Note> : <IntelTable items={data.items} />}
              </InsightCard>
            )}
          </InsightBlock>
        </div>
        <TrendCalendar />
      </div>
    </InsightPage>
  );
}
