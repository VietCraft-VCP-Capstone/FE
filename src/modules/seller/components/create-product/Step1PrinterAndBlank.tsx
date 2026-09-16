import { Building2, Check } from 'lucide-react';
import { abs } from './useHTMLImage';

interface Step1Props {
    printers: any[];
    selectedPrinter: string;
    setSelectedPrinter: (id: string) => void;
    blanks: any[];
    blank: any | null;
    chooseBlank: (blank: any) => void;
}

export function Step1PrinterAndBlank({
    printers,
    selectedPrinter,
    setSelectedPrinter,
    blanks,
    blank,
    chooseBlank
}: Step1Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Section 1: Chọn xưởng in Web Printer */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="text-[#1a6b1a]" size={20} />
                    <h2 className="text-base font-bold text-stone-900">1. Chọn xưởng in (Đã liên kết Web Printer API)</h2>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                    Quản lý phôi in, vận đơn và quy trình sản xuất trực tiếp qua kết nối Web Printer API với các nhà xưởng.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {printers.map((p: any) => {
                        const isSel = selectedPrinter === p.id;
                        return (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPrinter(p.id)}
                                className={`cursor-pointer p-3.5 rounded-lg border transition-all duration-150 relative ${isSel ? 'border-[#1a6b1a] bg-[#f0f7f0] shadow-sm' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'}`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                                        {p.badge}
                                    </span>
                                    {isSel && <Check size={16} className="text-[#1a6b1a]" />}
                                </div>
                                <h3 className="text-xs font-bold text-stone-900 mb-1">{p.name}</h3>
                                <p className="text-[11.5px] text-stone-500 leading-relaxed">{p.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section 2: Chọn phôi sản phẩm */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-stone-900">2. Chọn phôi in sản phẩm</h2>
                        <p className="text-xs text-stone-500">Chọn phôi từ xưởng đã chọn để tiến hành đặt hình thiết kế</p>
                    </div>
                    {blank && (
                        <div className="flex items-center gap-1.5 text-xs text-[#1a6b1a] bg-[#f0f7f0] px-3 py-1.5 rounded-lg font-semibold border border-[#cce5cc]">
                            <Check size={14} /> Đã chọn: {blank.title}
                        </div>
                    )}
                </div>

                <div className="blank-picker-grid">
                    {blanks.map((b: any) => {
                        const minCost = Math.min(...b.variations.map((v: any) => v.base_cost));
                        const faceCount = (b.print_areas || []).length;
                        return (
                            <button type="button" key={b._id} className={`blank-pick-card ${blank?._id === b._id ? 'selected' : ''}`} onClick={() => chooseBlank(b)}>
                                <img src={abs(b.default_image)} alt={b.title} />
                                <span className="blank-pick-title">{b.title}</span>
                                <span className="blank-pick-cost">Giá phôi từ {minCost.toLocaleString()}đ</span>
                                {faceCount > 1 && <span className="blank-pick-faces">{faceCount} mặt in</span>}
                            </button>
                        );
                    })}
                </div>

                {blanks.length === 0 && (
                    <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                        Chưa có phôi nào khả dụng từ xưởng in này. Vui lòng chọn xưởng in khác hoặc chọn phôi mặc định trên sàn.
                    </div>
                )}
            </div>
        </div>
    );
}

export default Step1PrinterAndBlank;
