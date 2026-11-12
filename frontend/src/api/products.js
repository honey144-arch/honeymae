import { apiFetch } from './client';

export function getProducts() {
  return apiFetch('/api/products');
}

export function getProductSizes(productId) {
  return apiFetch(`/api/products/${productId}/sizes`);
}