export interface SimInput {
    /** Đơn thành công mỗi tháng. */
    orders: number;
    /** Tiền hàng trung bình một đơn (giá niêm yết, đã gồm hoa hồng). */
    aov: number;
    shipping: number;
    /** % hoa hồng như trang Cấu hình lợi nhuận: tính trên tiền người bán nhận. */
    commissionPercent: number;
    /** Phí cổng trên (tiền hàng + ship), dạng 0.015. */
    paymentFeeRate: number;
    /** Phần đơn bị hoàn tiền trên tổng đơn, dạng 0.05. */
    refundRate: number;
    /** Phí cổng của một đơn hoàn so với một đơn thành công trung bình (lấy từ số thật, mặc định 1). */
    refundFeeRatio: number;
    voucherPerOrder: number;
    notificationPerOrder: number;
    monthlyFixed: number;
}

export interface SimResult {
    commissionPerOrder: number;
    paymentFeePerOrder: number;
    refundLossPerOrder: number;
    contributionPerOrder: number;
    netProfit: number;
    breakEvenOrders: number | null;
    marginOfSafety: number | null;
}

export const MAX_REFUND_RATE = 0.9;

export function simulate(i: SimInput): SimResult {
    const commission = (i.aov * i.commissionPercent) / (100 + i.commissionPercent);
    const paymentFee = (i.aov + i.shipping) * i.paymentFeeRate;
    const refundRate = Math.min(Math.max(i.refundRate, 0), MAX_REFUND_RATE);
    // Đơn hoàn không thu được hoa hồng nhưng vẫn mất phí cổng + thông báo; quy về mỗi đơn thành công.
    const refundLoss = (refundRate / (1 - refundRate)) * (paymentFee * i.refundFeeRatio + i.notificationPerOrder);
    const contribution = commission - i.voucherPerOrder - paymentFee - i.notificationPerOrder - refundLoss;
    const breakEven = contribution > 0 ? Math.ceil(i.monthlyFixed / contribution) : null;
    return {
        commissionPerOrder: commission,
        paymentFeePerOrder: paymentFee,
        refundLossPerOrder: refundLoss,
        contributionPerOrder: contribution,
        netProfit: i.orders * contribution - i.monthlyFixed,
        breakEvenOrders: breakEven,
        marginOfSafety: breakEven !== null && i.orders > 0 ? (i.orders - breakEven) / i.orders : null,
    };
}

/** Bước chia trục "đẹp" (1, 2, 2,5, 5 × 10ⁿ) để trục số đơn có 4 khoảng tròn. */
function niceStep(x: number): number {
    const p = 10 ** Math.floor(Math.log10(x));
    return ([1, 2, 2.5, 5, 10].find(m => m * p >= x) ?? 10) * p;
}

export function profitCurve(i: SimInput, points = 40): { orders: number; profit: number }[] {
    const { contributionPerOrder, breakEvenOrders } = simulate(i);
    const raw = Math.min(1_000_000, Math.max(50, Math.max(i.orders, breakEvenOrders ?? 0) * 1.5));
    const maxOrders = niceStep(raw / 4) * 4;
    return Array.from({ length: points + 1 }, (_, k) => {
        const orders = Math.round((maxOrders * k) / points);
        return { orders, profit: Math.round(orders * contributionPerOrder - i.monthlyFixed) };
    });
}

export const SCENARIOS: { key: 'bad' | 'base' | 'good'; label: string; note: string; apply: (b: SimInput) => SimInput }[] = [
    {
        key: 'bad',
        label: 'Bi quan',
        note: 'Đơn −30%, đơn hoàn +5 điểm, phí cổng +0,5 điểm, chi phí cố định +10%',
        apply: b => ({
            ...b,
            orders: Math.round(b.orders * 0.7),
            refundRate: Math.min(MAX_REFUND_RATE, b.refundRate + 0.05),
            paymentFeeRate: b.paymentFeeRate + 0.005,
            monthlyFixed: Math.round(b.monthlyFixed * 1.1),
        }),
    },
    { key: 'base', label: 'Cơ sở', note: 'Số liệu thật của kỳ đang xem', apply: b => b },
    {
        key: 'good',
        label: 'Lạc quan',
        note: 'Đơn +30%, đơn hoàn −2 điểm',
        apply: b => ({ ...b, orders: Math.round(b.orders * 1.3), refundRate: Math.max(0, b.refundRate - 0.02) }),
    },
];

const SHOCKS: { label: string; apply: (i: SimInput) => SimInput }[] = [
    { label: 'Phí cổng thanh toán tăng 0,5 điểm %', apply: i => ({ ...i, paymentFeeRate: i.paymentFeeRate + 0.005 }) },
    { label: 'Tỷ lệ đơn hoàn tăng 5 điểm %', apply: i => ({ ...i, refundRate: Math.min(MAX_REFUND_RATE, i.refundRate + 0.05) }) },
    { label: 'Voucher sàn thêm 2.000đ mỗi đơn', apply: i => ({ ...i, voucherPerOrder: i.voucherPerOrder + 2000 }) },
    { label: 'Chi phí cố định tăng 20%', apply: i => ({ ...i, monthlyFixed: i.monthlyFixed * 1.2 }) },
    { label: 'Giá trị đơn trung bình giảm 20%', apply: i => ({ ...i, aov: i.aov * 0.8 }) },
    { label: 'Số đơn giảm 20%', apply: i => ({ ...i, orders: Math.round(i.orders * 0.8) }) },
    { label: 'Hoa hồng tăng 1 điểm %', apply: i => ({ ...i, commissionPercent: i.commissionPercent + 1 }) },
];

/** Đổi từng yếu tố một, xếp theo mức làm lãi/lỗ tháng thay đổi nhiều nhất. */
export function sensitivity(i: SimInput) {
    const base = simulate(i);
    return SHOCKS.map(s => {
        const r = simulate(s.apply(i));
        return { label: s.label, profitDelta: r.netProfit - base.netProfit, breakEvenOrders: r.breakEvenOrders };
    }).sort((a, b) => Math.abs(b.profitDelta) - Math.abs(a.profitDelta));
}
