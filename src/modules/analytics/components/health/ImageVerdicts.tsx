import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import type { FeedbackVerdict, ImageAi, ImageEvidence, ListingHealth } from '../../healthTypes';
import { Chip, Note } from '../ui';
import { Thumb } from './Thumb';
import { FOCUS } from './healthStats';
import { FEEDBACK_DONE, FEEDBACK_ERROR, FEEDBACK_OPTIONS, NOT_COUNTED, VERDICT_INFO } from './imageVerdictText';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const BTN = `h-8 cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const PICKED = 'border-[#007700] bg-[#007700]/[0.08] text-[#005B00]';
const IDLE = 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50';

interface Analysed {
  url: string;
  ai: ImageAi;
  index: number;
}

function analysedImages(data: ListingHealth): Analysed[] {
  const raw = data.factors?.find(f => f.key === 'image')?.evidence.images;
  const list: ImageEvidence[] = Array.isArray(raw) ? raw : [];
  return list.flatMap((img, index) => (img.ai ? [{ url: img.url, ai: img.ai, index }] : []));
}

function ImageRow({ image, index, productId, initial }: { image: Analysed; index: number; productId?: string; initial?: FeedbackVerdict }) {
  const [picked, setPicked] = useState(initial);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'done' | 'error' | null>(null);
  const { verdict, counted } = image.ai;
  const info = VERDICT_INFO[verdict];
  const flagged = verdict === 'mismatch' || verdict === 'duplicate';

  const send = async (next: FeedbackVerdict) => {
    if (!productId) return;
    setSending(true);
    setResult(null);
    try {
      await analyticsApi.healthFeedback(productId, { image_url: image.url, verdict: next });
      setPicked(next);
      setResult('done');
    } catch {
      setResult('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <li className="flex items-start gap-3 rounded-xl border border-stone-100 p-3">
      <Thumb src={image.url} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 text-sm font-semibold text-stone-900">Ảnh {index + 1}</p>
          <Chip tone={info.tone}>{info.label}</Chip>
        </div>
        <p className="m-0 mt-1 text-sm text-stone-700">{info.text}</p>
        {flagged && !counted && <p className="m-0 mt-0.5 text-xs text-stone-500">{NOT_COUNTED}</p>}
        {productId && flagged && (
          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_OPTIONS.map(o => (
                <button
                  key={o.verdict}
                  type="button"
                  aria-pressed={picked === o.verdict}
                  disabled={sending}
                  onClick={() => send(o.verdict)}
                  className={`${BTN} ${picked === o.verdict ? PICKED : IDLE}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div role="status" aria-live="polite">
              {result && <Note tone={result === 'error' ? 'warn' : 'neutral'}>{result === 'done' ? FEEDBACK_DONE : FEEDBACK_ERROR}</Note>}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export function ImageVerdicts({ data, productId }: { data: ListingHealth; productId?: string }) {
  const images = analysedImages(data);
  if (!images.length) return null;
  return (
    <section className={CARD}>
      <h2 className="m-0 inline-flex items-center gap-2 text-base font-bold text-stone-900">
        <ScanLine size={18} className="text-[#007700]" aria-hidden />
        AI soi từng ảnh
      </h2>
      <p className="m-0 mt-1 text-xs text-stone-500">AI so từng ảnh với tên sản phẩm. Ảnh bị đánh dấu có thể làm giảm điểm mục Ảnh.</p>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {images.map(image => (
          <ImageRow
            key={`${image.url}#${image.index}`}
            image={image}
            index={image.index}
            productId={productId}
            initial={data.feedback?.find(f => f.image_url === image.url)?.verdict}
          />
        ))}
      </ul>
    </section>
  );
}
