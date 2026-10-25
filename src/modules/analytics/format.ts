/**
 * Định dạng riêng cho khu phân tích. Tiền và số đếm dùng lại shared/utils/format.
 *
 * Quy ước: giá trị null luôn hiện "Chưa có", không bao giờ hiện 0 — thiếu dữ liệu khác
 * với bằng không. Không dùng gạch ngang dài làm ký hiệu trống.
 */

export const NA = '—';

const VI = 'vi-VN';

/** 3.35 -> "3,35%". */
export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return `${value.toLocaleString(VI, { maximumFractionDigits: digits })}%`;
}

/** Biến động so kỳ trước: "+12,4%" / "-3,1%". */
export function delta(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const text = Math.abs(value).toLocaleString(VI, { maximumFractionDigits: digits });
  if (value > 0) return `+${text}%`;
  if (value < 0) return `-${text}%`;
  return '0%';
}

/** Số thập phân kiểu Việt: 0.8292 -> "0,83". */
export function decimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return value.toLocaleString(VI, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function vnd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return `${value.toLocaleString(VI)}đ`;
}

export function scoreText(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NA;
  return String(Math.floor(value));
}

/** "2026-08-01" -> "01/08". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return NA;
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}

/** "2026-08-01" -> "01/08/2026". */
export function fullDate(iso: string | null | undefined): string {
  if (!iso) return NA;
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Khoảng ngày: "01/08 đến 30/08/2026". */
export function dateRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from || !to) return NA;
  return `${shortDate(from)} đến ${fullDate(to)}`;
}

export const RANGE_OPTIONS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '180d', label: '6 tháng' },
  { value: '365d', label: '1 năm' },
] as const;

/** Nhãn BR-182: >= 80 · 50-79 · < 50. */
export const HEALTH_STATUS_LABEL: Record<string, string> = {
  good: 'Tốt',
  needs_improvement: 'Nên sửa thêm',
  poor: 'Cần sửa gấp',
};

export function plainText(text: string): string {
  return text
    .replace(/([\dđ%])\s*[–—]\s*(\d)/g, '$1 đến $2')
    .replace(/\s+[–—]\s+/g, ', ')
    .replace(/\s+·\s+/g, '. ');
}

export interface TodoSummary {
  tag: string;
  tagColor: { bg: string; text: string; border: string };
  primary: string;
  secondary: string;
}

export function formatTodoSummary(raw: string | null | undefined, field?: string | null): TodoSummary | null {
  if (!raw) return null;
  const msg = raw.trim();

  let tag = 'Gợi ý';
  let tagColor = { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' };

  const isPrice = field?.includes('price') || field?.includes('retail') || msg.toLowerCase().includes('giá');
  const isImage = field?.includes('image') || msg.toLowerCase().includes('ảnh');
  const isDesc = field?.includes('description') || msg.toLowerCase().includes('mô tả');
  const isTags = field?.includes('tag') || msg.toLowerCase().includes('từ khoá');
  const isMaterial = field?.includes('material') || msg.toLowerCase().includes('chất liệu');
  const isReview = field?.includes('review') || msg.toLowerCase().includes('đánh giá');
  const isMod = field?.includes('moderation') || msg.toLowerCase().includes('kiểm duyệt');

  if (isPrice) {
    tag = 'Giá cả';
    tagColor = { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };

    const highMatch = msg.match(/Giá cao hơn\s+(\d+%)\s+so với mức giữa.*?\((\d+[\d.,]*đ)\)/i);
    const rangeMatch = msg.match(/Tham khảo giá.*?:\s*([\d.,]+đ\s*[–—]\s*[\d.,]+đ)/i);
    const rangeStr = rangeMatch ? rangeMatch[1].replace(/[–—]/, '–') : '';

    if (highMatch) {
      return {
        tag,
        tagColor,
        primary: `Giá cao hơn ${highMatch[1]} mức phổ biến (${highMatch[2]})`,
        secondary: rangeStr
          ? `Gợi ý: ${rangeStr} · Hoặc nêu bật câu chuyện tay nghề`
          : 'Tham khảo mức giá chung hoặc làm rõ câu chuyện tay nghề',
      };
    }
    const lowMatch = msg.match(/Giá thấp hơn mức giữa\s+(\d+%)/i);
    if (lowMatch) {
      return {
        tag,
        tagColor,
        primary: `Giá thấp hơn ${lowMatch[1]} mức phổ biến, có thể đang bán rẻ quá`,
        secondary: rangeStr
          ? `Gợi ý: ${rangeStr} · Cân đối lại biên lợi nhuận`
          : 'Cân đối lại giá bán để bảo đảm biên lợi nhuận',
      };
    }
    if (msg.includes('thấp hơn giá vốn')) {
      return {
        tag,
        tagColor,
        primary: 'Giá bán thấp hơn giá vốn (đang bán lỗ)',
        secondary: 'Kiểm tra lại giá bán lẻ và giá vốn của các biến thể',
      };
    }
    if (msg.includes('Chưa có giá bán')) {
      return {
        tag,
        tagColor,
        primary: 'Chưa cài đặt giá bán cho biến thể',
        secondary: rangeStr ? `Gợi ý khoảng: ${rangeStr}` : 'Cập nhật giá bán để sản phẩm sẵn sàng phục vụ',
      };
    }
  }

  if (isImage) {
    tag = 'Hình ảnh';
    tagColor = { bg: 'bg-[#EAF0E2]', text: 'text-[#007700]', border: 'border-[#BECAB6]' };
    const addImgMatch = msg.match(/Thêm\s+(\d+)\s+ảnh\s*\(đang có\s+(\d+)\/(\d+)\)/i);
    if (addImgMatch) {
      return {
        tag,
        tagColor,
        primary: 'Thiếu ảnh chi tiết các góc chụp',
        secondary: `Cần thêm ${addImgMatch[1]} ảnh (hiện có ${addImgMatch[2]}/${addImgMatch[3]} ảnh)`,
      };
    }
    if (msg.includes('Chưa có ảnh')) {
      return {
        tag,
        tagColor,
        primary: 'Chưa có ảnh sản phẩm nào',
        secondary: 'Tải lên ít nhất 1 ảnh đại diện để hiển thị trên sàn',
      };
    }
  }

  if (isDesc) {
    tag = 'Mô tả';
    tagColor = { bg: 'bg-[#330033]/5', text: 'text-[#330033]', border: 'border-[#330033]/20' };
    const descMatch = msg.match(/(?:dài thêm|viết thêm|thêm)\s+(\d+)\s+(?:ký tự|từ)\s*\((\d+)\/(\d+)\)/i);
    if (descMatch) {
      return {
        tag,
        tagColor,
        primary: 'Mô tả sản phẩm còn ngắn',
        secondary: `Nên viết thêm ${descMatch[1]} từ (hiện có ${descMatch[2]}/${descMatch[3]} từ)`,
      };
    }
  }

  if (isTags) {
    tag = 'Từ khoá';
    tagColor = { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' };
    const tagMatch = msg.match(/Chọn thêm\s+(\d+)\s+tag/i);
    if (tagMatch) {
      return {
        tag,
        tagColor,
        primary: 'Chưa đủ từ khoá tìm kiếm',
        secondary: `Gắn thêm ${tagMatch[1]} tag phù hợp để người mua dễ tìm thấy`,
      };
    }
  }

  if (isMaterial) {
    tag = 'Chất liệu';
    tagColor = { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' };
    return {
      tag,
      tagColor,
      primary: 'Chưa ghi rõ chất liệu chế tác',
      secondary: 'Điền chất liệu (gốm sứ, mây tre, lụa, gỗ...) để tạo lòng tin',
    };
  }

  if (isReview) {
    tag = 'Đánh giá';
    tagColor = { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    if (msg.includes('Chưa có đánh giá')) {
      return {
        tag,
        tagColor,
        primary: 'Chưa có đánh giá từ người mua',
        secondary: 'Chăm sóc đơn đầu và mời khách để lại cảm nhận',
      };
    }
    const goodMatch = msg.match(/Tỉ lệ đánh giá tốt\s+(\d+%)/i);
    if (goodMatch) {
      return {
        tag,
        tagColor,
        primary: `Tỉ lệ đánh giá tốt đạt ${goodMatch[1]}`,
        secondary: 'Tiếp tục phản hồi sớm và chăm sóc khách mua hàng',
      };
    }
  }

  if (isMod) {
    tag = 'Kiểm duyệt';
    tagColor = { bg: 'bg-rose-50', text: 'text-[#BA1A1A]', border: 'border-rose-200' };
    return {
      tag,
      tagColor,
      primary: 'Sản phẩm bị từ chối kiểm duyệt',
      secondary: 'Xem lý do và cập nhật lại bài đăng để gửi duyệt',
    };
  }

  const parts = msg.split(/\s+[·–—]\s+/);
  return {
    tag,
    tagColor,
    primary: parts[0] || msg,
    secondary: parts.slice(1).join('. ') || 'Bấm xem chi tiết để được hướng dẫn cách tối ưu',
  };
}
