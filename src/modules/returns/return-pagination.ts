export interface RequestPage<T> { items: T[]; total: number; page: number; pageSize: number }

export async function collectRequestPages<T>(fetchPage: (page: number) => Promise<RequestPage<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchPage(page);
    items.push(...result.items);
    if (!result.items.length || page * result.pageSize >= result.total) return items;
  }
}
