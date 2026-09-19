import React, { useState } from 'react';
import { BankAccountItem, SUPPORTED_BANKS } from '../../types/settings';
import { X, Landmark, CreditCard, User, Building, Check } from 'lucide-react';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<BankAccountItem, 'id'>) => void;
  loading?: boolean;
}

export function AddBankAccountModal({
  isOpen,
  onClose,
  onAdd,
  loading = false,
}: AddBankAccountModalProps) {
  const [bankCode, setBankCode] = useState(SUPPORTED_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [branch, setBranch] = useState('Chi nhánh Hà Nội');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (!accountHolder.trim()) {
      setError('Vui lòng nhập tên chủ tài khoản');
      return;
    }

    const selectedBank = SUPPORTED_BANKS.find(b => b.code === bankCode) || SUPPORTED_BANKS[0];

    onAdd({
      bankName: selectedBank.name,
      bankCode: selectedBank.code,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      branch: branch.trim() || 'Hội sở chính',
      isDefault
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#007700] flex items-center justify-center font-bold">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 font-jakarta">
                Thêm tài khoản ngân hàng
              </h3>
              <p className="text-xs text-stone-500">Liên kết tài khoản để nhận tiền doanh thu tự động từ VietCraft</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#BA1A1A] font-semibold">
              {error}
            </div>
          )}

          {/* Bank Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer"
              >
                {SUPPORTED_BANKS.map(bank => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Số tài khoản ngân hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder="VD: 998812345678"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Account Holder Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên chủ tài khoản (Viết in hoa, không dấu) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN VAN BAT"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
                required
              />
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Chi nhánh mở tài khoản
            </label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="VD: Chi nhánh Hoàn Kiếm, Hà Nội"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>

          {/* Make Default Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-[#007700] accent-[#007700] border-stone-300 focus:ring-[#007700]"
            />
            <span className="text-xs font-semibold text-stone-700">Đặt làm tài khoản thụ hưởng mặc định</span>
          </label>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 font-jakarta"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Check size={14} />
              <span>XÁC NHẬN THÊM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
