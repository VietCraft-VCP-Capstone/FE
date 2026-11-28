import { Check, Store } from 'lucide-react';

export interface HomeVoucher {
  id: string;
  code: string;
  value: string;
  condition: string;
  is_platform: boolean;
  shop_name: string;
  applicable_scope: string;
  applicable_products_count: number;
  end_date?: string;
}

interface VoucherTicketStripProps {
  vouchers: HomeVoucher[];
  isSaved: (code: string) => boolean;
  pendingCode: string | null;
  onToggle: (code: string) => void;
}

function expiryLabel(end?: string) {
  if (!end) return '';
  const ms = new Date(end).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return '';
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return 'Hết hạn hôm nay';
  if (days <= 3) return `Còn ${days} ngày`;
  return `HSD ${new Date(end).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

export function VoucherTicketStrip({ vouchers, isSaved, pendingCode, onToggle }: VoucherTicketStripProps) {
  return (
    <div className="vc-rail" role="list">
      {vouchers.map((v) => {
        const saved = isSaved(v.code);
        const expiry = expiryLabel(v.end_date);
        const urgent = expiry.startsWith('Còn') || expiry.startsWith('Hết');
        return (
          <div key={v.id || v.code} role="listitem" className="vc-ticket" data-saved={saved}>
            <div className="min-w-0 px-4 py-3.5">
              <p className="vc-display m-0 truncate text-[17px] font-semibold text-[#330033]">{v.value}</p>
              <p className="m-0 mt-1 text-[12.5px] text-stone-600">{v.condition}</p>
              <p className="m-0 mt-2 flex items-center gap-1 truncate text-[11.5px] text-stone-500">
                {v.is_platform ? (
                  <span className="font-semibold text-[#007700]">Toàn sàn VietCraft</span>
                ) : (
                  <>
                    <Store size={11} className="shrink-0" />
                    <span className="truncate">
                      {v.shop_name}
                      {v.applicable_scope === 'SPECIFIC_PRODUCTS' ? `, ${v.applicable_products_count} sản phẩm` : ''}
                    </span>
                  </>
                )}
              </p>
              <p className="m-0 mt-1 flex items-center gap-2 text-[11px]">
                <span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold tracking-wide text-stone-700">{v.code}</span>
                {expiry && <span className={urgent ? 'font-semibold text-[#e11d48]' : 'text-stone-400'}>{expiry}</span>}
              </p>
            </div>
            <div className="vc-ticket-stub">
              <button
                type="button"
                disabled={pendingCode === v.code}
                onClick={() => onToggle(v.code)}
                aria-pressed={saved}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors disabled:opacity-60 ${
                  saved ? 'bg-white text-[#007700] ring-1 ring-[#b7dcb0]' : 'bg-[#007700] text-white hover:bg-[#005B00]'
                }`}
              >
                {saved ? <><Check size={13} /> Đã lưu</> : 'Lưu'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
