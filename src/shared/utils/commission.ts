/**
 * Hoa hồng sàn, phía hiển thị.
 *
 * Người bán nhập giá họ muốn nhận; sàn cộng hoa hồng lên thành giá niêm yết người mua
 * trả. Phải khớp từng đồng với `withCommission()` trong `BE/src/shared/utils/commission.ts`
 * — form hiện một số mà BE lưu số khác thì người bán mất lòng tin vào bảng giá.
 */

/** Giá niêm yết = giá người bán nhận + hoa hồng sàn. */
export function withCommission(net: number, percent: number): number {
  const n = Number(net);
  const p = Number(percent);
  if (!Number.isFinite(n) || !Number.isFinite(p)) return 0;
  return Math.round(n * (1 + p / 100));
}

/** Riêng phần hoa hồng, để hiện thành một dòng tách biệt trong bảng giá. */
export function commissionAmount(net: number, percent: number): number {
  return withCommission(net, percent) - (Number(net) || 0);
}

/**
 * Bóc hoa hồng khỏi giá niêm yết, lấy lại giá người bán nhận. Dùng khi mở form SỬA:
 * API trả về giá niêm yết, nhưng ô "Giá bán" phải hiện con số người bán đã nhập, nếu không
 * lưu lại một lần là hoa hồng bị cộng chồng lên.
 *
 * ponytail: khít tuyệt đối với giá do withCommission() sinh ra. Giá cũ lưu từ trước khi có
 * hoa hồng có thể lệch 1đ sau một vòng sửa; cần khít hẳn thì lưu thêm cột giá gốc ở BE.
 */
export function netFromGross(gross: number, percent: number): number {
  const g = Number(gross);
  const p = Number(percent);
  if (!Number.isFinite(g) || !Number.isFinite(p)) return 0;
  return g - Math.round((g * p) / (100 + p));
}

/**
 * Một luật hoa hồng. Trường `null` nghĩa là "mọi giá trị".
 * Phải khớp với `CommissionRule` ở BE/src/shared/utils/commission.ts.
 */
export interface CommissionRule {
  categoryId: string | null;
  productType: string | null;
  percent: number;
}

/** Độ cụ thể: càng ràng buộc nhiều chiều càng thắng. */
export function ruleSpecificity(rule: CommissionRule): number {
  return (rule.categoryId ? 2 : 0) + (rule.productType ? 1 : 0);
}

/**
 * Luật áp cho một phạm vi, hoặc null nếu không luật nào khớp (khi đó dùng mức mặc định).
 * Bản sao của `pickCommissionRule` ở BE — màn hình phải giải thích đúng cái hệ thống làm,
 * nếu lệch thì admin set một đằng sàn tính một nẻo.
 */
export function pickCommissionRule<T extends CommissionRule>(
  rules: T[],
  categoryId: string | null,
  productType: string | null
): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const rule of rules) {
    if (rule.categoryId && rule.categoryId !== categoryId) continue;
    if (rule.productType && rule.productType !== productType) continue;
    const score = ruleSpecificity(rule);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  return best;
}
