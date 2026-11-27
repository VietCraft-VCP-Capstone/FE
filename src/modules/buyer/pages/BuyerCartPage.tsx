import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Info, Minus, Plus, ShoppingBag, Store, Trash2, Zap } from 'lucide-react';
import { productsService, couponDiscount, type ProductDeal } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { useProductDeals } from '../hooks/useDealLookup';
import { cartService } from '../../order/services/cartService';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';
import { SelectVariantModal } from '../components/SelectVariantModal';
import { CommerceToast, useCommerceToast } from '../components/commerce/CommerceToast';
import { groupByShop, isBuyable, mapCart, normalizeSelection, type CartLine, type ShopGroup } from '../components/commerce/cartModel';
import { writeCheckoutHandoff } from '../components/commerce/checkoutHandoff';
import { mediaUrl, onImgError, PLACEHOLDER_IMG, toNumber, vnd } from '../components/commerce/format';
import '../components/commerce/commerce.css';

const QTY_DEBOUNCE_MS = 450;

interface Recommendation {
  id: string;
  title: string;
  price: number;
  image: string;
  raw: any;
}

/** Ô chọn hỗ trợ trạng thái "chọn một phần" */
function CheckBox({ checked, indeterminate = false, disabled, onChange, label }: {
  checked: boolean; indeterminate?: boolean; disabled?: boolean; onChange: () => void; label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate && !checked; }, [indeterminate, checked]);
  return <input ref={ref} type="checkbox" className="vc-check" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />;
}

/** Gợi ý mức giảm tốt nhất của 1 mã cho các dòng đang chọn (mỗi đơn chỉ 1 mã giảm tiền hàng). */
function bestVoucherFor(lines: CartLine[], deals: Map<string, ProductDeal>) {
  const byCoupon = new Map<string, { deal: ProductDeal; subtotal: number }>();
  for (const l of lines) {
    const d = deals.get(l.productId);
    if (!d) continue;
    const row = byCoupon.get(d.couponId) || { deal: d, subtotal: 0 };
    row.subtotal += l.price * l.quantity;
    byCoupon.set(d.couponId, row);
  }
  let best: { code: string; saving: number } | null = null;
  byCoupon.forEach(({ deal, subtotal }) => {
    if (deal.minOrder > 0 && subtotal < deal.minOrder) return;
    const saving = couponDiscount(deal.discountType, deal.discountValue, deal.maxDiscount, subtotal);
    if (saving > 0 && (!best || saving > best.saving)) best = { code: deal.couponCode, saving };
  });
  return best as { code: string; saving: number } | null;
}

export function BuyerCartPage() {
  const navigate = useNavigate();
  const { toast, show: showToast, dismiss } = useCommerceToast();
  const authed = isLoggedIn();

  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [qtyDraft, setQtyDraft] = useState<Record<string, number>>({});
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [variantProduct, setVariantProduct] = useState<any>(null);

  const qtyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const selectionSeq = useRef(0);

  const applyServerCart = useCallback((data: any) => setLines(mapCart(data)), []);

  const setBusy = (ids: string[], on: boolean) => setBusyIds((prev) => {
    const next = new Set(prev);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    return next;
  });

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const failures = await cartService.migrateLegacyCart();
      if (failures.length > 0) showToast(failures[0], 'error');
      const data = await cartService.getCart();
      const mapped = mapCart(data);
      setLines(mapped);
      const fixed = normalizeSelection(mapped);
      if (fixed) {
        setLines(mapped.map((l) => ({ ...l, checked: fixed.includes(l.id) })));
        cartService.setSelection(fixed).then(applyServerCart).catch(() => { /* giữ lựa chọn hiển thị, lần thao tác sau sẽ đồng bộ */ });
      }
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không tải được giỏ hàng.'));
      setLines((prev) => prev ?? []);
    }
  }, [applyServerCart, showToast]);

  useEffect(() => {
    void load();
    productsService.getAll().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.items || [];
      setRecs(list.slice(0, 12).map((p: any) => ({
        id: String(p._id || p.id),
        title: p.title || p.name || 'Sản phẩm VietCraft',
        price: toNumber(p.variants?.[0]?.retail_price ?? p.variants?.[0]?.price ?? p.price),
        image: mediaUrl(p.images?.[0] || p.image) || PLACEHOLDER_IMG,
        raw: p,
      })));
    }).catch(() => setRecs([]));
    const timers = qtyTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, [load]);

  const all = lines ?? [];
  const groups = useMemo(() => groupByShop(all), [all]);
  const deals = useProductDeals(all.map((l) => l.productId));
  const qtyOf = (l: CartLine) => qtyDraft[l.id] ?? l.quantity;

  const selected = all.filter((l) => l.checked);
  const activeShopId = selected[0]?.shopId ?? null;
  const activeGroup = groups.find((g) => g.shopId === activeShopId) ?? null;
  const selectedQty = selected.reduce((s, l) => s + qtyOf(l), 0);
  const selectedTotal = selected.reduce((s, l) => s + l.price * qtyOf(l), 0);
  const voucherHint = bestVoucherFor(selected.map((l) => ({ ...l, quantity: qtyOf(l) })), deals);
  const pendingQty = selected.some((l) => qtyDraft[l.id] !== undefined);

  const blockReason = (() => {
    if (selected.length === 0) return 'Chọn sản phẩm bạn muốn thanh toán.';
    const bad = selected.find((l) => !isBuyable(l));
    if (bad) return `"${bad.title}" ${bad.unavailable?.toLowerCase()}. Bỏ chọn để tiếp tục.`;
    const over = selected.find((l) => l.stock !== null && qtyOf(l) > l.stock);
    if (over) return `"${over.title}" chỉ còn ${over.stock} sản phẩm. Giảm số lượng để tiếp tục.`;
    return '';
  })();

  /* ---------- Chọn hàng: đặt đúng tập id lên server trong 1 request ---------- */
  const commitSelection = async (nextIds: string[]) => {
    const before = lines;
    const wanted = new Set(nextIds);
    setLines((prev) => (prev ?? []).map((l) => ({ ...l, checked: wanted.has(l.id) })));
    const seq = ++selectionSeq.current;
    try {
      const data = await cartService.setSelection(nextIds);
      if (seq === selectionSeq.current) applyServerCart(data);
    } catch (err) {
      if (seq === selectionSeq.current) setLines(before);
      showToast(getApiErrorMessage(err, 'Không cập nhật được lựa chọn.'), 'error');
    }
  };

  const toggleLine = (line: CartLine) => {
    if (!isBuyable(line)) return;
    if (line.checked) {
      void commitSelection(selected.filter((l) => l.id !== line.id).map((l) => l.id));
      return;
    }
    if (activeShopId && activeShopId !== line.shopId) {
      setNotice(`Đã chuyển sang ${line.shopName}. Mỗi lần thanh toán cho một shop.`);
      void commitSelection([line.id]);
      return;
    }
    setNotice('');
    void commitSelection([...selected.map((l) => l.id), line.id]);
  };

  const toggleShop = (group: ShopGroup) => {
    const buyable = group.lines.filter(isBuyable);
    const allOn = buyable.length > 0 && buyable.every((l) => l.checked);
    if (allOn) {
      void commitSelection([]);
      return;
    }
    if (activeShopId && activeShopId !== group.shopId) setNotice(`Đã chuyển sang ${group.shopName}. Mỗi lần thanh toán cho một shop.`);
    else setNotice('');
    void commitSelection(buyable.map((l) => l.id));
  };

  /* ---------- Số lượng: cập nhật ngay trên màn hình, gửi server sau khi ngừng bấm ---------- */
  const changeQty = (line: CartLine, next: number) => {
    const max = line.stock !== null && line.stock > 0 ? line.stock : 999;
    const qty = Math.min(max, Math.max(1, Math.floor(next) || 1));
    setQtyDraft((d) => ({ ...d, [line.id]: qty }));
    clearTimeout(qtyTimers.current[line.id]);
    qtyTimers.current[line.id] = setTimeout(async () => {
      try {
        if (qty !== line.quantity) applyServerCart(await cartService.updateQuantity(line.id, qty));
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Không cập nhật được số lượng.'), 'error');
      } finally {
        setQtyDraft((d) => {
          if (d[line.id] !== qty) return d;
          const { [line.id]: _, ...rest } = d;
          return rest;
        });
      }
    }, QTY_DEBOUNCE_MS);
  };

  /* ---------- Xoá / chuyển sang yêu thích ---------- */
  const removeLines = async (ids: string[], message: string) => {
    setBusy(ids, true);
    try {
      applyServerCart(ids.length === 1 ? await cartService.removeItem(ids[0]) : await cartService.removeItems(ids));
      showToast(message);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không xoá được sản phẩm.'), 'error');
    } finally {
      setBusy(ids, false);
    }
  };

  const moveToWishlist = async (line: CartLine) => {
    if (!authed) {
      navigate(`/login?next=${encodeURIComponent('/cart')}`);
      return;
    }
    setBusy([line.id], true);
    try {
      await favoritesService.addFavorite(line.productId);
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      applyServerCart(await cartService.removeItem(line.id));
      showToast('Đã chuyển vào danh sách yêu thích.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không chuyển được sang yêu thích.'), 'error');
    } finally {
      setBusy([line.id], false);
    }
  };

  const handleCheckout = () => {
    if (blockReason || pendingQty) return;
    writeCheckoutHandoff({
      source: 'cart',
      lines: selected.map((l) => ({ productId: l.productId, variantId: l.variantId || undefined, quantity: qtyOf(l) })),
    });
    navigate('/checkout');
  };

  const inCart = new Set(all.map((l) => l.productId));
  const visibleRecs = recs.filter((r) => !inCart.has(r.id)).slice(0, 4);
  const cartCount = all.reduce((s, l) => s + qtyOf(l), 0);

  const ctaLabel = pendingQty ? 'Đang cập nhật...' : selected.length > 0 ? `Thanh toán (${selectedQty})` : 'Thanh toán';

  return (
    <div className="vc-commerce">
      <div className="mx-auto max-w-[1200px] px-4 pb-36 pt-5 sm:px-6 lg:pb-16">
        <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--c-muted)]">
          <Link to="/" className="hover:text-[var(--c-green)]">Trang chủ</Link>
          <span className="mx-1.5" aria-hidden>/</span>
          <span className="text-[var(--c-ink)]">Giỏ hàng</span>
        </nav>

        <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="vc-display m-0 text-[28px] font-semibold leading-tight text-[var(--c-plum)] sm:text-[34px]">Giỏ hàng</h1>
            {lines && all.length > 0 && (
              <p className="m-0 mt-1 text-sm text-[var(--c-muted)]">
                {cartCount} sản phẩm từ {groups.length} shop
              </p>
            )}
          </div>
          {all.length > 0 && (
            <Link to="/" className="text-sm font-semibold text-[var(--c-green)] hover:underline">Tiếp tục mua sắm</Link>
          )}
        </header>

        {loadError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span>{loadError}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button>
          </div>
        )}

        {lines === null ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true" aria-label="Đang tải giỏ hàng">
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="vc-panel space-y-4 p-5">
                  <div className="vc-skel h-5 w-40" />
                  {[0, 1].map((j) => (
                    <div key={j} className="flex gap-4">
                      <div className="vc-skel h-24 w-24 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="vc-skel h-4 w-3/4" />
                        <div className="vc-skel h-3 w-1/3" />
                        <div className="vc-skel mt-4 h-8 w-28 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="vc-skel hidden h-72 rounded-2xl lg:block" />
          </div>
        ) : all.length === 0 && loadError ? null : all.length === 0 ? (
          <section className="vc-panel mx-auto max-w-xl px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--c-thread)] text-[var(--c-plum)]">
              <ShoppingBag size={30} strokeWidth={1.6} />
            </div>
            <h2 className="vc-display m-0 text-xl font-semibold text-[var(--c-plum)]">Giỏ hàng đang trống</h2>
            <p className="mx-auto mb-6 mt-2 max-w-sm text-sm leading-relaxed text-[var(--c-muted)]">
              Thêm món đồ bạn thích, chúng sẽ chờ ở đây đến khi bạn sẵn sàng thanh toán.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/" className="rounded-full bg-[var(--c-green)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-green-deep)]">Khám phá sản phẩm</Link>
              {authed && <Link to="/favorites" className="rounded-full border border-[var(--c-line-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--c-ink)] hover:border-[var(--c-ink)]">Xem danh sách yêu thích</Link>}
            </div>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              {groups.length > 1 && (
                <p className="m-0 flex items-start gap-2 rounded-2xl bg-[var(--c-plum-wash)] px-4 py-3 text-[13.5px] leading-snug text-[var(--c-plum)]" role="status">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>{notice || 'Mỗi lần thanh toán cho một shop. Chọn hàng ở shop khác, lựa chọn sẽ chuyển sang shop đó.'}</span>
                </p>
              )}

              {groups.map((group) => {
                const buyable = group.lines.filter(isBuyable);
                const checkedCount = buyable.filter((l) => l.checked).length;
                const active = group.shopId === activeShopId;
                const groupTotal = group.lines.filter((l) => l.checked).reduce((s, l) => s + l.price * qtyOf(l), 0);

                return (
                  <section key={group.shopId} className="vc-parcel" data-active={active} aria-label={`Kiện hàng từ ${group.shopName}`}>
                    <header className="mx-4 flex items-center gap-3 border-b border-[var(--c-line)] pb-3.5 pt-5 sm:mx-6">
                      <CheckBox
                        checked={buyable.length > 0 && checkedCount === buyable.length}
                        indeterminate={checkedCount > 0}
                        disabled={buyable.length === 0}
                        onChange={() => toggleShop(group)}
                        label={`Chọn tất cả sản phẩm của ${group.shopName}`}
                      />
                      {group.shopLogo ? (
                        <img src={group.shopLogo} alt="" className="h-7 w-7 rounded-full border border-[var(--c-line)] object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <Store size={18} className="text-[var(--c-muted)]" />
                      )}
                      {group.shopId !== 'vietcraft' ? (
                        <Link to={`/shop/${group.shopId}`} className="min-w-0 truncate text-[15px] font-semibold text-[var(--c-ink)] hover:text-[var(--c-green)]">{group.shopName}</Link>
                      ) : (
                        <span className="min-w-0 truncate text-[15px] font-semibold">{group.shopName}</span>
                      )}
                      {active && <span className="ml-auto hidden shrink-0 text-xs font-semibold text-[var(--c-green)] sm:inline">Đang chọn để thanh toán</span>}
                    </header>

                    <ul className="m-0 list-none divide-y divide-[var(--c-line)] px-4 sm:px-6">
                      {group.lines.map((line) => {
                        const qty = qtyOf(line);
                        const busy = busyIds.has(line.id);
                        const deal = deals.get(line.productId);
                        const unitOff = deal && (!deal.minOrder || line.price >= deal.minOrder)
                          ? couponDiscount(deal.discountType, deal.discountValue, deal.maxDiscount, line.price) : 0;
                        const over = line.stock !== null && qty > line.stock && isBuyable(line);
                        const maxQty = line.stock !== null && line.stock > 0 ? line.stock : 999;

                        return (
                          <li key={line.id} className={`flex gap-3 py-4 sm:gap-4 ${busy ? 'opacity-50' : ''}`} aria-busy={busy}>
                            <div className="pt-9">
                              <CheckBox
                                checked={line.checked}
                                disabled={!isBuyable(line) || busy}
                                onChange={() => toggleLine(line)}
                                label={`Chọn ${line.title}`}
                              />
                            </div>
                            <Link to={`/product/${line.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--c-line)] bg-stone-50 sm:h-28 sm:w-28">
                              <img src={line.image} alt={line.title} loading="lazy" onError={onImgError} className={`h-full w-full object-cover ${line.unavailable ? 'grayscale opacity-60' : ''}`} />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <Link to={`/product/${line.productId}`} className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--c-ink)] hover:text-[var(--c-green)]">
                                  {line.title}
                                </Link>
                                <span className={`vc-num hidden shrink-0 whitespace-nowrap text-[15px] font-semibold sm:inline ${line.unavailable ? 'text-[var(--c-muted)]' : 'text-[var(--c-ink)]'}`}>
                                  {vnd(line.price * qty)}
                                </span>
                              </div>
                              <p className="m-0 mt-1 text-[13px] text-[var(--c-muted)]">{line.variantName}</p>
                              <p className="m-0 mt-0.5 text-[13px] text-[var(--c-muted)]">
                                <span className="vc-num">{vnd(line.price)}</span> mỗi sản phẩm
                                <span className={`vc-num ml-2 font-semibold sm:hidden ${line.unavailable ? '' : 'text-[var(--c-ink)]'}`}>= {vnd(line.price * qty)}</span>
                              </p>
                              {unitOff > 0 && !line.unavailable && (
                                <p className="m-0 mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--c-rose)]">
                                  <Zap size={12} /> Còn {vnd(line.price - unitOff)} với mã {deal!.couponCode}
                                </p>
                              )}
                              {line.unavailable && <p className="m-0 mt-1 text-[13px] font-semibold text-[var(--c-rose)]">{line.unavailable}</p>}
                              {over && (
                                <p className="m-0 mt-1 text-[13px] font-semibold text-[var(--c-amber)]">
                                  Chỉ còn {line.stock} sản phẩm.{' '}
                                  <button type="button" onClick={() => changeQty(line, line.stock!)} className="font-semibold underline underline-offset-2">Giảm còn {line.stock}</button>
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                {line.unavailable ? <span /> : (
                                  <div className="vc-stepper" role="group" aria-label={`Số lượng ${line.title}`}>
                                    <button type="button" onClick={() => changeQty(line, qty - 1)} disabled={qty <= 1 || busy} aria-label="Giảm số lượng"><Minus size={14} /></button>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={1}
                                      max={maxQty}
                                      value={qty}
                                      onChange={(e) => changeQty(line, Number(e.target.value))}
                                      aria-label="Số lượng"
                                    />
                                    <button type="button" onClick={() => changeQty(line, qty + 1)} disabled={qty >= maxQty || busy} aria-label="Tăng số lượng"><Plus size={14} /></button>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void moveToWishlist(line)}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[var(--c-body)] hover:bg-stone-100"
                                  >
                                    <Heart size={14} /> <span className="hidden sm:inline">Lưu vào yêu thích</span><span className="sm:hidden">Lưu</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void removeLines([line.id], `Đã xoá "${line.title}" khỏi giỏ hàng.`)}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[var(--c-body)] hover:bg-rose-50 hover:text-[var(--c-rose)]"
                                  >
                                    <Trash2 size={14} /> Xoá
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--c-line)] px-4 py-4 text-sm sm:px-6">
                      {active ? (
                        <>
                          <span className="text-[var(--c-muted)]">Tạm tính ({checkedCount} dòng đã chọn)</span>
                          <span className="vc-num font-semibold">{vnd(groupTotal)}</span>
                        </>
                      ) : buyable.length > 0 ? (
                        <button type="button" onClick={() => toggleShop(group)} className="font-semibold text-[var(--c-green)] hover:underline">
                          Thanh toán kiện này thay thế
                        </button>
                      ) : (
                        <span className="text-[var(--c-muted)]">Không còn sản phẩm mua được trong kiện này</span>
                      )}
                    </footer>
                  </section>
                );
              })}

              {all.some((l) => !isBuyable(l)) && (
                <button
                  type="button"
                  onClick={() => void removeLines(all.filter((l) => !isBuyable(l)).map((l) => l.id), 'Đã xoá các sản phẩm không còn bán.')}
                  className="text-sm font-semibold text-[var(--c-muted)] underline-offset-2 hover:text-[var(--c-rose)] hover:underline"
                >
                  Xoá các sản phẩm không còn bán
                </button>
              )}
            </div>

            {/* Tóm tắt: hoá đơn tạm tính của kiện đang chọn */}
            <aside className="sticky top-24 hidden lg:block" aria-label="Tóm tắt thanh toán">
              <div className="vc-receipt-wrap">
                <div className="vc-receipt p-6">
                  <h2 className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">Tóm tắt</h2>
                  <p className="m-0 mt-1 text-[13px] text-[var(--c-muted)]">
                    {activeGroup ? <>Kiện hàng từ <span className="font-semibold text-[var(--c-ink)]">{activeGroup.shopName}</span></> : 'Chưa chọn sản phẩm nào'}
                  </p>

                  <dl className="m-0 mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--c-muted)]">Tiền hàng ({selectedQty} sản phẩm)</dt>
                      <dd className="vc-num m-0 font-medium">{vnd(selectedTotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--c-muted)]">Phí vận chuyển</dt>
                      <dd className="m-0 text-[var(--c-muted)]">Tính ở bước sau</dd>
                    </div>
                    {voucherHint && (
                      <div className="flex justify-between gap-3 text-[var(--c-rose)]">
                        <dt>Có thể giảm với mã {voucherHint.code}</dt>
                        <dd className="vc-num m-0 font-semibold">-{vnd(voucherHint.saving)}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="vc-perf my-5 -mx-6" />

                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">Tạm tính</span>
                    <span className="vc-display vc-num text-[26px] font-semibold text-[var(--c-plum)]">{vnd(selectedTotal)}</span>
                  </div>
                  {voucherHint && <p className="m-0 mt-1 text-right text-xs text-[var(--c-muted)]">Chọn mã ở bước thanh toán</p>}

                  {blockReason && selected.length > 0 && <p className="m-0 mt-3 text-[13px] text-[var(--c-rose)]">{blockReason}</p>}

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={Boolean(blockReason) || pendingQty}
                    className="mt-5 h-12 w-full rounded-full bg-[var(--c-green)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--c-green-deep)] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
                  >
                    {ctaLabel}
                  </button>

                  {selected.length > 0 && (
                    <div className="mt-3 flex justify-center gap-4 text-[13px]">
                      <button type="button" onClick={() => void commitSelection([])} className="text-[var(--c-muted)] hover:text-[var(--c-ink)]">Bỏ chọn</button>
                      <button type="button" onClick={() => setConfirmBulk(true)} className="text-[var(--c-muted)] hover:text-[var(--c-rose)]">Xoá {selected.length} dòng đã chọn</button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Gợi ý thêm */}
        {lines && visibleRecs.length > 0 && (
          <section className="mt-14" aria-labelledby="cart-recs">
            <h2 id="cart-recs" className="vc-display m-0 mb-4 text-lg font-semibold text-[var(--c-plum)]">Có thể bạn cũng thích</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {visibleRecs.map((rec) => (
                <article key={rec.id} className="vc-card-box vc-wish flex flex-col">
                  <Link to={`/product/${rec.id}`} className="block aspect-square overflow-hidden border-b border-[var(--c-line)] bg-stone-50">
                    <img src={rec.image} alt={rec.title} loading="lazy" onError={onImgError} className="vc-wish-img h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <Link to={`/product/${rec.id}`} className="line-clamp-2 min-h-[2.5rem] text-[13.5px] leading-5 text-[var(--c-ink)] hover:text-[var(--c-green)]">{rec.title}</Link>
                    <span className="vc-num text-[15px] font-semibold text-[var(--c-plum)]">{vnd(rec.price)}</span>
                    <button
                      type="button"
                      onClick={() => setVariantProduct(rec.raw)}
                      className="mt-auto rounded-full border border-[var(--c-line-strong)] py-2 text-[13px] font-semibold text-[var(--c-ink)] hover:border-[var(--c-green)] hover:text-[var(--c-green)]"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Thanh thanh toán trên điện thoại */}
      {lines && all.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--c-line)] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          {blockReason && selected.length > 0 && <p className="m-0 mb-2 text-[12.5px] text-[var(--c-rose)]">{blockReason}</p>}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-xs text-[var(--c-muted)]">{activeGroup ? activeGroup.shopName : 'Chưa chọn sản phẩm'}</p>
              <p className="vc-display vc-num m-0 text-xl font-semibold text-[var(--c-plum)]">{vnd(selectedTotal)}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={Boolean(blockReason) || pendingQty}
              className="h-12 shrink-0 rounded-full bg-[var(--c-green)] px-6 text-[15px] font-semibold text-white disabled:bg-stone-200 disabled:text-stone-500"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Xác nhận xoá nhiều dòng */}
      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="bulk-title" onClick={() => setConfirmBulk(false)}>
          <div className="vc-sheet w-full max-w-sm rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="bulk-title" className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">Xoá {selected.length} dòng đã chọn?</h3>
            <p className="m-0 mt-2 text-sm text-[var(--c-muted)]">Các sản phẩm này sẽ bị bỏ khỏi giỏ hàng.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirmBulk(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-stone-100">Giữ lại</button>
              <button
                type="button"
                onClick={() => { setConfirmBulk(false); void removeLines(selected.map((l) => l.id), `Đã xoá ${selected.length} dòng khỏi giỏ hàng.`); }}
                className="rounded-full bg-[var(--c-rose)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Xoá khỏi giỏ
              </button>
            </div>
          </div>
        </div>
      )}

      <SelectVariantModal
        isOpen={Boolean(variantProduct)}
        productId={variantProduct ? String(variantProduct._id || variantProduct.id) : null}
        initialProduct={variantProduct}
        onClose={() => setVariantProduct(null)}
        onAddToCart={async (payload) => {
          try {
            const next = mapCart(await cartService.addToCart(payload));
            // Hàng mới mặc định được chọn; nếu khác shop đang chọn thì giữ lựa chọn cũ (mỗi đơn một shop).
            const keepShop = activeShopId;
            if (keepShop && next.some((l) => l.checked && l.shopId !== keepShop)) {
              const ids = next.filter((l) => l.checked && l.shopId === keepShop).map((l) => l.id);
              setLines(next.map((l) => ({ ...l, checked: ids.includes(l.id) })));
              cartService.setSelection(ids).then(applyServerCart).catch(() => {});
            } else {
              setLines(next);
            }
            showToast('Đã thêm vào giỏ hàng.');
          } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thêm được sản phẩm.'), 'error');
            throw err;
          }
        }}
      />

      <CommerceToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

export default BuyerCartPage;
