import api from '../../../infrastructure/api/interceptors';

export interface SellerFinanceOverview {
    availableBalance: number;
    pendingBalance: number;
    settledRevenue: number;
    totalWithdrawn: number;
    totalPlatformFee: number;
    defaultBank?: {
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountHolder: string;
    } | null;
}

export interface SellerSettlementItem {
    orderId: string;
    orderCode: string;
    orderDate: string;
    deliveredDate?: string;
    orderStatus: string;
    subtotal: number;
    platformFee: number;
    commissionRate: number;
    netPayout: number;
    settlementStatus: 'SETTLED' | 'PENDING' | 'CANCELLED';
    itemsCount: number;
}

export interface SellerWithdrawalItem {
    id: string;
    withdrawalCode: string;
    amount: number;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
    completedAt?: string;
    note?: string;
    failureReason?: string;
}

export interface SettlementsResponse {
    items: SellerSettlementItem[];
    total: number;
    page: number;
    totalPages: number;
}

export interface WithdrawalsResponse {
    items: SellerWithdrawalItem[];
    total: number;
    page: number;
    totalPages: number;
}

export const sellerFinanceService = {
    getOverview: async (): Promise<SellerFinanceOverview> => {
        const res = await api.get<{ success: boolean; data: SellerFinanceOverview }>('/seller/finance/overview');
        return res.data.data;
    },

    getSettlements: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<SettlementsResponse> => {
        const res = await api.get<{ success: boolean } & SettlementsResponse>('/seller/finance/settlements', {
            params,
        });
        return {
            items: res.data.items || [],
            total: res.data.total || 0,
            page: res.data.page || 1,
            totalPages: res.data.totalPages || 0,
        };
    },

    getWithdrawals: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<WithdrawalsResponse> => {
        const res = await api.get<{ success: boolean } & WithdrawalsResponse>('/seller/finance/withdrawals', {
            params,
        });
        return {
            items: res.data.items || [],
            total: res.data.total || 0,
            page: res.data.page || 1,
            totalPages: res.data.totalPages || 0,
        };
    },

    requestWithdrawal: async (payload: {
        amount: number;
        bank?: { bankName: string; bankCode: string; accountNumber: string; accountHolder: string };
    }): Promise<SellerWithdrawalItem> => {
        const res = await api.post<{ success: boolean; data: SellerWithdrawalItem; message: string }>(
            '/seller/finance/withdraw',
            payload
        );
        return res.data.data;
    },
};
