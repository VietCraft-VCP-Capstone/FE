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

/**
 * Trích xuất gợi ý động theo từng ngành hàng và đặc tính thực tế của sản phẩm
 */
function getProductSuggestion(prod: any, campName: string) {
  const title = (prod?.title || 'Sản phẩm').trim();
  const lower = `${title} ${(prod?.categories || []).join(' ')} ${(prod?.tags || []).join(' ')}`.toLowerCase();

  let comboItemTip = 'kèm phụ kiện hoặc hộp quà nơ đóng sẵn';
  let sampleCombo = `Set ${title.slice(0, 30)} Kèm Hộp Quà & Thiệp ${campName}`;
  let sampleKeywords = `"quà tặng ${campName.toLowerCase()}", "set quà tri ân"`;

  if (/áo|quần|đầm|váy|khoác|len|thun|hoodie|may mặc|thời trang/i.test(lower)) {
    comboItemTip = 'kèm hộp quà nơ sang trọng, thiệp chúc hoặc phụ kiện phối kèm';
    sampleCombo = `Set ${title.slice(0, 28)} Kèm Hộp Quà Sang Trọng & Thiệp ${campName}`;
    sampleKeywords = `"quà tặng thời trang", "set đồ ${campName.toLowerCase()}", "quà tri ân"`;
  } else if (/khăn|choàng|lụa|len|mũ|nón|túi|ví|phụ kiện/i.test(lower)) {
    comboItemTip = 'kèm hộp đựng lót nhung/lụa, túi quà quai xách và thiệp mừng';
    sampleCombo = `Hộp Quà Cao Cấp ${title.slice(0, 25)} Kèm Thiệp Tri Ân ${campName}`;
    sampleKeywords = `"khăn quà tặng", "hộp quà phụ kiện", "quà ${campName.toLowerCase()} tinh tế"`;
  } else if (/gốm|sứ|ly|cốc|bình|chén|ấm|tách|gia dụng/i.test(lower)) {
    comboItemTip = 'ghép cặp đôi hoặc kèm thìa mạ vàng, đế lót gỗ và hộp quà kraft';
    sampleCombo = `Set 2 ${title.slice(0, 25)} Kèm Thìa Vàng & Hộp Quà ${campName}`;
    sampleKeywords = `"ly sứ quà tặng", "quà lưu niệm ${campName.toLowerCase()}", "set gốm quà tặng"`;
  } else if (/tranh|đèn|decor|trang trí|nến|tượng|gỗ|thủ công|mỹ nghệ/i.test(lower)) {
    comboItemTip = 'kèm hộp giấy kraft bọc rơm mộc mạc, tag thiệp handmade và nến thơm';
    sampleCombo = `Combo Quà Handmade ${title.slice(0, 25)} Kèm Thiệp Gỗ ${campName}`;
    sampleKeywords = `"quà handmade", "đồ decor ${campName.toLowerCase()}", "quà thủ công mỹ nghệ"`;
  } else if (/trà|cà phê|bánh|mứt|kẹo|thực phẩm/i.test(lower)) {
    comboItemTip = 'kèm tách thưởng trà hoặc giỏ quà mây tre đan cao cấp';
    sampleCombo = `Hộp Quà Thưởng Trà ${title.slice(0, 25)} Kèm Thiệp Chúc ${campName}`;
    sampleKeywords = `"hộp quà thực phẩm", "quà biếu ${campName.toLowerCase()}", "trà quà tặng"`;
  }

  let seoTitleSample = `${title} - Quà Tặng ${campName} Cao Cấp Ý Nghĩa`;
  if (title.length < 22) {
    seoTitleSample = `${title} Cao Cấp - Quà Tặng Dịp ${campName} Sang Trọng Ý Nghĩa`;
  }

  return {
    comboItemTip,
    sampleCombo,
    sampleKeywords,
    seoTitleSample,
  };
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
              const prodTitle = prod?.title || 'Sản phẩm';
              const titleLen = prodTitle.length;
              const suggestion = getProductSuggestion(prod, campName);

              const hasImages = Boolean((prod?.images?.length ?? 0) >= 2 || imgSrc);
              const hasKeywords = Boolean((prod?.tags?.length ?? 0) > 0 || (prod?.categories?.length ?? 0) > 0);
              const hasCombo = Boolean(/set|combo|hộp quà|quà tặng/i.test(prodTitle));
              const hasSeo = Boolean(titleLen >= 30);

              const checklist = [
                {
                  id: 'images',
                  label: `Ảnh concept theo chủ đề ${campName}`,
                  isDone: hasImages,
                  actionTitle: `Bổ sung ảnh concept dịp ${campName}`,
                  actionDetail: `Tải thêm ảnh chụp sản phẩm với bối cảnh hoặc hộp quà theo chủ đề dịp ${campName} để tăng tỷ lệ click (CTR).`,
                },
                {
                  id: 'keywords',
                  label: 'Từ khoá ngách đón tìm kiếm sớm',
                  isDone: hasKeywords,
                  actionTitle: 'Gắn từ khoá ngách đón tìm kiếm sớm',
                  actionDetail: `Bổ sung các từ khóa tìm kiếm theo dịp vào thẻ tag hoặc danh mục (gợi ý: ${suggestion.sampleKeywords}).`,
                },
                {
                  id: 'combo',
                  label: 'Đóng gói combo set quà tặng',
                  isDone: hasCombo,
                  actionTitle: 'Tạo combo set quà tặng',
                  actionDetail: `Tạo thêm phân loại ${suggestion.comboItemTip} (gợi ý: "${suggestion.sampleCombo}") để tăng giá trị đơn.`,
                },
                {
                  id: 'seo',
                  label: 'Tiêu đề & mô tả chuẩn SEO sàn',
                  isDone: hasSeo,
                  actionTitle: `Kéo dài tiêu đề chuẩn SEO (hiện ${titleLen}/30+ ký tự)`,
                  actionDetail: `Tiêu đề quá ngắn khiến sàn khó phân bổ tìm kiếm. Gợi ý đổi thành: "${suggestion.seoTitleSample}".`,
                },
              ];
              const uncompleted = checklist.filter((i) => !i.isDone);
              const doneCount = checklist.filter((i) => i.isDone).length;
              const pct = Math.round((doneCount / checklist.length) * 100);

              return (
                <div
                  key={prod._id || idx}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-stone-300 transition-all grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center"
                >
                  {/* Cột trái (7 Cột): Thông tin sản phẩm + Vòng tròn tiến độ + Checklist */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-span-7">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 overflow-hidden border border-stone-200">
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
                        <ShoppingBag size={22} className="text-stone-400 mb-0.5" />
                        <span className="text-[9px] text-stone-400 leading-tight">Chưa có ảnh</span>
                      </div>
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

                  {/* Cột phải (5 Cột): Khối Việc nên làm tiếp - Hướng dẫn cụ thể từng tiêu chí thiếu */}
                  <div className="flex flex-col justify-center rounded-xl border border-stone-200 bg-stone-50/70 p-4 lg:col-span-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        Việc nên chỉnh sửa ngay
                      </span>
                      {uncompleted.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          Còn {uncompleted.length} tiêu chí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Đạt 4/4 tiêu chuẩn
                        </span>
                      )}
                    </div>

                    {uncompleted.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        {uncompleted.map((item) => (
                          <div key={item.id} className="rounded-lg border border-stone-200/80 bg-white p-2.5 shadow-2xs">
                            <div className="font-semibold text-stone-800 text-[11px]">
                              {item.actionTitle}
                            </div>
                            <div className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                              {item.actionDetail}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 leading-relaxed">
                        Sản phẩm đã đạt chuẩn 4/4 tiêu chí đón cao điểm dịp <strong>{campName}</strong>! Bạn có thể kiểm tra lại tồn kho và gắn thêm voucher khuyến mãi để bứt phá doanh số.
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between">
                      <Link
                        to="/seller/products"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:underline"
                      >
                        Chỉnh sửa sản phẩm trong kho <ChevronRight size={13} />
                      </Link>
                      {activeCamp?.launch_window?.end && (
                        <span className="text-[10px] text-stone-400">
                          Hạn chốt: {fullDate(activeCamp.launch_window.end)}
                        </span>
                      )}
                    </div>
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
