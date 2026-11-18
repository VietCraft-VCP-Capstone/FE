import type { HealthItem, ListingHealth } from '../../healthTypes';

export const MIN_IMPACT = 0.5;

export const visibleTodos = (data: ListingHealth): HealthItem[] => data.todos.filter(t => t.impact >= MIN_IMPACT);

export const CAP_FIELD: Record<string, string> = { title: 'tên sản phẩm', materials: 'chất liệu', moderation_status: 'kiểm duyệt' };

export function scorePlan(data: ListingHealth) {
  const now = data.score ?? 0;
  const base = data.cap?.raw ?? now;
  const todos = visibleTodos(data);
  const potential = Math.min(100, Math.floor(base + todos.reduce((s, t) => s + t.impact, 0) + 1e-6));
  return { now, todos, potential };
}

const belongs = (t: HealthItem, key: string) => t.code === key || t.field === key;

export const partTodo = (data: ListingHealth, key: string) => visibleTodos(data).find(t => belongs(t, key));

export const looseTodos = (data: ListingHealth) => visibleTodos(data).filter(t => !data.breakdown.some(r => belongs(t, r.key)));

export function cleanTodoText(msg: string): string {
  return msg
    .replace(/^Chọn thêm (\d+) tag[^\.]*\.?/i, 'Gắn thêm $1 từ khoá')
    .replace(/^Chưa có đánh giá nào[^\.]*\.?/i, 'Mời khách đã mua để lại đánh giá')
    .replace(/^Thêm (\d+) ảnh[^\.]*\.?/i, 'Thêm $1 ảnh sản phẩm')
    .replace(/^Mô tả quá ngắn[^\.]*\.?/i, 'Viết mô tả chi tiết hơn')
    .trim();
}
