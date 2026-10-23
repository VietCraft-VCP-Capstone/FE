import { ImageOff } from 'lucide-react';

export function Thumb({ src, size = 40 }: { src: string | null; size?: number }) {
  const box = { width: size, height: size };
  return src
    ? <img src={src} alt="" style={box} className="shrink-0 rounded border border-stone-200 object-cover" />
    : (
      <span style={box} className="flex shrink-0 items-center justify-center rounded border border-dashed border-stone-300 bg-stone-50 text-stone-400" title="Chưa có ảnh">
        <ImageOff size={Math.round(size * 0.4)} aria-hidden />
      </span>
    );
}
