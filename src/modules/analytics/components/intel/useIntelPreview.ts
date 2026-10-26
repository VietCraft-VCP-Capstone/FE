import { useCallback, useEffect, useRef, useState } from 'react';
import { toState, type InsightState } from '../../hooks/useInsight';
import type { IntelPreviewBody, ListingIntel } from '../../intelTypes';
import { analyticsApi } from '../../services/analyticsApi';

const BAD_DRAFT = 'Bản nháp chưa hợp lệ. Kiểm tra lại tên sản phẩm, mô tả và danh sách ảnh rồi thử lại.';

export function useIntelPreview(body: IntelPreviewBody) {
  const [state, setState] = useState<InsightState<ListingIntel>>({ kind: 'loading' });
  const [nonce, setNonce] = useState(0);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: 'loading' });
    analyticsApi
      .intelPreview(bodyRef.current, controller.signal)
      .then(res =>
        setState(
          res.meta?.status === 'insufficient_data' || res.data === null
            ? { kind: 'insufficient', reason: res.meta?.reason || 'Chưa đủ dữ liệu để chấm bản nháp này.', meta: res.meta }
            : { kind: 'ready', data: res.data, meta: res.meta },
        ),
      )
      .catch(err => {
        if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
        setState(err?.response?.status === 400 ? { kind: 'error', message: BAD_DRAFT } : toState<ListingIntel>(err));
      });
    return () => controller.abort();
  }, [nonce]);

  const reload = useCallback(() => setNonce(n => n + 1), []);
  return { state, reload };
}
