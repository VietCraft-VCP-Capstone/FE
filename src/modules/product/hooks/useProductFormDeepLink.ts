import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ProductItem } from '../types/product';
import { productsService } from '../services/productsService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

export interface ProductPrefillDraft {
  title?: string;
  price?: number;
  description?: string;
  tags?: string[];
}

type OpenForm = (product: ProductItem | null, focusField?: string | null, prefill?: ProductPrefillDraft | null) => void;
type ShowToast = (message: string, type: 'error') => void;

export function useProductFormDeepLink(openForm: OpenForm, showToast: ShowToast) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hash } = useLocation();
  const openFormRef = useRef(openForm);
  openFormRef.current = openForm;
  const mountedRef = useRef(true);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    const rawTitle = searchParams.get('title') || undefined;
    const rawPrice = Number(searchParams.get('price') || 0) || undefined;
    const rawDesc = searchParams.get('description') || undefined;
    const rawTags = (searchParams.get('tags') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const prefill: ProductPrefillDraft | null =
      rawTitle || rawPrice || rawDesc || rawTags.length > 0
        ? { title: rawTitle, price: rawPrice, description: rawDesc, tags: rawTags }
        : null;
    openFormRef.current(null, null, prefill);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('title');
    next.delete('price');
    next.delete('description');
    next.delete('tags');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const focusField = hash ? decodeURIComponent(hash.slice(1)) : null;
    const requestId = ++latestRequestRef.current;
    const isCurrent = () => mountedRef.current && requestId === latestRequestRef.current;
    (async () => {
      try {
        const product = await productsService.getById(editId);
        if (isCurrent() && product) openFormRef.current(product, focusField);
      } catch (err: any) {
        if (isCurrent()) showToast(getApiErrorMessage(err, 'Không tìm thấy sản phẩm để sửa.'), 'error');
      }
    })();
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, hash, showToast]);
}
