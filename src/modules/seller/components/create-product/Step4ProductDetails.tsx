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
}

export function Step4ProductDetails({
    title, setTitle,
    description, setDescription,
    categories, categoryId, setCategoryId,
    blank, selectedVariants, setSelectedVariants
}: Step4Props) {
    const setV = (sku: string, f: string, val: any) => setSelectedVariants((prev: any) => ({ ...prev, [sku]: { ...prev[sku], [f]: val } }));

    return (
        <div className="flex flex-col gap-6">
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
                            placeholder="VD: Áo thun Graphic Mèo Cutie Cotton Premium..."
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
                        <h2 className="text-base font-bold text-stone-900 mb-1">2. Biến thể & Lợi nhuận (Markup)</h2>
                        <p className="text-xs text-stone-500">Chọn các biến thể muốn bán và điều chỉnh số tiền lời (markup). Giá bán = Tiền phôi + Markup.</p>
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

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13.5px] text-left [&_thead_th]:bg-[#fafcfa] [&_thead_th]:px-[18px] [&_thead_th]:py-3 [&_thead_th]:text-[11.5px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-stone-600 [&_thead_th]:border-b [&_thead_th]:border-stone-200 [&_tbody_td]:px-[18px] [&_tbody_td]:py-[12px] [&_tbody_td]:border-b [&_tbody_td]:border-stone-100 [&_tbody_td]:align-middle pod-variant-table">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#1a6b1a] cursor-pointer"
                                        checked={(blank?.variations || []).length > 0 && (blank?.variations || []).every((v: any) => selectedVariants[v.sku]?.on)}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setSelectedVariants(prev => {
                                                const next = { ...prev };
                                                (blank?.variations || []).forEach((v: any) => {
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
                                <th>Giá bán công bố</th>
                                <th>Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(blank?.variations || []).map((v: any) => {
                                const sv = selectedVariants[v.sku] || { on: false, markup: '0', stock: '0' };
                                const baseCost = v.base_cost || 0;
                                const retail = baseCost + (Number(sv.markup) || 0);
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
                                        <td className="font-bold text-stone-900">{[v.color, v.size].filter(Boolean).join(' / ') || v.sku}</td>
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
                                        <td className="font-bold text-[#1a6b1a] text-sm">{retail.toLocaleString()}đ</td>
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
