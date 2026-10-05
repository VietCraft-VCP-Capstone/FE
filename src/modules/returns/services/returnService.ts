import api from '../../../infrastructure/api/interceptors';
import type { AxiosResponse } from 'axios';
import { refundService } from '../../order/services/refundService';

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
export interface PrinterDecision { action: ReturnAction; reason: string; proposedFault?: FaultParty; proposedClassification?: string }
export interface AdminDecision { resolution: ReturnResolution; faultParty: FaultParty; reason: string; amountMinor: number; currency: string }

const idOf = (request: ReturnRequest) => request.id || request._id || '';

export const returnService = {
  create: async (payload: ReturnRequestInput): Promise<ReturnRequest> => unwrap(await api.post('/returns/v3/requests', payload)),
  eligibility: async (orderId: string): Promise<ReturnEligibilityItem[]> => {
    const result = unwrap<{ items: ReturnEligibilityItem[] }>(await api.get<{ items: ReturnEligibilityItem[] }>('/returns/v3/eligibility', { params: { orderId } }));
    return result.items || [];
  },
  list: async (status?: string): Promise<ReturnRequest[]> => {
    const result = unwrap<{ items: ReturnRequest[] }>(await api.get<{ items: ReturnRequest[] }>('/returns/v3/requests', { params: status ? { status } : undefined }));
    return result.items || [];
  },
  detail: async (id: string): Promise<ReturnDetail> => unwrap(await api.get<ReturnDetail>(`/returns/v3/requests/${encodeURIComponent(id)}`)),
  dispute: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/v3/requests/${encodeURIComponent(id)}/dispute`, { reason })),
  printerDecision: async (id: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/v3/requests/${encodeURIComponent(id)}/printer-decision`, payload)),
  requestEvidence: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/v3/requests/${encodeURIComponent(id)}/printer-evidence-request`, { reason })),
  adminDecision: async (id: string, payload: AdminDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/v3/requests/${encodeURIComponent(id)}/admin/decision`, payload)),
  adminConfirmRefund: async (id: string, payload: { amountMinor: number; currency: string; faultParty: FaultParty }): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>(`/returns/v3/requests/${encodeURIComponent(id)}/admin/confirm-refund`, payload)),
  clock: async (): Promise<{ now: string }> => (await api.get('/returns/v3/clock')).data,
  devPrinterAction: async (requestId: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post<ReturnRequest>('/returns/v3/requests/dev/printer-action', { requestId, ...payload })),
  upload: async (file: File): Promise<ReturnEvidence> => {
    const uri = await refundService.uploadEvidence(file);
    return { id: crypto.randomUUID(), uri, kind: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' };
  },
  idOf,
};
