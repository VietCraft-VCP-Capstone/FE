import { useState, useEffect } from 'react';
import { Drawer } from 'antd';
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  HelpCircle,
  Package,
  ShieldAlert,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import type { PotentialProfile } from '../../types';
import { money } from '../../../../shared/utils/format';
import { Chip } from '../ui';
import { TrialPlanCard } from './TrialPlanCard';

interface PotentialProfileDrawerProps {
  profile: PotentialProfile | null;
  open: boolean;
  onClose: () => void;
}

const LAYER_ICONS = {
  demand: <TrendingUp size={16} />,
  repeatability: <Clock size={16} />,
  competition: <Users size={16} />,
  profitability: <DollarSign size={16} />,
  capacity: <Package size={16} />,
};

export function PotentialProfileDrawer({ profile, open, onClose }: PotentialProfileDrawerProps) {
  if (!profile) return null;

  // State cho bộ tính điểm hòa vốn tương tác (interactive break-even calculator)
  const [retailPrice, setRetailPrice] = useState<number>(profile.break_even.retail_price || 200000);
  const [baseCost, setBaseCost] = useState<number>(profile.break_even.base_cost || 80000);
  const [testBudget, setTestBudget] = useState<number>(profile.break_even.fixed_test_budget || 500000);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    demand: true,
    repeatability: true,
    competition: true,
    profitability: true,
    capacity: true,
  });

  // Reset inputs khi đổi profile
  useEffect(() => {
    if (profile?.break_even) {
      setRetailPrice(profile.break_even.retail_price);
      setBaseCost(profile.break_even.base_cost);
      setTestBudget(profile.break_even.fixed_test_budget);
    }
  }, [profile]);

  // Tính toán thời gian thực theo công thức SRS 3.10
  const platformFee = Math.round(retailPrice * 0.10); // Phí sàn 10%
  const grossMargin = retailPrice - baseCost - platformFee;
  const estimatedCpa = Math.round(retailPrice * 0.15); // Chi phí ads ước tính 15%
  const netMargin = grossMargin - estimatedCpa;
  const netMarginPct = retailPrice > 0 ? Math.round((netMargin / retailPrice) * 100) : 0;
  const breakEvenUnits = netMargin > 0 ? Math.ceil(testBudget / netMargin) : 999;
  const isViable = netMargin > 0;

  const toggleLayer = (layerKey: string) => {
    setExpandedLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const getStatusBadge = (status: 'dat' | 'chua_chac' | 'khong_dat') => {
    if (status === 'dat') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#EAF0E2] px-2 py-0.5 text-xs font-semibold text-[#005B00]">
          <CheckCircle2 size={13} /> Đạt
        </span>
      );
    }
    if (status === 'chua_chac') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
          <HelpCircle size={13} /> Chưa chắc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
        <XCircle size={13} /> Không đạt
      </span>
    );
  };

  return (
    <Drawer
      title={
        <div className="flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2">
            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
              {profile.category_name}
            </span>
            <Chip tone={profile.verdict === 'dat' ? 'good' : profile.verdict === 'chua_chac' ? 'warn' : 'bad'}>
              {profile.verdict_label}
            </Chip>
            <span className="text-xs font-semibold text-stone-500">
              {profile.signal_label}
            </span>
          </div>
          <h2 className="m-0 text-base font-bold text-stone-900 leading-snug">
            Hồ sơ tiềm năng 5 lớp: {profile.product_name}
          </h2>
        </div>
      }
      placement="right"
      width={720}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '16px 20px', backgroundColor: '#fafaf9' } }}
    >
      <div className="space-y-4">
        {/* Banner triết lý: Người bán tự kiểm chứng */}
        <div className="rounded border border-stone-200 bg-white p-3 text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-900">Nguyên tắc minh bạch dữ liệu: </strong>
          Hệ thống không khẳng định sản phẩm chắc chắn bán chạy. Thay vào đó, mỗi gợi ý được mở bung thành 5 lớp bằng chứng độc lập để bạn tự đánh giá, kèm mức độ rủi ro và kế hoạch thử nhỏ có điểm dừng lỗ.
        </div>

        {/* 5 Lớp Bằng Chứng Độc Lập */}
        <div className="space-y-3">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-500">
            Năm Lớp Bằng Chứng Độc Lập (Seller Tự Kiểm Tra)
          </h3>

          {Object.entries(profile.layers).map(([key, layer]) => {
            const isExpanded = expandedLayers[key];
            const icon = LAYER_ICONS[key as keyof typeof LAYER_ICONS] || <HelpCircle size={16} />;

            return (
              <div key={key} className="rounded-md border border-stone-200 bg-white overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleLayer(key)}
                  className="flex w-full items-center justify-between p-3.5 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[#007700] shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">{layer.name}</span>
                        {getStatusBadge(layer.status)}
                      </div>
                      <span className="block mt-0.5 text-[11.5px] text-stone-500 truncate">
                        {layer.question}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-stone-400 pl-2 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-3.5 text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-stone-700">Tuyên bố hệ thống: </span>
                      <span className="text-stone-900">{layer.claim}</span>
                    </div>
                    <div className="rounded bg-white p-2.5 border border-stone-200">
                      <span className="block font-semibold text-stone-700 mb-1">Bằng chứng đối soát:</span>
                      <p className="mb-0 text-stone-600 leading-relaxed text-[11.5px]">
                        {layer.evidence}
                      </p>
                    </div>
                    {(layer.metric_value != null || layer.target_value != null) && (
                      <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-1">
                        {layer.metric_value != null && (
                          <span>Chỉ số đo được: <strong className="text-stone-800">{String(layer.metric_value)}</strong></span>
                        )}
                        {layer.target_value != null && (
                          <span>Ngưỡng chuẩn: <strong className="text-stone-800">{String(layer.target_value)}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bộ Tính Điểm Hòa Vốn Tương Tác */}
        <div className="rounded-md border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calculator className="text-[#007700]" size={16} />
              <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-900">
                Tự Tính Điểm Hòa Vốn & Biên Lợi Nhuận Thực Tế
              </h4>
            </div>
            <Chip tone={isViable ? 'good' : 'bad'}>
              {isViable ? 'Có lãi sau chi phí' : 'Không khả thi (Lỗ)'}
            </Chip>
          </div>

          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            Bạn có thể chỉnh sửa các con số bên dưới để xem số đơn tối thiểu cần bán để hòa vốn với chi phí của riêng shop.
          </p>

          {/* Ô nhập thông số */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Giá bán lẻ dự kiến (VND)
              </label>
              <input
                type="number"
                step="5000"
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value) || 0)}
                className="w-full rounded border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 font-semibold focus:border-[#007700] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Giá vốn phôi/sản xuất (VND)
              </label>
              <input
                type="number"
                step="5000"
                value={baseCost}
                onChange={(e) => setBaseCost(Number(e.target.value) || 0)}
                className="w-full rounded border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 font-semibold focus:border-[#007700] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Ngân sách test ads/mẫu (VND)
              </label>
              <input
                type="number"
                step="50000"
                value={testBudget}
                onChange={(e) => setTestBudget(Number(e.target.value) || 0)}
                className="w-full rounded border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 font-semibold focus:border-[#007700] focus:outline-none"
              />
            </div>
          </div>

          {/* Kết quả tính toán */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div className="rounded bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-[11px] text-stone-500">Phí sàn (10%)</span>
              <div className="mt-0.5 font-bold text-stone-800">{money(platformFee)}</div>
            </div>
            <div className="rounded bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-[11px] text-stone-500">CPA dự kiến (~15%)</span>
              <div className="mt-0.5 font-bold text-stone-800">{money(estimatedCpa)}</div>
            </div>
            <div className="rounded bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-[11px] text-stone-500">Lãi ròng / sản phẩm</span>
              <div className={`mt-0.5 font-bold ${netMargin > 0 ? 'text-[#005B00]' : 'text-red-700'}`}>
                {money(netMargin)} ({netMarginPct}%)
              </div>
            </div>
            <div className="rounded bg-emerald-50/70 p-2.5 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800">Cần bán để hòa vốn</span>
              <div className="mt-0.5 font-bold text-[#005B00]">
                {netMargin > 0 ? `${breakEvenUnits} sản phẩm` : 'Vô nghiệm (Lỗ)'}
              </div>
            </div>
          </div>
        </div>

        {/* Hộp Chống Tuyên Bố: Lý do gợi ý này có thể SAI */}
        <div className="rounded-md border border-amber-300 bg-amber-50/60 p-4">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
            <ShieldAlert size={16} className="text-amber-700" />
            <span>LÝ DO GỢI Ý NÀY CÓ THỂ SAI (ANTI-EVIDENCE)</span>
          </div>
          <p className="mt-1 text-[11.5px] text-amber-800 leading-relaxed">
            Trước khi quyết định, hãy cân nhắc kỹ các rủi ro phản biện sau:
          </p>
          <ul className="mb-0 mt-2 list-disc pl-4 text-xs text-amber-900 space-y-1.5">
            {profile.anti_evidence.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">{reason}</li>
            ))}
          </ul>
        </div>

        {/* Kế hoạch thử nghiệm 3 nấc */}
        <TrialPlanCard trialPlan={profile.trial_plan} />
      </div>
    </Drawer>
  );
}
