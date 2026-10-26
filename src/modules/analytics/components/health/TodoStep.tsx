import { Button } from 'antd';
import { Pencil, Lightbulb, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { decimal, plainText } from '../../format';
import type { HealthItem } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { TODO_HINT } from './todoHints';

export function TodoStep({ item, index, productId }: { item: HealthItem; index: number; productId: string }) {
  const hint = item.code ? TODO_HINT[item.code] : undefined;

  return (
    <li className="group rounded-xl border border-stone-200/80 bg-white p-4 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/10 hover:shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Step number and details */}
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-jakarta text-xs font-extrabold text-[#007700] ring-1 ring-emerald-300/60 shadow-2xs">
            {index}
          </span>
          <div className="min-w-0">
            <h4 className="m-0 font-jakarta text-sm font-bold leading-snug text-stone-900 group-hover:text-[#007700] transition-colors">
              {plainText(item.message)}
            </h4>

            {hint && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-stone-100 bg-stone-50/80 p-2.5 text-xs leading-relaxed text-stone-600">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <span>{hint}</span>
              </div>
            )}

            {item.code === 'review' && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/80 p-2.5 text-xs leading-relaxed text-sky-800">
                <MessageSquare size={14} className="mt-0.5 shrink-0 text-sky-600" />
                <span>Cách làm: Gửi tin nhắn cảm ơn và mời khách đã nhận hàng để lại đánh giá 5 sao kèm hình ảnh.</span>
              </div>
            )}
          </div>
        </div>

        {/* Impact points and action button */}
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 font-jakarta text-xs font-extrabold text-[#007700]">
            +{decimal(item.impact, 1)} điểm
          </span>

          {item.code !== 'review' && (
            <Link to={editLink(productId, item.field)}>
              <Button
                type="primary"
                size="small"
                icon={<Pencil size={12} />}
                className="!flex !items-center !gap-1.5 shadow-2xs font-semibold"
              >
                Sửa ngay
              </Button>
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
