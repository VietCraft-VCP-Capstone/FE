/** Điều khiển dùng chung của trang Phân tích đối thủ: phân trang, công tắc 2–3 lựa chọn, nút ẩn/hiện chi tiết. */

import { Pagination } from 'antd';
import { ChevronDown } from 'lucide-react';
import { SellerAntd } from '../../../seller/components/SellerAntd';

export const MOI_TRANG = 5;

/** Kẹp trang đang xem vào khoảng có dữ liệu (danh sách có thể ngắn lại khi tải lại) và cắt ra các dòng của trang đó. */
export function catTrang<T>(rows: T[], trang: number, moiTrang = MOI_TRANG) {
  const t = Math.min(Math.max(1, trang), Math.max(1, Math.ceil(rows.length / moiTrang)));
  return { t, dau: (t - 1) * moiTrang, rows: rows.slice((t - 1) * moiTrang, t * moiTrang) };
}

/** Phân trang gọn; ẩn khi chỉ có một trang. */
export function PhanTrang({ trang, tong, onDoi, nhan, moiTrang = MOI_TRANG }: {
  trang: number;
  tong: number;
  onDoi: (t: number) => void;
  nhan: string;
  moiTrang?: number;
}) {
  if (tong <= moiTrang) return null;
  return (
    <nav aria-label={nhan} className="flex justify-end">
      <SellerAntd>
        <Pagination size="small" current={trang} pageSize={moiTrang} total={tong} onChange={onDoi} showSizeChanger={false} />
      </SellerAntd>
    </nav>
  );
}

/** Công tắc cố định 2–3 lựa chọn (Bảng / Biểu đồ...). Bộ lọc có thể dài thêm theo hàng của shop thì dùng ô chọn. */
export function CongTac<T extends string>({ nhan, giaTri, onDoi, luaChon }: {
  nhan: string;
  giaTri: T;
  onDoi: (v: T) => void;
  luaChon: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div role="group" aria-label={nhan} className="inline-flex shrink-0 gap-0.5 rounded-full bg-stone-100 p-[3px]">
      {luaChon.map(l => (
        <button
          key={l.value}
          type="button"
          aria-pressed={l.value === giaTri}
          onClick={() => onDoi(l.value)}
          className={`min-h-8 cursor-pointer whitespace-nowrap rounded-full border-none px-2.5 text-xs font-semibold sm:px-3.5 sm:text-[13px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007700] motion-reduce:transition-none ${
            l.value === giaTri ? 'bg-[#007700] text-white' : 'bg-transparent text-stone-700 hover:text-[#007700]'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Nút ẩn/hiện một khối chi tiết (biểu đồ phụ, tiêu chí phụ). */
export function NutAnHien({ mo, onDoi, xem, an, controls }: { mo: boolean; onDoi: () => void; xem: string; an: string; controls?: string }) {
  return (
    <button
      type="button"
      onClick={onDoi}
      aria-expanded={mo}
      aria-controls={controls}
      className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
    >
      {mo ? an : xem}
      <ChevronDown size={14} className={`transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} aria-hidden />
    </button>
  );
}
