import { useMemo, useState } from 'react';
import { Building2, Check, Search, Layers, ShieldCheck, Clock, Printer, X } from 'lucide-react';
import { abs } from './useHTMLImage';
import { formatVnd, groupColors } from './podShared';

interface Step1Props {
    loading: boolean;
    noPrinter: boolean;
    printers: { id: string; name: string }[];
    selectedPrinter: string;
    setSelectedPrinter: (id: string) => void;
    blanks: any[];
    blank: any | null;
    chooseBlank: (blank: any) => void;
}

/** Phôi có mockup màu chuẩn: mọi mặt in đã có vùng phôi xưởng xác nhận / ảnh trong suốt, hoặc có ảnh thật theo màu. */
function hasVerifiedMockups(b: any): boolean {
    const areas = b.print_areas || [];
    if (!areas.length) return false;
    const colors = groupColors(b.variations || []).map(c => c.color);
    return areas.every((a: any) =>
        a.mask_status === 'confirmed' || a.mask_status === 'custom' ||
        (colors.length > 0 && colors.every(c => (b.color_images || []).some((ci: any) => ci.color === c && ci.area_key === a.key))));
}

const minCostOf = (b: any) => {
    const costs = (b.variations || []).map((v: any) => Number(v.base_cost) || 0).filter((n: number) => n > 0);
    return costs.length ? Math.min(...costs) : 0;
};

function Swatches({ variations }: { variations: any[] }) {
    const colors = groupColors(variations);
    const shown = colors.slice(0, 7);
    return (
        <div className="flex items-center gap-1" aria-label={`${colors.length} màu`}>
            {shown.map(c => (
                <span key={c.color} title={c.color} className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: c.hex || '#e5e7eb' }} />
            ))}
            {colors.length > shown.length && <span className="text-[11px] text-stone-500 ml-0.5">+{colors.length - shown.length}</span>}
        </div>
    );
}

export function Step1PrinterAndBlank({ loading, noPrinter, printers, selectedPrinter, setSelectedPrinter, blanks, blank, chooseBlank }: Step1Props) {
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('all');

    const categories = useMemo(() => {
        const set = new Map<string, number>();
        for (const b of blanks) if (b.category) set.set(b.category, (set.get(b.category) || 0) + 1);
        return [...set.entries()];
    }, [blanks]);

    const filtered = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return blanks.filter(b =>
            (selectedPrinter === 'all' || !selectedPrinter || b.printer_id === selectedPrinter) &&
            (category === 'all' || b.category === category) &&
            (!kw || `${b.title} ${b.category} ${b.brand || ''} ${b.printer_name || ''}`.toLowerCase().includes(kw)));
    }, [blanks, q, category, selectedPrinter]);

    if (!loading && noPrinter && blanks.length === 0) {
        return (
            <div className="py-14 px-6 text-center bg-white rounded-2xl border border-dashed border-stone-300 max-w-xl mx-auto">
                <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h2 className="font-bold text-stone-900 text-base mb-1.5">Bạn chưa liên kết xưởng in nào</h2>
                <p className="text-sm text-stone-500 leading-relaxed mb-5">
                    Sản phẩm in theo yêu cầu được xưởng đối tác sản xuất và giao hàng. Liên kết một xưởng in để thấy các phôi bạn có thể bán.
                </p>
                <a href="/seller/settings" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-admin-brand text-white rounded-[10px] font-semibold text-sm hover:bg-admin-brand-700">
                    Liên kết xưởng in
                </a>
            </div>
        );
    }

    const colors = blank ? groupColors(blank.variations || []) : [];
    const sizes = blank ? Array.from(new Set((blank.variations || []).map((v: any) => v.size).filter(Boolean))) as string[] : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
            <section className="min-w-0">
                {/* Bộ lọc */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Tìm phôi: áo thun, ly sứ, túi tote…"
                            className="w-full pl-9 pr-9 py-2.5 rounded-[10px] border border-stone-300 bg-white text-sm focus:outline-none focus:border-admin-brand focus:ring-2 focus:ring-admin-brand/15"
                        />
                        {q && <button type="button" onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700" aria-label="Xoá tìm kiếm"><X size={15} /></button>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[['all', blanks.length] as [string, number], ...categories].map(([c, n]) => (
                            <button key={c} type="button" onClick={() => setCategory(c)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${category === c ? 'bg-admin-brand text-white border-admin-brand' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'}`}>
                                {c === 'all' ? 'Tất cả' : c} <span className="opacity-70">{n}</span>
                            </button>
                        ))}
                        {printers.length > 1 && (
                            <select value={selectedPrinter} onChange={e => setSelectedPrinter(e.target.value)}
                                className="ml-auto px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700"
                                aria-label="Lọc theo xưởng in">
                                <option value="all">Tất cả xưởng ({printers.length})</option>
                                {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Lưới phôi */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-stone-200 bg-white p-2.5 animate-pulse">
                                <div className="aspect-square rounded-lg bg-stone-100 mb-2.5" />
                                <div className="h-3 bg-stone-100 rounded w-4/5 mb-2" />
                                <div className="h-3 bg-stone-100 rounded w-2/5" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-stone-500 bg-white rounded-xl border border-dashed border-stone-300">
                        {blanks.length === 0 ? 'Xưởng in chưa có phôi nào đang mở bán.' : 'Không có phôi phù hợp bộ lọc.'}
                        {(q || category !== 'all') && (
                            <button type="button" onClick={() => { setQ(''); setCategory('all'); }} className="block mx-auto mt-2 text-admin-brand font-semibold text-xs hover:underline">Xoá bộ lọc</button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filtered.map(b => {
                            const sel = blank?._id === b._id;
                            const verified = hasVerifiedMockups(b);
                            const faceCount = (b.print_areas || []).length || 1;
                            return (
                                <button type="button" key={`${b._id}_${b.printer_id || ''}`} onClick={() => chooseBlank(b)} aria-pressed={sel}
                                    className={`group relative text-left rounded-xl border bg-white p-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/40 ${sel ? 'border-admin-brand ring-2 ring-admin-brand/25 shadow-admin-md' : 'border-stone-200 hover:border-stone-300 hover:shadow-admin-sm'}`}>
                                    <div className="relative aspect-square rounded-lg bg-stone-50 overflow-hidden mb-2.5">
                                        <img src={abs(b.default_image || '')} alt="" loading="lazy" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
                                        {sel && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-admin-brand text-white grid place-items-center shadow"><Check size={14} /></span>}
                                        {verified && (
                                            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/95 border border-emerald-200 text-[10px] font-bold text-emerald-700" title="Xưởng đã xác nhận vùng phôi hoặc có ảnh thật theo màu: ảnh mockup đổi màu chính xác">
                                                <ShieldCheck size={11} /> Mockup màu chuẩn
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2 min-h-[2.5em]">{b.title}</div>
                                    <div className="flex items-center justify-between gap-2 mt-1.5">
                                        <span className="text-[13px] font-bold text-admin-brand">Từ {formatVnd(minCostOf(b))}</span>
                                        <Swatches variations={b.variations || []} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                                        <span className="inline-flex items-center gap-1"><Layers size={11} /> {faceCount} mặt in</span>
                                        {b.printer_name && <span className="truncate">· {b.printer_name}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Chi tiết phôi đang chọn */}
            <aside className="lg:sticky lg:top-4 rounded-2xl border border-stone-200 bg-white p-4">
                {!blank ? (
                    <div className="py-8 text-center text-sm text-stone-500">
                        <Printer className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        Chọn một phôi để xem thông số trước khi thiết kế.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3.5">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wide text-admin-brand mb-1">Phôi đã chọn</div>
                            <h2 className="text-[15px] font-bold text-stone-900 leading-snug">{blank.title}</h2>
                            {blank.description && <p className="text-xs text-stone-500 mt-1 line-clamp-3">{blank.description}</p>}
                        </div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                            <dt className="text-stone-500">Giá phôi</dt><dd className="font-semibold text-stone-800">từ {formatVnd(minCostOf(blank))}</dd>
                            {blank.print_technique && <><dt className="text-stone-500">Kỹ thuật in</dt><dd className="font-semibold text-stone-800">{blank.print_technique}</dd></>}
                            {blank.production_time && <><dt className="text-stone-500">Sản xuất</dt><dd className="font-semibold text-stone-800 inline-flex items-center gap-1"><Clock size={11} /> {blank.production_time}</dd></>}
                            {blank.printer_name && <><dt className="text-stone-500">Xưởng in</dt><dd className="font-semibold text-stone-800">{blank.printer_name}</dd></>}
                            {sizes.length > 0 && <><dt className="text-stone-500">Kích cỡ</dt><dd className="font-semibold text-stone-800">{sizes.join(', ')}</dd></>}
                        </dl>
                        <div>
                            <div className="text-xs font-semibold text-stone-700 mb-1.5">{colors.length} màu</div>
                            <div className="flex flex-wrap gap-1.5">
                                {colors.map(c => (
                                    <span key={c.color} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-stone-200 text-[11px] font-medium text-stone-700">
                                        <span className="w-3 h-3 rounded-full border border-black/15" style={{ backgroundColor: c.hex || '#e5e7eb' }} />{c.color}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-stone-700 mb-1.5">Mặt in</div>
                            <ul className="flex flex-col gap-1 text-xs text-stone-600">
                                {(blank.print_areas || []).map((a: any) => (
                                    <li key={a.key} className="flex items-center justify-between gap-2">
                                        <span>{a.label || a.key}{a.surface === 'wrap' ? ' (cuộn quanh)' : ''}</span>
                                        {a.physical_width_cm && a.physical_height_cm
                                            ? <span className="font-semibold text-stone-800">{a.physical_width_cm}×{a.physical_height_cm} cm</span>
                                            : <span className="text-stone-400">chưa có khổ in</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {!hasVerifiedMockups(blank) && (
                            <p className="text-[11px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                                Xưởng chưa xác nhận vùng phôi cho phôi này. Ảnh mockup các màu sẽ do AI tự tách nền, bạn nên xem kỹ ở bước 3.
                            </p>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
}

export default Step1PrinterAndBlank;
