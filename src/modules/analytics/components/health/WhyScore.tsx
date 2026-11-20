import { Tooltip } from 'antd';
import { Info } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';
import { SCORE_MEANING } from './factorState';
import { PART } from './whyText';

const NOTES = [
  SCORE_MEANING,
  'Từ 80 điểm trở lên là Tốt, từ 50 đến 79 là Cần cải thiện, dưới 50 là Kém.',
  'Tiêu chí chưa có đánh giá, không áp dụng hoặc chưa đánh giá được thì không tính vào mẫu số. Điểm được quy về thang 100 trên các tiêu chí còn lại.',
  'Tiêu chí chưa điền thì tính 0 điểm.',
  'Điểm không trực tiếp đẩy thứ hạng, nhưng các mục được chấm thì có: tìm kiếm của sàn chỉ hiện sản phẩm khi mọi từ khách gõ có trong tên, tag hoặc danh mục (khớp tên +5, khớp tag +3), và sao đánh giá cũng được cộng vào thứ hạng. Ảnh và mô tả là thứ khách xem trước khi quyết định mua.',
];

export function WhyScore({ data }: { data: ListingHealth }) {
  return (
    <div className="space-y-5 pt-1">
      <div>
        <p className="m-0 mb-2 text-xs text-stone-500">100 điểm chia cho 5 tiêu chí theo trọng số bên dưới · rê chuột để xem lý do</p>
        <ul className="m-0 list-none space-y-1.5 p-0">
          {(data.factors ?? []).map(f => (
            <Tooltip key={f.key} title={PART[f.key]?.why} placement="right">
              <li className="flex cursor-help items-center justify-between gap-3 text-xs text-stone-700">
                <span>{PART[f.key]?.label ?? f.label}</span>
                <span className="font-semibold tabular-nums text-stone-800">{f.weight}đ</span>
              </li>
            </Tooltip>
          ))}
        </ul>
      </div>
      {data.versions && (
        <p className="m-0 text-xs text-stone-500">
          Phiên bản: {data.versions.score} · độ liên quan: {data.versions.relevance} · chuẩn: {data.versions.benchmark ?? '—'}
        </p>
      )}
      <ul className="m-0 list-none space-y-2 border-t border-stone-100 p-0 pt-4">
        {NOTES.map(n => (
          <li key={n} className="flex items-start gap-2 text-xs text-stone-700">
            <Info size={13} className="mt-px shrink-0 text-stone-400" aria-hidden />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
