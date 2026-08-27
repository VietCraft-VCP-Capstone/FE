/**
 * Thanh cơ cấu (part-to-whole): một thanh ngang chia thành các phần theo tỉ lệ,
 * kèm bảng số liệu đầy đủ ngay bên dưới.
 *
 * Vì sao không dùng biểu đồ tròn: với 3 phần và các giá trị hay sát nhau, mắt
 * người so chiều dài tốt hơn nhiều so với so góc quạt. Thanh ngang còn xếp vừa
 * trong một thẻ hẹp và tận dụng được nhãn chữ dài (tiếng Việt có dấu).
 *
 * Hai phần liền nhau được tách bằng KHE 2px màu nền, không phải bằng viền —
 * viền là mực vẽ thêm không mang thông tin.
 */

import { count as fmtCount, percentOf } from '../../utils/format';

export interface ShareSegment {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Ghi chú ngắn dưới nhãn, ví dụ "chưa hiển thị với người mua". */
  hint?: string;
}

export function ShareBar({
  segments,
  emptyLabel = 'Chưa có dữ liệu.',
  ariaLabel,
}: {
  segments: ShareSegment[];
  emptyLabel?: string;
  ariaLabel: string;
}) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const visible = segments.filter(s => (Number(s.value) || 0) > 0);

  return (
    <div>
      {total > 0 ? (
        <div
          role="img"
          aria-label={`${ariaLabel}: ${visible
            .map(s => `${s.label} ${s.value} (${percentOf(s.value, total)}%)`)
            .join(', ')}`}
          className="flex h-2.5 w-full gap-0.5 overflow-hidden"
        >
          {visible.map((s, i) => (
            <span
              key={s.key}
              // flexGrow theo giá trị + basis 0 => chiều dài đúng tỉ lệ.
              // minWidth 3px để phần rất nhỏ nhưng KHÁC 0 vẫn nhìn thấy được.
              style={{
                backgroundColor: s.color,
                flexGrow: s.value,
                flexBasis: 0,
                minWidth: 3,
                borderTopLeftRadius: i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === 0 ? 4 : 0,
                borderTopRightRadius: i === visible.length - 1 ? 4 : 0,
                borderBottomRightRadius: i === visible.length - 1 ? 4 : 0,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="h-2.5 w-full rounded-[4px] bg-[#eceeec]" aria-hidden />
      )}

      {total > 0 ? (
        <ul className="mt-4 flex flex-col gap-2.5">
          {segments.map(s => (
            <li key={s.key} className="flex items-baseline gap-2.5">
              <span
                className="translate-y-[-1px] h-2 w-2 shrink-0 self-center rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-[#52514e]">{s.label}</span>
                {s.hint && <span className="block text-[11.5px] text-[#898781]">{s.hint}</span>}
              </span>
              <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-[#0b0b0b]">
                {fmtCount(s.value)}
              </span>
              <span className="w-11 shrink-0 text-right text-[12px] tabular-nums text-[#898781]">
                {percentOf(s.value, total)}%
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-[#898781]">{emptyLabel}</p>
      )}
    </div>
  );
}
