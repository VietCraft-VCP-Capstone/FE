import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Khung chung của mọi trang phân tích: tiêu đề, một câu nói rõ trang trả lời câu hỏi
 * gì, và vùng bộ lọc bên phải. Bộ lọc nằm trên URL (query) nên nút Back và việc gửi
 * đường dẫn cho người khác vẫn giữ đúng lựa chọn.
 */
export function InsightPage({ title, question, actions, breadcrumb, children }: {
  title: string;
  question: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; to?: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-fade-in">
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-[70ch]">
          <h1 className="m-0 font-jakarta text-xl font-extrabold tracking-tight text-stone-900 md:text-2xl">{title}</h1>
          <p className="mb-0 mt-1 text-sm leading-relaxed text-stone-600">{question}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
