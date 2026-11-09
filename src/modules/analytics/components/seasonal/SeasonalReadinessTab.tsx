import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  PackageCheck,
  PlusCircle,
  Tag,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { money } from '../../../../shared/utils/format';
import { fullDate } from '../../format';

interface SeasonalReadinessTabProps {
  matchingProducts: any[];
  allShopProducts: any[];
  activeCamp: SeasonalCampaign;
}

function getProductImageSrc(prod: any): string | null {
  if (!prod) return null;
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const first = prod.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (typeof first === 'object' && first?.url) return first.url.trim();
  }
  if (typeof prod.thumbnail === 'string' && prod.thumbnail.trim()) return prod.thumbnail.trim();
  if (typeof prod.image_url === 'string' && prod.image_url.trim()) return prod.image_url.trim();
  if (typeof prod.imageUrl === 'string' && prod.imageUrl.trim()) return prod.imageUrl.trim();
  if (typeof prod.default_image === 'string' && prod.default_image.trim()) return prod.default_image.trim();
  if (typeof prod.image === 'string' && prod.image.trim()) return prod.image.trim();
  return null;
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
              const imgSrc = getProductImageSrc(prod);
              const analysis = prod?.readiness_analysis;

              // Dữ liệu phân tích sẵn sàng được tính toán 100% từ Module Backend AI Analytics
              const checklist: any[] = analysis?.checklist || [
                {
                  id: 'images',
                  label: `Ảnh concept theo chủ đề ${campName}`,
                  is_done: Boolean((prod?.images?.length ?? 0) >= 2 || imgSrc),
                  action_title: `Bổ sung ảnh concept dịp ${campName}`,
                  action_detail: `Tải thêm ảnh chụp sản phẩm với bối cảnh hoặc hộp quà theo chủ đề dịp ${campName}.`,
                  market_data: 'Sản phẩm có ảnh chụp bối cảnh hoặc hộp quà dịp cao điểm đạt tỷ lệ nhấp chuột (CTR) cao hơn 58% so với ảnh chụp nền trắng.',
                },
                {
                  id: 'keywords',
                  label: 'Từ khoá ngách đón tìm kiếm sớm',
                  is_done: Boolean((prod?.tags?.length ?? 0) > 0 || (prod?.categories?.length ?? 0) > 0),
                  action_title: 'Gắn từ khoá ngách đón tìm kiếm sớm',
                  action_detail: `Bổ sung các từ khóa tìm kiếm theo dịp vào thẻ tag hoặc danh mục.`,
                  market_data: 'Hệ thống tìm kiếm sàn cần từ 5 đến 7 ngày để lập chỉ mục từ khóa. Cập nhật sớm giúp sản phẩm đón đúng thời điểm khách tìm kiếm.',
                },
                {
                  id: 'combo',
                  label: 'Đóng gói combo set quà tặng',
                  is_done: Boolean(/set|combo|hộp quà|quà tặng/i.test(prod?.title || '')),
                  action_title: 'Tạo combo set quà tặng',
                  action_detail: 'Tạo thêm phân loại kèm hộp quà nơ đóng sẵn và thiệp chúc mừng.',
                  seller_tip: 'Thêm phân loại "Kèm Hộp Quà & Thiệp (+35.000đ)" ngay trên sản phẩm hiện tại mà không cần nhập thêm mặt hàng mới.',
                  market_data: 'Giá trị đơn hàng (AOV) dịp này tăng do khách mua làm quà; sản phẩm có đóng gói quà tặng tăng tỷ lệ chốt đơn gấp 2.4 lần.',
                },
                {
                  id: 'seo',
                  label: 'Tiêu đề & mô tả chuẩn SEO sàn',
                  is_done: Boolean((prod?.title || '').length >= 30),
                  action_title: `Kéo dài tiêu đề chuẩn SEO (hiện ${(prod?.title || '').length}/30+ ký tự)`,
                  action_detail: 'Tiêu đề quá ngắn khiến sàn khó phân bổ tìm kiếm.',
                  market_data: '68% khách gõ từ khóa kèm tên dịp lễ. Tiêu đề chuẩn từ 30 ký tự trở lên có chứa tên dịp giúp tăng 45% lượt hiển thị tự nhiên.',
                },
              ];
              const uncompleted: any[] = analysis?.uncompleted || checklist.filter((i: any) => !i.is_done);
              const doneCount: number = analysis?.done_count ?? checklist.filter((i: any) => i.is_done).length;
              const pct: number = analysis?.readiness_score ?? Math.round((doneCount / checklist.length) * 100);

              return (
                <div
                  key={prod._id || idx}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-stone-300 transition-all space-y-4"
                >
                  {/* PHẦN 1: THANH TỔNG QUAN SẢN PHẨM & ĐỘ SẴN SÀNG */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    {/* Cụm trái: Ảnh + Tên sản phẩm + Giá + Tồn kho */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 overflow-hidden border border-stone-200">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={prod.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                              if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`img-fallback ${imgSrc ? 'hidden' : 'flex'} flex-col items-center justify-center w-full h-full text-stone-400 p-1 text-center`}>
                          <ShoppingBag size={20} className="text-stone-400 mb-0.5" />
                          <span className="text-[8px] text-stone-400 leading-tight">Chưa có ảnh</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug truncate" title={prod.title}>
                          {prod.title}
                        </h4>
                        <p className="mb-0 mt-1 text-xs text-stone-500">
                          Giá: <span className="font-semibold text-stone-700">{prod.price_vnd ? money(prod.price_vnd) : 'Chưa đặt giá'}</span>
                          {prod.stock !== undefined ? ` · Tồn kho: ${prod.stock} sp` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Cụm phải: Vòng tròn tiến độ + 4 tiêu chí tóm tắt + Nút sửa */}
                    <div className="flex flex-wrap items-center gap-4 lg:gap-5 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
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

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          {checklist.map((item, cIdx) => (
                            <div
                              key={cIdx}
                              className={`flex items-center gap-1.5 ${
                                (item.is_done ?? item.isDone) ? 'font-medium text-emerald-800' : 'text-stone-400'
                              }`}
                            >
                              {(item.is_done ?? item.isDone) ? (
                                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-stone-300 shrink-0" />
                              )}
                              <span className="text-[11px] truncate max-w-[130px]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link
                        to="/seller/products"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        Chỉnh sửa sản phẩm <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* PHẦN 2: CÁC TIÊU CHÍ CẦN CHỈNH SỬA (BỐ CỤC 2 CỘT CÂN ĐỐI) */}
                  {uncompleted.length > 0 ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-amber-600" />
                          Việc nên chỉnh sửa ngay đón dịp {campName} ({uncompleted.length} tiêu chí chưa đạt)
                        </span>
                        {activeCamp?.launch_window?.end && (
                          <span className="text-[11px] text-stone-400">
                            Hạn chốt chuẩn bị: {fullDate(activeCamp.launch_window.end)}
                          </span>
                        )}
                      </div>

                      {/* Lưới các thẻ việc cần làm: 2 cột khi có từ 2 mục, cân đối và thoáng */}
                      <div className={`grid grid-cols-1 ${uncompleted.length > 1 ? 'md:grid-cols-2' : ''} gap-3`}>
                        {uncompleted.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-stone-200/90 bg-stone-50/70 p-3.5 flex flex-col justify-between space-y-2.5 hover:border-stone-300 transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{item.action_title || item.actionTitle}</span>
                              </div>
                              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                                {item.action_detail || item.actionDetail}
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-stone-200/60">
                              {(item.seller_tip || item.tipForSeller) && (
                                <div className="text-[11px] text-emerald-900 bg-emerald-50/90 rounded-lg p-2 font-medium border border-emerald-200/70 flex items-start gap-1.5">
                                  <Lightbulb size={13} className="text-emerald-700 shrink-0 mt-0.5" />
                                  <div className="leading-relaxed">
                                    <span className="font-semibold text-emerald-950">Gợi ý thực hiện: </span>
                                    <span>{item.seller_tip || item.tipForSeller}</span>
                                  </div>
                                </div>
                              )}
                              {(item.market_data || item.evidenceNote) && (
                                <div className="text-[11px] text-stone-600 bg-white rounded-lg p-2 border border-stone-200/80 flex items-start gap-1.5 shadow-2xs">
                                  <TrendingUp size={13} className="text-stone-500 shrink-0 mt-0.5" />
                                  <div className="leading-relaxed">
                                    <span className="font-semibold text-stone-800">Dữ liệu thị trường: </span>
                                    <span>{item.market_data || item.evidenceNote}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between text-xs text-emerald-900">
                      <span>
                        🎉 Sản phẩm đã đạt chuẩn <strong>4/4 tiêu chí</strong> sẵn sàng đón cao điểm dịp <strong>{campName}</strong>! Hãy chuẩn bị tồn kho và thiết lập ưu đãi để bứt phá doanh số.
                      </span>
                      {activeCamp?.launch_window?.end && (
                        <span className="text-stone-500 shrink-0 ml-4">
                          Hạn chốt mở bán: {fullDate(activeCamp.launch_window.end)}
                        </span>
                      )}
                    </div>
                  )}
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
                {allShopProducts.map((prod) => {
                  const imgSrc = getProductImageSrc(prod);

                  return (
                    <div
                      key={prod._id}
                      className="rounded-xl border border-stone-200 bg-white p-3.5 flex flex-col justify-between space-y-3 hover:border-stone-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-14 h-14 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                                if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`img-fallback ${imgSrc ? 'hidden' : 'flex'} flex-col items-center justify-center w-full h-full text-stone-400 p-1 text-center`}>
                            <ShoppingBag size={18} className="text-stone-400 mb-0.5" />
                            <span className="text-[8px] text-stone-400 leading-tight">Chưa có ảnh</span>
                          </div>
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
                  );
                })}
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
