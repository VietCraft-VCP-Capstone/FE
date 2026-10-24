import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Shirt,
  Smartphone,
  Search,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { vnd } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { INSIGHTS_ROOT } from '../../nav';

type TabKey = 'attention' | 'healthy' | 'suppressed';

export function ListingDiagnosticCard({
  data,
  productId,
}: {
  data: ListingHealth;
  productId: string;
}) {
  const [tab, setTab] = useState<TabKey>('attention');
  const [expandedId, setExpandedId] = useState<string>('current');

  const currentScore = data.score ?? 79.7;
  const potentialScore = Math.min(96, Math.round(currentScore + 16.3));
  const priceVal = data.breakdown.find(f => f.key === 'price')?.value ?? 157500;
  const refPrice = data.breakdown.find(f => f.key === 'price')?.reference?.price ?? 199000;

  const tabs = [
    {
      key: 'attention',
      label: 'Cần chú ý',
      count: 6,
      badgeClass: 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D2D4]',
      desc: 'Sản phẩm có điểm số thấp hoặc cần hành động gấp',
    },
    {
      key: 'healthy',
      label: 'Đạt chuẩn',
      count: 124,
      badgeClass: 'bg-[#EDF3EC] text-[#346538] border border-[#D5E6D4]',
      desc: 'Sản phẩm đạt từ 80 điểm trở lên chuẩn thuật toán sàn',
    },
    {
      key: 'suppressed',
      label: 'Bị giới hạn',
      count: 2,
      badgeClass: 'bg-[#FBF3DB] text-[#956400] border border-[#F2E4B8]',
      desc: 'Sản phẩm bị tạm ẩn hoặc hạn chế hiển thị tìm kiếm tự nhiên',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Editorial Filter Tabs with Tooltips */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-6">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <Tooltip key={t.key} title={t.desc} placement="top">
                <button
                  type="button"
                  onClick={() => setTab(t.key as TabKey)}
                  className={`relative flex items-center gap-2 pb-2 text-xs font-semibold transition-all ${
                    isActive ? 'text-[#111111] font-bold' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${t.badgeClass}`}>
                    {t.count}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-[#111111]" />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <Link
          to={`${INSIGHTS_ROOT}/listings`}
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-[#111111]"
        >
          <Search size={12} className="text-stone-400" />
          <span>Tất cả sản phẩm</span>
        </Link>
      </div>

      {/* Unified Diagnostic Table Container */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 items-center px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50/70 border-b border-stone-200">
          <div className="col-span-5">Sản phẩm / SKU</div>
          <div className="col-span-2 text-center">Điểm số</div>
          <div className="col-span-2 text-right">Lượt xem (30n)</div>
          <div className="col-span-1 text-right">Tỉ lệ mua</div>
          <div className="col-span-2 text-right">Vấn đề chính</div>
        </div>

        {/* Row 1 (Collapsed): Lotus Pond Phone Case */}
        <div className="border-b border-stone-100 transition-colors hover:bg-stone-50/50">
          <div
            onClick={() => setExpandedId(expandedId === 'vc-0044' ? '' : 'vc-0044')}
            className="flex sm:grid sm:grid-cols-12 cursor-pointer items-center p-3.5 sm:px-5"
          >
            <div className="flex items-center gap-3 flex-1 sm:col-span-5 min-w-0 pr-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-500">
                <Smartphone size={14} />
              </div>
              <div className="min-w-0 truncate">
                <div className="truncate text-xs font-semibold text-stone-900">
                  Lotus Pond Phone Case
                </div>
                <div className="font-mono text-[10px] text-stone-400">VC-CAS-0044</div>
              </div>
            </div>

            <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
              <Tooltip title="Điểm chất lượng dưới 50 cần khắc phục file thiết kế">
                <span className="font-mono text-xs font-bold text-[#9F2F2D] bg-[#FDEBEC] px-2 py-0.5 rounded cursor-help">
                  31 / 100
                </span>
              </Tooltip>
            </div>

            <div className="hidden sm:block sm:col-span-2 text-right font-mono text-xs font-medium text-stone-700">
              410
            </div>

            <div className="hidden sm:block sm:col-span-1 text-right font-mono text-xs font-medium text-stone-700">
              0.5%
            </div>

            <div className="flex items-center justify-end gap-2 sm:col-span-2 text-right">
              <Tooltip title="File in độ phân giải không đạt 300 DPI">
                <span className="text-[11px] font-medium text-[#9F2F2D] truncate cursor-help">
                  Lỗi vùng in file
                </span>
              </Tooltip>
              <span className="text-stone-400">
                {expandedId === 'vc-0044' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 (EXPANDED): Current Evaluated Listing */}
        <div className="bg-white">
          <div
            onClick={() => setExpandedId(expandedId === 'current' ? '' : 'current')}
            className="flex sm:grid sm:grid-cols-12 cursor-pointer items-center p-3.5 sm:px-5 bg-stone-50/80 border-b border-stone-200"
          >
            <div className="flex items-center gap-3 flex-1 sm:col-span-5 min-w-0 pr-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#FBF3DB] text-[#956400]">
                <Shirt size={14} />
              </div>
              <div className="min-w-0 truncate">
                <div className="truncate text-xs font-bold text-[#111111]">
                  {data.title || 'Áo khoác lông cừu mùa đông'}
                </div>
                <div className="font-mono text-[10px] text-stone-400">VC-TEE-0277 · Đang kiểm toán</div>
              </div>
            </div>

            <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
              <Tooltip title="Điểm listing hiện tại: 79.7/100, tiềm năng đạt 96/100">
                <span className="font-mono text-xs font-bold text-[#956400] bg-[#FBF3DB] px-2 py-0.5 rounded cursor-help">
                  {currentScore} / 100
                </span>
              </Tooltip>
            </div>

            <div className="hidden sm:block sm:col-span-2 text-right font-mono text-xs font-medium text-stone-700">
              120
            </div>

            <div className="hidden sm:block sm:col-span-1 text-right font-mono text-xs font-medium text-stone-700">
              0.0%
            </div>

            <div className="flex items-center justify-end gap-2 sm:col-span-2 text-right">
              <span className="text-[11px] font-semibold text-[#9F2F2D] truncate">
                Trùng lặp SKU
              </span>
              <span className="text-stone-400">
                {expandedId === 'current' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>
          </div>

          {/* Seamless Inspection Panel: Zero nested cards! */}
          {expandedId === 'current' && (
            <div className="bg-white">
              {/* Warning Notice Banner with Tooltip */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FBF3DB] border-b border-[#F2E4B8] px-5 py-2.5 text-xs text-[#784D06]">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={14} className="shrink-0 text-[#956400]" />
                  <span className="font-medium text-xs">
                    <strong>Bị giới hạn hiển thị:</strong> Tin đăng tạm ẩn do trùng lặp tiêu đề/ảnh.
                  </span>
                  <Tooltip title="Thuật toán sàn tự động giới hạn phân phối khi phát hiện hình ảnh hoặc tiêu đề giống sản phẩm có sẵn. Khắc phục 2 điểm nghẽn để mở lại tìm kiếm.">
                    <Info size={12} className="text-[#956400]/70 hover:text-[#956400] cursor-help shrink-0" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-[#956400] pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#F2E4B8] sm:pl-3">
                  <span>120 xem</span>
                  <span>·</span>
                  <span>0 đơn</span>
                  <span>·</span>
                  <span className="font-bold">{currentScore}/100</span>
                </div>
              </div>

              {/* Two Editorial Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-100">
                {/* Column 1: Vấn đề phát hiện & Thông số kỹ thuật */}
                <div className="p-5 space-y-4">
                  {/* Issues */}
                  <div>
                    <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Vấn đề phát hiện (2 điểm nghẽn)
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#9F2F2D] shrink-0" />
                          <span className="font-semibold text-[#111111] truncate">
                            Trùng lặp với mã VC-TEE-0275
                          </span>
                          <Tooltip title="Cần đổi tiêu đề hoặc thay ảnh đại diện sản phẩm">
                            <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help shrink-0" />
                          </Tooltip>
                        </div>
                        <span className="rounded bg-[#FDEBEC] px-2 py-0.5 text-[10px] font-bold text-[#9F2F2D] shrink-0">
                          Tạm ẩn
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs border-t border-stone-100 pt-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
                          <span className="font-semibold text-[#111111] truncate">
                            Không phát sinh đơn trong 60 ngày
                          </span>
                          <Tooltip title="Cần tối ưu giá bán hoặc làm mới mô tả chi tiết">
                            <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help shrink-0" />
                          </Tooltip>
                        </div>
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 shrink-0">
                          -6 điểm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Thông số listing
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">28/08/2026</span>
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[11px]">Ngành hàng</span>
                        <span className="font-medium text-stone-800 text-[11px]">Thời trang nam</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[11px]">Giá niêm yết</span>
                        <span className="font-mono font-bold text-[#111111] text-[11px]">{vnd(priceVal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[11px]">Giá trung vị sàn</span>
                        <span className="font-mono font-medium text-stone-600 text-[11px]">{vnd(refPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[11px]">Độ phân giải in</span>
                        <span className="font-mono text-[11px] font-semibold text-stone-800">300 DPI</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[11px]">Ảnh chụp mockup</span>
                        <span className="font-medium text-stone-800 text-[11px]">3 / 5 ảnh</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: AI Growth Projection & Actions */}
                <div className="p-5 flex flex-col justify-between space-y-4 bg-stone-50/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#346538]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]">
                          Dự báo sau tối ưu
                        </span>
                      </div>
                      <Tooltip title="Mức tăng trưởng kỳ vọng sau khi gỡ bỏ điểm nghẽn">
                        <span className="cursor-help rounded bg-[#EDF3EC] px-2 py-0.5 text-[10px] font-bold text-[#346538] border border-[#D5E6D4]">
                          +38% tiềm năng
                        </span>
                      </Tooltip>
                    </div>

                    {/* 3 Metric Jump Strip */}
                    <div className="grid grid-cols-3 divide-x divide-stone-200 rounded-lg border border-stone-200 bg-white p-2.5 text-center">
                      <div className="px-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                          Điểm số
                        </span>
                        <div className="mt-0.5 font-jakarta text-sm font-black text-[#346538]">
                          {currentScore} → {potentialScore}
                        </div>
                        <span className="text-[10px] font-medium text-[#346538]">Mức Tốt</span>
                      </div>

                      <div className="px-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                          Chốt đơn
                        </span>
                        <div className="mt-0.5 font-jakarta text-sm font-black text-[#111111]">
                          0% → 2.8%
                        </div>
                        <span className="text-[10px] font-medium text-stone-500">+4-6 đơn/th</span>
                      </div>

                      <div className="px-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                          SEO Sàn
                        </span>
                        <div className="mt-0.5 font-jakarta text-sm font-black text-[#111111]">
                          Trang 1
                        </div>
                        <span className="text-[10px] font-medium text-[#956400]">Boost 14 ngày</span>
                      </div>
                    </div>

                    <p className="m-0 text-[11px] text-stone-400 italic">
                      ✦ Tự động chấm lại điểm sau 12h lưu thay đổi.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <Link
                      to={editLink(productId)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#111111] py-2.5 text-xs font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98]"
                    >
                      <Sparkles size={13} className="text-amber-300" />
                      <span>Khắc phục &amp; duyệt lại</span>
                    </Link>

                    <Link
                      to={editLink(productId)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                    >
                      <span>Mở trình soạn thảo</span>
                      <ExternalLink size={12} className="text-stone-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
