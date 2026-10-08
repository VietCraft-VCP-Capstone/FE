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
  /** Lý do lần chuyển tiền hoàn gần nhất thất bại hoặc chưa chạy được. */
  execution_error?: string;
  created_at: string;
}

function unwrap<T>(response: any): T { return response.data && Object.prototype.hasOwnProperty.call(response.data, 'data') ? response.data.data : response.data; }
export const refundService = {
  uploadEvidence: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/refund-evidence/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = response.data.url as string;
    return url.startsWith('/uploads/') ? new URL(url, api.defaults.baseURL || window.location.origin).toString() : url;
  },
  create: async (orderId: string, payload: { reason_category: string; description: string; evidence: string[]; refund_type: 'FULL' | 'PARTIAL'; refund_amount?: number }) => unwrap<RefundRequest>(await api.post(`/orders/${encodeURIComponent(orderId)}/refund-requests`, payload)),
  get: async (id: string) => unwrap<RefundRequest>(await api.get(`/refund-requests/${encodeURIComponent(id)}`)),
  getForOrder: async (orderId: string) => unwrap<RefundRequest | null>(await api.get(`/orders/${encodeURIComponent(orderId)}/refund-requests`)),
  dispute: async (id: string, reason: string) => unwrap<RefundRequest>(await api.post(`/refund-requests/${encodeURIComponent(id)}/dispute`, { reason })),
  sellerList: async (status?: RefundStatus | 'ALL') => unwrap<RefundRequest[]>(await api.get('/seller/refund-requests', { params: status && status !== 'ALL' ? { status } : undefined })),
  /** Seller chạy lại việc chuyển tiền hoàn khi lần trước lỗi. */
  sellerRetryExecution: async (id: string) => unwrap<RefundRequest>(await api.post(`/seller/refund-requests/${encodeURIComponent(id)}/retry-execution`)),
  sellerDecision: async (id: string, decision: 'APPROVE' | 'REJECT', note: string) => unwrap<RefundRequest>(await api.post(`/seller/refund-requests/${encodeURIComponent(id)}/decision`, { decision, note })),
  adminList: async () => unwrap<RefundRequest[]>(await api.get('/admin/refund-requests', { params: { status: 'DISPUTED' } })),
  adminResolve: async (id: string, payload: { decision: 'APPROVE' | 'REJECT'; cost_bearer: 'SELLER' | 'PRINTER' | 'PLATFORM'; refund_amount?: number; note: string }) => unwrap<RefundRequest>(await api.post(`/admin/refund-requests/${encodeURIComponent(id)}/resolve`, payload)),
};
