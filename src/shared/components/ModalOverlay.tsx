/**
 * Lớp phủ nền cho hộp thoại, dựng ra thẳng <body> bằng portal.
 *
 * Vì sao phải portal chứ không để `position: fixed` tại chỗ: fixed KHÔNG miễn
 * nhiễm với thẻ cha. Lỗi có thật ở trang Quản lí sản phẩm — thẻ bọc trang dùng
 * `space-y-6`, mà Tailwind hiện thực class đó bằng `> * + * { margin-top: 24px }`.
 * Margin ấy rơi trúng chính lớp phủ, đẩy nó tụt xuống 24px và co ngắn đúng 24px,
 * chừa hở một dải chưa bị làm tối ở đỉnh màn hình. Ngoài margin, `transform` /
 * `filter` / `contain` trên bất kỳ tổ tiên nào cũng biến tổ tiên đó thành khối
 * chứa của phần tử fixed và gây lỗi y hệt.
 *
 * Portal cắt đứt mọi ảnh hưởng đó: lớp phủ luôn neo vào viewport, luôn phủ kín,
 * và luôn nằm trên cùng bất kể trang đặt hộp thoại ở đâu trong cây DOM.
 *
 * Gom về một chỗ nên mọi hộp thoại dùng cùng một độ tối nền, cùng một z-index —
 * không còn cảnh mỗi hộp thoại một kiểu.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ModalOverlay({ children }: { children: React.ReactNode }) {
  // Khoá cuộn nền: không khoá thì lăn chuột trên lớp phủ sẽ cuộn trang phía sau.
  // Nhớ lại giá trị cũ thay vì ghi đè '' — trang bên dưới có thể vốn đã tự khoá.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      {children}
    </div>,
    document.body
  );
}
