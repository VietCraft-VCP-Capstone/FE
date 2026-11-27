/** Câu giải thích ngắn ghi thẳng cạnh trạng thái và các ô tổng của Kho voucher. */
import type { VoucherDraft, VoucherStock } from '../../moneyTypes';

type Item = VoucherStock['items'][number];
const DAY = 86_400_000;

export function statusNote(v: Item, now = Date.now()): string {
  const end = v.end_date ? new Date(v.end_date).getTime() : null;
  switch (v.status) {
    case 'unused': return '0 lượt dùng';
    case 'low': return `mới dùng ${Math.round((v.used / v.limit) * 100)}% lượt`;
    case 'expiring': return end ? `còn ${Math.max(0, Math.ceil((end - now) / DAY))} ngày` : '';
    case 'ended': return end !== null && end < now ? 'đã quá hạn' : 'shop đã tắt';
    default: return '';
  }
}

export function idleNote(items: Item[]): string {
  const unused = items.filter(v => v.status === 'unused').length;
  const low = items.filter(v => v.status === 'low').length;
  return [unused && `${unused} chưa ai dùng`, low && `${low} dùng dưới 20% lượt`].filter(Boolean).join(', ') || 'Mã nào cũng có người dùng';
}

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;
const off = (v: number) => (v <= 100 ? `${v}%` : vnd(v));

/** Điều kiện mã đề xuất, đọc như người bán sẽ thấy trong hộp tạo mã. */
export function draftTerms(type: string, d: VoucherDraft): string {
  const giam = type === 'PERCENTAGE' ? `Giảm ${d.value}%${d.max_discount ? ` (tối đa ${vnd(d.max_discount)})` : ''}`
    : type === 'FIXED_AMOUNT' ? `Giảm ${vnd(d.value)}`
    : type === 'FREE_SHIPPING' ? `Giảm ${d.value ? vnd(d.value) : '100%'} phí ship`
    : `Giảm ${off(d.value)}`;
  return [giam, d.min_order > 0 && `đơn từ ${vnd(d.min_order)}`, `${d.limit} lượt`, `chạy ${d.days} ngày`].filter(Boolean).join(', ');
}

export function draftLink(type: string, d: VoucherDraft): string {
  const q = new URLSearchParams({ new: type, code: d.code, title: d.title, value: String(d.value), min: String(d.min_order),
    max: String(d.max_discount), limit: String(d.limit), days: String(d.days) });
  return `/seller/promotions?${q}`;
}
