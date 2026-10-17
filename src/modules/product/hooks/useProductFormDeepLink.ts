import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ProductItem } from '../types/product';
import { productsService } from '../services/productsService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

type OpenForm = (product: ProductItem | null, focusField?: string | null) => void;
type ShowToast = (message: string, type: 'error') => void;

/**
 * `?new=1` mở modal tạo mới; `?edit=<id>#<field>` (việc cần sửa F29 ở khu "Phân tích & AI")
 * mở modal sửa đúng sản phẩm và trỏ tới ô `field`. Đọc xong thì xoá khỏi URL để
 * tải lại trang không mở lại modal, và bấm lại cùng đường dẫn vẫn mở được.
 */
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
    openFormRef.current(null);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const focusField = hash ? decodeURIComponent(hash.slice(1)) : null;
    // Không huỷ theo cleanup của effect: xoá `edit` khỏi URL làm effect chạy lại ngay,
    // cleanup sẽ bỏ mất kết quả. Chỉ bỏ khi đã có yêu cầu mới hơn hoặc trang đã unmount.
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
    // setSearchParams điều hướng tới "?..." nên hash cũng bị bỏ theo.
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, hash, showToast]);
}
