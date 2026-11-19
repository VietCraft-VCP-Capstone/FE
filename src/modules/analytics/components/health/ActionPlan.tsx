import { RefreshCw } from 'lucide-react';
import { editLink } from '../HealthParts';
import type { QualityIssue } from '../../qualityTypes';
import { ActionRow } from './ActionRow';
import { fieldName, MINIMAL_GUIDES } from './heroGuides';
import { useAudit } from './useAudit';

const SCORED_ELSEWHERE = new Set([
  'IMAGES_MISSING', 'IMAGES_INSUFFICIENT', 'TAGS_MISSING', 'DESCRIPTION_MISSING', 'DESCRIPTION_EMPTY',
  'DESCRIPTION_TOO_SHORT', 'TITLE_MISSING', 'TITLE_EMPTY', 'TITLE_TOO_SHORT', 'PRICE_MISSING', 'MATERIAL_MISSING',
  'BAG_MATERIAL_MISSING',
]);

function auditRow(issue: QualityIssue, productId: string) {
  const guide = MINIMAL_GUIDES[issue.code];
  const hint = [guide?.summary ?? issue.recommendation.message, ...(guide?.tips ?? [])].join(' · ');
  return (
    <ActionRow
      key={issue.id}
      text={`${guide?.title ?? issue.message} (${fieldName(issue.field)})`}
      hint={hint}
      to={editLink(productId, issue.field)}
      cta={issue.severity === 'high' ? 'Sửa ngay' : 'Sửa'}
    />
  );
}

export function ActionPlan({ productId }: { productId: string }) {
  const audit = useAudit(productId);
  const issues = (audit.data?.issues || []).filter(i => i.status === 'open' && !SCORED_ELSEWHERE.has(i.code));
  const high = issues.filter(i => i.severity === 'high');
  const soft = issues.filter(i => i.severity !== 'high');

  const recheck = (
    <button
      type="button"
      disabled={audit.rechecking}
      onClick={audit.recheck}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
    >
      <RefreshCw size={12} className={audit.rechecking ? 'animate-spin' : ''} aria-hidden />
      <span>{audit.rechecking ? 'Đang kiểm tra' : 'Kiểm tra lại'}</span>
    </button>
  );

  if (issues.length === 0) {
    if (!audit.loading && !audit.failed) return null;
    return (
      <div className="flex items-center justify-between gap-2 px-1 text-sm text-stone-500">
        <span>{audit.loading ? 'Đang kiểm tra lỗi nội dung...' : 'Chưa kiểm tra được lỗi nội dung, bấm Kiểm tra lại.'}</span>
        {recheck}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold text-stone-900">{issues.length} lỗi nội dung cần xem</h2>
        {recheck}
      </div>
      <ul className="m-0 mt-1 list-none divide-y divide-stone-100 p-0">
        {high.map(i => auditRow(i, productId))}
        {soft.map(i => auditRow(i, productId))}
      </ul>
    </section>
  );
}
