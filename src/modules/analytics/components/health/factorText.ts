import { decimal, NA, vnd } from '../../format';
import type { HealthFactor, HealthFactorKey } from '../../healthTypes';

const count = (n: number, unit: string) => `${decimal(n, 0)} ${unit}`;
const goal = (n: number | null, unit: string, suffix = '') => (n === null ? NA : `${count(n, unit)}${suffix}`);

export function formatAmount(key: HealthFactorKey, value: number): string {
  switch (key) {
    case 'image': return count(value, 'ảnh');
    case 'description': return count(value, 'ký tự');
    case 'tags': return count(value, 'tag');
    case 'review': return count(value, 'đánh giá');
    case 'material': return value > 0 ? 'Đã nêu' : 'Chưa nêu';
    case 'price': return vnd(value);
  }
}

export function factorValue(row: HealthFactor): string {
  if (row.value === null) return 'Chưa có';
  const text = formatAmount(row.key, row.value);
  if (row.key !== 'review' || typeof row.n_good !== 'number' || row.value <= 0) return text;
  return `${text}, ${Math.round((row.n_good / row.value) * 100)}% tốt`;
}

export function factorTarget(row: HealthFactor): string {
  switch (row.key) {
    case 'image': return goal(row.target, 'ảnh', ' trở lên');
    case 'description': return goal(row.target, 'ký tự', ' trở lên');
    case 'tags': return goal(row.target, 'tag', ' trở lên');
    case 'material': return 'Nêu chất liệu (ô Chất liệu, tên hoặc mô tả)';
    case 'review': return 'Đánh giá tốt từ người mua';
    case 'price': {
      const price = row.reference?.price;
      return typeof price === 'number' ? `Không cao hơn ${vnd(price)}` : NA;
    }
  }
}
