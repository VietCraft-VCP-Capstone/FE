import api, { isLoggedIn } from '../../../../infrastructure/api/interceptors';

const KEY = 'vietcraft_recent_searches';
const MAX = 8;

export function getRecentSearches(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(keyword: string): void {
  const kw = keyword.trim();
  if (!kw) return;
  const rest = getRecentSearches().filter((s) => s.toLowerCase() !== kw.toLowerCase());
  save([kw, ...rest].slice(0, MAX));
}

export function clearRecentSearches(): void {
  save([]);
}

export async function loadRecentSearches(): Promise<string[]> {
  if (!isLoggedIn()) return getRecentSearches();
  try {
    const res = await api.get('/products/meta/recent-searches');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function rememberSearch(keyword: string): Promise<void> {
  if (!isLoggedIn()) return addRecentSearch(keyword);
  try {
    await api.post('/products/meta/recent-searches', { keyword });
  } catch {
    // lỗi mạng thì bỏ qua, lịch sử không quan trọng bằng tìm kiếm
  }
}

export async function forgetRecentSearches(): Promise<void> {
  if (!isLoggedIn()) return clearRecentSearches();
  try {
    await api.delete('/products/meta/recent-searches');
  } catch {
    // lỗi mạng thì bỏ qua
  }
}

function save(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // localStorage bị chặn (chế độ ẩn danh) thì bỏ qua
  }
}
