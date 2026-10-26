export function editLink(productId: string, field?: string | null): string {
  return `/seller/products?edit=${productId}${field ? `#${field}` : ''}`;
}
