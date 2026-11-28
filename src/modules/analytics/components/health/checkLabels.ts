import type { HealthCheck } from '../../healthTypes';
import type { Tone } from '../ui';

type Evidence = Record<string, unknown> | null | undefined;
type Row = { label: string; value: string };

export const PILLAR_ORDER: HealthCheck['pillar'][] = ['print', 'description', 'image', 'duplicate'];

export const PILLAR_LABEL: Record<HealthCheck['pillar'], string> = {
  print: 'Sẵn sàng in',
  description: 'Đúng như mô tả',
  image: 'Chất lượng ảnh',
  duplicate: 'Ảnh trùng',
};

export const HINT_CHIP: { label: string; tone: Tone } = { label: 'AI gợi ý · chưa kiểm chứng, không trừ điểm', tone: 'neutral' };

export const SEVERITY_CHIP: Partial<Record<HealthCheck['severity'], { label: string; tone: Tone }>> = {
  block: { label: 'Chặn', tone: 'bad' },
  warn: { label: 'Cảnh báo', tone: 'warn' },
  info: { label: 'Gợi ý', tone: 'info' },
};

const IMAGE_PILLARS: HealthCheck['pillar'][] = ['image', 'duplicate'];

const LEVEL: Record<string, string> = { exact: 'Trùng hệt', near: 'Gần trùng', similar: 'Giống' };
const ATTR_VALUE: Record<string, string> = {
  tron: 'trơn', in_hinh: 'in hình', ke_soc: 'kẻ sọc', hoa: 'họa tiết hoa', caro: 'caro',
  den: 'đen', trang: 'trắng', do: 'đỏ', xanh: 'xanh', vang: 'vàng', hong: 'hồng', tim: 'tím', xam: 'xám',
  nau: 'nâu', be: 'be', cam: 'cam', kem: 'kem', ngan: 'tay ngắn', dai: 'tay dài', sat_nach: 'sát nách',
  da: 'da', len: 'len', canvas: 'canvas', jean: 'jean', kim_loai: 'kim loại', go: 'gỗ', gom_su: 'gốm sứ',
  set: 'bộ nhiều món', don: 'một món',
};
const attrValue = (v: unknown) => ATTR_VALUE[String(v)] ?? String(v);

const num = (v: unknown, fmt: (n: number) => string): string | null => {
  const n = Number(v);
  return Number.isFinite(n) ? fmt(n) : null;
};
const pct = (v: unknown) => num(v, n => `${Math.round(n * 100)}%`);
const hex = (v: unknown) => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(n))
  ? '#' + v.map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase()
  : null;

const EVIDENCE: { key: string; label: string; format: (v: unknown) => string | null }[] = [
  { key: 'dpi', label: 'DPI', format: v => num(v, n => String(Math.round(n))) },
  { key: 'outside_frac', label: 'Ngoài vùng in', format: pct },
  { key: 'low_share', label: 'Phần mực khó thấy trên áo', format: pct },
  { key: 'border_rgb', label: 'Màu nền', format: hex },
  { key: 'sentence', label: 'Câu mô tả', format: v => `“${v}”` },
  { key: 'claimed', label: 'Mô tả ghi', format: attrValue },
  { key: 'seen', label: 'Ảnh trông như', format: attrValue },
  { key: 'p_seen', label: 'AI chắc', format: pct },
  { key: 'quality', label: 'Điểm chất lượng ảnh (0–100)', format: v => num(v, n => `${Math.round(n)}/100`) },
  { key: 'level', label: 'Mức khớp', format: v => LEVEL[String(v)] ?? String(v) },
  { key: 'cos', label: 'Độ giống', format: pct },
  { key: 'host', label: 'Nguồn ảnh', format: String },
  { key: 'product_id', label: 'Trùng với sản phẩm', format: String },
];

const firstMatch = (evidence: Evidence): Record<string, unknown> => {
  const m = evidence?.matches;
  return Array.isArray(m) && m.length ? m[0] : {};
};

export function evidenceRows(evidence: Evidence): Row[] {
  const flat = { ...evidence, ...firstMatch(evidence) };
  return EVIDENCE
    .map(e => ({ label: e.label, value: flat[e.key] == null ? null : e.format(flat[e.key]) }))
    .filter((r): r is Row => r.value !== null)
    .slice(0, 3);
}

export function imageRows(c: HealthCheck): Row[] {
  const m = /:(\d+)$/.exec(c.id);
  return m && IMAGE_PILLARS.includes(c.pillar) ? [{ label: 'Ảnh', value: `số ${Number(m[1]) + 1}` }] : [];
}
