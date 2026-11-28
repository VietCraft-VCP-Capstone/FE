import type { FeedbackVerdict, ImageVerdict } from '../../healthTypes';
import type { Tone } from '../ui';

export const VERDICT_INFO: Record<ImageVerdict, { label: string; tone: Tone; text: string }> = {
  ok: { label: 'Đúng sản phẩm', tone: 'good', text: 'Ảnh khớp với tên sản phẩm.' },
  mismatch: { label: 'Không giống tên', tone: 'warn', text: 'Có vẻ không phải ảnh của sản phẩm này. Nên thay bằng ảnh chụp đúng sản phẩm.' },
  duplicate: { label: 'Ảnh trùng', tone: 'bad', text: 'Ảnh này trùng với ảnh ở tin khác của shop.' },
  not_learned: { label: 'AI chưa học', tone: 'neutral', text: 'AI chưa học loại hàng này nên ảnh được tính như bình thường.' },
  unanalyzed: { label: 'Chưa phân tích', tone: 'neutral', text: 'Chưa tải được ảnh này để phân tích.' },
};

export const FEEDBACK_OPTIONS: { verdict: FeedbackVerdict; label: string }[] = [
  { verdict: 'ai_right', label: 'Đúng, tôi sẽ thay' },
  { verdict: 'ai_wrong', label: 'AI nhầm' },
];

export const NOT_COUNTED = 'AI mới gợi ý, chưa trừ điểm.';
export const FEEDBACK_DONE = 'Đã ghi nhận. Điểm sẽ cập nhật sau khi AI học lại.';
export const FEEDBACK_ERROR = 'Chưa gửi được, vui lòng thử lại.';
