import api from '../../../infrastructure/api/interceptors';

export type RefundStatus = 'PENDING_SELLER' | 'SELLER_APPROVED' | 'SELLER_REJECTED' | 'PENDING_PRINTER' | 'PRINTER_APPROVED' | 'PRINTER_REJECTED' | 'DISPUTED' | 'ADMIN_APPROVED' | 'ADMIN_REJECTED' | 'REFUNDED' | 'TIMEOUT_ESCALATED';
export interface RefundRequest {
  _id: string;
  order_id: any;
  buyer_id: any;
  seller_id: any;
  product_type: 'NORMAL' | 'POD';
  reason_category: string;
  description: string;
  evidence: string[];
  refund_type: 'FULL' | 'PARTIAL';
  refund_amount?: number;
  status: RefundStatus;
  triage_result?: 'SELLER_RESPONSIBILITY' | 'PRINTER_RESPONSIBILITY';
  triage_checklist?: { evidence_reviewed: boolean; order_verified: boolean; artwork_checked: boolean; seller_terms_checked: boolean; note: string };
  seller_response?: { decision: 'APPROVE' | 'REJECT'; note?: string; responded_at: string };
  printer_response?: { decision: 'APPROVE' | 'REJECT'; note?: string; responded_at: string };
  dispute?: { reason: string; opened_at: string };
  admin_decision?: { decision: 'APPROVE' | 'REJECT'; refund_type: 'FULL' | 'PARTIAL'; cost_bearer: 'SELLER' | 'PRINTER' | 'PLATFORM'; note: string };
  sla_deadlines?: { seller_deadline: string; printer_deadline?: string };
  execution_status?: string;
  created_at: string;
}

function unwrap<T>(response: any): T { return response.data && Object.prototype.hasOwnProperty.call(response.data, 'data') ? response.data.data : response.data; }
export const refundService = {
  createTestFlow: async (orderId: string) => unwrap<{ order_id: string; refund_request_id: string; payment_status: string }>(await api.post(`/orders/${encodeURIComponent(orderId)}/refund-test-flow`)),
  create: async (orderId: string, payload: { reason_category: string; description: string; evidence: string[]; refund_type: 'FULL' | 'PARTIAL'; refund_amount?: number }) => unwrap<RefundRequest>(await api.post(`/orders/${encodeURIComponent(orderId)}/refund-requests`, payload)),
  get: async (id: string) => unwrap<RefundRequest>(await api.get(`/refund-requests/${encodeURIComponent(id)}`)),
  getForOrder: async (orderId: string) => unwrap<RefundRequest | null>(await api.get(`/orders/${encodeURIComponent(orderId)}/refund-requests`)),
  dispute: async (id: string, reason: string) => unwrap<RefundRequest>(await api.post(`/refund-requests/${encodeURIComponent(id)}/dispute`, { reason })),
  sellerList: async (status?: RefundStatus | 'ALL') => unwrap<RefundRequest[]>(await api.get('/seller/refund-requests', { params: status && status !== 'ALL' ? { status } : undefined })),
  triage: async (id: string, triage_result: 'SELLER_RESPONSIBILITY' | 'PRINTER_RESPONSIBILITY', checklist: { evidence_reviewed: boolean; order_verified: boolean; artwork_checked: boolean; seller_terms_checked: boolean; note: string }) => unwrap<RefundRequest>(await api.post(`/seller/refund-requests/${encodeURIComponent(id)}/triage`, { triage_result, checklist })),
  sellerDecision: async (id: string, decision: 'APPROVE' | 'REJECT', note: string) => unwrap<RefundRequest>(await api.post(`/seller/refund-requests/${encodeURIComponent(id)}/decision`, { decision, note })),
  sellerDispute: async (id: string, reason: string) => unwrap<RefundRequest>(await api.post(`/seller/refund-requests/${encodeURIComponent(id)}/dispute`, { reason })),
  adminList: async () => unwrap<RefundRequest[]>(await api.get('/admin/refund-requests', { params: { status: 'DISPUTED' } })),
  adminResolve: async (id: string, payload: { decision: 'APPROVE' | 'REJECT'; cost_bearer: 'SELLER' | 'PRINTER' | 'PLATFORM'; refund_amount?: number; note: string }) => unwrap<RefundRequest>(await api.post(`/admin/refund-requests/${encodeURIComponent(id)}/resolve`, payload)),
};
