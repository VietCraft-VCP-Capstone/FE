import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEnterMotion } from '../../../shared/hooks/useMotion';
import { InfoTip } from './ui';

/**
 * Khung chung của mọi trang phân tích: tiêu đề, một câu nói rõ trang trả lời câu hỏi
 * gì, và vùng bộ lọc bên phải. Bộ lọc nằm trên URL (query) nên nút Back và việc gửi
 * đường dẫn cho người khác vẫn giữ đúng lựa chọn.
 */
export function InsightPage({ title, info, question, actions, breadcrumb, header, children }: {
  title: string;
  /** Chú giải hiện khi rê chuột vào ⓘ cạnh tiêu đề: trang này để làm gì. */
  info?: React.ReactNode;
  question?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; to?: string }[];
  /** Thay khối tiêu đề mặc định, vd. dải thông tin sản phẩm ở trang chi tiết. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useEnterMotion<HTMLDivElement>([title]);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[1680px] space-y-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Vị trí trang" className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
          {breadcrumb.map((item, i) => (
            <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} aria-hidden />}
              {item.to ? (
                <Link to={item.to} className="font-semibold text-stone-600 no-underline hover:text-[#007700]">{item.label}</Link>
              ) : (
                <span aria-current="page" className="max-w-[48ch] truncate text-stone-700">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      {header ?? (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 max-w-[70ch]">
            <h1 className="m-0 flex items-center gap-2 font-jakarta text-xl font-extrabold tracking-tight text-stone-900 md:text-2xl">
              {title}
              {info && <InfoTip text={info} label={`${title} là gì?`} wide />}
            </h1>
            {question && <p className="mb-0 mt-1 text-sm leading-relaxed text-stone-600">{question}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}
