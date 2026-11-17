/** Kiểu của GET /seller/analytics/money (F43 · Tiền về & Voucher). Trường `| null` hiện "chưa có", không hiện 0. */
export type MoneyRange = '7d' | '30d' | '90d' | 'thisMonth' | 'lastMonth';

export const MONEY_RANGES: { value: MoneyRange; label: string; text: string }[] = [
  { value: '7d', label: '7 ngày', text: '7 ngày qua' },
  { value: '30d', label: '30 ngày', text: '30 ngày qua' },
  { value: '90d', label: '90 ngày', text: '90 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này', text: 'tháng này' },
  { value: 'lastMonth', label: 'Tháng trước', text: 'tháng trước' },
];

export const rangeText = (r: MoneyRange) => MONEY_RANGES.find(o => o.value === r)?.text ?? '';

export interface MoneyReport {
  range: MoneyRange;
  from: string;
  to: string;
  orders: number;
  flow: {
    buyer_paid_vnd: number;
    platform_fee_vnd: number;
    shop_voucher_vnd: number;
    refund_vnd: number;
    other_vnd: number;
    net_vnd: number;
    platform_voucher_vnd: number;
  };
  by_day: { date: string; net_vnd: number; orders: number }[];
  by_product: { product_id: string; title: string; image?: string; units: number; net_vnd: number; refund_vnd?: number }[];
  pod: { orders: number; net_vnd: number; blank_cost_vnd: number; profit_vnd: number } | null;
  vouchers: { code: string; title: string; orders: number; cost_vnd: number; net_vnd: number; avg_net_vnd: number }[];
  voucher_compare: {
    with_orders: number;
    with_avg_vnd: number;
    without_orders: number;
    without_avg_vnd: number;
  } | null;
  market: {
    category_slug: string;
    total: number;
    discounted: number;
    median_discount_pct: number;
    collected_at: string;
  } | null;
  /** Luôn rỗng ở /money; gợi ý thật tải riêng ở /money/advice. */
  advice: MoneyAdvice;
}

export interface MoneyAdvice { source: 'llm' | 'none'; provider: string | null; tips: Partial<Record<AdviceKey, string>> }

export type AdviceKey = 'cost' | 'voucher' | 'product' | 'pod';
