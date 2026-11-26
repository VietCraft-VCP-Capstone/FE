/**
 * Bàn giao từ giỏ hàng / Mua ngay sang trang thanh toán.
 * Chỉ mang id + số lượng: giá, phí ship và mã giảm do server tính lại ở bước thanh toán (POST /orders/quote).
 * Trang chi tiết sản phẩm (Mua ngay) còn ghi dạng mảng cũ; đọc được cả hai dạng.
 */
export const CHECKOUT_KEY = 'vietcraft_checkout';

export type CheckoutSource = 'cart' | 'buy_now';

export interface CheckoutLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CheckoutHandoff {
  source: CheckoutSource;
  lines: CheckoutLine[];
}

const toLine = (raw: any): CheckoutLine | null => {
  const productId = raw?.productId ? String(raw.productId) : '';
  if (!productId) return null;
  const variantId = raw?.variantId && raw.variantId !== 'default' ? String(raw.variantId) : undefined;
  const quantity = Math.max(1, Math.floor(Number(raw?.quantity) || 1));
  return { productId, variantId, quantity };
};

export function readCheckoutHandoff(): CheckoutHandoff | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHECKOUT_KEY) || 'null');
    const source: CheckoutSource = Array.isArray(parsed) ? 'buy_now' : parsed?.source === 'cart' ? 'cart' : 'buy_now';
    const rawLines = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.lines) ? parsed.lines : [];
    const lines = rawLines.map(toLine).filter(Boolean) as CheckoutLine[];
    return lines.length > 0 ? { source, lines } : null;
  } catch {
    return null;
  }
}

export function writeCheckoutHandoff(handoff: CheckoutHandoff) {
  try {
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify(handoff));
  } catch { /* trình duyệt chặn bộ nhớ: trang thanh toán sẽ đưa về giỏ */ }
}

export function clearCheckoutHandoff() {
  try {
    localStorage.removeItem(CHECKOUT_KEY);
  } catch { /* bỏ qua */ }
}
