import api from '../../../infrastructure/api/interceptors';
import type { AxiosResponse } from 'axios';
import { refundService } from '../../order/services/refundService';
import { collectRequestPages } from '../return-pagination';

export type ReturnResolution = 'EXCHANGE' | 'REFUND';
export type EvidenceKind = 'IMAGE' | 'VIDEO';
export type ReturnAction = 'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE' | 'PROPOSE_FAULT_CHANGE';
export type FaultParty = 'BUYER' | 'SELLER' | 'PRINTER' | 'CARRIER' | 'PLATFORM';
export interface ReturnEvidence { id: string; kind: EvidenceKind; uri: string }
export interface ReturnRequestInput { orderId: string; orderItemId: string; quantity: number; reasonCode: string; description: string; resolution: ReturnResolution; evidence: ReturnEvidence[] }
export type ReturnRequestStatus = 'SUBMITTED' | 'PENDING_PRINTER' | 'PRINTER_PROPOSED_FAULT_CHANGE' | 'APPROVED' | 'REJECTED' | 'DISPUTED' | 'AWAITING_ADMIN_REFUND' | 'ADMIN_REJECTED' | 'CONVERTED_TO_REFUND' | 'WAITING_BUYER_CHOICE' | 'WAITING_STOCK' | 'REPLACEMENT_CREATED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export interface ReturnRequest {
  id?: string;
  _id?: string;
  order_id: string;
  order_item_id: string;
  buyer_id: string;
  seller_id: string;
  printer_id: string;
  item_snapshot: Record<string, unknown>;
  quantity: number;
  reason_code: string;
  reason_description: string;
  requested_resolution: ReturnResolution;
  final_resolution: ReturnResolution | null;
  status: ReturnRequestStatus;
  deadline_at: string | null;
  linked_refund_status?: string | null;
  evidence_requested_at?: string | null;
  evidence_deadline_at?: string | null;
  buyer_evidence_submitted_at?: string | null;
  fault_party?: FaultParty | null;
  refund_amount_minor?: number | null;
  refund_currency?: string | null;
  replacement_order_id?: string | null;
  replacement_order_code?: string | null;
  created_at: string;
  updated_at: string;
}
export interface ReturnTimelineEvent {
  request_id: string;
  actor_id: string;
  actor_role: 'BUYER' | 'SELLER' | 'PRINTER' | 'ADMIN' | 'SYSTEM';
  from_status: string | null;
  to_status: string | null;
  reason: string;
  event_id: string | null;
  created_at: string;
}
export interface ReturnEvidenceRecord {
  request_id: string;
  evidence_id: string;
  kind: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SYSTEM';
  storage_ref: string;
  uploaded_by: string;
  created_at: string;
}
export interface ReturnDetail { request: ReturnRequest; timeline: ReturnTimelineEvent[]; evidence: ReturnEvidenceRecord[] }

type ApiResponse = AxiosResponse<unknown>;
const unwrap = <T>(response: ApiResponse): T => {
  const body = response.data;
  if (typeof body === 'object' && body !== null && 'data' in body) return body.data as T;
  return body as T;
};
export type ReturnEligibilityReasonCode = 'NOT_DELIVERED' | 'MISSING_ORDER_ITEM_ID' | 'NORMAL_UNSUPPORTED' | 'ACTIVE_REQUEST' | 'EXPIRED' | 'QUANTITY_EXHAUSTED';
export interface ReturnEligibilityItem {
  orderItemId: string | null;
  eligible: boolean;
  reasonIfNot: { code: ReturnEligibilityReasonCode; label: string } | null;
  deadline: string | null;
  remainingQuantity: number;
  activeRequestId?: string;
}
export interface ShopAuditRisk {
  shop_id: string;
  shop_name: string;
  reputation_score: number;
  reputation_tier: 'TRUSTED' | 'NORMAL' | 'WARNING' | 'RESTRICTED';
  clean_streak_orders: number;
  dispute_count_30d: number;
  penalty_points_30d: number;
  average_rating: number;
  rating_count: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

export interface BuyerAuditRisk {
  buyer_id: string;
  total_delivered_orders: number;
  total_return_requests: number;
  dispute_rate_pct: number;
  is_flagged_for_abuse: boolean;
}

export interface DisputeAuditProfile {
  shop: ShopAuditRisk | null;
  buyer: BuyerAuditRisk;
}

export interface PrinterDecision { action: ReturnAction; reason: string; proposedFault?: FaultParty; proposedClassification?: string }
export interface AdminDecision { resolution: ReturnResolution | null; faultParty: FaultParty | null; reason: string; amountMinor?: number; currency?: string }
export interface ReturnRequestPage { items: ReturnRequest[]; total: number; page: number; pageSize: number }

const idOf = (request: ReturnRequest) => request.id || request._id || '';

export const returnService = {
  create: async (payload: ReturnRequestInput): Promise<ReturnRequest> => unwrap(await api.post('/returns/requests', payload)),
  eligibility: async (orderId: string): Promise<ReturnEligibilityItem[]> => {
    const result = unwrap<{ items: ReturnEligibilityItem[] }>(await api.get<{ items: ReturnEligibilityItem[] }>('/returns/eligibility', { params: { orderId } }));
    return result.items || [];
  },
  listPage: async (status?: string, page = 1, pageSize = 20): Promise<ReturnRequestPage> => unwrap(await api.get('/returns/requests', { params: { status: status || undefined, page, pageSize } })),
  list: async (status?: string): Promise<ReturnRequest[]> => collectRequestPages(page => returnService.listPage(status, page, 100)),
  detail: async (id: string): Promise<ReturnDetail> => unwrap(await api.get<ReturnDetail>(`/returns/requests/${encodeURIComponent(id)}`)),
  auditProfile: async (id: string): Promise<DisputeAuditProfile> => unwrap(await api.get<DisputeAuditProfile>(`/returns/requests/${encodeURIComponent(id)}/audit-profile`)),
  dispute: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/dispute`, { reason })),
  addEvidence: async (id: string, evidence: ReturnEvidence[]): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/evidence`, { evidence })),
  printerDecision: async (id: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/printer-decision`, payload)),
  requestEvidence: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/printer-evidence-request`, { reason })),
  adminDecision: async (id: string, payload: AdminDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/admin/decision`, payload)),
  adminConfirmRefund: async (id: string, payload: { amountMinor: number; currency: string; faultParty: FaultParty }): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/requests/${encodeURIComponent(id)}/admin/confirm-refund`, payload)),
  clock: async (): Promise<{ now: string }> => (await api.get('/returns/clock')).data,
  devPrinterAction: async (requestId: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>('/returns/requests/dev/printer-action', { requestId, ...payload })),
  upload: async (file: File): Promise<ReturnEvidence> => {
    const uri = await refundService.uploadEvidence(file);
    return { id: crypto.randomUUID(), uri, kind: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' };
  },
  idOf,
};
