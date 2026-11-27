import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Star } from 'lucide-react';

const ROTATE_MS = 3000;

export interface HeroProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  soldCount: number;
  rating: number;
  ratingCount: number;
  shopName?: string;
}

interface HomeHeroProps {
  name?: string;
  /** Số sản phẩm lên kệ trong 7 ngày qua (đếm ở BE trên toàn sàn). */
  newThisWeek: number;
  /** Tổng sản phẩm đang bán trên sàn. */
  totalProducts: number;
  /** Tối đa 5 sản phẩm: bán chạy thật (đã bán > 0), hoặc hàng mới nhất khi sàn chưa có đơn giao thành công. */
  products: HeroProduct[];
  /** 'best' = xếp theo lượt bán thật; 'new' = hàng mới (chưa có lượt bán để xếp hạng). */
  mode: 'best' | 'new';
  savedVoucherCount: number;
  loading: boolean;
  onOpenProduct: (id: string) => void;
  onExplore: () => void;
  onOpenVouchers: () => void;
}

/** Tên để chào: bỏ ký tự lạ (")", ",", emoji); tên dài thì gọi tên riêng như người Việt hay gọi. */
function greetingName(name?: string) {
  const clean = (name || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > 18 ? clean.split(' ').slice(-1)[0] : clean;
}

const money = (n: number) => `${(Number(n) || 0).toLocaleString('vi-VN')}đ`;

export function HomeHero({
  name, newThisWeek, totalProducts, products, mode, savedVoucherCount, loading,
  onOpenProduct, onExplore, onOpenVouchers,
}: HomeHeroProps) {
  const who = greetingName(name);
  const [active, setActive] = useState(0);
  useEffect(() => { setActive(0); }, [products.length, mode]);

  // Tự đổi sản phẩm mỗi 3 giây. Dừng khi: khách bấm tạm dừng, đang rê chuột / dùng bàn phím trong khối,
  // tab bị ẩn, hoặc máy bật giảm chuyển động (WCAG 2.2.2: nội dung tự chuyển phải dừng được).
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  const canRotate = !loading && products.length > 1 && !reducedMotion;
  const rotating = canRotate && !userPaused && !hovering && !focusInside && !tabHidden;
  useEffect(() => {
    if (!rotating) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % products.length), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [rotating, products.length]);
  const index = Math.min(active, Math.max(0, products.length - 1));
  const featured = products[index];

  const summary = newThisWeek > 0
    ? `Tuần này có ${newThisWeek >= 100 ? 'hơn 100' : newThisWeek} sản phẩm mới lên kệ, trong ${totalProducts.toLocaleString('vi-VN')} sản phẩm đang bán.`
    : `${totalProducts.toLocaleString('vi-VN')} sản phẩm đang bán trên VietCraft.`;

  return (
    <section
      aria-labelledby="home-hero-title"
      className="vc-hero overflow-hidden rounded-[28px]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false); }}
    >
      <div className="grid lg:min-h-[470px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* ── Trái: lời chào + bảng xếp hạng ───────────────────────────── */}
        <div className="vc-hero-dark flex flex-col bg-[#330033] px-7 py-9 text-white sm:px-10 sm:py-10">
          <h1 id="home-hero-title" className="vc-display m-0 text-[34px] font-semibold leading-[1.08]">
            {who ? `Chào ${who}` : 'Chào bạn'}
          </h1>
          <p className="m-0 mt-3 max-w-[40ch] text-[15px] leading-[1.6] text-white/70">
            {loading ? 'Đang xếp hàng lên kệ…' : summary}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <button
              type="button"
              onClick={onExplore}
              className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#330033] transition-colors hover:bg-[#EAF0E2]"
            >
              Xem hàng mới
            </button>
            <button
              type="button"
              onClick={onOpenVouchers}
              className="text-[14px] font-semibold text-white/90 underline decoration-white/35 underline-offset-[6px] hover:text-white hover:decoration-white"
            >
              {savedVoucherCount > 0 ? `Ví voucher (${savedVoucherCount} mã)` : 'Kho voucher'}
            </button>
          </div>

          <div className="mt-10 lg:mt-auto lg:pt-10">
            <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
              <h2 className="m-0 text-[14px] font-semibold text-white">
                {mode === 'best' ? 'Bán chạy nhất' : 'Vừa lên kệ'}
              </h2>
              <span className="flex items-center gap-3 text-[12.5px] text-white/45">
                {mode === 'best' ? 'theo lượt bán đã giao' : 'mới nhất trước'}
                {canRotate && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? 'Tiếp tục tự đổi sản phẩm' : 'Tạm dừng tự đổi sản phẩm'}
                    title={userPaused ? 'Tiếp tục tự đổi' : 'Tạm dừng tự đổi'}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-white/70 hover:border-white hover:text-white"
                  >
                    {userPaused ? <Play size={11} /> : <Pause size={11} />}
                  </button>
                )}
              </span>
            </div>
            {loading ? (
              <div className="space-y-4 pt-4">
                {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-4 animate-pulse rounded bg-white/10" />)}
              </div>
            ) : (
              <ol className="m-0 list-none p-0">
                {products.map((p, i) => {
                  const on = i === index;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        onClick={() => onOpenProduct(p.id)}
                        aria-current={on ? 'true' : undefined}
                        className="grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-[9px] text-left"
                      >
                        <span className={`vc-display text-[13px] tabular-nums ${on ? 'text-[#94FC7E]' : 'text-white/35'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={`truncate text-[14px] ${on ? 'font-semibold text-white' : 'text-white/65'}`}>{p.title}</span>
                        <span className={`text-[14px] tabular-nums ${on ? 'text-white' : 'text-white/55'}`}>{money(p.price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* ── Phải: ảnh lấp khoảng giữa, thông tin bên dưới ─────────────────── */}
        <div className="flex flex-col bg-[#F4EDF3] px-6 py-6 sm:px-8 sm:py-7">
          {loading || !featured ? (
            <div className="min-h-[380px] flex-1 animate-pulse rounded-2xl bg-[#ece3ea]" />
          ) : (
            <>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="vc-display font-medium text-[#330033]/60">
                  {mode === 'best' ? `Hạng ${index + 1}` : 'Mới lên kệ'}
                </span>
                {featured.shopName && <span className="truncate pl-4 text-stone-500">{featured.shopName}</span>}
              </div>

              <button
                type="button"
                onClick={() => onOpenProduct(featured.id)}
                aria-label={`Xem ${featured.title}`}
                className="relative my-4 block min-h-[240px] flex-1 overflow-hidden rounded-2xl bg-[#ece3ea] sm:min-h-[260px]"
              >
                {/* Lấp kín khung; neo ở 20% từ trên để ảnh người mẫu không mất đầu khi bị cắt */}
                <img
                  key={featured.id}
                  src={featured.image}
                  alt={featured.title}
                  className="vc-fade absolute inset-0 h-full w-full object-cover object-[center_20%]"
                />
              </button>

              <div className="border-t border-[#330033]/10 pt-4">
                <p className="m-0 line-clamp-2 text-[17px] font-semibold leading-snug text-[#330033]">{featured.title}</p>
                <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[22px] font-bold leading-none text-[#330033]">{money(featured.price)}</span>
                    {featured.ratingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[13px] text-stone-500">
                        <Star size={12} className="fill-amber-400 text-amber-400" /> {featured.rating.toFixed(1)}
                      </span>
                    )}
                    {featured.soldCount > 0 && (
                      <span className="text-[13px] text-stone-500">Đã bán {featured.soldCount.toLocaleString('vi-VN')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProduct(featured.id)}
                    className="text-[14px] font-semibold text-[#007700] underline decoration-[#007700]/35 underline-offset-[6px] hover:decoration-[#007700]"
                  >
                    Xem sản phẩm
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
