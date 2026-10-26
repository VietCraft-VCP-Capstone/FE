import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MaterialInput } from '../../../product/components/MaterialInput';
import { IntelPreviewModal } from '../../../analytics/components/intel/IntelPreviewModal';
import { previewDraft, type DraftSource } from './previewDraft';

export function IntelPreviewSection({ source, onMaterialsChange }: { source: DraftSource; onMaterialsChange: (v: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const hasTitle = !!source.title.trim();

    return (
        <>
            <div className="md:col-span-2">
                <MaterialInput value={source.materials} onChange={onMaterialsChange} />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    disabled={!hasTitle}
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#007700] border border-[#007700] rounded-[9px] text-[13px] font-bold hover:bg-[#EAF0E2] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700]"
                >
                    <Sparkles size={14} aria-hidden /> Chấm thử trước khi đăng
                </button>
                <span className="text-xs text-stone-500">
                    {hasTitle ? 'Xem điểm ảnh, từ khoá, tag và mùa vụ của bản nháp này. Chưa lưu gì.' : 'Nhập tên sản phẩm để chấm thử.'}
                </span>
            </div>

            {open && <IntelPreviewModal onClose={() => setOpen(false)} draft={previewDraft(source)} />}
        </>
    );
}
