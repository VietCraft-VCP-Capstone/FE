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
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      analyticsApi.context()
        .then(ctx => {
          cached = ctx;
          if (alive) setContext(ctx);
          if (alive && !ctx.ai_reachable) {
            retryTimer = setTimeout(load, 3500);
          }
        })
        .catch(() => {
          if (alive && !cached) setFailed(true);
        });
    };
    load();
    return () => {
      alive = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { context, failed };
}
