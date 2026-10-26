export type QualitySeverity = 'high' | 'medium' | 'low';
export type QualityStatus = 'open' | 'resolved' | 'dismissed' | 'unverified';

export interface QualityRecommendation {
  action: string;
  message: string;
  field_link?: string;
  verification: string;
}

export interface QualityIssue {
  id: string;
  code: string;
  detector: string;
  severity: QualitySeverity;
  field: string;
  status: QualityStatus;
  confidence: number;
  evidence: Record<string, any>;
  message: string;
  recommendation: QualityRecommendation;
}

export interface QualitySummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface QualityAuditData {
  auditId: string;
  listingId: string;
  version: string;
  status: 'completed' | 'partial' | 'failed';
  auditedAt: string;
  contentHash: string;
  summary: QualitySummary;
  issues: QualityIssue[];
  detectors: Record<string, string>;
  warnings: string[];
}
