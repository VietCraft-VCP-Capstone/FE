import api from '../../../../infrastructure/api/interceptors';

export const PLACEHOLDER_IMG = '/image-not-found.jpg';

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

/** Định dạng tiền Việt: 189.000đ */
export const vnd = (n: number) => `${Math.round(Number(n) || 0).toLocaleString('vi-VN')}đ`;

/** Đổi đường dẫn ảnh tương đối của BE thành URL đầy đủ; bỏ qua mã màu (#fff) lưu nhầm ở ô ảnh. */
export const mediaUrl = (u: unknown): string => {
  if (!u || typeof u !== 'string') return '';
  const s = u.trim();
  if (!s || s.startsWith('#')) return '';
  if (/^(https?:|data:|blob:)/.test(s)) return s;
  if (s.startsWith('/')) return ORIGIN + s;
  return s;
};

/** Số tiền Mongo Decimal128 / chuỗi / số → number */
export const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof val === 'object') {
    if ('$numberDecimal' in val) return parseFloat(val.$numberDecimal) || 0;
    if ('value' in val) return parseFloat(val.value) || 0;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.endsWith(PLACEHOLDER_IMG)) img.src = PLACEHOLDER_IMG;
};

export const formatDateTime = (value: string | Date | undefined | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
