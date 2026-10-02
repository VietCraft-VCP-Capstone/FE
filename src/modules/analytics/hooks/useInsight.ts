import { useCallback, useEffect, useRef, useState } from 'react';
import { analyticsApi, type QueryParams } from '../services/analyticsApi';
import type { InsightMeta, InsightViewer } from '../types';

/**
 * Trạng thái một khối số liệu. Mỗi nhánh là một màn hình khác nhau — KHÔNG gộp
 * "chưa đủ dữ liệu" với "lỗi" hay với "0": người bán cần biết vì sao không có số.
 */
export type InsightState<T> =
  | { kind: 'loading' }
  /** status ok hoặc partial. partial thì meta.reason nói vì sao độ tin cậy thấp. */
  | { kind: 'ready'; data: T; meta: InsightMeta; viewer?: InsightViewer }
  /** Đã tính, nhưng shop này chưa đủ dữ liệu. data là null, KHÔNG phải 0. */
  | { kind: 'insufficient'; reason: string; meta: InsightMeta; viewer?: InsightViewer }
  /** Job đêm chưa chạy lần nào cho bảng này (503 mart_not_ready). */
  | { kind: 'not_ready'; collection: string }
  /** Người bán chưa có gian hàng (409 shop_required). */
  | { kind: 'shop_required' }
  /** Dịch vụ phân tích không phản hồi hoặc chưa cấu hình (502/503/504). */
  | { kind: 'unavailable'; code: string }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: InsightState<unknown> }>();

function keyOf(path: string, params?: QueryParams): string {
  const entries = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return `${path}?${entries.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

/** Xoá cache của một nhóm đường dẫn sau khi ghi (ví dụ thêm shop theo dõi). */
export function invalidateInsights(pathPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) cache.delete(key);
  }
}

function toState<T>(err: any): InsightState<T> {
  const status: number | undefined = err?.response?.status;
  const body = err?.response?.data || {};
  if (status === 503 && body.error === 'mart_not_ready') return { kind: 'not_ready', collection: body.collection || '' };
  if (status === 409 && body.error === 'shop_required') return { kind: 'shop_required' };
  if (status === 404) return { kind: 'not_found' };
  if (status === 502 || status === 503 || status === 504 || !status) {
    return { kind: 'unavailable', code: body.error || 'network' };
  }
  return { kind: 'error', message: typeof body.error === 'string' ? body.error : 'Không đọc được số liệu.' };
}

/**
 * Đọc một endpoint phân tích. `path` null = chưa đủ điều kiện để gọi (ví dụ chưa chọn
 * danh mục). Kết quả được nhớ 5 phút theo đường dẫn + tham số, nên chuyển qua lại giữa
 * các trang, hoặc giữa khu vận hành và khu phân tích, không phải chờ tải lại.
 */
export function useInsight<T>(path: string | null, params?: QueryParams) {
  const key = path ? keyOf(path, params) : null;
  const [state, setState] = useState<InsightState<T>>(() => {
    const hit = key ? cache.get(key) : undefined;
    return hit && Date.now() - hit.at < TTL_MS ? (hit.value as InsightState<T>) : { kind: 'loading' };
  });
  const [nonce, setNonce] = useState(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  // Cờ chỉ đúng cho LẦN gọi ngay sau khi bấm "Thử lại". Nếu dùng `nonce !== 0` để quyết
  // định bỏ qua cache thì mọi lần đổi bộ lọc SAU đó cũng bỏ qua cache, và người bán đổi
  // qua lại 7d/30d sẽ phải chờ tải mới mỗi lần.
  const forceRef = useRef(false);

  useEffect(() => {
    if (!path || !key) return;
    const forced = forceRef.current;
    forceRef.current = false;
    const hit = cache.get(key);
    if (!forced && hit && Date.now() - hit.at < TTL_MS) {
      setState(hit.value as InsightState<T>);
      return;
    }

    const controller = new AbortController();
    setState({ kind: 'loading' });
    analyticsApi
      .get<T>(path, paramsRef.current, controller.signal)
      .then(res => {
        const value: InsightState<T> =
          res.meta?.status === 'insufficient_data' || res.data === null
            ? { kind: 'insufficient', reason: res.meta?.reason || 'Chưa đủ dữ liệu để tính.', meta: res.meta, viewer: res.viewer }
            : { kind: 'ready', data: res.data as T, meta: res.meta, viewer: res.viewer };
        cache.set(key, { at: Date.now(), value });
        setState(value);
      })
      .catch(err => {
        if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
        setState(toState<T>(err));
      });
    return () => controller.abort();
  }, [path, key, nonce]);

  const reload = useCallback(() => {
    if (key) cache.delete(key);
    forceRef.current = true;
    setNonce(n => n + 1);
  }, [key]);

  return { state, reload };
}
