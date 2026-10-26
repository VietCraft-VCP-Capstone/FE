import { Tooltip } from 'antd';
import { Check, Info } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';

export function HealthRoadmap({ data: _data }: { data: ListingHealth }) {
  const steps = [
    {
      time: 'Thứ 2',
      step: 'B1',
      title: 'Quét & chấm điểm',
      desc: 'Đã hoàn tất quét 132 sản phẩm trên shop',
      status: 'done',
    },
    {
      time: 'Thứ 3–4',
      step: 'B2',
      title: 'AI kiểm toán',
      desc: 'Phát hiện 14 điểm nghẽn trên 6 sản phẩm',
      status: 'done',
    },
    {
      time: 'Hôm nay',
      step: 'B3',
      title: 'Khắc phục lỗi',
      desc: 'Ưu tiên xử lý 2 tin đăng bị tạm ẩn',
      status: 'active',
    },
    {
      time: 'Chủ nhật',
      step: 'B4',
      title: 'Đánh giá lại',
      desc: 'Tự động chấm lại toàn bộ gian hàng & báo cáo',
      status: 'upcoming',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Lộ trình cải thiện tuần 42
          </span>
          <Tooltip title="Quy trình 4 bước tối ưu chất lượng tin đăng do AI đề xuất theo tuần">
            <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
          </Tooltip>
        </div>
        <span className="font-mono text-[11px] text-stone-400">2 / 4 hoàn thành</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-stone-100 rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        {steps.map(item => {
          const isActive = item.status === 'active';
          const isDone = item.status === 'done';

          return (
            <Tooltip key={item.step} title={item.desc} placement="top">
              <div
                className={`relative flex flex-col justify-between p-3 transition-all cursor-pointer ${
                  isActive ? 'bg-stone-50/80' : 'bg-white hover:bg-stone-50/40'
                }`}
              >
                {isActive && <span className="absolute left-0 right-0 top-0 h-0.5 bg-[#111111]" />}

                <div className="flex items-center justify-between text-[11px]">
                  <span className={isActive ? 'font-bold text-[#111111]' : 'font-medium text-stone-500'}>
                    {item.time}
                  </span>
                  <span className="font-mono text-stone-400 text-[10px]">{item.step}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {isDone && (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[#007700]">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}

                  {isActive && (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[#007700] bg-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#007700]" />
                    </div>
                  )}

                  {!isDone && !isActive && (
                    <div className="h-4 w-4 shrink-0 rounded-full border border-stone-200 bg-white" />
                  )}

                  <div className="min-w-0">
                    <div className={`text-xs truncate ${isActive ? 'font-bold text-[#111111]' : 'font-semibold text-stone-700'}`}>
                      {item.title}
                    </div>
                  </div>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
