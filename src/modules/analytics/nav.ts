import {
  BellRing,
  CalendarClock,
  Eye,
  LayoutGrid,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Điều hướng khu "Phân tích & AI".
 *
 * Nhóm theo BA CÂU HỎI của người bán, đúng cách SRS chia mục 3.8 / 3.9 / 3.10:
 *   nhìn vào trong  — shop tôi đang chạy ra sao, cái gì đang hỏng
 *   nhìn sang ngang — so với người bán cùng ngách, tôi đứng ở đâu
 *   nhìn về trước   — tháng sau nên làm gì, chuẩn bị từ bao giờ
 */

export interface InsightNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Mã tính năng trong SRS, để đối chiếu tài liệu khi cần. */
  feature: string;
}

export interface InsightNavGroup {
  /** Không có label thì các mục nằm ngay đầu thanh bên, không có tiêu đề nhóm. */
  label?: string;
  hint?: string;
  items: InsightNavItem[];
}

export const INSIGHTS_ROOT = '/seller/insights';

export const INSIGHTS_NAV: InsightNavGroup[] = [
  {
    label: 'Nhìn vào trong',
    hint: 'Shop đang chạy ra sao',
    items: [
      { to: `${INSIGHTS_ROOT}/overview`, label: 'Tổng quan shop', icon: LayoutGrid, feature: 'F26' },
      { to: `${INSIGHTS_ROOT}/money`, label: 'Thực nhận & Voucher', icon: Wallet, feature: 'F43' },
      { to: `${INSIGHTS_ROOT}/alerts`, label: 'Cảnh báo bất thường', icon: BellRing, feature: 'F30' },
      { to: `${INSIGHTS_ROOT}/listings`, label: 'Sức khoẻ sản phẩm', icon: Eye, feature: 'F27 · F28 · F29' },
    ],
  },
  {
    // F32, F33, F36 gộp một trang. F35 (giá), F34 (từ khoá) bỏ tab riêng, chỉ mở từ link "Xem".
    label: 'Đối thủ cạnh tranh',
    hint: 'So sánh với shop cùng ngành',
    items: [
      { to: `${INSIGHTS_ROOT}/competitors`, label: 'Phân tích đối thủ', icon: Users, feature: 'F32 · F33 · F36' },
    ],
  },
  {
    label: 'Nhìn về trước',
    hint: 'Tháng sau nên chuẩn bị gì',
    items: [
      { to: `${INSIGHTS_ROOT}/seasonal`, label: 'Kế hoạch Cao điểm', icon: CalendarClock, feature: 'F38' },
    ],
  },
];

/** Tra nhãn theo đường dẫn, dùng cho breadcrumb và tiêu đề tab. */
export function insightNavLabel(pathname: string): string | null {
  for (const group of INSIGHTS_NAV) {
    for (const item of group.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return item.label;
    }
  }
  return null;
}
