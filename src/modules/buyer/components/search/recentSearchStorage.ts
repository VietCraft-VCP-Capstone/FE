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

function save(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // localStorage bị chặn (chế độ ẩn danh) thì bỏ qua
  }
}
