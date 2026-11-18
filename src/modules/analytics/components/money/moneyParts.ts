import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { BRAND } from '../ui';

export const PART_COLOR = { net: BRAND, fee: SERIES.blue, voucher: SERIES.red, refund: CHART_INK.axis };

export function sharePct(part: number, total: number): string {
  return `${((part / total) * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
