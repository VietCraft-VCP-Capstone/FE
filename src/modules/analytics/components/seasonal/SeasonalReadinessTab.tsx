import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { count, money } from '../../../../shared/utils/format';
import { fullDate } from '../../format';

interface SeasonalReadinessTabProps {
  topProduct: any;
  activeCamp: SeasonalCampaign;
}

export function SeasonalReadinessTab({
  topProduct,
  activeCamp,
}: SeasonalReadinessTabProps) {
  const campName = activeCamp.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Chiến dịch';

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Cột trái (7 Cột): Thông tin sản phẩm + Vòng tròn 1/4 + Checklist */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-span-7">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 overflow-hidden border border-stone-200">
            {topProduct?.images?.[0] ? (
              <img
                src={topProduct.images[0]}
                alt={topProduct.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <ShoppingBag size={32} className="text-amber-700/60" />
            )}
          </div>

          <div className="flex-1">
            <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug">
              {topProduct?.title || 'Sản phẩm chủ lực trong gian hàng'}
            </h4>
            <p className="mb-3 mt-1 text-xs text-stone-500">
              Đang có doanh số tốt nhất: {count(topProduct?.orders || 12)} đơn · {money(topProduct?.revenue_vnd || 3570000)}
            </p>

            <div className="flex items-center gap-4">
              {/* Vòng tròn 1/4 SVG */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-stone-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#007700]"
                    strokeDasharray="25, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-stone-800 font-jakarta">1/4</span>
              </div>

              {/* 4 Mục trạng thái */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                  Ảnh concept theo chủ đề {campName}
                </div>
                <div className="flex items-center gap-1.5 text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                  Từ khoá ngách đón tìm kiếm sớm
                </div>
                <div className="flex items-center gap-1.5 text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                  Đóng gói combo set quà tặng
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Tiêu đề &amp; mô tả đã chuẩn SEO sàn
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải (5 Cột): Khối Việc nên làm tiếp */}
        <div className="flex flex-col justify-center rounded-2xl border border-[#007700]/20 bg-[#EAF0E2]/60 p-5 lg:col-span-5 space-y-2">
          <span className="text-xs font-bold text-[#005B00] uppercase tracking-wider">Việc nên làm tiếp</span>
          <p className="mb-0 text-xs text-stone-800 leading-relaxed">
            Chụp lại ảnh concept cho mùa <strong>{campName}</strong> và thêm từ khoá ngách vào mô tả để sàn index kịp trước{' '}
            <strong>{activeCamp?.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'tuần sau'}</strong>.
          </p>
          <Link
            to="/seller/products"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#007700] hover:underline"
          >
            Mở Quản lý kho hàng để cập nhật ảnh <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
