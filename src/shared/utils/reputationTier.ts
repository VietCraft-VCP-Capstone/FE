const TIERS: Record<string, { label: string; badge: string }> = {
  TRUSTED: { label: 'Nghệ Nhân Uy Tín', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  NORMAL: { label: 'Gian Hàng Tiêu Chuẩn', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  WARNING: { label: 'Cảnh Báo Rủi Ro', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  RESTRICTED: { label: 'Hạn Chế', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export const reputationTier = (tier?: string) => TIERS[tier || ''] || TIERS.RESTRICTED;
