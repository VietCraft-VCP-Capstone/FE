import { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] rounded-md text-xs',
  md: 'w-12 h-12 min-w-[48px] max-w-[48px] min-h-[48px] max-h-[48px] rounded-lg text-sm',
  lg: 'w-16 h-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] rounded-xl text-base',
  xl: 'w-full aspect-4/3 rounded-2xl text-xl',
  full: 'w-full h-full text-base',
};

export function ProductImage({
  src,
  alt,
  className = '',
  size = 'md'
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const containerSize = SIZE_CLASSES[size];
  const imageSrc = src && !error ? src : null;

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 border border-stone-200/80 flex items-center justify-center flex-shrink-0 select-none ${containerSize} ${className}`}
    >
      {imageSrc ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center">
              <Package className="w-1/2 h-1/2 text-stone-300" />
            </div>
          )}
          <img
            src={imageSrc}
            alt={alt}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full object-cover transition-all duration-300 ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            loading="lazy"
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 p-1 text-center">
          {size === 'xl' ? (
            <div className="flex flex-col items-center gap-2">
              <ImageOff className="w-8 h-8 text-stone-400" />
              <span className="text-xs font-medium text-stone-500">Chưa có ảnh sản phẩm</span>
            </div>
          ) : (
            <Package className="w-1/2 h-1/2 text-stone-400" />
          )}
        </div>
      )}
    </div>
  );
}
