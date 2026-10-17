import { useEffect, useState } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import type { InsightContext } from '../types';

/**
 * Ai đang xem và đang xem shop nào. Gọi một lần mỗi phiên trình duyệt, không gọi lại
 * mỗi lần đổi trang trong khu phân tích.
 */
let cached: InsightContext | null = null;

export function useInsightContext() {
  const [context, setContext] = useState<InsightContext | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    analyticsApi.context()
      .then(ctx => {
        cached = ctx;
        if (alive) setContext(ctx);
      })
      .catch(() => {
        if (alive && !cached) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { context, failed };
}
