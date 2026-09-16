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
                <h2 className="text-base font-bold text-stone-900 mb-1">2. Biến thể & Lợi nhuận (Markup)</h2>
                <p className="text-xs text-stone-500 mb-4">Chọn các biến thể muốn bán và điều chỉnh số tiền lời (markup). Giá bán = Tiền phôi + Markup.</p>

                <table className="w-full border-collapse text-[13.5px] text-left [&_thead_th]:bg-[#fafcfa] [&_thead_th]:px-[18px] [&_thead_th]:py-3 [&_thead_th]:text-[11.5px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-stone-500 [&_thead_th]:border-b [&_thead_th]:border-stone-200 [&_tbody_td]:px-[18px] [&_tbody_td]:py-[14px] [&_tbody_td]:border-b [&_tbody_td]:border-stone-100 [&_tbody_td]:align-middle pod-variant-table">
                    <thead><tr><th></th><th>Biến thể</th><th>Tiền phôi</th><th>Lợi nhuận Markup (đ)</th><th>Giá bán công bố</th><th>Tồn kho</th></tr></thead>
                    <tbody>
                        {blank.variations.map((v: any) => {
                            const sv = selectedVariants[v.sku] || { on: false, markup: '0', stock: '0' };
                            const retail = v.base_cost + (Number(sv.markup) || 0);
                            return (
                                <tr key={v.sku} className={sv.on ? '' : 'opacity-50'}>
                                    <td><input type="checkbox" checked={sv.on} onChange={e => setV(v.sku, 'on', e.target.checked)} className="w-4 h-4 accent-[#1a6b1a]" /></td>
                                    <td className="font-semibold text-stone-800">{[v.color, v.size].filter(Boolean).join(' / ') || v.sku}</td>
                                    <td className="text-stone-500">{v.base_cost.toLocaleString()}đ</td>
                                    <td><input type="number" value={sv.markup} disabled={!sv.on} onChange={e => setV(v.sku, 'markup', e.target.value)} className="border border-stone-300 rounded px-2 py-1 text-xs w-24 outline-none focus:border-[#1a6b1a]" /></td>
                                    <td className="font-bold text-[#1a6b1a]">{retail.toLocaleString()}đ</td>
                                    <td><input type="number" value={sv.stock} disabled={!sv.on} onChange={e => setV(v.sku, 'stock', e.target.value)} className="border border-stone-300 rounded px-2 py-1 text-xs w-20 outline-none focus:border-[#1a6b1a]" /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Step4ProductDetails;
