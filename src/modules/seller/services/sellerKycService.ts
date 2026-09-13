import api from '../../../infrastructure/api/interceptors';

export interface SellerKycStatusResponse {
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        is_phone_verified: boolean;
        is_email_verified: boolean;
        seller_status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    };
    application: {
        id: string;
        seller_type: 'INDIVIDUAL' | 'BUSINESS';
        status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
        phone: string;
        is_phone_verified: boolean;
        email: string;
        is_email_verified: boolean;
        kyc_data: {
            full_name: string;
            id_card_number_masked?: string;
            date_of_birth?: string;
            id_issue_date?: string;
            id_issue_place?: string;
            tax_code?: string;
            company_name?: string;
            business_license_number_masked?: string;
            legal_rep_name?: string;
            legal_rep_position?: string;
            front_id_url?: string;
            back_id_url?: string;
            portrait_url?: string;
            business_license_url?: string;
        };
        shop_info: {
            shop_name: string;
            shop_slug: string;
            description?: string;
            main_category?: string;
            pickup_address: {
                recipient_name: string;
                phone: string;
                province_id: string;
                district_id: string;
                ward_code: string;
                address_detail: string;
            };
        };
        bank_info: {
            bank_code: string;
            bank_name: string;
            account_number_masked?: string;
            account_holder: string;
            is_name_matched: boolean;
        };
        compliance: {
            agreed_terms: boolean;
            agreed_pdpd_policy: boolean;
            electronic_signature: string;
            signed_at: string;
        };
        review?: {
            reviewed_at?: string;
            rejection_reason?: string;
        };
        created_at: string;
        updated_at: string;
    } | null;
}

export interface SubmitApplicationPayload {
    seller_type: 'INDIVIDUAL' | 'BUSINESS';
    phone: string;
    phone_verified: boolean;
    kyc_data: {
        full_name: string;
        identity_card_number: string;
        date_of_birth?: string;
        id_issue_date?: string;
        id_issue_place?: string;
        tax_code?: string;
        front_id_image?: string;
        back_id_image?: string;
        portrait_image?: string;
        company_name?: string;
        business_license_number?: string;
        business_license_image?: string;
        legal_rep_name?: string;
        legal_rep_position?: string;
        legal_rep_id?: string;
    };
    shop_info: {
        shop_name: string;
        description?: string;
        main_category?: string;
        pickup_address: {
            recipient_name: string;
            phone: string;
            province_id: string;
            district_id: string;
            ward_code: string;
            address_detail: string;
        };
    };
    bank_info: {
        bank_code: string;
        bank_name: string;
        account_number: string;
        account_holder: string;
    };
    compliance: {
        agreed_terms: boolean;
        agreed_pdpd_policy: boolean;
        electronic_signature: string;
    };
}

export const sellerKycService = {
    async getStatus(): Promise<SellerKycStatusResponse> {
        const res = await api.get('/seller/kyc/status');
        return res.data?.data;
    },

    async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string }> {
        const res = await api.post('/seller/kyc/phone-otp/send', { phone });
        return res.data;
    },

    async verifyPhoneOtp(phone: string, code: string): Promise<{ success: boolean; message: string }> {
        const res = await api.post('/seller/kyc/phone-otp/verify', { phone, code });
        return res.data;
    },

    async uploadDocument(file: File): Promise<{ success: boolean; filename: string; secureUrl: string; message: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/seller/kyc/upload-doc', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    async submitApplication(payload: SubmitApplicationPayload): Promise<{ success: boolean; message: string; applicationId: string }> {
        const res = await api.post('/seller/kyc/apply', payload);
        return res.data;
    },

    async cancelOrDelete(): Promise<{ success: boolean; message: string }> {
        const res = await api.delete('/seller/kyc/cancel-or-delete');
        return res.data;
    }
};
