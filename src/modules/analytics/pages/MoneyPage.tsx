/**
 * F43 — Thực nhận & Voucher. Trả lời: "Tôi thực nhận bao nhiêu sau phí sàn, voucher và hoàn tiền?"
 *
 * Đọc GET /seller/analytics/money (tham số timeRange = 7d · 30d · 90d · thisMonth · lastMonth; mặc định 30d).
 */

import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { MoneyDaily } from '../components/money/MoneyDaily';
import { MoneyHero } from '../components/money/MoneyHero';
import { MoneyProducts } from '../components/money/MoneyProducts';
import { MoneySkeleton } from '../components/money/MoneySkeleton';
import { MoneyVerdicts } from '../components/money/MoneyVerdicts';
import { VoucherTable } from '../components/money/VoucherTable';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import { MONEY_RANGES, type MoneyAdvice, type MoneyRange, type MoneyReport } from '../moneyTypes';

const OPTIONS = MONEY_RANGES.map(({ value, label }) => ({ value, label }));

export function MoneyPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const timeRange: MoneyRange = OPTIONS.find(o => o.value === raw)?.value ?? '30d';

  const { state, reload, refreshing } = useInsight<MoneyReport>('/money', { timeRange }, { keepPrevious: true });
  // Gợi ý AI gọi LLM nên chậm hơn: tải riêng, số liệu hiện trước.
  const advice = useInsight<MoneyAdvice>('/money/advice', { timeRange });
  const tips = advice.state.kind === 'ready' ? advice.state.data.tips : {};
  const aiLoading = advice.state.kind === 'loading';

  // LLM đôi khi lỗi một lần: tự gọi lại đúng 1 lần cho mỗi khoảng thời gian.
  const retried = useRef('');
  const adviceMissing = state.kind === 'ready' && advice.state.kind !== 'ready' && advice.state.kind !== 'loading';
  const reloadAdvice = advice.reload;
  useEffect(() => {
    if (!adviceMissing || retried.current === timeRange) return;
    const timer = setTimeout(() => { retried.current = timeRange; reloadAdvice(); }, 3000);
    return () => clearTimeout(timer);
  }, [adviceMissing, timeRange, reloadAdvice]);

  const setRange = (value: MoneyRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage
      title="Thực nhận & Voucher"
      question="Tôi thực nhận bao nhiêu sau phí sàn, voucher và hoàn tiền?"
      actions={<RangeTabs<MoneyRange> value={timeRange} onChange={setRange} options={OPTIONS} label="Khoảng thời gian" />}
    >
      <InsightBlock state={state} onRetry={reload} skeleton={<MoneySkeleton />}>
        {(data, meta) => (
          <div
            aria-busy={refreshing}
            className={`space-y-5 transition-opacity duration-200 motion-reduce:transition-none ${refreshing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <MoneyHero data={data} />
            <MoneyVerdicts data={data} tips={refreshing ? {} : tips} aiLoading={!refreshing && aiLoading} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-7"><MoneyProducts data={data} /></div>
              <div className="min-w-0 lg:col-span-5"><VoucherTable data={data} /></div>
            </div>
            <MoneyDaily data={data} />
            <SourceFooter meta={meta} />
            <p className="m-0 text-xs text-stone-500">
              Xem thêm:{' '}
              <Link to={`${INSIGHTS_ROOT}/alerts`} className="font-semibold text-[#005B00] hover:underline">Cảnh báo bất thường</Link>
              {' · '}
              <Link to={`${INSIGHTS_ROOT}/forecast`} className="font-semibold text-[#005B00] hover:underline">Dự báo doanh thu</Link>
            </p>
          </div>
        )}
      </InsightBlock>
    </InsightPage>
  );
}
