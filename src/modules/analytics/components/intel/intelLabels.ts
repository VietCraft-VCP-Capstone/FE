import type { IntelAxisKey, IntelDirection, IntelEvidence } from '../../intelTypes';
import type { Tone } from '../ui';

export const AXIS_KEYS: IntelAxisKey[] = ['image', 'text', 'tags', 'market', 'trend'];

export const AXIS_LABEL: Record<IntelAxisKey, string> = {
  image: 'Ảnh',
  text: 'Từ khoá',
  tags: 'Tag',
  market: 'Thị hiếu và cạnh tranh',
  trend: 'Trend và mùa vụ',
};

export const AXIS_SHORT: Record<IntelAxisKey, string> = { image: 'Ảnh', text: 'Từ khoá', tags: 'Tag', market: 'Thị hiếu', trend: 'Trend' };

export const AXIS_HINT: Record<IntelAxisKey, string> = {
  image: 'Độ nét, nền, chữ đè ảnh và độ khớp ảnh với tiêu đề.',
  text: 'Tiêu đề và mô tả: độ dài, từ khoá bán chạy, thuộc tính còn thiếu.',
  tags: 'Tag có từ khoá bán chạy, có trùng lặp hay đang chờ duyệt.',
  market: 'Giá và kiểu sản phẩm so với các listing gần giống.',
  trend: 'Nhu cầu theo mùa và đà tăng của từ khoá khớp với sản phẩm.',
};

export const EVIDENCE_LABEL: Record<IntelEvidence, { label: string; tone: Tone; hint: string }> = {
  measured: { label: 'Đã đo', tone: 'good', hint: 'Yếu tố này đã được kiểm chứng là có liên quan tới listing bán chạy trên dữ liệu thật.' },
  practice: { label: 'Thực hành tốt', tone: 'neutral', hint: 'Khuyến nghị theo kinh nghiệm bán hàng, chưa đo được tác động trên dữ liệu.' },
};

export const GROUP_LABEL: Record<string, string> = {
  fashion: 'Thời trang',
  bags: 'Túi xách',
  shoes: 'Giày dép',
  accessories: 'Phụ kiện',
  home: 'Đồ gia dụng',
  sport: 'Thể thao',
};

export const DIRECTION_LABEL: Record<IntelDirection, string> = { up: 'Đang tăng', flat: 'Đi ngang', down: 'Đang giảm' };

export const DIRECTION_TONE: Record<IntelDirection, Tone> = { up: 'good', flat: 'neutral', down: 'bad' };

export const ISSUE_LABEL: Record<string, string> = {
  low_resolution: 'Ảnh nhỏ',
  blurry: 'Ảnh mờ',
  too_dark: 'Quá tối',
  too_bright: 'Quá sáng',
  busy_background: 'Nền rối',
  text_overlay: 'Chữ đè ảnh',
  bad_aspect: 'Tỉ lệ khung lạ',
};

export const EFFORT_LABEL: Record<1 | 2 | 3, string> = { 1: 'Dễ', 2: 'Vừa', 3: 'Khó' };
