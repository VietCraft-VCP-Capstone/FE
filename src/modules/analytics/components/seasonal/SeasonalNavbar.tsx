import React from 'react';
import {
  BarChart3,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export interface NavTabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  subtitle?: string;
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
      label: 'Tổng quan',
      icon: <LayoutDashboard size={15} />,
    },
    {
      key: 'act1',
      label: 'Ý tưởng',
      icon: <Sparkles size={15} />,
      badge: ideasCount > 0 ? ideasCount : undefined,
    },
    {
      key: 'act2',
      label: 'Áp dụng',
      icon: <ShoppingBag size={15} />,
    },
    {
      key: 'act3',
      label: 'Thành quả',
      icon: <BarChart3 size={15} />,
    },
  ];

  return (
    <div
      className={`sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md py-2.5 border-b border-stone-200/90 -mx-4 sm:-mx-6 px-4 sm:px-6 transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Dải nút chuyển tab câu chuyện 3 hồi mượt mà, KHÔNG BỊ CẮT BA CHẤM */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 w-full">
          {tabs.map(tab => {
            const isActive =
              activeTab === tab.key ||
              (tab.key === 'act1' && (activeTab === 'traits' || activeTab === 'potential')) ||
              (tab.key === 'act2' && (activeTab === 'readiness' || activeTab === 'trial' || activeTab === 'timeline')) ||
              (tab.key === 'act3' && activeTab === 'performance');

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#007700] text-white shadow-sm shadow-emerald-900/15 ring-1 ring-[#007700]'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/90 shadow-2xs'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-stone-500'}>
                  {tab.icon}
                </span>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
