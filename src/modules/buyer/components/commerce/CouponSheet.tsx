import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Store, Ticket, Truck, X } from 'lucide-react';
import type { CouponDTO } from '../../../promotion/services/promotionService';
import { toNumber, vnd } from './format';

export type CouponSlot = 'PRODUCT' | 'SHIPPING';

interface Line { productId: string; unitPrice: number; quantity: number }

interface CouponSheetProps {
  open: boolean;
  slot: CouponSlot;
  coupons: CouponDTO[];
  loading: boolean;
  appliedCode?: string;
  shopId: string | null;
  lines: Line[];
  subtotal: number;
  shippingFee: number;
  savedCodes: string[];
  applying: boolean;
  onApply: (code: string, slot: CouponSlot) => void;
  onClose: () => void;
}

const valueLabel = (c: CouponDTO) => {
  const v = toNumber(c.discount_value);
  const cap = toNumber(c.max_discount_amount);
  switch (c.discount_type) {
    case 'PERCENTAGE': return `Giảm ${v}%${cap > 0 ? `, tối đa ${vnd(cap)}` : ''}`;
    case 'FIXED_AMOUNT': return `Giảm ${vnd(v)}`;
    case 'FREE_SHIPPING': return v > 0 ? `Giảm ${vnd(v)} phí vận chuyển` : 'Miễn phí vận chuyển';
    default: return v <= 100 ? `Giảm ${v}%${cap > 0 ? `, tối đa ${vnd(cap)}` : ''}` : `Giảm ${vnd(v)}`;
  }
};

export function CouponSheet(props: CouponSheetProps) {
  const { open, slot, coupons, loading, appliedCode, shopId, lines, subtotal, shippingFee, savedCodes, applying, onApply, onClose } = props;
  const [manual, setManual] = useState('');
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setManual('');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const rows = useMemo(() => {
    const slotCoupons = coupons.filter((c) => (c.discount_type === 'FREE_SHIPPING') === (slot === 'SHIPPING'));

    const blockedReason = (c: CouponDTO): string | null => {
      if (c.used_by_buyer) return 'Bạn đã dùng mã này. Mỗi tài khoản dùng 1 lần.';
      if (c.shop_id && shopId && String((c.shop_id as any)?._id || c.shop_id) !== shopId) return 'Không áp dụng cho shop này';
      if (c.is_eligible === false) {
        if (c.min_order_diff && c.min_order_diff > 0) return `Mua thêm ${vnd(c.min_order_diff)} để dùng`;
        return c.scope_message || 'Đơn chưa đủ điều kiện';
      }
      return null;
    };

    // Ước tính mức giảm để sắp xếp; số chính thức do server tính khi áp mã.
    const estimate = (c: CouponDTO): number => {
      const v = toNumber(c.discount_value);
      const base = c.applicable_scope === 'SPECIFIC_PRODUCTS'
        ? lines.filter((l) => (c.applicable_product_ids || []).includes(l.productId)).reduce((s, l) => s + l.unitPrice * l.quantity, 0)
        : subtotal;
      const capRaw = toNumber(c.max_discount_amount);
      const cap = capRaw > 0 ? capRaw : Infinity;
      const pct = (p: number) => Math.min(Math.round((base * p) / 100), cap, base);
      if (c.discount_type === 'PERCENTAGE') return pct(v);
      if (c.discount_type === 'FIXED_AMOUNT') return Math.min(v, base);
      if (c.discount_type === 'FREE_SHIPPING') return v > 0 ? Math.min(v, shippingFee) : shippingFee;
      return v <= 100 ? pct(v) : Math.min(v, cap, base);
    };

    const list = slotCoupons.map((c) => {
      const blocked = blockedReason(c);
      const saving = blocked ? 0 : estimate(c);
      return { c, blocked: blocked ?? (saving <= 0 ? 'Không giảm thêm cho đơn này' : null), saving, saved: savedCodes.includes(c.code) };
    });
    list.sort((a, b) => {
      if (!a.blocked !== !b.blocked) return a.blocked ? 1 : -1;
      if (b.saving !== a.saving) return b.saving - a.saving;
      return Number(b.saved) - Number(a.saved);
    });
    return list;
  }, [coupons, slot, shopId, lines, subtotal, shippingFee, savedCodes]);

  if (!open) return null;
  const bestId = rows.find((r) => !r.blocked)?.c.id;
  const title = slot === 'SHIPPING' ? 'Ưu đãi phí vận chuyển' : 'Voucher giảm giá';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="coupon-title" onClick={onClose}>
      <div className="vc-sheet flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--c-line)] px-6 pb-4 pt-5">
          <div>
            <h3 id="coupon-title" className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">{title}</h3>
            <p className="m-0 mt-1 text-[13px] text-[var(--c-muted)]">Mỗi đơn dùng 1 voucher giảm giá và 1 ưu đãi vận chuyển.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-stone-100"><X size={18} /></button>
        </div>

        <form
          className="flex gap-2 px-6 pt-4"
          onSubmit={(e) => { e.preventDefault(); if (manual.trim()) onApply(manual.trim().toUpperCase(), slot); }}
        >
          <label className="sr-only" htmlFor="coupon-manual">Nhập mã</label>
          <input
            id="coupon-manual"
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full border border-[var(--c-line-strong)] px-4 text-sm uppercase tracking-wide outline-none focus:border-[var(--c-green)]"
          />
          <button type="submit" disabled={applying || !manual.trim()} className="h-11 shrink-0 rounded-full bg-[var(--c-ink)] px-5 text-sm font-semibold text-white disabled:opacity-40">
            Áp dụng
          </button>
        </form>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto px-6 pb-6">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--c-muted)]"><Loader2 size={16} className="animate-spin" /> Đang tìm voucher dùng được</p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--c-muted)]">Chưa có voucher phù hợp với đơn này. Bạn vẫn có thể nhập mã ở trên.</p>
          ) : rows.map(({ c, blocked, saving, saved }, i) => {
            const inUse = appliedCode === c.code;
            const best = c.id === bestId && !appliedCode;
            // Nhóm "chưa dùng được" luôn nằm dưới (đã sắp xếp), có tiêu đề riêng như các sàn khác.
            const firstBlocked = blocked && (i === 0 || !rows[i - 1].blocked);
            return (
              <div key={c.id}>
              {firstBlocked && (
                <p className="m-0 mb-3 mt-5 text-[13px] font-semibold text-[var(--c-muted)] first:mt-0">
                  Chưa dùng được cho đơn này
                </p>
              )}
              <div className={`vc-vslot ${blocked ? 'opacity-55' : ''}`} data-applied={inUse}>
                <div className="min-w-0 px-4 py-3">
                  <p className="vc-display m-0 text-[15px] font-semibold text-[var(--c-plum)]">{valueLabel(c)}</p>
                  <p className="m-0 mt-0.5 truncate text-[13px] text-[var(--c-body)]">{c.title}</p>
                  <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--c-muted)]">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold tracking-wide text-[var(--c-ink)]">{c.code}</span>
                    {c.is_platform ? (
                      <span className="font-semibold text-[var(--c-green)]">Toàn sàn</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Store size={11} />{c.shop_name}</span>
                    )}
                    {toNumber(c.min_order_value) > 0 && <span>Đơn từ {vnd(toNumber(c.min_order_value))}</span>}
                    <span>HSD {new Date(c.end_date).toLocaleDateString('vi-VN')}</span>
                    {saved && <span className="font-semibold text-[var(--c-green)]">Đã lưu</span>}
                  </p>
                  {blocked ? (
                    <p className="m-0 mt-1.5 text-[12.5px] font-medium text-[var(--c-amber)]">{blocked}</p>
                  ) : saving > 0 && (
                    <p className="m-0 mt-1.5 text-[12.5px] font-semibold text-[var(--c-rose)]">
                      {best ? 'Tiết kiệm nhiều nhất: ' : 'Tiết kiệm khoảng '}{vnd(saving)}
                    </p>
                  )}
                </div>
                <div className="vc-vslot-stub">
                  {inUse ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--c-green)]"><Check size={14} /> Đang dùng</span>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(blocked) || applying}
                      onClick={() => onApply(c.code, slot)}
                      className="whitespace-nowrap rounded-full bg-[var(--c-green)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--c-green-deep)] disabled:bg-stone-200 disabled:text-stone-500"
                    >
                      Dùng
                    </button>
                  )}
                </div>
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const SlotIcon = ({ slot }: { slot: CouponSlot }) => (slot === 'SHIPPING' ? <Truck size={16} /> : <Ticket size={16} />);
