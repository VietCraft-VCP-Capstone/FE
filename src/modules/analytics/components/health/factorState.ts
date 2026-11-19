import type { HealthStatus } from '../../types';
import type { HealthFactorV3 } from '../../healthTypes';
import type { Tone } from '../ui';

export const STATUS_INFO: Record<HealthStatus, { label: string; tone: Tone }> = {
  good: { label: 'Tốt', tone: 'good' },
  needs_improvement: { label: 'Cần cải thiện', tone: 'warn' },
  poor: { label: 'Kém', tone: 'bad' },
};

export function statusInfo(status: HealthStatus | null | undefined): { label: string; tone: Tone } {
  return (status && STATUS_INFO[status]) || { label: 'Chưa có điểm', tone: 'neutral' };
}

export const AI_HINT = 'AI thấy ảnh có thể không đúng sản phẩm. AI có thể nhầm nên không trừ điểm, bạn chỉ cần xem lại ảnh.';

export function factorStateChip(f: HealthFactorV3): { label: string; tone: Tone } {
  switch (f.state) {
    case 'scored':
      return f.sub_score === 100 ? { label: 'Đạt', tone: 'good' } : { label: 'Chưa đạt', tone: 'warn' };
    case 'seller_missing':
      return { label: 'Chưa điền', tone: 'warn' };
    case 'not_applicable':
      return f.key === 'review' ? { label: 'Chưa có đánh giá', tone: 'neutral' } : { label: 'Không áp dụng', tone: 'neutral' };
    case 'technical_failure':
      return { label: 'Chưa đánh giá được', tone: 'neutral' };
  }
}

export const isExcluded = (f: HealthFactorV3) => f.state === 'not_applicable' || f.state === 'technical_failure';

export const SCORE_MEANING = 'Điểm cho biết trang sản phẩm đã đủ những gì khách cần xem và ô tìm kiếm cần đọc: ảnh rõ, từ khoá khách hay gõ, mô tả, đánh giá, giá. Điểm không đo sản phẩm bán chạy hay không, phần đó xem ở tab Xếp hạng bán hàng trong shop.';
