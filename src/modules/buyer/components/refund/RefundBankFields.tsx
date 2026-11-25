import type { ChangeEvent } from 'react';
import type { RefundBankInfo } from '../../../order/services/refundService';

export const EMPTY_BANK_INFO: RefundBankInfo = { bank_name: '', account_holder: '', account_number: '' };

export const isValidBankInfo = (info: RefundBankInfo) =>
  info.bank_name.trim().length >= 2 &&
  info.account_holder.trim().length >= 2 &&
  /^\d{6,20}$/.test(info.account_number.trim());

const fieldClass = 'w-full min-h-11 rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100';

/** Thông tin tài khoản nhận tiền hoàn cho đơn COD, vì cổng thanh toán không có sẵn tài khoản khách. */
export function RefundBankFields({ value, onChange }: { value: RefundBankInfo; onChange: (next: RefundBankInfo) => void }) {
  const set = (key: keyof RefundBankInfo) => (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: key === 'account_number' ? event.target.value.replace(/\D/g, '') : event.target.value });

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <p className="text-sm font-bold text-slate-800">Tài khoản nhận tiền hoàn <span className="text-rose-600">*</span></p>
        <p className="mt-0.5 text-xs text-slate-500">Đơn thanh toán khi nhận hàng nên cần số tài khoản để người bán chuyển khoản hoàn cho bạn.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="block text-xs font-bold text-slate-700">Ngân hàng</span>
          <input className={fieldClass} maxLength={100} value={value.bank_name} onChange={set('bank_name')} placeholder="Ví dụ Vietcombank" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-slate-700">Chủ tài khoản</span>
          <input className={fieldClass} maxLength={100} value={value.account_holder} onChange={set('account_holder')} placeholder="NGUYEN VAN A" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-slate-700">Số tài khoản</span>
          <input className={`${fieldClass} tabular-nums`} inputMode="numeric" maxLength={20} value={value.account_number} onChange={set('account_number')} placeholder="6–20 chữ số" />
        </label>
      </div>
    </div>
  );
}
