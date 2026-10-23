import api from '../../../infrastructure/api/client';

export interface MonthlyCost {
    /** Chỉ khoản mặc định có `key` (không xóa được); khoản tự thêm thì không. */
    key?: string;
    name: string;
    amount: number;
}

export interface PaymentFee {
    /** Mã trùng `payment_method` của đơn hàng. Cổng mới thêm chưa lưu thì chưa có; BE tạo từ tên. */
    code?: string;
    name: string;
    rate: number;
    fixed: number;
    /** Cổng mặc định (VNPAY, PayOS, COD): không xóa được. */
    is_default?: boolean;
}

export interface FinanceConfig {
    monthly_costs: MonthlyCost[];
    payment_fees: PaymentFee[];
    notification_per_order: number;
    /** Vốn dự phòng hiện có (đ), để tính sàn trụ được bao lâu khi đang lỗ. */
    cash_reserve: number;
    updated_at?: string | null;
}

export interface TrendMonth {
    month: string;
    orders: number;
    gmv: number;
    net_revenue: number;
    contribution: number;
    fixed_costs: number;
    net_profit: number;
    /** Tháng đang chạy: chi phí cố định chỉ tính số ngày đã qua. */
    partial: boolean;
}

export interface FinanceOverview {
    period: { days: number; from: string; to: string };
    commission_percent: number;
    orders: { paid: number; refunded: number };
    gmv: number;
    shipping: number;
    paid_amount: number;
    /** Tổng giảm giá của đơn đã thanh toán (voucher sàn + voucher shop). */
    discount: number;
    pnl: {
        commission: number;
        platform_voucher: number;
        net_revenue: number;
        payment_fees: number;
        refund_losses: number;
        notification: number;
        contribution: number;
        fixed_costs: number;
        net_profit: number;
    };
    refunded_commission: number;
    payment_mix: { method: string; name: string; orders: number; amount: number; fee: number }[];
    take_rate: number | null;
    contribution_per_order: number | null;
    /** Kỳ liền trước cùng độ dài, để so sánh tăng/giảm. */
    previous: { orders: number; gmv: number; net_revenue: number; contribution: number; net_profit: number };
    monthly: {
        fixed_costs: number;
        orders: number;
        net_profit: number;
        break_even_orders: number | null;
        break_even_gmv: number | null;
        margin_of_safety: number | null;
        runway_months: number | null;
    };
    trend: TrendMonth[];
    baseline: {
        aov: number | null;
        shipping_per_order: number | null;
        commission_percent: number;
        payment_fee_rate: number;
        refund_rate: number;
        refund_fee_ratio: number;
        voucher_per_order: number;
        notification_per_order: number;
    };
}

/** Kỳ báo cáo: N ngày gần nhất, hoặc từ ngày đến ngày (YYYY-MM-DD, giờ VN). */
export type OverviewQuery = { days: number } | { from: string; to: string };

export const adminFinanceService = {
    async getConfig(): Promise<FinanceConfig> {
        const { data } = await api.get('/admin/finance/config');
        return data.data;
    },

    async updateConfig(payload: FinanceConfig): Promise<FinanceConfig> {
        const { data } = await api.put('/admin/finance/config', payload);
        return data.data;
    },

    async getOverview(query: OverviewQuery): Promise<FinanceOverview> {
        const { data } = await api.get('/admin/finance/pnl', { params: query });
        return data.data;
    },
};
