import type { MockupColorPreview, MockupLevel } from '../../../product/services/productsService';

/** Toạ độ trong khung ảnh phôi chuẩn 800×800 (cùng hệ toạ độ xưởng khai báo vùng in). */
export const TEMPLATE_SIZE = 800;

export interface LayerItem {
    id: string;
    type: 'image';
    x: number; y: number; scale: number; rotation: number;
    flipH?: boolean;
    design?: any; baseW?: number; baseH?: number;
}

export interface VariantState {
    on: boolean; markup: string; stock: string;
    color?: string; size?: string; base_cost?: number;
}
export type VariantMap = Record<string, VariantState>;

export interface PrintBox { x: number; y: number; width: number; height: number }

export interface ColorGroup {
    color: string;
    hex?: string;
    skus: string[];
    sizes: string[];
    minCost: number;
}

/** Vùng in đúng như xưởng khai báo; người bán không sửa được (file in phải khớp khổ in thật). */
export function printBoxOf(area: any): PrintBox {
    return {
        x: Number(area?.x ?? 200),
        y: Number(area?.y ?? 200),
        width: Number(area?.width ?? 400),
        height: Number(area?.height ?? 400),
    };
}

/** cm thật trên 1 px khung 800, nếu xưởng khai báo kích thước in vật lý. */
export function cmPerPx(area: any): number | null {
    const w = Number(area?.physical_width_cm), pw = Number(area?.width);
    if (w > 0 && pw > 0) return w / pw;
    const h = Number(area?.physical_height_cm), ph = Number(area?.height);
    if (h > 0 && ph > 0) return h / ph;
    return null;
}

/**
 * Độ phân giải khi in (DPI) của một hình: số px gốc của file / số inch thật của hình trên áo.
 * null khi xưởng không khai báo kích thước vật lý.
 */
export function printDpi(layer: LayerItem, area: any): number | null {
    const k = cmPerPx(area);
    if (!k || !layer.baseW) return null;
    const widthCm = layer.baseW * layer.scale * k;
    if (widthCm <= 0) return null;
    // baseW là px gốc của file thiết kế
    return Math.round(layer.baseW / (widthCm / 2.54));
}

export function groupColors(variations: any[]): ColorGroup[] {
    const map = new Map<string, ColorGroup>();
    for (const v of variations || []) {
        const name = (v.color || 'Màu mặc định').trim();
        if (!map.has(name)) map.set(name, { color: name, hex: v.color_hex, skus: [], sizes: [], minCost: Number(v.base_cost) || 0 });
        const g = map.get(name)!;
        if (v.sku && !g.skus.includes(v.sku)) g.skus.push(v.sku);
        if (v.size && !g.sizes.includes(v.size)) g.sizes.push(v.size);
        const c = Number(v.base_cost) || 0;
        if (c && (!g.minCost || c < g.minCost)) g.minCost = c;
        if (!g.hex && v.color_hex) g.hex = v.color_hex;
    }
    return [...map.values()];
}

export const LEVEL_META: Record<MockupLevel, { label: string; hint: string; cls: string }> = {
    photo: { label: 'Ảnh thật', hint: 'Ảnh chụp thật của xưởng cho màu này', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    verified: { label: 'Đã xác nhận', hint: 'Đổi màu trong vùng phôi xưởng đã xác nhận', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    auto: { label: 'Ảnh tự động', hint: 'AI tự tách nền, xưởng chưa xác nhận. Kiểm tra lại trước khi bán', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    estimated: { label: 'Ước lượng', hint: 'Không chạy được AI tách nền, màu có thể bị lem ra nền', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const LEVEL_RANK: Record<MockupLevel, number> = { photo: 0, verified: 1, auto: 2, estimated: 3 };

/** Mức kém nhất trong các ảnh của một màu (để cảnh báo). */
export function worstLevel(preview?: MockupColorPreview): MockupLevel | null {
    if (!preview?.items?.length) return null;
    return preview.items.reduce<MockupLevel>((w, i) => (LEVEL_RANK[i.level] > LEVEL_RANK[w] ? i.level : w), 'photo');
}

export const formatVnd = (n: number) => `${Math.round(n || 0).toLocaleString('vi-VN')}đ`;

/** Khoá nội dung của bộ thiết kế: đổi thiết kế thì phải render lại ảnh xem trước. */
export function designSignature(blankId: string, faces: Record<string, LayerItem[]>): string {
    const body = Object.keys(faces).sort().map(k => [k, (faces[k] || []).map(l => [
        l.design?._id, Math.round(l.x), Math.round(l.y), Math.round(l.scale * 1000), Math.round(l.rotation), !!l.flipH,
    ])]);
    return `${blankId}|${JSON.stringify(body)}`;
}
