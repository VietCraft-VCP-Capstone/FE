export interface SellerBrandSettings {
  storeName: string;
  slug: string;
  headline?: string;
  description: string;
  hotline: string;
  email: string;
  workshopAddress: string;
  bannerUrl: string;
  logoUrl: string;
  establishedYear?: string;
  craftVillage?: string;
  printTechnology?: string;
  mainCategory?: string;
}

export interface ShippingCarrierItem {
  id: 'ghn' | 'ghtk' | 'hỏa_tốc';
  name: string;
  logo?: string;
  enabled: boolean;
  estimatedTime?: string;
}

export interface SellerShippingSettings {
  senderName: string;
  senderPhone: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  carriers: ShippingCarrierItem[];
  useFlatRate: boolean;
  flatRateFee: number;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  isDefault: boolean;
}

export interface SellerPaymentSettings {
  bankAccounts: BankAccountItem[];
  autoWithdraw: boolean;
  payoutCycle: 'DAILY' | 'WEEKLY_MON' | 'MONTHLY_01';
  minPayoutAmount: number;
}

export interface NotificationChannelSetting {
  email: boolean;
  app: boolean;
}

export interface SellerNotificationSettings {
  orders: {
    newOrder: NotificationChannelSetting;
    returnRefund: NotificationChannelSetting;
    cancelled: NotificationChannelSetting;
  };
  inventory: {
    lowStock: NotificationChannelSetting;
    listingApproval: NotificationChannelSetting;
  };
  analytics: {
    weeklyReport: NotificationChannelSetting;
    promotions: NotificationChannelSetting;
  };
}

export interface SellerSettingsState {
  brand: SellerBrandSettings;
  shipping: SellerShippingSettings;
  payment: SellerPaymentSettings;
  notifications: SellerNotificationSettings;
  updatedAt: string;
}

export interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  completedAt?: string;
}
