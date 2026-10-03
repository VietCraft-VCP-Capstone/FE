import api from '../../../infrastructure/api/interceptors';
import { refundService } from '../../order/services/refundService';

export type ReturnResolution = 'EXCHANGE' | 'REFUND';
export type EvidenceKind = 'IMAGE' | 'VIDEO';
export type ReturnAction = 'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE' | 'PROPOSE_FAULT_CHANGE';
export type FaultParty = 'BUYER' | 'SELLER' | 'PRINTER' | 'CARRIER' | 'PLATFORM';
export interface ReturnEvidence { id: string; kind: EvidenceKind; uri: string }
export interface ReturnRequestInput { orderId: string; orderItemId: string; quantity: number; reasonCode: string; description: string; resolution: ReturnResolution; evidence: ReturnEvidence[] }
export interface ReturnRequest { id?: string; _id?: string; status?: string; [key: string]: any }
export interface ReturnDetail { request: ReturnRequest; timeline: any[]; evidence: any[] }
export interface PrinterDecision { action: ReturnAction; reason: string; proposedFault?: FaultParty; proposedClassification?: string }
export interface AdminDecision { resolution: ReturnResolution; faultParty: FaultParty; reason: string; amountMinor: number; currency: string }

const unwrap = <T>(response: any): T => response.data?.data as T;
const idOf = (request: ReturnRequest) => request.id || request._id || '';

export const returnService = {
  create: async (payload: ReturnRequestInput): Promise<ReturnRequest> => unwrap(await api.post('/returns/v3/requests', payload)),
  list: async (status?: string): Promise<ReturnRequest[]> => {
    const result = unwrap<{ items: ReturnRequest[] }>(await api.get('/returns/v3/requests', { params: status ? { status } : undefined }));
    return result.items || [];
  },
  detail: async (id: string): Promise<ReturnDetail> => unwrap(await api.get(`/returns/v3/requests/${encodeURIComponent(id)}`)),
  dispute: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post(`/returns/v3/requests/${encodeURIComponent(id)}/dispute`, { reason })),
  printerDecision: async (id: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post(`/returns/v3/requests/${encodeURIComponent(id)}/printer-decision`, payload)),
  requestEvidence: async (id: string, reason: string): Promise<ReturnRequest> => unwrap(await api.post(`/returns/v3/requests/${encodeURIComponent(id)}/printer-evidence-request`, { reason })),
  adminDecision: async (id: string, payload: AdminDecision): Promise<ReturnRequest> => unwrap(await api.post(`/returns/v3/requests/${encodeURIComponent(id)}/admin/decision`, payload)),
  adminConfirmRefund: async (id: string, payload: { amountMinor: number; currency: string; faultParty: FaultParty }): Promise<ReturnRequest> => unwrap(await api.post(`/returns/v3/requests/${encodeURIComponent(id)}/admin/confirm-refund`, payload)),
  clock: async (): Promise<{ now: string }> => (await api.get('/returns/v3/clock')).data,
  devPrinterAction: async (requestId: string, payload: PrinterDecision): Promise<ReturnRequest> => unwrap(await api.post('/returns/v3/requests/dev/printer-action', { requestId, ...payload })),
  upload: async (file: File): Promise<ReturnEvidence> => {
    const uri = await refundService.uploadEvidence(file);
    return { id: crypto.randomUUID(), uri, kind: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' };
  },
  idOf,
};
