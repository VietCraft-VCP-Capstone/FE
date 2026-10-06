import api from '../../../infrastructure/api/client';

export interface FixedCostsConfig {
    domain_monthly: number;
    vps_base_monthly: number;
    frontend_hosting: number;
    security_ssl: number;
}

export interface UnitCostsConfig {
    storage_per_gb: number;
    ai_per_request: number;
    db_per_active_seller: number;
    payment_gateway_rate: number;
    notification_per_order: number;
}

export interface SellerQuotasConfig {
    free_storage_gb: number;
    free_ai_requests: number;
    overage_markup_rate: number;
}

export interface PoliciesConfig {
    default_commission_rate: number;
    min_order_fee: number;
    max_voucher_profit_share: number;
}

export interface PlatformCostConfigData {
    _id?: string;
    fixed_costs: FixedCostsConfig;
    unit_costs: UnitCostsConfig;
    seller_quotas: SellerQuotasConfig;
    policies: PoliciesConfig;
    updated_at?: string;
}

export interface CvpAnalysisData {
    period_days: number;
    active_sellers: number;
    completed_orders: number;
    total_gmv: number;
    aov: number;
    actual_platform_revenue: number;
    total_fixed_costs: number;
    total_variable_costs: number;
    total_costs: number;
    net_profit: number;
    is_profitable: boolean;
    break_even_orders: number;
    break_even_gmv: number;
    margin_of_safety_pct: number;
    unit_economics: {
        revenue_per_order: number;
        variable_cost_per_order: number;
        contribution_margin_per_order: number;
        contribution_margin_ratio: number;
    };
    breakdown: {
        fixed_costs: {
            domain: number;
            vps: number;
            frontend: number;
            ssl: number;
            subtotal: number;
        };
        infrastructure_costs: {
            active_seller_db: number;
            storage_estimated: number;
            ai_estimated: number;
            subtotal: number;
        };
        variable_costs: {
            payment_gateway: number;
            notification: number;
            subtotal_per_order: number;
        };
    };
}

export interface SimulationPoint {
    quantity: number;
    totalRevenue: number;
    totalCost: number;
    fixedCost: number;
    netProfit: number;
}

export interface SimulationData {
    simulated_orders: number;
    simulated_commission_rate: number;
    simulated_aov: number;
    projected_revenue: number;
    projected_total_cost: number;
    projected_net_profit: number;
    is_profitable: boolean;
    break_even_orders: number;
    break_even_gmv: number;
    margin_of_safety_pct: number;
    unit_contribution_margin: number;
    chart_series: SimulationPoint[];
}

export const adminFinanceService = {
    async getConfig(): Promise<PlatformCostConfigData> {
        const { data } = await api.get('/admin/finance/config');
        return data.data;
    },

    async updateConfig(payload: Partial<PlatformCostConfigData>): Promise<PlatformCostConfigData> {
        const { data } = await api.put('/admin/finance/config', payload);
        return data.data;
    },

    async getCVPAnalysis(): Promise<CvpAnalysisData> {
        const { data } = await api.get('/admin/finance/cvp-analysis');
        return data.data;
    },

    async runSimulation(
        simulatedOrders: number,
        simulatedRate: number,
        simulatedAov?: number
    ): Promise<SimulationData> {
        const { data } = await api.post('/admin/finance/simulate', {
            simulatedOrders,
            simulatedRate,
            simulatedAov,
        });
        return data.data;
    },
};
