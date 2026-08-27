/**
 * Công tắc tính năng của khu người bán.
 *
 * Chỗ này dành cho những thứ TẮT TẠM chứ chưa bỏ hẳn: code màn hình vẫn nguyên,
 * chỉ là không còn lối vào. Bật lại chỉ cần đổi hằng về `true`, không phải lần
 * lại từng file để khôi phục.
 */

/** Đường dẫn màn hình tạo sản phẩm POD. Dùng chung để nav và route khỏi lệch nhau. */
export const POD_CREATE_PATH = '/seller/products/new';

/**
 * Luồng tạo sản phẩm POD (chọn phôi + đặt design).
 *
 * Tắt đồng thời BỐN lối vào: mục trên thanh điều hướng, chính route đó, nút "Tạo
 * sản phẩm" ở Trang chủ gian hàng, và nút cùng tên trong trạng thái rỗng của
 * Danh mục sản phẩm. Ẩn mỗi cái tab thì ba lối kia vẫn mở — người bán vẫn vào
 * được màn hình lẽ ra đang tắt, và đó là kiểu lỗi khó lần ra nhất.
 */
export const POD_CREATE_ENABLED = false;

/**
 * Nơi mọi nút "Tạo sản phẩm" trong khu người bán dẫn tới.
 *
 * Tắt luồng POD KHÔNG được làm các nút này biến mất: gian hàng vẫn tạo sản phẩm
 * được qua hộp thoại ở màn Quản lí sản phẩm. Nút mất đi thì người bán mở trang
 * chủ ra và không còn lối nào để bắt đầu — đó là cụt đường, không phải tắt tính năng.
 *
 * `?new=1` để màn đó mở sẵn hộp thoại, đỡ bắt người dùng bấm thêm một nhịp nữa.
 */
export const PRODUCT_CREATE_PATH = POD_CREATE_ENABLED ? POD_CREATE_PATH : '/seller/products?new=1';
