import { ExternalLink, X } from 'lucide-react';

export interface EvidencePreview { uri: string; title: string; kind?: string }

export function EvidenceLightbox({ item, onClose }: { item: EvidencePreview; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
          <div className="flex items-center gap-2">
            <a href={item.uri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              <ExternalLink size={14} /> Mở tab mới
            </a>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex max-h-[75vh] items-center justify-center bg-slate-950/5 p-4">
          {item.kind === 'VIDEO' ? (
            <video src={item.uri} controls autoPlay className="max-h-[70vh] max-w-full rounded-xl" />
          ) : (
            <img src={item.uri} alt={item.title} className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
