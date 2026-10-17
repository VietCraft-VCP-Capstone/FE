import { PackagePlus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SellerAntd } from '../../seller/components/SellerAntd';
import { AXIS_ORDER, HealthExplainer } from '../components/HealthParts';
import { AxisAverages, BandDistribution, IssueBars } from '../components/health/HealthBreakdowns';
import { HealthKpis } from '../components/health/HealthKpis';
import { HealthTable } from '../components/health/HealthTable';
import { FOCUS, gainOf, needsWork, shopStats } from '../components/health/healthStats';
import { ScoreBenefits } from '../components/health/ScoreBenefits';
import { ShopTrend, TREND_DAYS } from '../components/health/ShopTrend';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Fold } from '../components/ui';
import type { HealthSummaryPoint, ListingHealthList } from '../healthTypes';
import { useInsight, type InsightState } from '../hooks/useInsight';

function summary(state: InsightState<ListingHealthList>): string {
  if (state.kind !== 'ready' || state.data.items.length === 0) return 'Làm các việc dưới đây để sản phẩm dễ bán hơn.';
  const items = state.data.items;
  const scored = items.filter(i => i.score !== null);
  const toFix = items.filter(needsWork).length;
  if (toFix === 0) return 'Mọi sản phẩm đều ổn, chưa cần sửa gì.';
  if (scored.length === 0) return `${toFix} sản phẩm còn việc nên làm.`;
  const weak = scored.filter(i => i.status !== 'good').length;
  const head = weak > 0 ? `${weak} sản phẩm dưới mức Tốt, nên sửa trước` : `Mọi sản phẩm đã đạt mức Tốt, ${toFix} sản phẩm còn có thể tăng điểm`;
  const avg = scored.reduce((s, i) => s + (i.score as number), 0) / scored.length;
  const after = scored.reduce((s, i) => s + Math.min(100, (i.score as number) + gainOf(i)), 0) / scored.length;
  const tail = Math.round(after) > Math.round(avg) ? ` · làm hết, điểm trung bình shop từ ${Math.round(avg)} lên khoảng ${Math.round(after)}` : '';
  return `${head}${tail}.`;
}

function EmptyShop() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-stone-200 bg-white px-6 py-12 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F7EE] text-[#007700]" aria-hidden>
        <PackagePlus size={20} />
      </span>
      <div>
        <p className="m-0 text-sm font-bold text-stone-800">Shop chưa có sản phẩm nào</p>
        <p className="m-0 mt-1 text-xs text-stone-500">Đăng sản phẩm đầu tiên, khoảng 1 phút sau sẽ có điểm và việc cần làm.</p>
      </div>
      <Link
        to="/seller/products?new=1"
        className={`inline-flex h-9 items-center rounded-md bg-[#007700] px-4 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none ${FOCUS}`}
      >
        Đăng sản phẩm
      </Link>
    </div>
  );
}

const ABOUT = (
  <>
    <strong>Sức khoẻ sản phẩm giúp bạn biết sản phẩm nào đăng chưa tốt và nên sửa gì trước.</strong>
    <ul className="m-0 mt-1.5 list-disc space-y-1 pl-4">
      <li>Chấm mỗi sản phẩm 0–100 theo ảnh, mô tả, tag, tồn kho và độ cập nhật; khi có đủ dữ liệu sẽ tính thêm đánh giá và tỉ lệ người xem mua.</li>
      <li>Chỉ ra việc cụ thể kèm số điểm tăng thêm, bấm Sửa là tới đúng ô cần sửa.</li>
      <li>Lọc theo lỗi (thiếu ảnh, mô tả ngắn, thiếu tag, hết hàng) để sửa hàng loạt cùng một kiểu.</li>
    </ul>
    <p className="m-0 mt-1.5">
      Sản phẩm đủ ảnh, mô tả rõ, còn hàng giúp người mua tin tưởng và dễ chốt đơn hơn. Điểm chỉ để bạn tự cải thiện,
      không ảnh hưởng thứ hạng tìm kiếm.
    </p>
  </>
);

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const issue = params.get('issue') || '';
  const band = params.get('health') || '';
  const query = params.get('q') || '';
  const tags = params.getAll('tag');
  const days = TREND_DAYS.find(d => String(d) === params.get('days')) ?? 30;
  const health = useInsight<ListingHealthList>('/listings/health');
  const trend = useInsight<HealthSummaryPoint[]>('/listings/health/summary', { days });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const setTags = (next: string[]) => {
    const p = new URLSearchParams(params);
    p.delete('tag');
    next.forEach(t => p.append('tag', t));
    setParams(p, { replace: true });
  };
  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <SellerAntd>
      <InsightPage title="Sức khoẻ sản phẩm" info={ABOUT} question={summary(health.state)}>
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => {
            if (data.items.length === 0) return <EmptyShop />;

            const stats = shopStats(data.items, AXIS_ORDER);
            const counted = stats.axes.filter(a => a.avg !== null).map(a => a.axis);
            const missing = AXIS_ORDER.filter(axis => !counted.includes(axis));

            return (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-12">
                  <ScoreBenefits />
                  <HealthKpis stats={stats} total={data.items.length} summary={trend.state} />
                </div>
                <ShopTrend
                  state={trend.state}
                  scores={stats.scored.map(i => i.score as number)}
                  days={days}
                  onDaysChange={d => setParam('days', d === 30 ? '' : String(d))}
                  className="lg:col-span-8"
                />
                <BandDistribution stats={stats} active={band} onPick={b => setParam('health', b)} className="lg:col-span-4" />
                <IssueBars stats={stats} total={data.items.length} active={issue} onPick={i => setParam('issue', i)} className="lg:col-span-6" />
                <AxisAverages stats={stats} className="lg:col-span-6" />
                <div className="min-w-0 space-y-3 lg:col-span-12">
                  <HealthTable items={data.items} issue={issue} band={band} query={query} tags={tags} setParam={setParam} setTags={setTags} clearFilters={clearFilters} />
                  <Fold title="Điểm được tính thế nào?">
                    <HealthExplainer counted={counted} missing={missing} />
                  </Fold>
                  <SourceFooter meta={meta} />
                </div>
              </div>
            );
          }}
        </InsightBlock>
      </InsightPage>
    </SellerAntd>
  );
}
