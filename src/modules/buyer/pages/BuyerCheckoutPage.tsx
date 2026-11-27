import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Plus, ShieldCheck, Store, Truck, X } from 'lucide-react';
import { ordersService, type OrderQuote } from '../../order/services/ordersService';
import { userService, type Address } from '../../user/services/userService';
import { cartService } from '../../order/services/cartService';
import { promotionService, type CouponDTO } from '../../promotion/services/promotionService';
import { useVoucherWallet } from '../../promotion/hooks/useVoucherWallet';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';
import { AddressFormModal } from '../components/profile/AddressFormModal';
import { CommerceToast, useCommerceToast } from '../components/commerce/CommerceToast';
import { CouponSheet, SlotIcon, type CouponSlot } from '../components/commerce/CouponSheet';
import { clearCheckoutHandoff, readCheckoutHandoff } from '../components/commerce/checkoutHandoff';
import { mediaUrl, onImgError, PLACEHOLDER_IMG, vnd } from '../components/commerce/format';
import '../components/commerce/commerce.css';

type PaymentMethod = 'payos' | 'cod';

const STEPS = ['Giỏ hàng', 'Thanh toán', 'Hoàn tất'];

export function BuyerCheckoutPage() {
  const navigate = useNavigate();
  const outlet = useOutletContext<{ setCartCount?: (n: number) => void }>() || {};
  const { toast, show: showToast, dismiss } = useCommerceToast();
  const authed = isLoggedIn();
  const [handoff] = useState(readCheckoutHandoff);

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('payos');
  const [codes, setCodes] = useState<Partial<Record<CouponSlot, string>>>({});

  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoting, setQuoting] = useState(true);
  const [quoteError, setQuoteError] = useState('');
  const [quoteNonce, setQuoteNonce] = useState(0);

  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [sheetSlot, setSheetSlot] = useState<CouponSlot | null>(null);
  const [applying, setApplying] = useState(false);

  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const { savedCodes } = useVoucherWallet();

  const address = useMemo(() => addresses?.find((a) => a._id === addressId) ?? null, [addresses, addressId]);

  /* ---------- Địa chỉ ---------- */
  useEffect(() => {
    if (!authed) return;
    userService.getProfile()
      .then((p) => {
        const list = Array.isArray(p?.addresses) ? p.addresses : [];
        setAddresses(list);
        setAddressId((list.find((a) => a.is_default) || list[0])?._id ?? null);
      })
      .catch(() => setAddresses([]));
  }, [authed]);

  /* ---------- Xem trước đơn: server tính giá, phí ship, mã ---------- */
  useEffect(() => {
    if (!authed || !handoff || addresses === null) return;
    const ctrl = new AbortController();
    setQuoting(true);
    setQuoteError('');
    ordersService.quote({
      items: handoff.lines,
      shippingAddress: address ?? undefined,
      couponCode: codes.PRODUCT,
      shippingCouponCode: codes.SHIPPING,
    }, ctrl.signal)
      .then((q) => {
        setQuote(q);
        const failed = (Object.keys(q.couponErrors || {}) as CouponSlot[]).filter((s) => codes[s]);
        if (failed.length > 0) {
          setCodes((prev) => {
            const next = { ...prev };
            failed.forEach((s) => delete next[s]);
            return next;
          });
          showToast(q.couponErrors[failed[0]] || 'Mã giảm giá không còn dùng được cho đơn này.', 'error');
        }
        if (!q.codAllowed) setPaymentMethod('payos');
      })
      .catch((err) => {
        if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED') return;
        setQuoteError(getApiErrorMessage(err, 'Không tính được tiền đơn hàng.'));
      })
      .finally(() => { if (!ctrl.signal.aborted) setQuoting(false); });
    return () => ctrl.abort();
  }, [authed, handoff, addresses, address, codes, quoteNonce, showToast]);

  /* ---------- Voucher khả dụng (theo shop và tiền hàng) ---------- */
  const quoteShopId = quote?.shopId ?? null;
  const quoteSubtotal = quote?.subtotal ?? 0;
  const loadCoupons = useCallback(async () => {
    if (!quote) return;
    setCouponsLoading(true);
    try {
      const data = await promotionService.getAvailableCoupons({
        shopId: quote.shopId || undefined,
        productId: quote.items[0]?.productId,
        subtotal: quote.subtotal,
        items: JSON.stringify(quote.items.map((it) => ({ productId: it.productId, price: it.unitPrice, quantity: it.quantity }))),
      });
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteShopId, quoteSubtotal]);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  if (!authed) return <Navigate to={`/login?next=${encodeURIComponent('/checkout')}`} replace />;
  if (!handoff) return <Navigate to="/cart" replace />;

  const applyCode = async (code: string, slot?: CouponSlot) => {
    if (!quote) return;
    setApplying(true);
    try {
      const res = await promotionService.applyCoupon({
        code,
        subtotal: quote.subtotal,
        shippingFee: quote.shippingFee,
        shopId: quote.shopId || undefined,
        productId: quote.items[0]?.productId,
        items: quote.items.map((it) => ({ productId: it.productId, price: it.unitPrice, quantity: it.quantity })),
      });
      if (slot && res.target !== slot) {
        showToast(slot === 'SHIPPING' ? 'Mã này không phải ưu đãi phí vận chuyển.' : 'Đây là mã vận chuyển, hãy chọn ở ô Ưu đãi phí vận chuyển.', 'error');
        return;
      }
      setCodes((prev) => ({ ...prev, [res.target]: code }));
      setSheetSlot(null);
      showToast(`Đã áp dụng mã ${code}.`);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Mã không hợp lệ hoặc đơn chưa đủ điều kiện.'), 'error');
    } finally {
      setApplying(false);
    }
  };

  const removeCode = (slot: CouponSlot) => {
    setCodes((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const saveNewAddress = async (data: Partial<Address>) => {
    const before = new Set((addresses || []).map((a) => a._id));
    const list = await userService.addAddress(data);
    const next = Array.isArray(list) ? list : [];
    setAddresses(next);
    const created = next.find((a) => !before.has(a._id)) || next[next.length - 1];
    if (created?._id) setAddressId(created._id);
    setAddressFormOpen(false);
    showToast('Đã thêm địa chỉ giao hàng.');
  };

  const blockReason = (() => {
    if (addresses !== null && !address) return 'Thêm địa chỉ nhận hàng để đặt đơn.';
    if (quoteError) return quoteError;
    return '';
  })();

  const placeOrder = async () => {
    if (placingRef.current || !quote || quoting) return;
    if (!address) {
      setPickerOpen(true);
      return;
    }
    placingRef.current = true;
    setPlacing(true);
    try {
      const created = await ordersService.create({
        items: handoff.lines,
        source: handoff.source,
        paymentGateway: paymentMethod,
        shippingProvider: 'ghn',
        shippingAddress: {
          recipient_name: address.recipient_name,
          phone: address.phone,
          address_detail: address.address_detail,
          province_id: address.province_id,
          district_id: address.district_id,
          ward_code: address.ward_code,
        },
        couponCode: codes.PRODUCT,
        shippingCouponCode: codes.SHIPPING,
      });
      clearCheckoutHandoff();
      // Server đã bỏ hàng vừa mua khỏi giỏ; tải lại để số trên biểu tượng giỏ đúng.
      cartService.getCart()
        .then((c) => outlet.setCartCount?.((c?.items || []).reduce((s: number, it: any) => s + (it.quantity || 1), 0)))
        .catch(() => {});

      const orderPath = `/orders/${encodeURIComponent(created.id)}`;
      if (paymentMethod === 'payos') {
        try {
          const { checkoutUrl } = await ordersService.createPayosPayment(created.id);
          window.location.replace(checkoutUrl);
          return;
        } catch {
          // Đơn đã tạo: trang chi tiết đơn có nút thanh toán lại.
          navigate(`${orderPath}?payment=cancelled`, { replace: true });
          return;
        }
      }
      navigate(orderPath, { replace: true });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không đặt được đơn. Vui lòng thử lại.'), 'error');
      setQuoteNonce((n) => n + 1);
      placingRef.current = false;
      setPlacing(false);
    }
  };

  const ctaLabel = placing
    ? 'Đang đặt đơn...'
    : paymentMethod === 'payos' ? 'Đặt hàng và thanh toán' : 'Đặt hàng';
  const ctaDisabled = placing || quoting || !quote || Boolean(blockReason);
  const itemCount = quote?.items.reduce((s, it) => s + it.quantity, 0) ?? handoff.lines.reduce((s, l) => s + l.quantity, 0);

  const voucherSlot = (slot: CouponSlot) => {
    const code = codes[slot];
    const info = slot === 'PRODUCT' ? quote?.coupons.product : quote?.coupons.shipping;
    const off = slot === 'PRODUCT' ? quote?.productDiscount ?? 0 : quote?.shippingDiscount ?? 0;
    return (
      <div className="vc-vslot" data-applied={Boolean(code)}>
        <button type="button" onClick={() => setSheetSlot(slot)} disabled={!quote} className="flex min-w-0 items-center gap-3 px-4 py-3 text-left">
          <span className={code ? 'text-[var(--c-green)]' : 'text-[var(--c-muted)]'}><SlotIcon slot={slot} /></span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-[var(--c-ink)]">{slot === 'PRODUCT' ? 'Voucher giảm giá' : 'Ưu đãi vận chuyển'}</span>
            <span className="block truncate text-[12.5px] text-[var(--c-muted)]">
              {code ? <>{code}{info?.isPlatform === false ? ', voucher shop' : ''}{off > 0 ? ` (-${vnd(off)})` : ''}</> : 'Chọn hoặc nhập mã'}
            </span>
          </span>
        </button>
        <div className="vc-vslot-stub">
          {code ? (
            <button type="button" onClick={() => removeCode(slot)} aria-label={`Bỏ mã ${code}`} className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-white hover:text-[var(--c-rose)]"><X size={16} /></button>
          ) : (
            <ChevronRight size={16} className="text-[var(--c-muted)]" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="vc-commerce">
      <div className="mx-auto max-w-[1200px] px-4 pb-40 pt-5 sm:px-6 lg:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (handoff.source === 'cart' ? navigate('/cart') : navigate(-1))}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--c-muted)] hover:text-[var(--c-ink)]"
          >
            <ChevronLeft size={16} /> {handoff.source === 'cart' ? 'Giỏ hàng' : 'Quay lại'}
          </button>
          <ol className="m-0 flex list-none items-center gap-2 p-0 text-[12.5px]" aria-label="Các bước mua hàng">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2" aria-current={i === 1 ? 'step' : undefined}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${i < 1 ? 'bg-[var(--c-green)] text-white' : i === 1 ? 'border-2 border-[var(--c-green)] text-[var(--c-green)]' : 'border border-[var(--c-line-strong)] text-[var(--c-muted)]'}`}>{i + 1}</span>
                <span className={i === 1 ? 'font-semibold text-[var(--c-ink)]' : 'text-[var(--c-muted)]'}>{s}</span>
                {i < STEPS.length - 1 && <span aria-hidden className="h-px w-5 border-t-[1.5px] border-dashed border-[var(--c-thread)] sm:w-8" />}
              </li>
            ))}
          </ol>
        </div>

        <h1 className="vc-display m-0 mb-6 mt-4 text-[28px] font-semibold leading-tight text-[var(--c-plum)] sm:text-[34px]">Thanh toán</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {/* Giao đến */}
            <section className="vc-panel overflow-hidden" aria-labelledby="ship-to">
              <div className="vc-band flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                <h2 id="ship-to" className="m-0 flex items-center gap-2 text-[15px] font-semibold"><MapPin size={17} className="text-[var(--c-green)]" /> Giao đến</h2>
                {addresses && addresses.length > 0 && (
                  <button type="button" onClick={() => setPickerOpen(true)} className="text-[13px] font-semibold text-[var(--c-green)] hover:underline">Đổi địa chỉ</button>
                )}
              </div>
              <div className="px-5 py-4 sm:px-6">
              {addresses === null ? (
                <div className="space-y-2"><div className="vc-skel h-4 w-1/2" /><div className="vc-skel h-3 w-3/4" /></div>
              ) : address ? (
                <div className="text-sm leading-relaxed">
                  <p className="m-0 font-semibold text-[var(--c-ink)]">{address.recipient_name} <span className="font-normal text-[var(--c-muted)]">({address.phone})</span></p>
                  <p className="m-0 text-[var(--c-body)]">{address.address_detail}</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span>Bạn chưa có địa chỉ nhận hàng.</span>
                  <button type="button" onClick={() => setAddressFormOpen(true)} className="inline-flex items-center gap-1 font-semibold underline"><Plus size={14} /> Thêm địa chỉ</button>
                </div>
              )}
              </div>
            </section>

            {/* Kiện hàng */}
            <section className="vc-parcel" data-active="true" aria-labelledby="parcel-title">
              <div className="mx-5 flex items-center gap-2.5 border-b border-[var(--c-line)] pb-3.5 pt-5 sm:mx-6">
                {quote?.shopLogo ? (
                  <img src={mediaUrl(quote.shopLogo)} alt="" className="h-7 w-7 rounded-full border border-[var(--c-line)] object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : <Store size={18} className="text-[var(--c-muted)]" />}
                <h2 id="parcel-title" className="m-0 min-w-0 truncate text-[15px] font-semibold">
                  {quote ? <>Kiện hàng từ {quote.shopId ? <Link to={`/shop/${quote.shopId}`} className="hover:text-[var(--c-green)]">{quote.shopName}</Link> : quote.shopName}</> : 'Kiện hàng'}
                </h2>
                <span className="ml-auto shrink-0 text-[13px] text-[var(--c-muted)]">{itemCount} sản phẩm</span>
              </div>

              {quoteError && !quote ? (
                <div className="px-5 pb-5 sm:px-6" role="alert">
                  <p className="m-0 mt-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">{quoteError}</p>
                  <div className="mt-3 flex gap-4 text-sm font-semibold">
                    <button type="button" onClick={() => setQuoteNonce((n) => n + 1)} className="text-[var(--c-green)] hover:underline">Thử lại</button>
                    <Link to="/cart" className="text-[var(--c-muted)] hover:underline">Sửa giỏ hàng</Link>
                  </div>
                </div>
              ) : !quote ? (
                <div className="space-y-4 px-5 pb-5 pt-2 sm:px-6">
                  {handoff.lines.map((l) => (
                    <div key={`${l.productId}-${l.variantId}`} className="flex gap-4"><div className="vc-skel h-20 w-20 shrink-0 rounded-xl" /><div className="flex-1 space-y-2 pt-1"><div className="vc-skel h-4 w-2/3" /><div className="vc-skel h-3 w-1/3" /></div></div>
                  ))}
                </div>
              ) : (
                <>
                  <ul className="m-0 list-none divide-y divide-[var(--c-line)] px-5 sm:px-6">
                    {quote.items.map((it) => (
                      <li key={`${it.productId}-${it.variantId}`} className="flex gap-4 py-4">
                        <img src={mediaUrl(it.image) || PLACEHOLDER_IMG} alt={it.title} onError={onImgError} className="h-20 w-20 shrink-0 rounded-xl border border-[var(--c-line)] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 line-clamp-2 text-[14.5px] font-medium leading-snug">{it.title}</p>
                          <p className="m-0 mt-1 text-[13px] text-[var(--c-muted)]">{[it.color, it.size].filter(Boolean).join(', ') || 'Tiêu chuẩn'}</p>
                          <p className="vc-num m-0 mt-1 text-[13px] text-[var(--c-muted)]">{it.quantity} x {vnd(it.unitPrice)}</p>
                        </div>
                        <span className="vc-num shrink-0 text-[14.5px] font-semibold">{vnd(it.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--c-line)] px-5 py-4 text-sm sm:px-6">
                    <span className="flex items-center gap-2 text-[var(--c-body)]"><Truck size={16} className="text-[var(--c-muted)]" /> Giao tiêu chuẩn{address ? `, ${quote.shipping.zoneLabel.toLowerCase()}` : ''}</span>
                    <span className="vc-num font-medium">{!address ? 'Cần địa chỉ' : quote.shippingFee === 0 ? 'Miễn phí' : vnd(quote.shippingFee)}</span>
                  </div>
                </>
              )}
            </section>

            {/* Thanh toán bằng */}
            <fieldset className="vc-panel m-0 overflow-hidden p-0">
              <legend className="sr-only">Phương thức thanh toán</legend>
              <p className="vc-band m-0 px-5 py-3.5 text-[15px] font-semibold sm:px-6" aria-hidden>Thanh toán bằng</p>
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                {([
                  { id: 'payos', title: 'Chuyển khoản QR', desc: 'Quét VietQR bằng ứng dụng ngân hàng qua payOS', disabled: false },
                  { id: 'cod', title: 'Thanh toán khi nhận hàng', desc: quote && !quote.codAllowed ? 'Không áp dụng cho hàng in theo yêu cầu' : 'Trả tiền mặt cho người giao hàng', disabled: Boolean(quote && !quote.codAllowed) },
                ] as const).map((m) => {
                  const on = paymentMethod === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${m.disabled ? 'cursor-not-allowed border-[var(--c-line)] bg-stone-50 opacity-60' : on ? 'border-[var(--c-green)] bg-[var(--c-green-wash)]' : 'border-[var(--c-edge)] hover:border-[var(--c-line-strong)]'}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={on}
                        disabled={m.disabled}
                        onChange={() => setPaymentMethod(m.id)}
                        className="mt-1 h-4 w-4 accent-[var(--c-green)]"
                      />
                      <span>
                        <span className="block text-[14px] font-semibold">{m.title}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--c-muted)]">{m.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Hoá đơn */}
          <aside className="lg:sticky lg:top-24" aria-label="Chi tiết thanh toán">
            <div className="vc-receipt-wrap">
              <div className="vc-receipt p-5 sm:p-6">
                <div className="space-y-2.5">
                  {voucherSlot('PRODUCT')}
                  {voucherSlot('SHIPPING')}
                </div>

                <dl className="m-0 mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--c-muted)]">Tiền hàng</dt>
                    <dd className="vc-num m-0">{quote ? vnd(quote.subtotal) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--c-muted)]">Phí vận chuyển</dt>
                    <dd className="vc-num m-0">{!quote ? '—' : quote.shippingFee === 0 ? 'Miễn phí' : vnd(quote.shippingFee)}</dd>
                  </div>
                  {quote && quote.productDiscount > 0 && (
                    <div className="flex justify-between gap-3 text-[var(--c-green)]">
                      <dt>{quote.coupons.product?.isPlatform === false ? 'Voucher của shop' : 'Voucher VietCraft'}</dt>
                      <dd className="vc-num m-0 font-semibold">-{vnd(quote.productDiscount)}</dd>
                    </div>
                  )}
                  {quote && quote.shippingDiscount > 0 && (
                    <div className="flex justify-between gap-3 text-[var(--c-green)]">
                      <dt>Ưu đãi vận chuyển</dt>
                      <dd className="vc-num m-0 font-semibold">-{vnd(quote.shippingDiscount)}</dd>
                    </div>
                  )}
                </dl>

                <div className="vc-perf my-5 -mx-5 sm:-mx-6" />

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">Tổng thanh toán</span>
                  <span className="vc-display vc-num flex items-center gap-2 text-[28px] font-semibold text-[var(--c-plum)]">
                    {quoting && quote && <Loader2 size={16} className="animate-spin text-[var(--c-muted)]" aria-label="Đang cập nhật" />}
                    {quote ? vnd(quote.total) : '—'}
                  </span>
                </div>
                {quote && quote.productDiscount + quote.shippingDiscount > 0 && (
                  <p className="m-0 mt-1 text-right text-[12.5px] font-semibold text-[var(--c-green)]">Bạn tiết kiệm {vnd(quote.productDiscount + quote.shippingDiscount)}</p>
                )}

                {blockReason && <p className="m-0 mt-3 text-[13px] text-[var(--c-rose)]" role="alert">{blockReason}</p>}

                <button
                  type="button"
                  onClick={() => void placeOrder()}
                  disabled={ctaDisabled}
                  className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--c-green)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--c-green-deep)] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 lg:flex"
                >
                  {placing && <Loader2 size={16} className="animate-spin" />} {ctaLabel}
                </button>
                <p className="m-0 mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[var(--c-muted)]">
                  <ShieldCheck size={13} /> Số tiền trên do VietCraft tính và sẽ không đổi khi bạn đặt
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Thanh đặt hàng trên điện thoại */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--c-line)] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs text-[var(--c-muted)]">Tổng thanh toán</p>
            <p className="vc-display vc-num m-0 text-xl font-semibold text-[var(--c-plum)]">{quote ? vnd(quote.total) : '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => void placeOrder()}
            disabled={ctaDisabled}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-[var(--c-green)] px-6 text-[15px] font-semibold text-white disabled:bg-stone-200 disabled:text-stone-500"
          >
            {placing && <Loader2 size={16} className="animate-spin" />} {ctaLabel}
          </button>
        </div>
      </div>

      {/* Chọn địa chỉ */}
      {pickerOpen && addresses && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="addr-title" onClick={() => setPickerOpen(false)}>
          <div className="vc-sheet flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--c-line)] px-6 pb-4 pt-5">
              <h3 id="addr-title" className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">Giao đến</h3>
              <button type="button" onClick={() => setPickerOpen(false)} aria-label="Đóng" className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-stone-100"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto px-6 py-4" role="radiogroup" aria-label="Địa chỉ đã lưu">
              {addresses.map((a) => (
                <label key={a._id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${a._id === addressId ? 'border-[var(--c-green)] bg-[var(--c-green-wash)]' : 'border-[var(--c-line)] hover:border-[var(--c-line-strong)]'}`}>
                  <input type="radio" name="address" checked={a._id === addressId} onChange={() => { setAddressId(a._id ?? null); setPickerOpen(false); }} className="mt-1 h-4 w-4 accent-[var(--c-green)]" />
                  <span className="text-sm leading-relaxed">
                    <span className="block font-semibold">{a.recipient_name} <span className="font-normal text-[var(--c-muted)]">({a.phone})</span></span>
                    <span className="block text-[var(--c-body)]">{a.address_detail}</span>
                    {a.is_default && <span className="mt-1 inline-block text-[12px] font-semibold text-[var(--c-green)]">Mặc định</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="border-t border-[var(--c-line)] px-6 py-4">
              <button type="button" onClick={() => { setPickerOpen(false); setAddressFormOpen(true); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--c-green)] hover:underline">
                <Plus size={15} /> Thêm địa chỉ mới
              </button>
            </div>
          </div>
        </div>
      )}

      <AddressFormModal
        isOpen={addressFormOpen}
        onClose={() => setAddressFormOpen(false)}
        editingAddress={null}
        onSaveAddress={saveNewAddress}
      />

      <CouponSheet
        open={sheetSlot !== null}
        slot={sheetSlot ?? 'PRODUCT'}
        coupons={coupons}
        loading={couponsLoading}
        appliedCode={sheetSlot ? codes[sheetSlot] : undefined}
        shopId={quote?.shopId ?? null}
        lines={quote?.items ?? []}
        subtotal={quote?.subtotal ?? 0}
        shippingFee={quote?.shippingFee ?? 0}
        savedCodes={savedCodes}
        applying={applying}
        onApply={(code, slot) => void applyCode(code, slot)}
        onClose={() => setSheetSlot(null)}
      />

      <CommerceToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

export default BuyerCheckoutPage;
