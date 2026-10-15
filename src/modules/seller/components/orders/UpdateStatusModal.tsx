/**
 * Hộp thoại xác nhận đổi trạng thái đơn hàng.
 *
 * Mỗi bước chuyển đều đi qua đây thay vì bấm một phát là xong: các bước này KHÔNG lùi
 * lại được (BE chặn), nên người bán phải được đọc lại mình sắp làm gì trước khi chốt.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Truck, X } from 'lucide-react';

import { ModalOverlay } from '../../../../shared/components/ModalOverlay';
import type { SellerOrder } from '../../types/order';
import type { StatusAction } from './orderStatusMeta';
import { CARRIER_LABEL } from './orderStatusMeta';

export interface StatusSubmitPayload {
  trackingNumber?: string;
  carrier?: 'ghn' | 'ghtk';
  note?: string;
}

const FIELD =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition-colors duration-150 placeholder:text-stone-400 focus:border-[#007700] motion-reduce:transition-none';

export function UpdateStatusModal({
  order,
  action,
  loading = false,
  onClose,
  onConfirm,
}: {
  order: SellerOrder | null;
  action: StatusAction | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: StatusSubmitPayload) => void;
}) {
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState<'ghn' | 'ghtk'>('ghn');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Mở lại hộp thoại cho đơn khác phải là tờ giấy trắng, không dính mã vận đơn cũ.
  useEffect(() => {
    if (!order || !action) return;
    setTracking(order.shipping.trackingNumber || '');
    setCarrier(order.shipping.carrier === 'ghtk' ? 'ghtk' : 'ghn');
    setNote('');
    setError('');
  }, [order, action]);

  if (!order || !action) return null;

  const submit = () => {
    if (action.requiresTracking && !tracking.trim()) {
      setError('Nhập mã vận đơn do đơn vị vận chuyển cấp.');
      return;
    }
    onConfirm({
      trackingNumber: tracking.trim() || undefined,
      carrier: action.requiresTracking ? carrier : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-md animate-scale-up overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              action.destructive ? 'bg-rose-100 text-rose-600' : 'bg-[#EAF0E2] text-[#007700]'
            }`}
          >
            {action.destructive ? <AlertTriangle size={19} aria-hidden /> : <Truck size={19} aria-hidden />}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 motion-reduce:transition-none"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-3 px-6 py-2">
          <h3 className="m-0 text-lg font-bold text-stone-900 font-jakarta">{action.label}</h3>
          <p className="m-0 text-[13px] leading-relaxed text-stone-600">
            Đơn{' '}
            <span className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-bold text-stone-900">
              {order.orderCode}
            </span>
            : {action.description}
          </p>

          {action.requiresTracking && (
            <div className="space-y-2.5 pt-1">
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-stone-500">
                  Đơn vị vận chuyển
                </span>
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value as 'ghn' | 'ghtk')}
                  className={`${FIELD} cursor-pointer`}
                >
                  <option value="ghn">{CARRIER_LABEL.ghn} (GHN)</option>
                  <option value="ghtk">{CARRIER_LABEL.ghtk} (GHTK)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-stone-500">
                  Mã vận đơn
                </span>
                <input
                  value={tracking}
                  autoFocus
                  onChange={e => {
                    setTracking(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="VD: GHN123456789"
                  className={`${FIELD} ${error ? 'border-rose-300' : ''}`}
                />
              </label>
              {error && (
                <p role="alert" className="m-0 text-[12px] font-semibold text-[#BA1A1A]">
                  {error}
                </p>
              )}
            </div>
          )}

          <label className="block pt-1">
            <span className="mb-1 block text-[11.5px] font-bold uppercase tracking-wider text-stone-500">
              Ghi chú {action.destructive ? '(lý do huỷ)' : '(không bắt buộc)'}
            </span>
            <textarea
              value={note}
              rows={2}
              onChange={e => setNote(e.target.value)}
              placeholder={action.destructive ? 'VD: Khách yêu cầu huỷ, hết phôi...' : 'Ghi chú nội bộ cho đơn này'}
              className={`${FIELD} resize-y`}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-xl border-none bg-transparent px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 disabled:opacity-50 motion-reduce:transition-none"
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className={`cursor-pointer rounded-xl border-none px-4 py-2 text-sm font-semibold text-white transition-colors disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none ${
              action.destructive ? 'bg-[#BA1A1A] hover:bg-[#911414]' : 'bg-[#007700] hover:bg-[#005B00]'
            }`}
          >
            {loading ? 'Đang lưu…' : action.label}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
