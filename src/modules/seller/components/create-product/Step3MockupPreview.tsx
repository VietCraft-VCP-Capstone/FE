import { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { productsService } from '../../../product/services/productsService';
import { abs } from './useHTMLImage';

interface Step3Props {
    blank: any;
    faces: Record<string, any[]>;
    toApiLayer: (layer: any) => any;
    selectedVariants: Record<string, { on: boolean; markup: string; stock: string }>;
    spaceOf?: (area: any) => { x: number; y: number; width: number; height: number };
}

export function Step3MockupPreview({ blank, faces, toApiLayer, selectedVariants, spaceOf }: Step3Props) {
    if (!blank) return null;
    const printAreas = blank.print_areas || [];
    const variations = blank.variations || [];
    const areas = printAreas.filter((a: any) => (faces[a.key] || []).length > 0);
    const [images, setImages] = useState<string[] | null>(null);
    const [active, setActive] = useState(0);
    const [err, setErr] = useState('');

    useEffect(() => {
        const placements = areas.map((a: any) => ({
            print_area_key: a.key,
            area: spaceOf ? spaceOf(a) : a,
            layers: (faces[a.key] || []).map(toApiLayer)
        }));
        setImages(null); setErr('');
        productsService.previewMockup(blank._id, placements)
            .then((imgs) => setImages(imgs && imgs.length ? imgs : [blank.default_image]))
            .catch((e: any) => setErr(e.response?.data?.error || 'Không tạo được xem trước'));
    }, [blank._id, faces]);

    const chosen = Object.entries(selectedVariants || {}).filter(([, v]: any) => v.on);
    const prices = (chosen.length ? chosen : variations.map((v: any) => [v.sku, { markup: '0' }]))
        .map(([sku, v]: any) => { const bv = variations.find((x: any) => x.sku === sku); return bv ? (bv.base_cost || 0) + (Number(v.markup) || 0) : 0; })
        .filter((n: number) => n > 0);
    const minPrice = prices.length ? Math.min(...prices) : (variations.length ? Math.min(...variations.map((v: any) => v.base_cost || 0)) : 0);

    return (
        <div className="preview-step">
            {err && <div className="px-[15px] py-[11px] rounded-[9px] text-[13px] font-medium mb-4 bg-admin-danger-050 border border-[#f6caca] text-[#b91c1c]">{err}</div>}
            {!images && !err && <div className="preview-loading"><Loader2 size={26} className="animate-spin" /><span>Đang tạo mockup thật...</span></div>}
            {images && (
                <div className="preview-showcase">
                    <div className="preview-gallery">
                        <div className="preview-hero">
                            <img src={abs(images[active] || images[0])} alt="mockup" />
                        </div>
                        {images.length > 1 && (
                            <div className="preview-thumbs">
                                {images.map((src, i) => (
                                    <button key={i} type="button" className={`preview-thumb ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
                                        <img src={abs(src)} alt={areas[i]?.label} />
                                        <span>{areas[i]?.label || areas[i]?.key}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="preview-info">
                        <div className="preview-info-badge"><Check size={13} /> Mockup thực tế từ sản phẩm</div>
                        <h2 className="preview-info-title">{blank.title}</h2>
                        <div className="preview-info-price">
                            <span className="preview-info-from">Giá bán dự kiến từ</span>
                            <span className="preview-info-amount">{minPrice.toLocaleString()}đ</span>
                        </div>
                        <div className="preview-info-meta">
                            <div className="preview-info-row"><span>Loại phôi</span><b>{blank.title}</b></div>
                            <div className="preview-info-row"><span>Số mặt in</span><b>{areas.length} mặt</b></div>
                        </div>
                        <p className="preview-info-note">Bấm <b>Tiếp</b> để đặt tên sản phẩm, nhập mô tả, chọn danh mục và cấu hình giá bán.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Step3MockupPreview;
