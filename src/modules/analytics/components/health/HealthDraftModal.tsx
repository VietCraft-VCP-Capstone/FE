import { useMemo } from 'react';
import { X } from 'lucide-react';
import { ModalOverlay } from '../../../../shared/components/ModalOverlay';
import type { HealthDraft } from '../../healthTypes';
import { useFocusTrap } from '../../../../shared/hooks/useFocusTrap';
import { InsightBlock } from '../InsightBlock';
import { Note } from '../ui';
import { CriteriaTable } from './CriteriaTable';
import { Recommendations } from './Recommendations';
import { ScoreHero } from './ScoreHero';
import { useHealthDraft } from './useHealthDraft';

const HOSTED = new RegExp(`^https://res\\.cloudinary\\.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '[^/]+'}/image/upload/.`);

export function HealthDraftModal({ draft, onClose }: { draft: HealthDraft; onClose: () => void }) {
  const { images, ...rest } = draft;
  const unique = useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const hosted = useMemo(() => unique.filter(u => u.length <= 2048 && HOSTED.test(u) && !u.includes('..')), [unique]);
  const urls = useMemo(() => hosted.slice(0, 8), [hosted]);
  const skipped = unique.length - hosted.length;
  const { state, reload } = useHealthDraft({ ...rest, image_urls: urls });

  const panelRef = useFocusTrap(onClose);

  return (
    <ModalOverlay>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="health-draft-title" className="my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="health-draft-title" className="m-0 font-jakarta text-lg font-extrabold text-stone-900">Chấm thử trước khi đăng</h2>
            <p className="m-0 mt-0.5 text-xs text-stone-500">Chấm bản nháp hiện tại, chưa lưu gì vào hệ thống.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng cửa sổ chấm thử" className="shrink-0 cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {skipped > 0 && (
            <Note tone="warn">{skipped} ảnh chưa được tải lên kho ảnh của sàn nên chưa phân tích được. Điểm ảnh sẽ đầy đủ hơn sau khi sản phẩm được đăng.</Note>
          )}
          <InsightBlock state={state} onRetry={reload} compact>
            {data => (
              <div className="space-y-3">
                <section className="grid grid-cols-1 gap-6 rounded-2xl border border-stone-200/90 bg-white p-5 sm:grid-cols-12">
                  <div className="sm:col-span-4"><ScoreHero data={data} /></div>
                  <div className="sm:col-span-8"><CriteriaTable factors={data.factors} /></div>
                </section>
                <Recommendations data={data} />
              </div>
            )}
          </InsightBlock>
        </div>
      </div>
    </ModalOverlay>
  );
}
