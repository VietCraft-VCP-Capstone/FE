import api from '../../../infrastructure/api/interceptors';

export interface AdminSellerApplicationItem {
    id: string;
    user_id: string;
    seller_type: 'INDIVIDUAL' | 'BUSINESS';
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    email: string;
    phone: string;
    shop_name: string;
    full_name: string;
    company_name?: string;
    id_card_masked: string;
    bank_name: string;
    account_holder: string;
    account_number_masked: string;
    is_name_matched: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminSellerListResponse {
    items: AdminSellerApplicationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export const adminSellerService = {
    async getApplications(params: {
        status?: string;
        seller_type?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<AdminSellerListResponse> {
        const res = await api.get('/admin/seller-applications', { params });
        return res.data?.data;
    },

    async getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
        const res = await api.get('/admin/seller-applications/stats');
        return res.data?.data;
    },

    async getApplicationDetail(id: string): Promise<any> {
        const res = await api.get(`/admin/seller-applications/${id}`);
        return res.data?.data;
    },

    async approveApplication(id: string): Promise<{ success: boolean; message: string; shopId: string }> {
        const res = await api.post(`/admin/seller-applications/${id}/approve`);
        return res.data;
    },

    async rejectApplication(id: string, reason: string): Promise<{ success: boolean; message: string }> {
        const res = await api.post(`/admin/seller-applications/${id}/reject`, { reason });
        return res.data;
    }
};
