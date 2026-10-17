import api from '../../../infrastructure/api/interceptors';
import {
  SellerSettingsState,
  SellerBrandSettings,
  SellerShippingSettings,
  SellerPaymentSettings,
  SellerNotificationSettings,
  BankAccountItem,
  OnboardingState
} from '../types/settings';

const SETTINGS_STORAGE_KEY = 'vietcraft_seller_settings_cache';
const ONBOARDING_STORAGE_KEY = 'vietcraft_seller_onboarding_mock';

export const INITIAL_SELLER_SETTINGS: SellerSettingsState = {
  brand: {
    storeName: '',
    slug: '',
    headline: '',
    description: '',
    hotline: '',
    email: '',
    workshopAddress: '',
    bannerUrl: '',
    logoUrl: '',
    establishedYear: new Date().getFullYear().toString(),
    craftVillage: '',
    printTechnology: '',
    mainCategory: ''
  },
  shipping: {
    senderName: '',
    senderPhone: '',
    province: '',
    district: '',
    ward: '',
    specificAddress: '',
    carriers: [
      {
        id: 'ghn',
        name: 'Giao Hàng Nhanh (GHN)',
        enabled: true,
        estimatedTime: '1 - 2 ngày'
      },
      {
        id: 'ghtk',
        name: 'Giao Hàng Tiết Kiệm (GHTK)',
        enabled: true,
        estimatedTime: '2 - 3 ngày'
      }
    ],
    useFlatRate: false,
    flatRateFee: 0
  },
  payment: {
    bankAccounts: [],
    autoWithdraw: false,
    payoutCycle: 'WEEKLY_MON',
    minPayoutAmount: 500
  },
  notifications: {
    orders: {
      newOrder: { email: true, app: true },
      returnRefund: { email: true, app: true },
      cancelled: { email: true, app: false }
    },
    inventory: {
      lowStock: { email: true, app: true },
      listingApproval: { email: true, app: true }
    },
    analytics: {
      weeklyReport: { email: true, app: false },
      promotions: { email: false, app: true }
    }
  },
  updatedAt: new Date().toISOString()
};

function isAuthError(err: any): boolean {
  const status = err?.response?.status;
  return status === 401 || status === 403;
}

function filterOutViettel(settings: SellerSettingsState): SellerSettingsState {
  if (!settings.shipping) {
    settings.shipping = { ...INITIAL_SELLER_SETTINGS.shipping };
  }
  if (!settings.shipping.carriers || settings.shipping.carriers.length === 0) {
    settings.shipping.carriers = [
      {
        id: 'ghn',
        name: 'Giao Hàng Nhanh (GHN)',
        enabled: true,
        estimatedTime: '1 - 2 ngày'
      },
      {
        id: 'ghtk',
        name: 'Giao Hàng Tiết Kiệm (GHTK)',
        enabled: true,
        estimatedTime: '2 - 3 ngày'
      }
    ];
  } else {
    settings.shipping.carriers = settings.shipping.carriers.filter(
      (c: any) => c && c.id !== 'viettelpost' && c.id !== 'viettel_post' && c.id !== 'vtp' && !c.name?.toLowerCase().includes('viettel')
    );
    if (settings.shipping.carriers.length === 0) {
      settings.shipping.carriers = [
        {
          id: 'ghn',
          name: 'Giao Hàng Nhanh (GHN)',
          enabled: true,
          estimatedTime: '1 - 2 ngày'
        },
        {
          id: 'ghtk',
          name: 'Giao Hàng Tiết Kiệm (GHTK)',
          enabled: true,
          estimatedTime: '2 - 3 ngày'
        }
      ];
    }
  }
  return settings;
}

function sanitizeForLocalStorage(settings: SellerSettingsState): SellerSettingsState {
  try {
    const copy = JSON.parse(JSON.stringify(settings));
    if (copy.payment?.bankAccounts) {
      copy.payment.bankAccounts = copy.payment.bankAccounts.map((b: any) => ({
        ...b,
        accountNumber: b.accountNumber
          ? (b.accountNumber.startsWith('*') ? b.accountNumber : `**** **** ${String(b.accountNumber).slice(-4)}`)
          : ''
      }));
    }
    return copy;
  } catch {
    return settings;
  }
}

export const sellerSettingsService = {
  getSettings: async (): Promise<SellerSettingsState> => {
    try {
      const res = await api.get('/seller/settings');
      if (res.data && res.data.brand) {
        const clean = filterOutViettel(res.data);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(clean)));
        return clean;
      }
    } catch (e) {
      if (isAuthError(e)) throw e;
      console.warn('Could not load seller settings from backend, falling back to cache:', e);
    }

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return filterOutViettel(JSON.parse(stored));
      }
    } catch (e) { }

    return INITIAL_SELLER_SETTINGS;
  },

  getCachedSettings: (): SellerSettingsState => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return filterOutViettel(JSON.parse(stored));
      }
    } catch (e) { }
    return INITIAL_SELLER_SETTINGS;
  },

  updateSettings: async (payload: Partial<SellerSettingsState>): Promise<SellerSettingsState> => {
    try {
      const res = await api.put('/seller/settings', payload);
      if (res.data && res.data.brand) {
        const clean = filterOutViettel(res.data);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(clean)));
        return clean;
      }
    } catch (e) {
      console.error('Error saving settings to backend:', e);
      throw e;
    }

    const current = sellerSettingsService.getCachedSettings();
    const merged = filterOutViettel({ ...current, ...payload, updatedAt: new Date().toISOString() });
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(merged)));
    return merged;
  },

  updateGeneral: async (brand: SellerBrandSettings): Promise<SellerSettingsState> => {
    return sellerSettingsService.updateSettings({ brand });
  },

  updateShipping: async (shipping: SellerShippingSettings): Promise<SellerSettingsState> => {
    return sellerSettingsService.updateSettings({ shipping });
  },

  updatePayment: async (payment: SellerPaymentSettings): Promise<SellerSettingsState> => {
    return sellerSettingsService.updateSettings({ payment });
  },

  addBankAccount: async (account: Omit<BankAccountItem, 'id'>): Promise<SellerSettingsState> => {
    const current = await sellerSettingsService.getSettings();
    const newId = `bank_${Date.now()}`;
    let bankAccounts = [...(current.payment.bankAccounts || [])];
    const isFirstBank = bankAccounts.length === 0;
    const isDefault = isFirstBank || account.isDefault;

    const newAccount: BankAccountItem = { ...account, id: newId, isDefault };
    if (isDefault) {
      bankAccounts = bankAccounts.map(b => ({ ...b, isDefault: false }));
    }
    bankAccounts.push(newAccount);

    const safeMinPayout = (!current.payment.minPayoutAmount || current.payment.minPayoutAmount < 500)
      ? 500
      : current.payment.minPayoutAmount;

    return sellerSettingsService.updatePayment({
      ...current.payment,
      minPayoutAmount: safeMinPayout,
      bankAccounts
    });
  },

  deleteBankAccount: async (id: string): Promise<SellerSettingsState> => {
    const current = await sellerSettingsService.getSettings();
    let bankAccounts = (current.payment.bankAccounts || []).filter(b => b.id !== id);
    if (bankAccounts.length > 0 && !bankAccounts.some(b => b.isDefault)) {
      bankAccounts[0].isDefault = true;
    }
    return sellerSettingsService.updatePayment({
      ...current.payment,
      bankAccounts
    });
  },

  setDefaultBankAccount: async (id: string): Promise<SellerSettingsState> => {
    const current = await sellerSettingsService.getSettings();
    const bankAccounts = (current.payment.bankAccounts || []).map(b => ({
      ...b,
      isDefault: b.id === id
    }));
    return sellerSettingsService.updatePayment({
      ...current.payment,
      bankAccounts
    });
  },

  updateNotifications: async (notifications: SellerNotificationSettings): Promise<SellerSettingsState> => {
    return sellerSettingsService.updateSettings({ notifications });
  },

  resetDefaults: async (): Promise<SellerSettingsState> => {
    return sellerSettingsService.updateSettings(INITIAL_SELLER_SETTINGS);
  },

  getOnboardingState: (): OnboardingState => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load onboarding state:', e);
    }
    const initial: OnboardingState = { currentStep: 1, isCompleted: false };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  },

  getReputation: async (): Promise<{ profile: any; logs: any[] }> => {
    try {
      const res = await api.get('/seller/settings/reputation');
      return res.data || { profile: null, logs: [] };
    } catch (e) {
      console.warn('Could not load seller reputation:', e);
      return { profile: null, logs: [] };
    }
  },

  saveOnboardingState: (state: OnboardingState): OnboardingState => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    return state;
  }
};
