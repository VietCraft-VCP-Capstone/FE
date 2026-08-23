import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sellerSettingsService } from '../services/sellerSettingsService';
import { SellerSettingsState } from '../types/settings';
import { OnboardingStepBrand } from '../components/onboarding/OnboardingStepBrand';
import { OnboardingStepShipping } from '../components/onboarding/OnboardingStepShipping';
import { OnboardingStepBank } from '../components/onboarding/OnboardingStepBank';
import { OnboardingStepSuccess } from '../components/onboarding/OnboardingStepSuccess';
import {
  Store,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Thương hiệu', icon: Store },
  { id: 2, title: 'Vận chuyển', icon: Truck },
  { id: 3, title: 'Thanh toán', icon: CreditCard },
  { id: 4, title: 'Kích hoạt', icon: CheckCircle2 },
];

export function ShopOnboardingPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SellerSettingsState>(sellerSettingsService.getCachedSettings());
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    sellerSettingsService.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    sellerSettingsService.saveOnboardingState({
      currentStep: 4,
      isCompleted: true,
      completedAt: new Date().toISOString()
    });
    navigate('/seller/products');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8 font-sans">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/seller/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors font-jakarta"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Cài đặt</span>
        </Link>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#EAF0E2] text-[#007700] rounded-full text-xs font-extrabold font-jakarta">
          <Sparkles size={13} /> Quy trình thiết lập gian hàng VietCraft
        </span>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Progress Bar line */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-stone-100 z-0">
            <div
              className="h-full bg-[#007700] transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {/* Step Nodes */}
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                    isDone
                      ? 'bg-[#007700] text-white ring-4 ring-emerald-50'
                      : isCurrent
                      ? 'bg-white border-2 border-[#007700] text-[#007700] ring-4 ring-emerald-100 font-extrabold shadow-sm'
                      : 'bg-white border border-stone-200 text-stone-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </button>
                <span
                  className={`text-[11px] font-jakarta font-bold hidden sm:block ${
                    isCurrent ? 'text-[#007700]' : isDone ? 'text-stone-800' : 'text-stone-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="py-2">
        {currentStep === 1 && (
          <OnboardingStepBrand
            data={settings.brand}
            onChange={(brand) => {
              sellerSettingsService.updateGeneral(brand).then(setSettings).catch(console.error);
            }}
          />
        )}

        {currentStep === 2 && (
          <OnboardingStepShipping
            data={settings.shipping}
            onChange={(shipping) => {
              sellerSettingsService.updateShipping(shipping).then(setSettings).catch(console.error);
            }}
          />
        )}

        {currentStep === 3 && (
          <OnboardingStepBank
            data={settings.payment}
            onChange={(payment) => {
              sellerSettingsService.updatePayment(payment).then(setSettings).catch(console.error);
            }}
          />
        )}

        {currentStep === 4 && (
          <OnboardingStepSuccess
            settings={settings}
            onFinish={handleFinish}
          />
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer font-jakarta"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-jakarta"
          >
            <span>Tiếp tục</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ShopOnboardingPage;
