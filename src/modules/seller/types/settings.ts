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

export type ShippingPricingType = 'FLAT_RATE' | 'ZONE_BASED';

export interface ZoneShippingRates {
  intraProvince: number; // Nội tỉnh
  intraRegion: number;   // Nội vùng
  interRegion: number;   // Liên vùng
}

export interface SellerShippingSettings {
  senderName: string;
  senderPhone: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  carriers: ShippingCarrierItem[];
  pricingType?: ShippingPricingType;
  useFlatRate: boolean;
  flatRateFee: number;
  zoneRates?: ZoneShippingRates;
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

export const SUPPORTED_BANKS = [
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)' },
  { code: 'MB', name: 'Ngân hàng TMCP Quân Đội (MB Bank)' },
  { code: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)' },
  { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  { code: 'CTG', name: 'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)' },
  { code: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)' },
  { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  { code: 'AGR', name: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn (Agribank)' },
  { code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  { code: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)' },
  { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
];

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
