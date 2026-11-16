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

/** Chuẩn hóa tiêu đề sản phẩm, loại bỏ các chuỗi rác do crawl hoặc copy từ sàn khác */
export function cleanTitle(title: string | null | undefined): string {
  if (!title) return 'Sản phẩm';
  return title
    .replace(/icon\s*arrow\s*(left|right)\s*bold/gi, '')
    .replace(/Share\s*:\s*/gi, '')
    .replace(/Favorite\s*\(\d+\)/gi, '')
    .replace(/^[\s-:–—|/•]+/, '')
    .trim() || 'Sản phẩm';
}

export function cleanAdviceTitle(title: string | null | undefined): string {
  if (!title) return 'Gợi ý tối ưu';
  return cleanTitle(title);
}

export function cleanAdviceAction(action: string | null | undefined): string {
  if (!action) return '';
  let clean = action;
  if (clean.includes('chữ thừa copy từ trang khác') || clean.includes('icon arrow')) {
    return 'Tiêu đề chứa từ khóa rác và ký hiệu copy từ sàn khác. Cần chỉnh sửa để chuẩn SEO tìm kiếm.';
  }
  clean = clean
    .replace(/icon\s*arrow\s*(left|right)\s*bold/gi, '')
    .replace(/Share\s*:\s*/gi, '')
    .replace(/Favorite\s*\(\d+\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
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
  { value: 'year', label: 'Theo năm' },
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

/** Rút ngắn thông điệp cảnh báo gấp để hiển thị dạng badge gọn gàng trong bảng */
export function formatUrgentWarning(msg: string | null | undefined): { short: string; detail: string } {
  if (!msg) return { short: 'Cần sửa lỗi gấp', detail: '' };
  const clean = plainText(msg);
  if (clean.includes('chữ thừa') || clean.includes('copy từ trang khác')) {
    return { short: 'Tiêu đề chứa từ khóa rác copy', detail: clean };
  }
  if (clean.includes('thông tin liên hệ')) {
    return { short: 'Tiêu đề chứa thông tin liên hệ', detail: clean };
  }
  if (clean.includes('Chất liệu khai báo chưa khớp') || clean.includes('chất liệu')) {
    return { short: 'Chất liệu chưa khớp tiêu đề', detail: clean };
  }
  if (clean.includes('từ chối kiểm duyệt') || clean.includes('vi phạm')) {
    return { short: 'Tin bị từ chối kiểm duyệt', detail: clean };
  }
  const beforeColon = clean.split(':')[0].trim();
  const short = beforeColon.length <= 36 ? beforeColon : clean.slice(0, 32) + '...';
  return { short, detail: clean };
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

  if (field === 'title' || (field === 'materials' && msg.includes(':'))) {
    const [head, ...rest] = msg.split(':');
    return {
      tag: field === 'title' ? 'Tên SP' : 'Chất liệu',
      tagColor: { bg: 'bg-rose-50', text: 'text-[#BA1A1A]', border: 'border-rose-200' },
      primary: head.trim(),
      secondary: rest.join(':').trim() || 'Xem gợi ý tên đã làm sạch trong trang chi tiết',
    };
  }

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

    const highMatch = msg.match(/Giá cao hơn\s+(\d+%)\s+so với.*?\(mức giữa\s+([\d.,]+đ)\)/i);
    const rangeMatch = msg.match(/Tham khảo:\s*([\d.,]+đ\s*[–—]\s*[\d.,]+đ)/i);
    const range = rangeMatch ? `Khoảng phổ biến: ${rangeMatch[1].replace(/[–—]/, '–')} · ` : '';

    if (highMatch) {
      return {
        tag,
        tagColor,
        primary: `Giá cao hơn ${highMatch[1]} so với hàng cùng chất liệu (${highMatch[2]})`,
        secondary: `${range}Nếu chất liệu xịn hơn, giá vốn cao hay thiết kế riêng, hãy ghi rõ trong mô tả`,
      };
    }
    const lowMatch = msg.match(/Giá thấp hơn\s+(\d+%)\s+so với/i);
    if (lowMatch) {
      return {
        tag,
        tagColor,
        primary: `Giá thấp hơn ${lowMatch[1]} so với hàng cùng chất liệu`,
        secondary: `${range}Kiểm tra lại chi phí để không bán lỗ`,
      };
    }
    const typoMatch = msg.match(/(thấp|cao) hơn khoảng\s+(\d+)\s+lần/i);
    if (typoMatch) {
      return {
        tag,
        tagColor,
        primary: 'Giá có thể bị gõ nhầm',
        secondary: `${typoMatch[1] === 'thấp' ? 'Thấp' : 'Cao'} hơn khoảng ${typoMatch[2]} lần so với mức tham khảo`,
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
        secondary: 'Cập nhật giá bán để sản phẩm sẵn sàng bán',
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
