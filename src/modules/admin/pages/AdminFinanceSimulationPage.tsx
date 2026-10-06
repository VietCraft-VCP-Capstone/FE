import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Database,
  Server,
  Sliders,
  CheckCircle,
  Percent,
  Layers,
  ArrowRight,
  CreditCard,
  Receipt,
  PiggyBank,
  Lightbulb,
  SlidersHorizontal,
  Settings,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

import {
  adminFinanceService,
  PlatformCostConfigData,
  CvpAnalysisData,
  SimulationData,
} from '../services/adminFinanceService';
import { PageHeader, Alert } from '../components/AdminPrimitives';
import { CARD, BTN_PRIMARY, BTN_SECONDARY, PAGE, cx } from '../components/adminUi';
import { money, compactMoney } from '../../../shared/utils/format';

export function AdminFinanceSimulationPage() {
  const [config, setConfig] = useState<PlatformCostConfigData | null>(null);
  const [cvp, setCvp] = useState<CvpAnalysisData | null>(null);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab điều hướng cho Admin: 'simulator' (Mô phỏng giả lập) | 'config' (Cấu hình đơn giá)
  const [activeTab, setActiveTab] = useState<'simulator' | 'config'>('simulator');

  // Form state cho Cấu hình Chi phí
  const [formConfig, setFormConfig] = useState<PlatformCostConfigData | null>(null);

  // Slider state cho What-If Simulation
  const [simOrders, setSimOrders] = useState<number>(150);
  const [simRatePercent, setSimRatePercent] = useState<number>(10);

  // 1. Tải dữ liệu ban đầu
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgData, cvpData] = await Promise.all([
        adminFinanceService.getConfig(),
        adminFinanceService.getCVPAnalysis(),
      ]);
      setConfig(cfgData);
      setFormConfig(JSON.parse(JSON.stringify(cfgData)));
      setCvp(cvpData);

      // Khởi tạo slider với số liệu thực tế gần nhất
      const defaultOrders = cvpData.completed_orders > 0 ? cvpData.completed_orders : 150;
      const defaultRate = Math.round((cfgData.policies?.default_commission_rate || 0.10) * 100);
      setSimOrders(defaultOrders);
      setSimRatePercent(defaultRate);

      // Chạy mô phỏng ban đầu
      const simData = await adminFinanceService.runSimulation(
        defaultOrders,
        defaultRate / 100,
        cvpData.aov
      );
      setSimulation(simData);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Không thể tải dữ liệu tài chính.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 2. Chạy mô phỏng khi người dùng kéo Slider (Debounce nhẹ)
  useEffect(() => {
    if (!cvp) return;
    const timer = setTimeout(async () => {
      try {
        const res = await adminFinanceService.runSimulation(
          simOrders,
          simRatePercent / 100,
          cvp.aov
        );
        setSimulation(res);
      } catch (err: any) {
        console.error('Lỗi chạy mô phỏng:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [simOrders, simRatePercent, cvp]);

  // 3. Xử lý lưu cấu hình chi phí
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConfig) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await adminFinanceService.updateConfig(formConfig);
      setConfig(updated);
      setSaveSuccess(true);
      // Tải lại phân tích CVP với tham số mới
      const cvpData = await adminFinanceService.getCVPAnalysis();
      setCvp(cvpData);
      const simData = await adminFinanceService.runSimulation(
        simOrders,
        simRatePercent / 100,
        cvpData.aov
      );
      setSimulation(simData);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  // Khuyến nghị tự động từ CVP Advisor
  const autoAdvisorMessage = useMemo(() => {
    if (!simulation || !cvp) return null;
    const bep = simulation.break_even_orders;
    const isOk = simulation.is_profitable;
    const margin = simulation.margin_of_safety_pct;

    if (isOk && margin >= 20) {
      return {
        tone: 'success' as const,
        title: 'Tài chính an toàn & Vận hành bền vững',
        desc: `Với tỷ lệ hoa hồng ${simRatePercent}% và sản lượng ${simOrders} đơn/tháng, sàn đang có biên an toàn ${margin}%. Điểm hòa vốn đạt được từ đơn thứ ${bep}. Lợi nhuận dự kiến ${money(simulation.projected_net_profit)}/tháng.`,
      };
    } else if (isOk && margin < 20) {
      return {
        tone: 'warning' as const,
        title: 'Biên an toàn mỏng (Dễ rơi vào điểm lỗ)',
        desc: `Sàn đang có lãi nhẹ nhưng biên an toàn chỉ ${margin}% (cần ${bep} đơn để hòa vốn). Khuyến nghị duy trì tối thiểu ${Math.round(bep * 1.25)} đơn/tháng hoặc tối ưu biến phí cổng thanh toán.`,
      };
    } else {
      return {
        tone: 'danger' as const,
        title: 'Cảnh báo: Kịch bản thâm hụt ngân sách',
        desc: `Tại mức phí ${simRatePercent}% và ${simOrders} đơn/tháng, sàn đang lỗ ${money(Math.abs(simulation.projected_net_profit))}/tháng. Cần bán ít nhất ${bep} đơn mới đạt hòa vốn. Khuyến nghị nâng mức hoa hồng hoặc điều chỉnh phí tối thiểu/đơn.`,
      };
    }
  }, [simulation, cvp, simOrders, simRatePercent]);

  // Các biến tính toán trực quan cho Tầng 1 & Tầng 2
  const aov = cvp?.aov || 315462;
  const revPerOrder = cvp?.unit_economics.revenue_per_order || 31546;
  const vcPerOrder = cvp?.unit_economics.variable_cost_per_order || 5732;
  const cmPerOrder = cvp?.unit_economics.contribution_margin_per_order || 25814;
  const sellerPrinterPayout = Math.max(0, aov - revPerOrder);
  const fixedTotal = cvp?.total_fixed_costs || 2065550;
  const bepOrders = cvp?.break_even_orders || 81;
  const currentOrders = cvp?.completed_orders || 0;
  const missingOrders = Math.max(0, bepOrders - currentOrders);
  const survivePercent = bepOrders > 0 ? Math.min(100, Math.round((currentOrders / bepOrders) * 100)) : 0;

  if (loading) {
    return (
      <div className={PAGE}>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-admin-brand border-t-transparent" />
          <p className="text-[14px] text-admin-muted">Đang phân tích dòng tiền và mô hình hòa vốn của sàn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE}>
      {/* Header */}
      <PageHeader
        title="Quản trị Dòng tiền & Hòa vốn Sàn"
        description="Mô hình hóa dòng tiền thực tế, phân tích ngưỡng an toàn tài chính và giả lập kịch bản kinh doanh cho sàn POD VietCraft."
        actions={
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw size={15} aria-hidden />
            Làm mới
          </button>
        }
      />

      {error && (
        <Alert tone="danger">
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13.5px] font-semibold text-emerald-800">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>Đã lưu thành công cấu hình chi phí vận hành và cập nhật chính sách sàn!</span>
        </div>
      )}

      {/* ========================================================
          TẦNG 1: SƠ ĐỒ DÒNG TIỀN THỰC TẾ (VISUAL MONEY FLOW)
          Admin nhìn 3 giây hiểu ngay cơ chế vận hành sàn POD
      ======================================================== */}
      {cvp && (
        <section className={cx(CARD, 'mb-6 p-5 border-l-4 border-l-admin-brand bg-gradient-to-br from-white to-[#f7faf7]')}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-admin-brand">
                <Sparkles size={16} />
              </span>
              <h2 className="m-0 text-[15px] font-extrabold text-admin-ink tracking-tight">
                Cơ Chế Dòng Tiền Trên 1 Đơn Hàng POD (AOV Trung Bình: {money(aov)})
              </h2>
            </div>
            <span className="hidden sm:inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11.5px] font-bold text-admin-brand">
              Mô hình phí sàn: {((revPerOrder / aov) * 100).toFixed(0)}%
            </span>
          </div>

          <p className="mt-0 mb-4 text-[13px] text-admin-muted leading-relaxed">
            Mỗi khi khách đặt mua 1 sản phẩm in ấn, tiền sẽ chạy qua 4 bước khấu trừ trước khi Sàn giữ lại phần lãi thuần để nuôi hệ thống:
          </p>

          {/* 4 Cards nối nhau bằng mũi tên ArrowRight */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4 md:gap-3">
            {/* Bước 1 */}
            <div className="relative flex flex-col justify-between rounded-xl border border-admin-line bg-white p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between text-[11.5px] font-bold text-admin-muted uppercase">
                  <span>Bước 1: Khách Trả</span>
                  <CreditCard size={15} className="text-blue-600" />
                </div>
                <div className="mt-2 text-[20px] font-extrabold text-stone-900 tabular-nums">
                  {money(aov)}
                </div>
                <p className="mt-1 mb-0 text-[11.5px] text-stone-500 leading-normal">
                  Khách mua 1 áo POD. Tiền tạm giữ an toàn tại tài khoản Sàn.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-admin-line shadow-sm text-admin-muted">
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Bước 2 */}
            <div className="relative flex flex-col justify-between rounded-xl border border-admin-line bg-white p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between text-[11.5px] font-bold text-admin-muted uppercase">
                  <span>Bước 2: Nghĩa Vụ</span>
                  <Receipt size={15} className="text-amber-600" />
                </div>
                <div className="mt-2 text-[20px] font-extrabold text-admin-brand tabular-nums">
                  {money(revPerOrder)}
                </div>
                <p className="mt-1 mb-0 text-[11.5px] text-stone-500 leading-normal">
                  Trả xưởng in & Seller: <strong className="text-stone-700">{compactMoney(sellerPrinterPayout)}</strong>. Sàn thu về phí dịch vụ <strong className="text-admin-brand">{money(revPerOrder)}</strong>.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-admin-line shadow-sm text-admin-muted">
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Bước 3 */}
            <div className="relative flex flex-col justify-between rounded-xl border border-admin-line bg-white p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between text-[11.5px] font-bold text-admin-muted uppercase">
                  <span>Bước 3: Chi Trung Gian</span>
                  <Percent size={15} className="text-rose-600" />
                </div>
                <div className="mt-2 text-[20px] font-extrabold text-rose-700 tabular-nums">
                  -{money(vcPerOrder)}
                </div>
                <p className="mt-1 mb-0 text-[11.5px] text-stone-500 leading-normal">
                  Sàn thanh toán cổng VNPAY (1.5%) + phí gửi thông báo/SMS/Email.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-admin-line shadow-sm text-admin-muted">
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Bước 4 */}
            <div className="flex flex-col justify-between rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between text-[11.5px] font-bold text-emerald-800 uppercase">
                  <span>Bước 4: Sàn Đút Túi</span>
                  <PiggyBank size={16} className="text-emerald-700" />
                </div>
                <div className="mt-2 text-[20px] font-extrabold text-emerald-800 tabular-nums">
                  +{money(cmPerOrder)}
                </div>
                <p className="mt-1 mb-0 text-[11.5px] text-emerald-900 leading-normal font-medium">
                  Lãi thuần giữ lại trên mỗi đơn để nuôi máy chủ VPS, Cloudinary & tên miền!
                </p>
              </div>
            </div>
          </div>

          {/* Banner Kết luận dòng tiền trực quan */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[12.5px] text-white">
            <Lightbulb size={17} className="text-amber-400 shrink-0" />
            <div className="flex-1">
              <strong className="text-amber-300">Công thức sống sót của sàn:</strong> Tổng định phí máy chủ là{' '}
              <strong className="underline text-white">{money(fixedTotal)}/tháng</strong>. Mỗi đơn sàn đút túi thuần{' '}
              <strong className="underline text-emerald-300">{money(cmPerOrder)}</strong>.{' '}
              <span>
                Lấy <strong>{compactMoney(fixedTotal)}</strong> chia <strong>{compactMoney(cmPerOrder)}</strong> 👉{' '}
                Sàn cần bán tối thiểu <strong className="text-amber-300 text-[13.5px]">{bepOrders} đơn/tháng</strong> để tự nuôi sống mình và không phải bù tiền túi!
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TẦNG 2: BÌNH DÂN HÓA THUẬT NGỮ TRÊN CÁC CARD KPI
      ======================================================== */}
      {cvp && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Lợi nhuận ròng 30 ngày */}
            <div className={cx(CARD, 'p-4')}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-admin-muted">
                  Lợi Nhuận Ròng (30 Ngày)
                </span>
                <span
                  className={cx(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold',
                    cvp.is_profitable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  )}
                >
                  {cvp.is_profitable ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {cvp.is_profitable ? 'CÓ LÃI' : 'BÙ LỖ'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={cx(
                    'text-[24px] font-extrabold tabular-nums tracking-tight',
                    cvp.is_profitable ? 'text-emerald-700' : 'text-rose-700'
                  )}
                >
                  {cvp.net_profit < 0 ? `- ${money(Math.abs(cvp.net_profit))}` : `+ ${money(cvp.net_profit)}`}
                </span>
              </div>
              <div className="mt-1 text-[12px] font-medium text-admin-muted">
                {cvp.is_profitable ? (
                  <span className="text-emerald-700">✓ Sàn tự nuôi sống được máy chủ</span>
                ) : (
                  <span className="text-rose-600 font-semibold">⚠ Admin đang phải bỏ tiền túi bù lỗ</span>
                )}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-admin-line-soft flex justify-between text-[11.5px] text-admin-muted">
                <span>Thu sàn: {compactMoney(cvp.actual_platform_revenue)}</span>
                <span>Chi phí: {compactMoney(cvp.total_costs)}</span>
              </div>
            </div>

            {/* Card 2: Số đơn cần để hòa vốn */}
            <div className={cx(CARD, 'p-4')}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-admin-muted">
                  Số Đơn Cần Để Hòa Vốn
                </span>
                <Calculator size={16} className="text-admin-brand" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-extrabold tabular-nums tracking-tight text-admin-ink">
                  {bepOrders.toLocaleString()}
                </span>
                <span className="text-[13px] font-bold text-admin-muted">đơn/tháng</span>
              </div>
              <div className="mt-1 text-[12px] text-admin-muted">
                Hiện tại: <strong className="text-admin-ink">{currentOrders} đơn</strong>
                {missingOrders > 0 ? (
                  <span className="text-rose-600 font-bold"> (Còn thiếu {missingOrders} đơn)</span>
                ) : (
                  <span className="text-emerald-600 font-bold"> (Đã vượt mục tiêu)</span>
                )}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-admin-line-soft text-[11.5px] text-admin-muted">
                Đạt từ đơn số {bepOrders} trở đi sẽ bắt đầu có lãi thuần
              </div>
            </div>

            {/* Card 3: Doanh số toàn sàn cần đạt */}
            <div className={cx(CARD, 'p-4')}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-admin-muted">
                  Doanh Số Toàn Sàn Cần Đạt
                </span>
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-extrabold tabular-nums tracking-tight text-admin-ink">
                  {compactMoney(cvp.break_even_gmv)}
                </span>
              </div>
              <div className="mt-1 text-[12px] text-admin-muted">
                Hiện tại: <strong className="text-admin-ink">{compactMoney(cvp.total_gmv)}</strong>
                {cvp.break_even_gmv > cvp.total_gmv && (
                  <span className="text-rose-600 font-medium"> (Thiếu {compactMoney(cvp.break_even_gmv - cvp.total_gmv)})</span>
                )}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-admin-line-soft text-[11.5px] text-admin-muted">
                Tổng giá trị giao dịch người mua chi trả trên sàn
              </div>
            </div>

            {/* Card 4: Mức độ thiếu hụt / Đạt ngưỡng an toàn */}
            <div className={cx(CARD, 'p-4')}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-admin-muted">
                  Mức Độ Sống Sót Của Sàn
                </span>
                <ShieldAlert
                  size={16}
                  className={survivePercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span
                  className={cx(
                    'text-[24px] font-extrabold tabular-nums tracking-tight',
                    survivePercent >= 100 ? 'text-emerald-700' : 'text-amber-700'
                  )}
                >
                  {survivePercent}%
                </span>
                <span className="text-[12px] font-bold text-admin-muted">
                  {currentOrders}/{bepOrders} đơn
                </span>
              </div>

              {/* Progress bar trực quan */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={cx(
                    'h-full rounded-full transition-all duration-500',
                    survivePercent >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(100, survivePercent)}%` }}
                />
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-admin-line-soft text-[11.5px] text-admin-muted">
                {survivePercent >= 100
                  ? 'Đã vượt ngưỡng an toàn tài chính'
                  : `Đạt ${survivePercent}% ngưỡng để sàn tự nuôi được mình`}
              </div>
            </div>
          </div>

          {/* Dải 4 ô Cơ cấu tiền trên 1 đơn hàng (Bình dân hóa) */}
          <div className="rounded-xl border border-admin-line bg-admin-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-bold text-admin-ink flex items-center gap-1.5">
                <Layers size={15} className="text-admin-brand" />
                Cơ Cấu Tiền Trên 1 Đơn Hàng (AOV: {money(aov)})
              </span>
              <span className="text-[12px] text-admin-muted">
                Định phí cố định: <strong className="text-admin-ink">{money(fixedTotal)}/tháng</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-admin-canvas p-3 border border-admin-line-soft">
                <div className="text-[11.5px] font-bold text-admin-muted">1. Phí sàn thu trên 1 đơn</div>
                <div className="mt-1 text-[17px] font-extrabold text-admin-ink tabular-nums">
                  {money(revPerOrder)}
                </div>
                <div className="text-[11px] text-admin-muted mt-0.5">Tỷ lệ phí dịch vụ {((revPerOrder / aov) * 100).toFixed(0)}%</div>
              </div>
              <div className="rounded-lg bg-admin-canvas p-3 border border-admin-line-soft">
                <div className="text-[11.5px] font-bold text-admin-muted">2. Phí cổng VNPay & thông báo</div>
                <div className="mt-1 text-[17px] font-extrabold text-rose-700 tabular-nums">
                  -{money(vcPerOrder)}
                </div>
                <div className="text-[11px] text-admin-muted mt-0.5">Chi phí trung gian bắt buộc</div>
              </div>
              <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
                <div className="text-[11.5px] font-bold text-emerald-800">3. Lãi thuần sàn giữ lại (= 1 - 2)</div>
                <div className="mt-1 text-[17px] font-extrabold text-emerald-800 tabular-nums">
                  +{money(cmPerOrder)}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Tiền thực đút túi nuôi máy chủ</div>
              </div>
              <div className="rounded-lg bg-admin-canvas p-3 border border-admin-line-soft">
                <div className="text-[11.5px] font-bold text-admin-muted">4. Hiệu suất giữ tiền</div>
                <div className="mt-1 text-[17px] font-extrabold text-blue-700 tabular-nums">
                  {((cmPerOrder / (revPerOrder || 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-admin-muted mt-0.5">Tỷ lệ giữ lại sau khi trả VNPay</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TẦNG 3: CHIA RÕ 2 TAB HÀNH ĐỘNG CHO ADMIN
          Tab 1: 🎮 Kịch Bản & Mô Phỏng Giả Lập
          Tab 2: ⚙️ Cấu Hình Đơn Giá Dịch Vụ
      ======================================================== */}
      <div className="mb-4 flex border-b border-admin-line gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold transition-all border-b-2 -mb-[2px]',
            activeTab === 'simulator'
              ? 'border-admin-brand text-admin-brand bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <SlidersHorizontal size={16} />
          <span> Kịch Bản & Mô Phỏng Giả Lập (What-If Simulator)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold transition-all border-b-2 -mb-[2px]',
            activeTab === 'config'
              ? 'border-admin-brand text-admin-brand bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <Settings size={16} />
          <span> Cấu Hình Đơn Giá Dịch Vụ (Platform Cost Config)</span>
        </button>
      </div>

      {/* --------------------------------------------------------
          NỘI DUNG TAB 1: KỊCH BẢN & MÔ PHỎNG GIẢ LẬP
      -------------------------------------------------------- */}
      {activeTab === 'simulator' && (
        <section className={cx(CARD, 'mb-6 p-5')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-admin-line pb-3">
            <div>
              <h2 className="m-0 text-[16px] font-bold text-admin-ink flex items-center gap-2">
                <Sliders size={18} className="text-admin-brand" />
                Bộ Giả Lập Dòng Tiền & Điểm Thoát Lỗ (What-If Playground)
              </h2>
              <p className="mt-0.5 text-[12.5px] text-admin-muted">
                Điều chỉnh số lượng đơn và mức hoa hồng để thử nghiệm các quyết định kinh doanh trước khi ban hành chính sách.
              </p>
            </div>
            {simulation && (
              <span className="rounded-lg bg-admin-canvas px-3 py-1.5 text-[12px] font-semibold text-admin-muted border border-admin-line">
                AOV chuẩn giả lập: <strong className="text-admin-ink">{money(simulation.simulated_aov)}</strong>
              </span>
            )}
          </div>

          {/* Khối gợi ý nhanh: 3 Câu hỏi tình huống phổ biến của Admin */}
          <div className="mb-5">
            <span className="text-[12px] font-bold uppercase tracking-wider text-admin-muted block mb-2">
              💡 Thử nhanh các tình huống thực chiến:
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => { setSimRatePercent(12); }}
                className="text-left rounded-lg border border-admin-line bg-admin-canvas p-3 transition-all hover:border-admin-brand hover:bg-emerald-50/30 group"
              >
                <div className="text-[12.5px] font-bold text-admin-ink group-hover:text-admin-brand">
                  Tăng hoa hồng lên 12%
                </div>
                <div className="text-[11.5px] text-admin-muted mt-0.5">
                  Cần bán bao nhiêu đơn thì bắt đầu có lãi?
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSimOrders(50); }}
                className="text-left rounded-lg border border-admin-line bg-admin-canvas p-3 transition-all hover:border-admin-brand hover:bg-emerald-50/30 group"
              >
                <div className="text-[12.5px] font-bold text-admin-ink group-hover:text-admin-brand">
                  Tháng tới ế ẩm: chỉ được 50 đơn
                </div>
                <div className="text-[11.5px] text-admin-muted mt-0.5">
                  Sàn sẽ thâm hụt bao nhiêu tiền túi?
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSimOrders(150); setSimRatePercent(8); }}
                className="text-left rounded-lg border border-admin-line bg-admin-canvas p-3 transition-all hover:border-admin-brand hover:bg-emerald-50/30 group"
              >
                <div className="text-[12.5px] font-bold text-admin-ink group-hover:text-admin-brand">
                  Giảm phí còn 8% để hút Seller
                </div>
                <div className="text-[11.5px] text-admin-muted mt-0.5">
                  Bán 150 đơn thì sàn có tự nuôi được mình?
                </div>
              </button>
            </div>
          </div>

          {/* 2 Slider điều khiển */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Slider 1: Sản lượng đơn dự kiến */}
            <div className="rounded-xl border border-admin-line bg-admin-canvas p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="sim-orders-input" className="text-[13px] font-bold text-admin-ink">
                  Sản lượng đơn dự kiến / tháng:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="sim-orders-input"
                    type="number"
                    min="10"
                    max="5000"
                    value={simOrders}
                    onChange={(e) => setSimOrders(Math.max(1, Number(e.target.value) || 0))}
                    className="w-20 rounded-md border border-[#ccc] bg-white px-2 py-1 text-right text-[14px] font-extrabold text-admin-ink outline-none focus:border-admin-brand"
                  />
                  <span className="text-[12px] font-semibold text-admin-muted">đơn</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={simOrders}
                onChange={(e) => setSimOrders(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#ddd] accent-admin-brand"
              />
              <div className="mt-2 flex justify-between text-[11px] text-admin-muted font-medium">
                <span>10 đơn</span>
                <span>500 đơn</span>
                <span>1.000 đơn</span>
                <span>2.000 đơn</span>
              </div>
            </div>

            {/* Slider 2: Tỷ lệ hoa hồng sàn */}
            <div className="rounded-xl border border-admin-line bg-admin-canvas p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="sim-rate-input" className="text-[13px] font-bold text-admin-ink">
                  Tỷ lệ phí dịch vụ sàn thu:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="sim-rate-input"
                    type="number"
                    min="1"
                    max="40"
                    step="0.5"
                    value={simRatePercent}
                    onChange={(e) => setSimRatePercent(Math.max(0.5, Number(e.target.value) || 0))}
                    className="w-16 rounded-md border border-[#ccc] bg-white px-2 py-1 text-right text-[14px] font-extrabold text-admin-ink outline-none focus:border-admin-brand"
                  />
                  <span className="text-[13px] font-bold text-admin-brand">%</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="0.5"
                value={simRatePercent}
                onChange={(e) => setSimRatePercent(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#ddd] accent-admin-brand"
              />
              <div className="mt-2 flex justify-between text-[11px] text-admin-muted font-medium">
                <span>3% (Hạ giá)</span>
                <span>8%</span>
                <span>10% (Gốc)</span>
                <span>15%</span>
                <span>25%</span>
              </div>
            </div>
          </div>

          {/* Thẻ kết quả mô phỏng nhanh */}
          {simulation && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-emerald-50/60 p-3.5 border border-emerald-200">
                <div className="text-[11.5px] font-bold uppercase text-emerald-800">Hoa Hồng Thu Về Dự Phóng</div>
                <div className="mt-1 text-[19px] font-extrabold text-emerald-900 tabular-nums">
                  {money(simulation.projected_revenue)}
                </div>
                <div className="text-[11.5px] text-emerald-700 font-medium">
                  ~{money(Math.round(simulation.projected_revenue / simOrders))}/đơn
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                <div className="text-[11.5px] font-bold uppercase text-slate-700">Chi Phí Duy Trì Sàn Dự Phóng</div>
                <div className="mt-1 text-[19px] font-extrabold text-slate-900 tabular-nums">
                  {money(simulation.projected_total_cost)}
                </div>
                <div className="text-[11.5px] text-slate-600 font-medium">
                  Máy chủ + Phí cổng VNPay
                </div>
              </div>

              <div
                className={cx(
                  'rounded-lg p-3.5 border',
                  simulation.is_profitable
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-rose-50 border-rose-300'
                )}
              >
                <div
                  className={cx(
                    'text-[11.5px] font-bold uppercase',
                    simulation.is_profitable ? 'text-emerald-800' : 'text-rose-800'
                  )}
                >
                  Lợi Nhuận Ròng Dự Phóng
                </div>
                <div
                  className={cx(
                    'mt-1 text-[19px] font-extrabold tabular-nums',
                    simulation.is_profitable ? 'text-emerald-900' : 'text-rose-900'
                  )}
                >
                  {simulation.projected_net_profit < 0
                    ? `- ${money(Math.abs(simulation.projected_net_profit))}`
                    : `+ ${money(simulation.projected_net_profit)}`}
                </div>
                <div
                  className={cx(
                    'text-[11.5px] font-bold',
                    simulation.is_profitable ? 'text-emerald-700' : 'text-rose-700'
                  )}
                >
                  {simulation.is_profitable ? '✓ Sàn vận hành có lãi' : '⚠ Thâm hụt ngân sách'}
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50/60 p-3.5 border border-indigo-200">
                <div className="text-[11.5px] font-bold uppercase text-indigo-800">Điểm Thoát Lỗ Kịch Bản Này</div>
                <div className="mt-1 text-[19px] font-extrabold text-indigo-900 tabular-nums">
                  {simulation.break_even_orders.toLocaleString()} đơn
                </div>
                <div className="text-[11.5px] text-indigo-700 font-medium">
                  GMV hòa vốn: {compactMoney(simulation.break_even_gmv)}
                </div>
              </div>
            </div>
          )}

          {/* Biểu đồ CVP Recharts với nhãn bình dân hóa */}
          {simulation && simulation.chart_series.length > 0 && (
            <div className="rounded-xl border border-admin-line bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="m-0 text-[13.5px] font-bold text-admin-ink flex items-center gap-2">
                  Đồ Thị Hòa Vốn & Thoát Lỗ Thực Tế
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <span className="h-3 w-3 rounded-full bg-[#1a6b1a]" /> Hoa hồng thu về
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-rose-800">
                    <span className="h-3 w-3 rounded-full bg-[#d03b3b]" /> Chi phí duy trì sàn
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-blue-800">
                    <span className="h-0.5 w-3 border-t-2 border-dashed border-[#2a78d6]" /> Tiền cố định VPS + Tên miền
                  </span>
                </div>
              </div>

              <div className="h-[320px] w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulation.chart_series}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f0" />
                    <XAxis
                      dataKey="quantity"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      label={{
                        value: 'Sản lượng đơn hàng bán được trong tháng (đơn)',
                        position: 'insideBottom',
                        offset: -12,
                        fontSize: 12,
                        fill: '#4b5563',
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) => compactMoney(v)}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      label={{
                        value: 'Số tiền (VND)',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 12,
                        fill: '#4b5563',
                      }}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        const labelMap: Record<string, string> = {
                          totalRevenue: 'Hoa hồng thu về',
                          totalCost: 'Chi phí duy trì sàn',
                          fixedCost: 'Tiền cố định VPS + Tên miền',
                          netProfit: 'Lợi nhuận ròng',
                        };
                        return [money(value), labelMap[name] || name];
                      }}
                      labelFormatter={(label) => `Bán được: ${label} đơn`}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    {/* Đường Chi phí cố định */}
                    <Line
                      type="monotone"
                      dataKey="fixedCost"
                      stroke="#2a78d6"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      name="fixedCost"
                    />
                    {/* Đường Tổng Chi Phí */}
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      stroke="#d03b3b"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="totalCost"
                    />
                    {/* Đường Tổng Doanh Thu */}
                    <Line
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="#1a6b1a"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="totalRevenue"
                    />
                    {/* Đường đánh dấu số đơn mô phỏng hiện tại */}
                    <ReferenceLine
                      x={simOrders}
                      stroke="#007700"
                      strokeDasharray="3 3"
                      label={{
                        value: `Kịch bản: ${simOrders} đơn`,
                        fill: '#007700',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                    {/* Đường đánh dấu Điểm hòa vốn */}
                    {simulation.break_even_orders > 0 && simulation.break_even_orders < 3000 && (
                      <ReferenceLine
                        x={simulation.break_even_orders}
                        stroke="#991b1b"
                        strokeDasharray="2 2"
                        label={{
                          value: `Điểm thoát lỗ: ${simulation.break_even_orders} đơn`,
                          fill: '#991b1b',
                          fontSize: 11,
                          position: 'insideTopLeft',
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Khuyến nghị thông minh từ Auto Advisor */}
          {autoAdvisorMessage && (
            <div
              className={cx(
                'mt-4 rounded-xl border p-4 text-[13px]',
                autoAdvisorMessage.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                autoAdvisorMessage.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900',
                autoAdvisorMessage.tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-900'
              )}
            >
              <div className="flex items-center gap-2 font-bold text-[14px]">
                <Info size={17} />
                <span>Gợi Ý Cân Đối Chi Phí: {autoAdvisorMessage.title}</span>
              </div>
              <p className="mb-0 mt-1.5 leading-relaxed">{autoAdvisorMessage.desc}</p>
            </div>
          )}
        </section>
      )}

      {/* --------------------------------------------------------
          NỘI DUNG TAB 2: CẤU HÌNH ĐƠN GIÁ DỊCH VỤ
      -------------------------------------------------------- */}
      {activeTab === 'config' && formConfig && (
        <form onSubmit={handleSaveConfig} className={cx(CARD, 'p-5')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-line pb-3">
            <div>
              <h2 className="m-0 text-[16px] font-bold text-admin-ink flex items-center gap-2">
                <Server size={18} className="text-admin-brand" />
                Cấu Hình Đơn Giá Chi Phí Vận Hành & Chính Sách Thu Phí
              </h2>
              <p className="mt-0.5 text-[12.5px] text-admin-muted">
                💡 <strong className="text-stone-700">Hướng dẫn:</strong> Chỉ chỉnh sửa các thông số này khi nhà cung cấp máy chủ, Cloudinary, hoặc cổng thanh toán VNPay tăng giá.
                {config?.updated_at && (
                  <span className="ml-1 text-admin-muted font-normal">
                    (Lần lưu gần nhất: {new Date(config.updated_at).toLocaleString('vi-VN')})
                  </span>
                )}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className={cx(BTN_PRIMARY, 'flex items-center gap-1.5 px-4 py-2')}
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Cột 1: Chi phí cố định hàng tháng */}
            <div className="space-y-4 rounded-xl border border-admin-line bg-admin-canvas p-4">
              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink flex items-center gap-2 pb-2 border-b border-admin-line-soft">
                <Server size={15} className="text-blue-600" />
                Định Phí Hàng Tháng (Nuôi Hạ Tầng)
              </h3>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  VPS / Cloud Server cơ bản (đ/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={formConfig.fixed_costs.vps_base_monthly}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      fixed_costs: {
                        ...formConfig.fixed_costs,
                        vps_base_monthly: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Frontend Hosting / CDN (đ/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={formConfig.fixed_costs.frontend_hosting}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      fixed_costs: {
                        ...formConfig.fixed_costs,
                        frontend_hosting: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Tên miền & DNS (đ/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formConfig.fixed_costs.domain_monthly}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      fixed_costs: {
                        ...formConfig.fixed_costs,
                        domain_monthly: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Bảo mật SSL & WAF (đ/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formConfig.fixed_costs.security_ssl}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      fixed_costs: {
                        ...formConfig.fixed_costs,
                        security_ssl: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>
            </div>

            {/* Cột 2: Đơn giá biến phí & Hạ tầng theo tải */}
            <div className="space-y-4 rounded-xl border border-admin-line bg-admin-canvas p-4">
              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink flex items-center gap-2 pb-2 border-b border-admin-line-soft">
                <Database size={15} className="text-amber-600" />
                Biến Phí Theo Đơn & Quy Mô
              </h3>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Phí cổng thanh toán VNPAY (%):
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="0.1"
                    step="0.001"
                    value={formConfig.unit_costs.payment_gateway_rate}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        unit_costs: {
                          ...formConfig.unit_costs,
                          payment_gateway_rate: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                  />
                  <span className="absolute right-3 text-[12px] text-admin-muted">
                    = {(formConfig.unit_costs.payment_gateway_rate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Phí thông báo SMS / Email (đ/đơn):
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formConfig.unit_costs.notification_per_order}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      unit_costs: {
                        ...formConfig.unit_costs,
                        notification_per_order: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Lưu trữ Artwork Cloudinary (đ/GB/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formConfig.unit_costs.storage_per_gb}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      unit_costs: {
                        ...formConfig.unit_costs,
                        storage_per_gb: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Chi phí AI phân tích xu hướng (đ/lượt):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formConfig.unit_costs.ai_per_request}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      unit_costs: {
                        ...formConfig.unit_costs,
                        ai_per_request: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Tải DB trên mỗi Người Bán (đ/shop/tháng):
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formConfig.unit_costs.db_per_active_seller}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      unit_costs: {
                        ...formConfig.unit_costs,
                        db_per_active_seller: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>
            </div>

            {/* Cột 3: Chính sách sàn & Hạn mức miễn phí */}
            <div className="space-y-4 rounded-xl border border-admin-line bg-admin-canvas p-4">
              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink flex items-center gap-2 pb-2 border-b border-admin-line-soft">
                <Percent size={15} className="text-emerald-700" />
                Chính Sách Thu Phí & Hạn Mức
              </h3>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Tỷ lệ hoa hồng mặc định sàn:
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={formConfig.policies.default_commission_rate}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        policies: {
                          ...formConfig.policies,
                          default_commission_rate: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                  />
                  <span className="absolute right-3 text-[12px] font-bold text-admin-brand">
                    = {(formConfig.policies.default_commission_rate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Mức phí sàn tối thiểu / đơn hàng (đ):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formConfig.policies.min_order_fee}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      policies: {
                        ...formConfig.policies,
                        min_order_fee: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Dung lượng lưu trữ miễn phí / shop (GB):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={formConfig.seller_quotas.free_storage_gb}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      seller_quotas: {
                        ...formConfig.seller_quotas,
                        free_storage_gb: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Lượt AI xu hướng miễn phí / shop:
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formConfig.seller_quotas.free_ai_requests}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      seller_quotas: {
                        ...formConfig.seller_quotas,
                        free_ai_requests: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-admin-muted mb-1">
                  Tỷ lệ phụ thu vượt hạn mức (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formConfig.seller_quotas.overage_markup_rate}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      seller_quotas: {
                        ...formConfig.seller_quotas,
                        overage_markup_rate: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-[#ccc] bg-white px-3 py-1.5 text-[13px] font-bold text-admin-ink outline-none focus:border-admin-brand"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminFinanceSimulationPage;
