import React, { useState } from 'react';
import { SellerPaymentSettings, BankAccountItem } from '../../types/settings';
import { AddBankAccountModal } from './AddBankAccountModal';
import { useToast } from '../../../../shared/components/Toast';
import {
  CreditCard,
  Landmark,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  DollarSign,
  QrCode,
  Check,
  AlertCircle
} from 'lucide-react';

interface PaymentSettingsTabProps {
  initialData: SellerPaymentSettings;
  onSave: (data: SellerPaymentSettings) => void;
  onAddBank: (account: Omit<BankAccountItem, 'id'>) => void;
  onDeleteBank: (id: string) => void;
  onSetDefaultBank: (id: string) => void;
  loading?: boolean;
}

export const PaymentSettingsTab: React.FC<PaymentSettingsTabProps> = ({
  initialData,
  onSave,
  onAddBank,
  onDeleteBank,
  onSetDefaultBank,
  loading = false,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<SellerPaymentSettings>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMinPayoutInvalid = formData.autoWithdraw && (!formData.minPayoutAmount || formData.minPayoutAmount < 50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.autoWithdraw && isMinPayoutInvalid) {
      showToast('Hạn mức rút tiền tối thiểu phải từ 50.000 VNĐ trở lên.', 'error');
      return;
    }
    onSave(formData);
  };

  const payoutPresets = [50000, 200000, 500000, 1000000, 2000000];

  const maskAccountNumber = (acc: string) => {
    if (acc.length <= 4) return acc;
    return `**** **** ${acc.slice(-4)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in font-sans">
      {/* Section 1: Bank Accounts */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
              <Landmark size={18} className="text-[#007700]" />
              <span>Tài khoản ngân hàng thụ hưởng</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Doanh thu từ các đơn hàng thành công sẽ được đối soát và giải ngân về tài khoản này.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#007700] text-xs font-bold rounded-xl border border-emerald-300 transition-colors cursor-pointer font-jakarta self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>

        {/* Bank Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialData.bankAccounts.map((account) => (
            <div
              key={account.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                account.isDefault
                  ? 'border-[#007700] bg-emerald-50/30 ring-2 ring-[#007700]/10 shadow-xs'
                  : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-bold text-xs text-[#007700] shadow-2xs">
                    {account.bankCode || 'BANK'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 font-jakarta leading-tight">
                      {account.bankName}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">{account.branch}</p>
                  </div>
                </div>

                {account.isDefault && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF0E2] text-[#007700] border border-[#BECAB6]/50 flex items-center gap-1 font-jakarta">
                    <CheckCircle2 size={11} /> Mặc định
                  </span>
                )}
              </div>

              {/* Card Details */}
              <div className="mt-4 pt-4 border-t border-stone-200/60 flex items-end justify-between">
                <div>
                  <p className="text-xs font-mono font-bold text-stone-800 tracking-wider">
                    {maskAccountNumber(account.accountNumber)}
                  </p>
                  <p className="text-[11px] font-semibold text-stone-600 uppercase mt-0.5">
                    {account.accountHolder}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!account.isDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefaultBank(account.id)}
                      className="text-xs font-semibold text-[#007700] hover:underline cursor-pointer"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  {initialData.bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteBank(account.id)}
                      className="p-1.5 text-stone-400 hover:text-[#BA1A1A] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa tài khoản"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Payout & Auto Withdrawal Settings */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 font-jakarta flex items-center gap-2">
            <DollarSign size={18} className="text-[#007700]" />
            <span>Cài đặt rút tiền & Đối soát doanh thu</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cấu hình lịch chuyển tiền tự động từ số dư ví Người bán về tài khoản ngân hàng mặc định.
          </p>
        </div>

        {/* Auto withdraw toggle */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900 font-jakarta">
              Tự động rút tiền định kỳ
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Tiền từ ví Seller sẽ tự động chuyển về tài khoản ngân hàng mặc định theo chu kỳ đã chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, autoWithdraw: !formData.autoWithdraw })}
            className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 flex-shrink-0 cursor-pointer ${
              formData.autoWithdraw ? 'bg-[#007700] justify-end' : 'bg-stone-300 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Payout Cycle Select */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Chu kỳ rút tiền
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                value={formData.payoutCycle}
                onChange={e => setFormData({ ...formData, payoutCycle: e.target.value as any })}
                disabled={!formData.autoWithdraw}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer disabled:opacity-50"
              >
                <option value="WEEKLY_MON">Hàng tuần (Vào sáng Thứ Hai)</option>
                <option value="DAILY">Hàng ngày (Vào 18:00 mỗi ngày)</option>
                <option value="MONTHLY_01">Hàng tháng (Vào ngày 01 đầu tháng)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold uppercase tracking-wider font-jakarta transition-colors ${formData.autoWithdraw ? 'text-stone-700' : 'text-stone-400'}`}>
                Hạn mức rút tối thiểu (VNĐ) {formData.autoWithdraw && <span className="text-rose-500">*</span>}
              </label>
              <span className={`text-xs font-bold font-jakarta transition-colors ${formData.autoWithdraw ? 'text-[#007700]' : 'text-stone-400'}`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.minPayoutAmount || 0)}
              </span>
            </div>

            <div className="relative">
              <CreditCard size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${!formData.autoWithdraw ? 'text-stone-300' : isMinPayoutInvalid ? 'text-rose-500' : 'text-stone-400'}`} />
              <input
                type="number"
                step="10000"
                min="50000"
                disabled={!formData.autoWithdraw}
                value={formData.minPayoutAmount || ''}
                onChange={e => setFormData({ ...formData, minPayoutAmount: Number(e.target.value) })}
                placeholder="50000"
                className={`w-full pl-10 pr-16 py-2.5 rounded-xl text-sm font-bold font-jakarta focus:outline-none transition-colors ${
                  !formData.autoWithdraw
                    ? 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed select-none'
                    : isMinPayoutInvalid
                    ? 'bg-rose-50/30 border border-rose-400 text-rose-700 focus:ring-2 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'bg-stone-50/80 border border-stone-200 text-stone-900 focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]'
                }`}
                required={formData.autoWithdraw}
              />
              <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${formData.autoWithdraw ? 'text-stone-400' : 'text-stone-300'}`}>
                VNĐ
              </span>
            </div>

            {/* Validation or Helper Message */}
            {formData.autoWithdraw ? (
              isMinPayoutInvalid ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold animate-fade-in pt-0.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>Hạn mức rút tiền tối thiểu phải từ 50.000 ₫ trở lên.</span>
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 pt-0.5">
                  💡 Hệ thống sẽ tự động chuyển tiền khi số dư ví đạt từ mức này trở lên theo chu kỳ đã chọn.
                </p>
              )
            ) : (
              <p className="text-[11px] text-stone-400 pt-0.5">
                Bật nút <strong>"Tự động rút tiền định kỳ"</strong> ở trên để thiết lập chu kỳ và hạn mức rút tiền.
              </p>
            )}

            {/* Quick Presets */}
            <div className={`flex flex-wrap items-center gap-2 pt-1.5 ${!formData.autoWithdraw ? 'opacity-40 pointer-events-none' : ''}`}>
              <span className="text-[11px] text-stone-400 font-medium">Chọn nhanh:</span>
              {payoutPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  disabled={!formData.autoWithdraw}
                  onClick={() => setFormData({ ...formData, minPayoutAmount: preset })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-jakarta ${
                    formData.minPayoutAmount === preset && formData.autoWithdraw
                      ? 'bg-[#007700] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  {preset.toLocaleString('vi-VN')} ₫
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VietQR Quick Payment Info */}
        <div className="p-4 rounded-xl border border-[#BECAB6]/70 bg-[#EAF0E2]/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-[#007700] border border-[#BECAB6]/50 shadow-2xs">
              <QrCode size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#005B00] font-jakarta">Hỗ trợ mã VietQR Napas247</h4>
              <p className="text-[11px] text-stone-600">Khách hàng có thể quét mã QR ngân hàng thanh toán trực tiếp qua cổng VietCraft.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#007700] text-white rounded-full">Kích hoạt</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-sm shadow-[#007700]/25 transition-all cursor-pointer flex items-center gap-2 font-jakarta disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={15} />
            )}
            <span>LƯU CẤU HÌNH THANH TOÁN</span>
          </button>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddBank}
        loading={loading}
      />
    </form>
  );
}
