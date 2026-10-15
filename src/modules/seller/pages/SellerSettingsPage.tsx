import { useState, useEffect } from 'react';
import { sellerSettingsService } from '../services/sellerSettingsService';
import {
  SellerSettingsState,
  SellerBrandSettings,
  SellerShippingSettings,
  SellerPaymentSettings,
  SellerNotificationSettings,
  BankAccountItem
} from '../types/settings';
import { GeneralSettingsTab } from '../components/settings/GeneralSettingsTab';
import { ShippingSettingsTab } from '../components/settings/ShippingSettingsTab';
import { PaymentSettingsTab } from '../components/settings/PaymentSettingsTab';
import { NotificationSettingsTab } from '../components/settings/NotificationSettingsTab';
import { PrinterSettingsTab } from '../components/settings/PrinterSettingsTab';
import { useToast } from '../../../shared/components/Toast';
import {
  Store,
  Truck,
  CreditCard,
  Bell,
  Printer
} from 'lucide-react';

type TabKey = 'general' | 'shipping' | 'payment' | 'notifications' | 'printer';

export function SellerSettingsPage() {
  const [settings, setSettings] = useState<SellerSettingsState>(sellerSettingsService.getCachedSettings());
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    sellerSettingsService.getSettings()
      .then((data) => {
        if (isMounted) {
          setSettings(data);
          setInitialLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching settings:', err);
        if (isMounted) setInitialLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleSaveGeneral = async (brandData: SellerBrandSettings) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.updateGeneral(brandData);
      setSettings(updated);
      showToast('Đã lưu thông tin nhận diện thương hiệu thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi lưu thông tin thương hiệu: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShipping = async (shippingData: SellerShippingSettings) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.updateShipping(shippingData);
      setSettings(updated);
      showToast('Đã cập nhật cấu hình vận chuyển thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi lưu cấu hình vận chuyển: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async (paymentData: SellerPaymentSettings) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.updatePayment(paymentData);
      setSettings(updated);
      showToast('Đã lưu cấu hình rút tiền và thanh toán thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi lưu cấu hình thanh toán: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async (newBank: Omit<BankAccountItem, 'id'>) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.addBankAccount(newBank);
      setSettings(updated);
      showToast(`Đã thêm tài khoản ${newBank.bankName} thành công!`, 'success');
    } catch (err: any) {
      showToast('Lỗi khi thêm tài khoản ngân hàng: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.deleteBankAccount(id);
      setSettings(updated);
      showToast('Đã xóa tài khoản ngân hàng.', 'info');
    } catch (err: any) {
      showToast('Lỗi khi xóa tài khoản ngân hàng: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultBank = async (id: string) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.setDefaultBankAccount(id);
      setSettings(updated);
      showToast('Đã đặt làm tài khoản thụ hưởng mặc định.', 'success');
    } catch (err: any) {
      showToast('Lỗi khi đặt tài khoản mặc định: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async (notifData: SellerNotificationSettings) => {
    setLoading(true);
    try {
      const updated = await sellerSettingsService.updateNotifications(notifData);
      setSettings(updated);
      showToast('Đã cập nhật cài đặt nhận thông báo thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi lưu cài đặt thông báo: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'general', label: 'Thông tin chung', icon: Store },
    { key: 'shipping', label: 'Vận chuyển', icon: Truck },
    { key: 'payment', label: 'Thanh toán', icon: CreditCard },
    { key: 'printer', label: 'Xưởng in (POD)', icon: Printer },
    { key: 'notifications', label: 'Thông báo', icon: Bell },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#330033] font-jakarta tracking-tight">
          Cài đặt & Cấu hình Gian hàng
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Quản lý nhận diện thương hiệu, chính sách vận chuyển, tài khoản thanh toán thụ hưởng và thông báo gian hàng.
        </p>
      </div>

      {/* Navigation Tabs (Strictly Figma-styled with clean bottom border) */}
      <div className="border-b border-stone-200">
        <nav className="flex items-center gap-8 -mb-px overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`py-3.5 px-1 border-b-2 font-jakarta font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#007700] text-[#007700]'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tab Content */}
      <div className="relative">
        {initialLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-100 overflow-hidden z-20">
            <div className="w-full h-full bg-[#007700] animate-pulse" />
          </div>
        )}

        {activeTab === 'general' && (
          <GeneralSettingsTab
            initialData={settings.brand}
            onSave={handleSaveGeneral}
            loading={loading}
          />
        )}

        {activeTab === 'shipping' && (
          <ShippingSettingsTab
            initialData={settings.shipping}
            onSave={handleSaveShipping}
            loading={loading}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentSettingsTab
            initialData={settings.payment}
            onSave={handleSavePayment}
            onAddBank={handleAddBank}
            onDeleteBank={handleDeleteBank}
            onSetDefaultBank={handleSetDefaultBank}
            loading={loading}
          />
        )}

        {activeTab === 'printer' && (
          <PrinterSettingsTab />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsTab
            initialData={settings.notifications}
            onSave={handleSaveNotifications}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

export default SellerSettingsPage;
