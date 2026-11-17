import React from 'react';
import { ExternalLink, ShieldCheck, UserCheck } from 'lucide-react';
import type { Precedent } from '../../types/evidence';
import { GLOSSARY } from '../../i18n/vi.glossary';

interface Props {
  precedent?: Precedent;
  className?: string;
}

export const PrecedentCard: React.FC<Props> = ({ precedent, className = '' }) => {
  if (!precedent) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-4 text-xs text-stone-500">
        <p className="font-semibold text-stone-700">Chưa có trường hợp tương tự đã xác minh</p>
        <p className="mt-1">
          Chưa có shop nào cùng quy mô áp dụng kế hoạch này trong hệ thống. Đề xuất: bắt đầu với bước{' '}
          <strong className="text-stone-800">Thử nhỏ</strong> để tự kiểm chứng với số lượng tối thiểu.
        </p>
      </div>
    );
  }

  const gradeInfo = GLOSSARY.precedentGrades[precedent.grade] || GLOSSARY.precedentGrades.C;

  return (
    <div className={`rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[#007700]" />
          <span>Trường hợp tương tự</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
            precedent.grade === 'A'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : precedent.grade === 'B'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : precedent.grade === 'C'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}
        >
          {gradeInfo.badge}
        </span>
      </div>

      <div className="space-y-1 text-stone-700">
        <p>
          <strong className="text-stone-900">Việc đã làm:</strong> {precedent.action}
        </p>
        <p>
          <strong className="text-stone-900">Ở đâu & Khi nào:</strong> {precedent.where} ({precedent.when})
        </p>
        <p className="text-emerald-800 bg-emerald-50/80 p-2 rounded-lg font-semibold border border-emerald-100">
          Kết quả đo được: {precedent.result} (đo bằng: {precedent.method})
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-500 text-[11px] pt-1">
          <span>Mức giống shop: <strong>{precedent.similarity}</strong></span>
          <span className="flex items-center gap-1">
            <UserCheck size={12} />
            Đã duyệt bởi: {precedent.reviewer} ({precedent.checkedAt})
          </span>
          {precedent.sourceUrl && (
            <a
              href={precedent.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[#007700] hover:underline"
            >
              <span>Nguồn công khai</span>
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-stone-100 pt-2 text-[11px] text-stone-400 italic">
        * Kết quả ở nơi khác không phải cam kết cho shop của bạn.
      </div>
    </div>
  );
};
