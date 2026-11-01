import React from 'react';
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export interface NavTabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface Props {
  activeTab: string;
  onSelectTab: (key: string) => void;
  ideasCount?: number;
  className?: string;
}

export const SeasonalNavbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  ideasCount = 0,
  className = '',
}) => {
  const tabs: NavTabItem[] = [
    {
      key: 'hub',
      label: '1. Tổng quan kế hoạch',
      icon: <LayoutDashboard size={15} />,
    },
    {
      key: 'traits',
      label: '2. Đặc điểm sức mua',
      icon: <BarChart3 size={15} />,
    },
    {
      key: 'potential',
      label: '3. Nên bán gì & Hồ sơ 5 lớp',
      icon: <Sparkles size={15} />,
      badge: ideasCount > 0 ? ideasCount : undefined,
    },
    {
      key: 'timeline',
      label: '4. Lộ trình việc & Hạn chốt',
      icon: <Clock size={15} />,
    },
    {
      key: 'readiness',
      label: '5. Sản phẩm shop',
      icon: <ShoppingBag size={15} />,
    },
    {
      key: 'trial',
      label: '6. Thử nhỏ & Dừng lỗ',
      icon: <ShieldAlert size={15} />,
    },
  ];

  return (
    <div
      className={`sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md py-2.5 border-b border-stone-200/90 -mx-4 sm:-mx-6 px-4 sm:px-6 transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Dải nút chuyển tab có thể cuộn ngang mượt mà, KHÔNG BAO GIỜ bị cắt thành dấu ba chấm (...) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 w-full">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#007700] text-white shadow-sm shadow-emerald-900/15 ring-1 ring-[#007700]'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/90 shadow-2xs'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-stone-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
