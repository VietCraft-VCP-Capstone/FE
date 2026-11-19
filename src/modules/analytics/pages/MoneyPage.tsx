/**
 * F43 — Thực nhận & Voucher. Trả lời: "Tôi thực nhận bao nhiêu sau phí sàn, voucher và hoàn tiền?"
 *
 * Đọc GET /seller/analytics/money (timeRange = 7d · 30d · 90d · thisMonth · lastMonth · custom + from_date/to_date; mặc định 30d).
 */

import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { CustomRange, rangeProblem } from '../components/money/CustomRange';
import { MoneyHero } from '../components/money/MoneyHero';
import { MoneyDaily } from '../components/money/MoneyDaily';
import { MoneyProducts } from '../components/money/MoneyProducts';
import { MoneySkeleton } from '../components/money/MoneySkeleton';
import { VoucherStock } from '../components/money/VoucherStock';
import { VoucherTable } from '../components/money/VoucherTable';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import { MONEY_RANGES, type MoneyAdvice, type MoneyRange, type MoneyReport } from '../moneyTypes';

const OPTIONS = MONEY_RANGES.map(({ value, label }) => ({ value, label }));

export function MoneyPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const picked: MoneyRange = OPTIONS.find(o => o.value === raw)?.value ?? '30d';
  const timeRange: MoneyRange = picked === 'custom' && rangeProblem(from, to) ? '30d' : picked;
  const query = timeRange === 'custom' ? { timeRange, from_date: from, to_date: to } : { timeRange };
  const rangeKey = `${timeRange}:${from}:${to}`;

  const { state, reload, refreshing } = useInsight<MoneyReport>('/money', query, { keepPrevious: true });
  // Gợi ý AI gọi LLM nên chậm hơn: tải riêng, số liệu hiện trước.
  const advice = useInsight<MoneyAdvice>('/money/advice', query);
  const tips = advice.state.kind === 'ready' ? advice.state.data.tips : {};
  const aiLoading = advice.state.kind === 'loading';

  // LLM đôi khi lỗi một lần: tự gọi lại đúng 1 lần cho mỗi khoảng thời gian.
  const retried = useRef('');
  const adviceMissing = state.kind === 'ready' && advice.state.kind !== 'ready' && advice.state.kind !== 'loading';
  const reloadAdvice = advice.reload;
  useEffect(() => {
    if (!adviceMissing || retried.current === rangeKey) return;
    const timer = setTimeout(() => { retried.current = rangeKey; reloadAdvice(); }, 3000);
    return () => clearTimeout(timer);
  }, [adviceMissing, rangeKey, reloadAdvice]);

  const setRange = (value: MoneyRange, f?: string, t?: string) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    // bấm "Tuỳ chọn" lần đầu: lấy luôn khoảng đang xem làm mặc định
    const cur = state.kind === 'ready' ? state.data : null;
    const nf = f ?? (value === 'custom' ? from || cur?.from : undefined);
    const nt = t ?? (value === 'custom' ? to || cur?.to : undefined);
    if (nf && nt) { next.set('from', nf); next.set('to', nt); } else { next.delete('from'); next.delete('to'); }
    setParams(next, { replace: true });
  };
  const pick = (f: string, t: string) => setRange('custom', f, t);

  return (
    <InsightPage
      title="Thực nhận & Voucher"
      question="Tôi thực nhận bao nhiêu sau phí sàn, voucher và hoàn tiền?"
      actions={
        <div className="flex flex-col items-end gap-2">
          <RangeTabs<MoneyRange> value={timeRange} onChange={v => setRange(v)} options={OPTIONS} label="Khoảng thời gian" />
          {timeRange === 'custom' && <CustomRange from={from} to={to} onApply={pick} />}
        </div>
      }
    >
      <InsightBlock state={state} onRetry={reload} skeleton={<MoneySkeleton />}>
        {(data, meta) => (
          <div
            aria-busy={refreshing}
            className={`space-y-5 transition-opacity duration-200 motion-reduce:transition-none ${refreshing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <MoneyHero data={data} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-7"><MoneyProducts data={data} /></div>
              <div className="min-w-0 lg:col-span-5"><VoucherTable data={data} /></div>
            </div>
            {data.voucher_stock && <VoucherStock stock={data.voucher_stock} tip={refreshing ? undefined : tips.next_voucher} aiLoading={!refreshing && aiLoading} />}
            <MoneyDaily data={data} onPick={pick} />
            <SourceFooter meta={meta} />
            <p className="m-0 text-xs text-stone-500">
              Xem thêm:{' '}
              <Link to={`${INSIGHTS_ROOT}/alerts`} className="font-semibold text-[#005B00] hover:underline">Cảnh báo bất thường</Link>
            </p>
          </div>
        )}
      </InsightBlock>
    </InsightPage>
  );
}
