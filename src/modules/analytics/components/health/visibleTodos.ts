import type { HealthItem, ListingHealth } from '../../healthTypes';

export const MIN_IMPACT = 0.5;

export const visibleTodos = (data: ListingHealth): HealthItem[] => data.todos.filter(t => t.impact >= MIN_IMPACT);

export const CAP_FIELD: Record<string, string> = { title: 'tên sản phẩm', materials: 'chất liệu', moderation_status: 'kiểm duyệt' };

export const blockersOf = (data: ListingHealth): string[] =>
  [...new Set(data.warnings.filter(w => w.type === 'warning' && w.field && w.field in CAP_FIELD).map(w => w.field as string))];
