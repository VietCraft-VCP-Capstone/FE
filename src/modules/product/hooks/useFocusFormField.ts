import { RefObject, useEffect, useRef } from 'react';

export type ProductFormFocusTarget = 'images' | 'title' | 'tags' | 'price' | 'stock' | 'description';

// Map field của todo F29 sang ô trong form; field chưa có ô thì chỉ mở modal.
const FIELD_TO_TARGET: Record<string, ProductFormFocusTarget> = {
  images: 'images',
  description: 'description',
  tags: 'tags',
  stock_quantity: 'stock',
  stock: 'stock',
  'variants.retail_price': 'price',
  retail_price: 'price',
  price: 'price',
  content: 'title',
  title: 'title',
};

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-amber-400', 'ring-offset-4', 'rounded-xl'];
const HIGHLIGHT_MS = 2400;

export function resolveFocusTarget(field?: string | null): ProductFormFocusTarget | null {
  if (!field) return null;
  return FIELD_TO_TARGET[field] ?? null;
}

// Ưu tiên ô nhập trước nút: khối mô tả có thanh công cụ đứng trước textarea.
function firstFocusable(box: HTMLElement): HTMLElement | undefined {
  const usable = (el: HTMLElement) => el.getClientRects().length > 0 && !(el as HTMLInputElement).disabled;
  const pick = (selector: string) => Array.from(box.querySelectorAll<HTMLElement>(selector)).find(usable);
  return pick('input, textarea, select') ?? pick('button');
}

/** Cuộn tới và nháy viền ô cần sửa mỗi lần modal mở, chờ catalog tải xong. */
export function useFocusFormField(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  field: string | null | undefined,
  ready: boolean
) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      doneRef.current = false;
      return;
    }
    const target = resolveFocusTarget(field);
    if (!target || !ready || doneRef.current) return;

    let box: HTMLElement | null = null;
    let timer: number | undefined;
    const frame = requestAnimationFrame(() => {
      box = containerRef.current?.querySelector<HTMLElement>(`[data-focus-target="${target}"]`) ?? null;
      if (!box) return;
      // Đánh dấu trong callback để StrictMode huỷ frame đầu vẫn chạy lại được.
      doneRef.current = true;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstFocusable(box)?.focus({ preventScroll: true });
      box.classList.add(...HIGHLIGHT_CLASSES);
      const highlighted = box;
      timer = window.setTimeout(() => highlighted.classList.remove(...HIGHLIGHT_CLASSES), HIGHLIGHT_MS);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      box?.classList.remove(...HIGHLIGHT_CLASSES);
    };
  }, [containerRef, isOpen, field, ready]);
}
