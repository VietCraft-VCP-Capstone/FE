import type { HealthItem, ListingHealth } from '../../healthTypes';

export const MIN_IMPACT = 0.5;

export const visibleTodos = (data: ListingHealth): HealthItem[] => data.todos.filter(t => t.impact >= MIN_IMPACT);
