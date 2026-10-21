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
    updated_at?: string | null;
}

export interface FinanceOverview {
    period: { days: number; from: string; to: string };
    commission_percent: number;
    orders: { paid: number; refunded: number };
    gmv: number;
    shipping: number;
    paid_amount: number;
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
    monthly: {
        fixed_costs: number;
        orders: number;
        break_even_orders: number | null;
        margin_of_safety: number | null;
    };
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

export const adminFinanceService = {
    async getConfig(): Promise<FinanceConfig> {
        const { data } = await api.get('/admin/finance/config');
        return data.data;
    },

    async updateConfig(payload: FinanceConfig): Promise<FinanceConfig> {
        const { data } = await api.put('/admin/finance/config', payload);
        return data.data;
    },

    async getOverview(days: number): Promise<FinanceOverview> {
        const { data } = await api.get('/admin/finance/overview', { params: { days } });
        return data.data;
    },
};
