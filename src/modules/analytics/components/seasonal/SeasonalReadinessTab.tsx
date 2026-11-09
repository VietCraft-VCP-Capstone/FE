import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  PackageCheck,
  PlusCircle,
  Tag,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { money } from '../../../../shared/utils/format';
import { fullDate } from '../../format';

interface SeasonalReadinessTabProps {
  matchingProducts: any[];
  allShopProducts: any[];
  activeCamp: SeasonalCampaign;
}

export function SeasonalReadinessTab({
  matchingProducts = [],
  allShopProducts = [],
  activeCamp,
}: SeasonalReadinessTabProps) {
  const campName = activeCamp.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Chiến dịch';
  const hasMatching = matchingProducts.length > 0;

  return (
    <div className="space-y-6 pt-1">
      {/* 1. Header giải thích mục đích rõ ràng */}
      <div className="border-b border-stone-200/80 pb-4">
        <h3 className="text-base font-bold text-stone-900">
          Rà soát sản phẩm &amp; Độ sẵn sàng của shop đón dịp {campName}
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Kiểm tra các tiêu chuẩn hình ảnh, từ khóa và đóng gói quà tặng cho các sản phẩm trong gian hàng để chuẩn bị ra hàng đón cao điểm.
        </p>
      </div>

      {/* 2. TRƯỜNG HỢP A: SHOP CÓ SẢN PHẨM KHỚP VỚI DỊP */}
      {hasMatching ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>
              Tìm thấy <strong>{matchingProducts.length}</strong> sản phẩm trong shop phù hợp với dịp <strong>{campName}</strong>. Hãy hoàn thiện các tiêu chí còn thiếu bên dưới.
            </span>
          </div>

          <div className="space-y-4">
            {matchingProducts.map((prod, idx) => {
              const checklist = [
                {
                  label: `Ảnh concept theo chủ đề ${campName}`,
                  isDone: Boolean(prod?.images?.length && prod.images.length >= 2),
                },
                {
                  label: 'Từ khoá ngách đón tìm kiếm sớm',
                  isDone: Boolean((prod?.tags?.length ?? 0) > 0 || (prod?.categories?.length ?? 0) > 0),
                },
                {
                  label: 'Đóng gói combo set quà tặng',
                  isDone: Boolean(/set|combo|hộp quà|quà tặng/i.test(prod?.title || '')),
                },
                {
                  label: 'Tiêu đề & mô tả chuẩn SEO sàn',
                  isDone: Boolean((prod?.title || '').length >= 30),
                },
              ];
              const doneCount = checklist.filter((i) => i.isDone).length;
              const pct = Math.round((doneCount / checklist.length) * 100);

              return (
                <div
                  key={prod._id || idx}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-stone-300 transition-all grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center"
                >
                  {/* Cột trái (7 Cột): Thông tin sản phẩm + Vòng tròn tiến độ + Checklist */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-span-7">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 overflow-hidden border border-stone-200">
                      {prod?.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag size={28} className="text-stone-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug line-clamp-2" title={prod.title}>
                        {prod.title}
                      </h4>
                      <p className="mb-2.5 mt-1 text-xs text-stone-500">
                        Giá: {prod.price_vnd ? money(prod.price_vnd) : 'Chưa đặt giá'}
                        {prod.stock !== undefined ? ` · Tồn kho: ${prod.stock} sp` : ''}
                      </p>

                      <div className="flex items-center gap-4">
                        {/* Vòng tròn tiến độ SVG */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
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
                              strokeDasharray={`${pct}, 100`}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-xs font-bold text-stone-800">
                            {doneCount}/{checklist.length}
                          </span>
                        </div>

                        {/* 4 Mục trạng thái */}
                        <div className="space-y-1 text-xs">
                          {checklist.map((item, cIdx) => (
                            <div
                              key={cIdx}
                              className={`flex items-center gap-1.5 ${
                                item.isDone ? 'font-semibold text-emerald-800' : 'text-stone-500'
                              }`}
                            >
                              {item.isDone ? (
                                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                              ) : (
                                <span className="h-2 w-2 rounded-sm bg-stone-300 shrink-0" />
                              )}
                              <span className="text-[11px]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải (5 Cột): Khối Việc nên làm tiếp */}
                  <div className="flex flex-col justify-center rounded-xl border border-stone-200 bg-stone-50/70 p-4 lg:col-span-5 space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Việc nên làm tiếp
                    </span>
                    <p className="mb-0 text-xs text-stone-600 leading-relaxed">
                      Cập nhật ảnh concept quà tặng cho dịp <strong>{campName}</strong> và bổ sung từ khoá ngách vào mô tả để sàn kịp index trước{' '}
                      <strong>
                        {activeCamp?.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'ngày chốt đơn'}
                      </strong>.
                    </p>
                    <Link
                      to="/seller/products"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:underline pt-1"
                    >
                      Mở Quản lý kho hàng để cập nhật ảnh <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. TRƯỜNG HỢP B: CHƯA CÓ SẢN PHẨM KHỚP -> BÁO RÕ RÀNG VÀ HIỆN DANH SÁCH SP CỦA SHOP */
        <div className="space-y-5">
          {/* Thông báo trung thực, rõ ràng */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-700 shrink-0" />
              <h4 className="font-bold text-amber-900 text-sm">
                Shop hiện chưa có sản phẩm nào gắn với dịp {campName}
              </h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed pl-6">
              Hệ thống chưa tìm thấy sản phẩm nào trong gian hàng có chứa từ khóa hoặc hình ảnh liên quan đến dịp này.
              Dưới đây là các sản phẩm hiện có trong shop của bạn — bạn có thể chọn sản phẩm phù hợp để tối ưu tiêu đề, thêm ảnh concept hoặc tạo combo đón sóng tìm kiếm.
            </p>
          </div>

          {/* Danh sách các sản phẩm thực tế của shop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-stone-600" />
                <h4 className="font-bold text-stone-900 text-sm">
                  Sản phẩm hiện có trong shop ({allShopProducts.length} sản phẩm)
                </h4>
              </div>
              <Link
                to="/seller/products/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:underline"
              >
                <PlusCircle size={13} />
                <span>Đăng sản phẩm mới</span>
              </Link>
            </div>

            {allShopProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {allShopProducts.map((prod) => (
                  <div
                    key={prod._id}
                    className="rounded-xl border border-stone-200 bg-white p-3.5 flex flex-col justify-between space-y-3 hover:border-stone-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center">
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={22} className="text-stone-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5
                          className="font-bold text-stone-900 text-xs leading-snug line-clamp-2"
                          title={prod.title}
                        >
                          {prod.title}
                        </h5>
                        <p className="text-[11px] text-stone-500 mt-1">
                          {prod.price_vnd ? money(prod.price_vnd) : 'Chưa đặt giá'}
                          {prod.stock !== undefined ? ` · Tồn: ${prod.stock} sp` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                        <Tag size={10} />
                        Chưa tối ưu dịp này
                      </span>
                      <Link
                        to="/seller/products"
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#007700] hover:underline"
                      >
                        <span>Tối ưu đón dịp</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Trường hợp shop hoàn toàn chưa có sản phẩm nào */
              <div className="text-center py-10 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 space-y-3">
                <ShoppingBag size={36} className="mx-auto text-stone-400" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-800">
                    Gian hàng chưa có sản phẩm nào
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Bạn chưa đăng sản phẩm nào trên VietCraft. Hãy đăng sản phẩm đầu tiên để hệ thống phân tích và chuẩn bị kế hoạch bán hàng.
                  </p>
                </div>
                <Link
                  to="/seller/products/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007700] text-white text-xs font-bold hover:bg-[#005B00] transition-colors"
                >
                  <PlusCircle size={14} />
                  <span>Đăng sản phẩm mới ngay</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
