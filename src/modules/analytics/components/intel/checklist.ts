import type { IntelAxisKey, ListingIntel } from '../../intelTypes';

interface Check {
  codes: string[];
  label: string;
  axis: IntelAxisKey;
}

const REVIEW_CODES = ['no_reviews', 'low_rating'];

const CHECKS: Check[] = [
  { codes: ['no_images', 'few_images'], label: 'Có đủ ảnh sản phẩm', axis: 'image' },
  { codes: ['blurry', 'low_resolution'], label: 'Ảnh rõ nét, đủ lớn', axis: 'image' },
  { codes: ['too_dark', 'too_bright'], label: 'Ảnh đủ sáng', axis: 'image' },
  { codes: ['busy_background', 'text_overlay', 'bad_aspect'], label: 'Ảnh gọn: nền sạch, không chữ đè', axis: 'image' },
  { codes: ['title_short', 'title_long'], label: 'Tiêu đề dài vừa phải', axis: 'text' },
  { codes: ['keyword_stuffing', 'banned_word'], label: 'Tiêu đề không nhồi từ, không có từ cấm', axis: 'text' },
  { codes: ['missing_material', 'missing_color', 'missing_size'], label: 'Nêu đủ chất liệu, màu sắc, kích cỡ', axis: 'text' },
  { codes: ['desc_short'], label: 'Mô tả đủ chi tiết', axis: 'text' },
  { codes: ['no_tags', 'few_tags', 'weak_tag'], label: 'Có đủ tag phù hợp', axis: 'tags' },
  { codes: ['duplicate_tag', 'pending_tag'], label: 'Tag không trùng, đã được duyệt', axis: 'tags' },
  { codes: ['price_high', 'price_low'], label: 'Giá hợp lý so với sản phẩm tương tự', axis: 'market' },
  { codes: ['near_duplicate'], label: 'Không trùng với sản phẩm khác trên sàn', axis: 'market' },
  { codes: REVIEW_CODES, label: 'Có đánh giá tốt từ khách', axis: 'market' },
  { codes: ['no_trend_keyword'], label: 'Tiêu đề có từ khoá đang được tìm nhiều', axis: 'trend' },
];

export function issueCodes(data: ListingIntel): Set<string> {
  const codes = new Set(data.advice.map(a => a.code));
  Object.values(data.axes).forEach(axis => axis.issues.forEach(i => codes.add(i.code)));
  return codes;
}

export function passedChecks(data: ListingIntel, withReviews: boolean): string[] {
  const codes = issueCodes(data);
  const noImages = codes.has('no_images');
  return CHECKS
    .filter(c => withReviews || c.codes !== REVIEW_CODES)
    .filter(c => !(noImages && c.axis === 'image'))
    .filter(c => !c.codes.some(code => codes.has(code)))
    .map(c => c.label);
}
