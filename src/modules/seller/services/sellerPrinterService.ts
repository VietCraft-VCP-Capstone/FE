import api from '../../../infrastructure/api/interceptors';

export interface PrinterPartnerInfo {
  printer_id?: string;
  printer_name: string;
  api_url: string;
  api_key?: string;
  webhook_secret?: string;
  is_connected: boolean;
  connected_at?: string;
  auto_approve?: boolean;
}

export interface PrinterSettingsResponse {
  printer: PrinterPartnerInfo;
  defaultApiUrl: string;
}

export interface ConnectPrinterPayload {
  printer_name: string;
  api_url: string;
  api_key?: string;
  auto_approve?: boolean;
}

export const sellerPrinterService = {
  async getSettings(): Promise<PrinterSettingsResponse> {
    const res = await api.get('/seller/printer');
    return res.data;
  },

  async testConnection(apiUrl: string, apiKey?: string): Promise<{ success: boolean; message: string; blanksCount?: number }> {
    const res = await api.post('/seller/printer/test', {
      api_url: apiUrl,
      api_key: apiKey,
    });
    return res.data;
  },

  async connect(payload: ConnectPrinterPayload): Promise<{ message: string; printer: PrinterPartnerInfo }> {
    const res = await api.post('/seller/printer/connect', payload);
    return res.data;
  },

  async disconnect(): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/seller/printer/disconnect');
    return res.data;
  },
};

export default sellerPrinterService;
