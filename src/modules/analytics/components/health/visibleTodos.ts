export const MIN_IMPACT = 0.5;

export function cleanTodoText(msg: string): string {
  return msg
    .replace(/^Chọn thêm (\d+) tag[^\.]*\.?/i, 'Gắn thêm $1 từ khoá')
    .replace(/^Chưa có đánh giá nào[^\.]*\.?/i, 'Mời khách đã mua để lại đánh giá')
    .replace(/^Thêm (\d+) ảnh[^\.]*\.?/i, 'Thêm $1 ảnh sản phẩm')
    .replace(/^Mô tả quá ngắn[^\.]*\.?/i, 'Viết mô tả chi tiết hơn')
    .trim();
}
