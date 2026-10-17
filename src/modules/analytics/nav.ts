import {
  Activity,
  BellRing,
  CalendarClock,
  Compass,
  Crosshair,
  Eye,
  LayoutGrid,
  LineChart,
  ListChecks,
  Radar,
  Tags,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Điều hướng khu "Phân tích & AI".
 *
 * Nhóm theo BA CÂU HỎI của người bán, đúng cách SRS chia mục 3.8 / 3.9 / 3.10:
 *   nhìn vào trong  — shop tôi đang chạy ra sao, cái gì đang hỏng
 *   nhìn sang ngang — so với người bán cùng ngách, tôi đứng ở đâu
 *   nhìn về trước   — tháng sau nên làm gì, chuẩn bị từ bao giờ
 *
 * "Việc nên làm" (F41) đứng riêng trên đầu vì nó là đích đến: 15 trang kia đưa dữ kiện,
 * trang đó đưa quyết định. Người bán vào khu này phần lớn chỉ cần đọc nó.
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
    items: [
      { to: `${INSIGHTS_ROOT}/actions`, label: 'Việc nên làm', icon: ListChecks, feature: 'F41' },
    ],
  },
  {
    label: 'Nhìn vào trong',
    hint: 'Shop đang chạy ra sao',
    items: [
      { to: `${INSIGHTS_ROOT}/overview`, label: 'Tổng quan shop', icon: LayoutGrid, feature: 'F26' },
      { to: `${INSIGHTS_ROOT}/categories`, label: 'Doanh thu theo loại', icon: Activity, feature: 'F31' },
      { to: `${INSIGHTS_ROOT}/alerts`, label: 'Cảnh báo bất thường', icon: BellRing, feature: 'F30' },
      { to: `${INSIGHTS_ROOT}/listings`, label: 'Sức khoẻ sản phẩm', icon: Eye, feature: 'F27 · F28 · F29' },
    ],
  },
  {
    // Đặt theo câu hỏi của người bán mới, xếp theo thứ tự nên đi: tìm -> theo dõi -> so -> sửa giá, từ khoá.
    label: 'So với đối thủ',
    hint: 'Ai bán chạy, tôi đứng ở đâu',
    items: [
      { to: `${INSIGHTS_ROOT}/competitors`, label: 'Ai đang bán chạy', icon: Users, feature: 'F32' },
      { to: `${INSIGHTS_ROOT}/tracking`, label: 'Đối thủ đang theo dõi', icon: Radar, feature: 'F36' },
      { to: `${INSIGHTS_ROOT}/benchmark`, label: 'Tôi mạnh, yếu ở đâu', icon: Crosshair, feature: 'F33' },
      { to: `${INSIGHTS_ROOT}/pricing`, label: 'Giá tôi đắt hay rẻ', icon: Target, feature: 'F35' },
      { to: `${INSIGHTS_ROOT}/tag-gap`, label: 'Từ khoá nên thêm', icon: Tags, feature: 'F34' },
    ],
  },
  {
    label: 'Nhìn về trước',
    hint: 'Tháng sau nên chuẩn bị gì',
    items: [
      { to: `${INSIGHTS_ROOT}/forecast`, label: 'Dự báo doanh thu', icon: LineChart, feature: 'F37' },
      { to: `${INSIGHTS_ROOT}/seasonal`, label: 'Mùa vụ và lịch ra hàng', icon: CalendarClock, feature: 'F38' },
      { to: `${INSIGHTS_ROOT}/niches`, label: 'Ngách tiềm năng', icon: Compass, feature: 'F39' },
      { to: `${INSIGHTS_ROOT}/radar`, label: 'Tag đang tăng nhanh', icon: Radar, feature: 'F40' },
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
