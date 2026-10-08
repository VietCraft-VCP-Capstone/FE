import { useState } from 'react';
import { Star, Filter } from 'lucide-react';
import { abs } from './useHTMLImage';
import { commissionAmount, withCommission } from '../../../../shared/utils/commission';
import { money } from '../../../../shared/utils/format';

interface Step4Props {
    title: string;
    setTitle: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    categories: any[];
    categoryId: string;
    setCategoryId: (val: string) => void;
    blank: any;
    selectedVariants: Record<string, { on: boolean; markup: string; stock: string }>;
    setSelectedVariants: React.Dispatch<React.SetStateAction<Record<string, { on: boolean; markup: string; stock: string }>>>;
    selectedImages?: string[];
    coverImage?: string;
    /** % hoa hồng sàn. null = chưa tải được, khi đó không hiện giá niêm yết dự kiến. */
    commissionPercent: number | null;
}

export function Step4ProductDetails({
    title, setTitle,
    description, setDescription,
    categories, categoryId, setCategoryId,
    blank, selectedVariants, setSelectedVariants,
    selectedImages = [],
    coverImage = '',
    commissionPercent,
}: Step4Props) {
    const [colorFilter, setColorFilter] = useState('all');
    const [onlySelectedFilter, setOnlySelectedFilter] = useState(false);

    const setV = (sku: string, f: string, val: any) => setSelectedVariants((prev: any) => ({ ...prev, [sku]: { ...prev[sku], [f]: val } }));

    // Extract unique colors for filter
    const distinctColors = Array.from(new Set((blank?.variations || []).map((v: any) => v.color).filter(Boolean))) as string[];

    const displayedVariations = (blank?.variations || []).filter((v: any) => {
        if (colorFilter !== 'all' && v.color !== colorFilter) return false;
        if (onlySelectedFilter && !selectedVariants[v.sku]?.on) return false;
        return true;
    });

    const activeCount = Object.values(selectedVariants).filter((v: any) => v.on).length;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Ảnh sản phẩm đã chọn từ bước 3 */}
            {selectedImages && selectedImages.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-stone-900">Ảnh Sản Phẩm Khả Dụng ({selectedImages.length})</h2>
                            <span className="text-xs bg-[#edf5ed] text-[#1a6b1a] font-bold px-2.5 py-0.5 rounded-full">
                                Đã duyệt từ Bước 3
                            </span>
                        </div>
                        {coverImage && (
                            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                                Ảnh có gắn huy hiệu <span className="text-[#1a6b1a] font-bold">⭐</span> sẽ là ảnh đại diện chính khi lên sàn
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {selectedImages.map((src, i) => (
                            <div
                                key={i}
                                className={`relative w-20 h-20 rounded-xl border overflow-hidden shrink-0 bg-stone-50 p-1 transition-all ${
                                    coverImage === src
                                        ? 'border-[#1a6b1a] ring-2 ring-[#1a6b1a]/20 shadow-xs'
                                        : 'border-stone-200'
                                }`}
                            >
                                <img
                                    src={abs(src)}
                                    alt="mockup"
                                    className="w-full h-full object-contain"
                                />
                                {coverImage === src && (
                                    <span className="absolute top-1 left-1 bg-[#1a6b1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                        <Star size={9} fill="currentColor" /> Bìa
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form đặt tên và thông tin */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <h2 className="text-base font-bold text-stone-900 mb-4">1. Đặt tên & Thông tin sản phẩm</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[13px] font-semibold text-stone-800 mb-[7px]">Tên sản phẩm POD *</label>
                        <input
                            type="text"
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)]"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`VD: ${blank?.title ? `${blank.title} Nghệ Thuật` : 'Sản phẩm POD sáng tạo...'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-stone-800 mb-[7px]">Danh mục sản phẩm *</label>
                        <select
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] text-stone-900 bg-white outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)]"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">— Chọn danh mục —</option>
                            {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[13px] font-semibold text-stone-800 mb-[7px]">Mô tả sản phẩm * (ít nhất 10 ký tự)</label>
                        <textarea
                            rows={3}
                            className="w-full px-[13px] py-[10px] border border-[#d5ddd5] rounded-[9px] text-[13.5px] font-medium text-stone-900 bg-white placeholder:text-stone-400 outline-none focus:border-[#007700] focus:shadow-[0_0_0_3px_rgba(0,119,0,0.1)] resize-y"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Nhập chi tiết về sản phẩm, chất liệu, cách bảo quản..."
                        />
                    </div>
                </div>
            </div>

            {/* Bảng biến thể & Giá bán */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-stone-900">2. Biến thể & Lợi nhuận (Markup)</h2>
                            <span className="text-xs font-bold text-[#1a6b1a] bg-[#edf5ed] px-2 py-0.5 rounded-full">
                                Đang chọn bán {activeCount}/{(blank?.variations || []).length} biến thể
                            </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">Chọn các biến thể muốn bán và điều chỉnh số tiền lời (markup). Giá bán = Tiền phôi + Markup.</p>
                    </div>

                    {/* Bulk Markup & Selection Action Bar */}
                    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 self-start md:self-auto">
                        <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">Áp dụng chung:</span>
                        <input
                            type="number"
                            step={5000}
                            placeholder="Tiền lời (đ)"
                            className="w-28 px-2.5 py-1 border border-stone-300 rounded text-xs font-bold text-stone-900 bg-white outline-none focus:border-[#1a6b1a]"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) {
                                        setSelectedVariants(prev => {
                                            const next = { ...prev };
                                            Object.keys(next).forEach(sku => { next[sku] = { ...next[sku], markup: val }; });
                                            return next;
                                        });
                                    }
                                }
                            }}
                            id="bulkMarkupInput"
                        />
                        <button
                            type="button"
                            className="px-2.5 py-1 bg-[#1a6b1a] text-white text-xs font-bold rounded hover:bg-[#145c14] transition-colors whitespace-nowrap"
                            onClick={() => {
                                const input = document.getElementById('bulkMarkupInput') as HTMLInputElement;
                                if (input && input.value) {
                                    const val = input.value;
                                    setSelectedVariants(prev => {
                                        const next = { ...prev };
                                        Object.keys(next).forEach(sku => { next[sku] = { ...next[sku], markup: val }; });
                                        return next;
                                    });
                                }
                            }}
                        >
                            Áp dụng tất cả
                        </button>
                    </div>
                </div>

                {/* Filter bar by color & selected status */}
                {distinctColors.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-stone-100">
                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                            <Filter size={12} /> Lọc màu:
                        </span>
                        <button
                            type="button"
                            onClick={() => setColorFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                colorFilter === 'all'
                                    ? 'bg-stone-800 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            Tất cả ({blank?.variations?.length || 0})
                        </button>
                        {distinctColors.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColorFilter(c)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    colorFilter === c
                                        ? 'bg-[#1a6b1a] text-white'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                {c}
                            </button>
                        ))}

                        <div className="ml-auto">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={onlySelectedFilter}
                                    onChange={e => setOnlySelectedFilter(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-[#1a6b1a] cursor-pointer"
                                />
                                <span>Chỉ hiện biến thể đang chọn</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13.5px] text-left [&_thead_th]:bg-[#fafcfa] [&_thead_th]:px-[18px] [&_thead_th]:py-3 [&_thead_th]:text-[11.5px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-stone-600 [&_thead_th]:border-b [&_thead_th]:border-stone-200 [&_tbody_td]:px-[18px] [&_tbody_td]:py-[12px] [&_tbody_td]:border-b [&_tbody_td]:border-stone-100 [&_tbody_td]:align-middle pod-variant-table">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#1a6b1a] cursor-pointer"
                                        checked={displayedVariations.length > 0 && displayedVariations.every((v: any) => selectedVariants[v.sku]?.on)}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setSelectedVariants(prev => {
                                                const next = { ...prev };
                                                displayedVariations.forEach((v: any) => {
                                                    next[v.sku] = { ...next[v.sku], on: checked };
                                                });
                                                return next;
                                            });
                                        }}
                                    />
                                </th>
                                <th>Biến thể</th>
                                <th>Tiền phôi</th>
                                <th>Lợi nhuận Markup (đ)</th>
                                <th>Bạn nhận</th>
                                <th>Hoa hồng sàn{commissionPercent === null ? '' : ` ${commissionPercent}%`}</th>
                                <th>Giá niêm yết</th>
                                <th>Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedVariations.map((v: any) => {
                                const sv = selectedVariants[v.sku] || { on: false, markup: '0', stock: '0' };
                                const baseCost = v.base_cost || 0;
                                const net = baseCost + (Number(sv.markup) || 0);
                                const fee = commissionPercent === null ? null : commissionAmount(net, commissionPercent);
                                const listPrice = commissionPercent === null ? null : withCommission(net, commissionPercent);
                                return (
                                    <tr key={v.sku} className={sv.on ? 'bg-white' : 'bg-stone-50/60 opacity-60'}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={sv.on}
                                                onChange={e => setV(v.sku, 'on', e.target.checked)}
                                                className="w-4 h-4 accent-[#1a6b1a] cursor-pointer"
                                            />
                                        </td>
                                        <td className="font-bold text-stone-900">
                                            <div className="flex items-center gap-2">
                                                {v.color && (
                                                    <span className="inline-block w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: v.color_hex || '#ccc' }} />
                                                )}
                                                <span>{[v.color, v.size].filter(Boolean).join(' / ') || v.sku}</span>
                                            </div>
                                        </td>
                                        <td className="text-stone-600 font-medium">{baseCost.toLocaleString()}đ</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={sv.markup}
                                                disabled={!sv.on}
                                                onChange={e => setV(v.sku, 'markup', e.target.value)}
                                                className={`px-3 py-1.5 rounded text-xs font-bold w-28 outline-none border transition-colors ${
                                                    sv.on
                                                        ? 'bg-white border-stone-300 text-stone-900 focus:border-[#1a6b1a] focus:ring-1 focus:ring-[#1a6b1a] shadow-sm'
                                                        : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                                }`}
                                            />
                                        </td>
                                        <td className="text-stone-700 font-semibold">{money(net)}</td>
                                        <td className="text-stone-500 font-medium">{fee === null ? '—' : `+${money(fee)}`}</td>
                                        <td className="font-bold text-[#1a6b1a] text-sm">{listPrice === null ? '—' : money(listPrice)}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={sv.stock}
                                                disabled={!sv.on}
                                                onChange={e => setV(v.sku, 'stock', e.target.value)}
                                                className={`px-3 py-1.5 rounded text-xs font-bold w-24 outline-none border transition-colors ${
                                                    sv.on
                                                        ? 'bg-white border-stone-300 text-stone-900 focus:border-[#1a6b1a] focus:ring-1 focus:ring-[#1a6b1a] shadow-sm'
                                                        : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                                }`}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Step4ProductDetails;
