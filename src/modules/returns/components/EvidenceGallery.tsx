import { useState } from 'react';
import { ImagePlus, Video, ZoomIn } from 'lucide-react';
import { EvidenceLightbox, type EvidencePreview } from './EvidenceLightbox';

interface GridProps {
  items: any[];
  title: string;
  tileClass: string;
  onPreview: (item: EvidencePreview) => void;
}

function EvidenceGrid({ items, title, tileClass, onPreview }: GridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {items.map((item, idx) => {
        const uri = item.storage_ref || item.uri;
        return (
          <div
            key={item.evidence_id || uri || idx}
            onClick={() => onPreview({ uri, title: `${title} #${idx + 1}`, kind: item.kind })}
            className={`group relative aspect-square overflow-hidden rounded-xl bg-slate-50 cursor-pointer shadow-xs transition hover:shadow-md ${tileClass}`}
          >
            {item.kind === 'VIDEO' ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                <Video size={24} className="opacity-80 group-hover:scale-110 transition" />
              </div>
            ) : (
              <img src={uri} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-xs transition duration-200 group-hover:opacity-100">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                <ZoomIn size={16} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EvidenceGallery({ evidence, buyerId }: { evidence: any[]; buyerId?: string }) {
  const [preview, setPreview] = useState<EvidencePreview | null>(null);
  const isBuyer = (item: any) => !item.uploaded_by || item.uploaded_by === buyerId || item.uploaded_by === 'BUYER';
  const buyerItems = evidence.filter(isBuyer);
  const partnerItems = evidence.filter(item => !isBuyer(item));

  return (
    <section className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 min-h-[58px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <ImagePlus size={19} />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Hồ sơ minh chứng</h2>
          <p className="text-xs text-slate-500">Ảnh và video đối soát</p>
        </div>
      </div>

      <div className="flex-1 mt-5 space-y-5">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Minh chứng bạn đã cung cấp ({buyerItems.length})
            </p>
            <span className="text-[11px] text-slate-400">Từ người mua</span>
          </div>
          {buyerItems.length > 0 ? (
            <EvidenceGrid items={buyerItems} title="Minh chứng bạn đã cung cấp" tileClass="border border-slate-200 hover:border-emerald-500" onPreview={setPreview} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400 italic">Chưa có tệp từ người mua.</div>
          )}
        </div>

        {partnerItems.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                Ảnh đối chiếu từ xưởng in ({partnerItems.length})
              </p>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">Đối chiếu xưởng</span>
            </div>
            <EvidenceGrid items={partnerItems} title="Ảnh đối chiếu từ xưởng in" tileClass="border border-amber-300 ring-2 ring-amber-100 hover:border-amber-500 hover:ring-amber-200" onPreview={setPreview} />
          </div>
        )}
      </div>

      {preview && <EvidenceLightbox item={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
