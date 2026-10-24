import { withCommission } from '../../../../shared/utils/commission';
import type { IntelDraft } from '../../../analytics/intelTypes';

export interface DraftSource {
    title: string;
    description: string;
    categories: any[];
    categoryId: string;
    tags: string[];
    materials: string[];
    images: string[];
    blank: any;
    selectedVariants: Record<string, { on: boolean; markup: string }>;
    commissionPercent: number | null;
}

export function previewDraft(s: DraftSource): IntelDraft {
    const pct = s.commissionPercent;
    const prices = pct === null ? [] : (s.blank?.variations || [])
        .filter((v: any) => s.selectedVariants[v.sku]?.on)
        .map((v: any) => withCommission((v.base_cost || 0) + (Number(s.selectedVariants[v.sku].markup) || 0), pct));
    const category = s.categories.find(c => c._id === s.categoryId)?.name || '';
    return {
        title: s.title.trim().slice(0, 200),
        description: s.description.slice(0, 5000),
        tags: s.tags.slice(0, 20).map(t => t.slice(0, 40)),
        materials: s.materials,
        category: category.slice(0, 80),
        ...(prices.length ? { price: Math.min(...prices) } : {}),
        images: s.images,
    };
}
