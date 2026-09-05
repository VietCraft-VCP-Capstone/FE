export const POD_CREATE_PATH = '/seller/products/new';
export const POD_CREATE_ENABLED = false;
export const PRODUCT_CREATE_PATH = POD_CREATE_ENABLED ? POD_CREATE_PATH : '/seller/products?new=1';
