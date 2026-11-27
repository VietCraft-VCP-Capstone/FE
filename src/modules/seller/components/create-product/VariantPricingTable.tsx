import { useState } from 'react';
import { Filter } from 'lucide-react';
import { commissionAmount, withCommission } from '../../../../shared/utils/commission';
import { money } from '../../../../shared/utils/format';

export type SelectedVariants = Record<string, { on: boolean; markup: string; stock: string }>;

interface VariantPricingTableProps {
    blank: any;
    selectedVariants: SelectedVariants;
    setSelectedVariants: React.Dispatch<React.SetStateAction<SelectedVariants>>;
    commissionPercent: number | null;
}

export function VariantPricingTable({ blank, selectedVariants, setSelectedVariants, commissionPercent }: VariantPricingTableProps) {
    const [colorFilter, setColorFilter] = useState('all');
    const [onlySelectedFilter, setOnlySelectedFilter] = useState(false);

    const setV = (sku: string, f: string, val: any) => setSelectedVariants((prev: any) => ({ ...prev, [sku]: { ...prev[sku], [f]: val } }));

    const applyMarkupToAll = (val: string) => setSelectedVariants(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(sku => { next[sku] = { ...next[sku], markup: val }; });
        return next;
    });

    const distinctColors = Array.from(new Set((blank?.variations || []).map((v: any) => v.color).filter(Boolean))) as string[];

    const displayedVariations = (blank?.variations || []).filter((v: any) => {
        if (colorFilter !== 'all' && v.color !== colorFilter) return false;
        if (onlySelectedFilter && !selectedVariants[v.sku]?.on) return false;
        return true;
    });

    const activeCount = Object.values(selectedVariants).filter((v: any) => v.on).length;

    return (
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
                                if (val) applyMarkupToAll(val);
                            }
                        }}
                        id="bulkMarkupInput"
                    />
                    <button
                        type="button"
                        className="px-2.5 py-1 bg-[#1a6b1a] text-white text-xs font-bold rounded hover:bg-[#145c14] transition-colors whitespace-nowrap"
                        onClick={() => {
                            const input = document.getElementById('bulkMarkupInput') as HTMLInputElement;
                            if (input && input.value) applyMarkupToAll(input.value);
                        }}
                    >
                        Áp dụng tất cả
                    </button>
                </div>
            </div>
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
    );
}
