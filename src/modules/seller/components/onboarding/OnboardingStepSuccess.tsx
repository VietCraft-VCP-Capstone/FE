import { SellerSettingsState } from '../../types/settings';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingStepSuccessProps {
  settings: SellerSettingsState;
  onFinish: () => void;
}

export function OnboardingStepSuccess({ settings, onFinish }: OnboardingStepSuccessProps) {
  return (
    <div className="space-y-6 font-sans text-center max-w-xl mx-auto animate-scale-up">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#EAF0E2] text-[#007700] ring-8 ring-emerald-50 mb-2">
        <CheckCircle2 size={42} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">
          Chúc mừng! Gian hàng đã sẵn sàng
        </h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Hồ sơ gian hàng của bạn đã được thiết lập thành công. Bây giờ bạn có thể bắt đầu đăng bán những sản phẩm thủ công mỹ nghệ đầu tiên!
        </p>
      </div>

      {/* Summary Review Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-left space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
          <img
            src={settings.brand.logoUrl}
            alt="Logo"
            className="w-12 h-12 rounded-full object-cover border border-stone-200 shadow-2xs"
          />
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 font-jakarta">{settings.brand.storeName}</h4>
            <p className="text-xs text-stone-500 font-mono">vietcraft.vn/shop/{settings.brand.slug}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px]">Hotline:</span>
            <span className="font-bold text-stone-800">{settings.brand.hotline}</span>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">Email:</span>
            <span className="font-bold text-stone-800">{settings.brand.email}</span>
          </div>
          <div className="col-span-2">
            <span className="text-stone-400 block text-[11px]">Kho lấy hàng:</span>
            <span className="font-medium text-stone-800">{settings.shipping.specificAddress}, {settings.shipping.district}, {settings.shipping.province}</span>
          </div>
          <div className="col-span-2">
            <span className="text-stone-400 block text-[11px]">Tài khoản thụ hưởng:</span>
            <span className="font-mono font-bold text-[#007700]">
              {settings.payment.bankAccounts[0]?.bankName} - {settings.payment.bankAccounts[0]?.accountNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onFinish}
          className="w-full sm:w-auto px-8 py-3 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-md shadow-[#007700]/25 transition-all cursor-pointer flex items-center justify-center gap-2 font-jakarta"
        >
          <span>BẮT ĐẦU ĐĂNG SẢN PHẨM</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
