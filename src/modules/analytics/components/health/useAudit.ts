import { useEffect, useState } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import type { QualityAuditData } from '../../qualityTypes';

export function useAudit(productId: string) {
  const [data, setData] = useState<QualityAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setFailed(false);
    analyticsApi.listingQuality(productId)
      .then(res => res?.data && setData(res.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [productId]);

  const recheck = async () => {
    setRechecking(true);
    try {
      const res = await analyticsApi.listingQualityRecheck(productId);
      if (res?.data) {
        setData(res.data);
        setFailed(false);
      }
    } catch {
      setFailed(true);
    } finally {
      setRechecking(false);
    }
  };

  return { data, loading, failed, rechecking, recheck };
}
