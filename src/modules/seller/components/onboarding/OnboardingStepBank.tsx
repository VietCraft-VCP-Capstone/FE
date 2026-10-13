import { SellerPaymentSettings, BankAccountItem } from '../../types/settings';
import { Landmark, ShieldCheck } from 'lucide-react';

interface OnboardingStepBankProps {
  data: SellerPaymentSettings;
  onChange: (data: SellerPaymentSettings) => void;
}

export function OnboardingStepBank({ data, onChange }: OnboardingStepBankProps) {
  const defaultBank = data.bankAccounts.find(b => b.isDefault) || data.bankAccounts[0];

  const handleUpdateFirstBank = (field: keyof BankAccountItem, value: string) => {
    let updated = [...data.bankAccounts];
    if (updated.length === 0) {
      updated = [{
        id: 'new_bank_' + Date.now(),
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountHolder: '',
        branch: '',
        isDefault: true
      }];
    }
    updated[0] = { ...updated[0], [field]: value };
    onChange({ ...data, bankAccounts: updated });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EAF0E2] text-[#007700] mb-3">
          <Landmark size={24} />
        </div>
        <h3 className="text-xl font-extrabold text-stone-900 font-jakarta">
          Bước 3: Tài khoản Ngân hàng Thụ hưởng
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Thiết lập tài khoản để VietCraft chuyển tiền đối soát bán hàng định kỳ về ngân hàng của bạn.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={defaultBank?.bankName || ''}
              onChange={e => handleUpdateFirstBank('bankName', e.target.value)}
              placeholder="VD: Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Số tài khoản ngân hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={defaultBank?.accountNumber || ''}
              onChange={e => handleUpdateFirstBank('accountNumber', e.target.value)}
              placeholder="VD: 998812345678"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Tên chủ tài khoản (In hoa không dấu) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={defaultBank?.accountHolder || ''}
              onChange={e => handleUpdateFirstBank('accountHolder', e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN BAT"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Chi nhánh ngân hàng
            </label>
            <input
              type="text"
              value={defaultBank?.branch || ''}
              onChange={e => handleUpdateFirstBank('branch', e.target.value)}
              placeholder="VD: Chi nhánh Hoàn Kiếm, Hà Nội"
              className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
            />
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-[#005B00]">
          <ShieldCheck size={16} className="text-[#007700] flex-shrink-0" />
          <span>Tài khoản được bảo mật và mã hóa theo tiêu chuẩn đối soát tài chính PCI-DSS.</span>
        </div>
      </div>
    </div>
  );
}
