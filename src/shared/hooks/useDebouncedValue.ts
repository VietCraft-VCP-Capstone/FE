import { useEffect, useState } from 'react';

/**
 * Trả về `value` sau khi nó đã ngừng thay đổi trong `delay` mili-giây.
 *
 * Dùng cho ô tìm kiếm sau khi việc lọc chuyển xuống máy chủ: gõ "gốm sứ" mà gửi
 * ngay từng ký tự là sáu lượt gọi API, năm lượt đầu vô nghĩa, và phản hồi của
 * chúng có thể về sau lượt cuối rồi ghi đè kết quả đúng bằng kết quả cũ.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
