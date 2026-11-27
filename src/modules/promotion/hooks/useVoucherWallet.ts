import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { isLoggedIn, getApiErrorMessage } from '../../../infrastructure/api/interceptors';

/**
 * Ví voucher của tài khoản (lưu ở server, như Shopee): mã đã lưu đi theo tài khoản trên mọi thiết bị
 * và được đưa lên đầu danh sách khi thanh toán. Mọi trang dùng chung một kho trong bộ nhớ, nên lưu ở
 * trang shop thì trang voucher / chi tiết sản phẩm cập nhật theo ngay.
 */

type Listener = (codes: string[]) => void;

let savedCodes: string[] = [];
let loadedFor: string | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l(savedCodes));

const sessionKey = () => (isLoggedIn() ? 'user' : null);

async function load(force = false) {
  const key = sessionKey();
  if (!key) {
    savedCodes = [];
    loadedFor = null;
    emit();
    return;
  }
  if (!force && loadedFor === key) return;
  if (!inflight) {
    inflight = api.get('/promotions/saved')
      .then((res) => {
        savedCodes = Array.isArray(res.data) ? res.data.map((r: any) => String(r.code)) : [];
        loadedFor = key;
        emit();
      })
      .catch(() => { /* giữ nguyên danh sách hiện có; lần sau thử lại */ })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** Gọi khi đăng nhập / đăng xuất để ví không giữ dữ liệu của tài khoản trước. */
export function resetVoucherWallet() {
  savedCodes = [];
  loadedFor = null;
  emit();
}

type Notify = (message: string, type: 'success' | 'info' | 'error') => void;
type CouponLike = { id?: string; _id?: string; code: string };

export function useVoucherWallet(notify?: Notify) {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<string[]>(savedCodes);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    const l: Listener = (c) => setCodes(c);
    listeners.add(l);
    load();
    return () => { listeners.delete(l); };
  }, []);

  const isSaved = useCallback((code: string) => codes.includes(code), [codes]);

  /** Lưu / bỏ lưu một mã. Khách chưa đăng nhập được đưa tới trang đăng nhập rồi quay lại đúng trang. */
  const toggle = useCallback(async (coupon: CouponLike) => {
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const couponId = coupon.id || coupon._id;
    if (!couponId || pending) return;
    setPending(coupon.code);
    const wasSaved = savedCodes.includes(coupon.code);
    try {
      if (wasSaved) {
        await api.delete(`/promotions/${couponId}/save`);
        savedCodes = savedCodes.filter((c) => c !== coupon.code);
        notify?.(`Đã bỏ lưu mã ${coupon.code}`, 'info');
      } else {
        await api.post(`/promotions/${couponId}/save`);
        savedCodes = [...savedCodes, coupon.code];
        notify?.(`Đã lưu mã ${coupon.code} vào ví voucher. Mã sẽ hiện đầu danh sách khi thanh toán.`, 'success');
      }
      emit();
    } catch (err) {
      notify?.(getApiErrorMessage(err, 'Không thể cập nhật ví voucher, vui lòng thử lại.'), 'error');
      load(true);
    } finally {
      setPending(null);
    }
  }, [navigate, notify, pending]);

  return { savedCodes: codes, isSaved, toggle, pendingCode: pending };
}
