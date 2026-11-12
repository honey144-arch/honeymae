import { apiFetch } from './client';

export function getAllProducts() {
  return apiFetch('/api/admin/products');
}

export function createProduct(product) {
  return apiFetch('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export function deleteProduct(id) {
  return apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export function getProductSizesAdmin(productId) {
  return apiFetch(`/api/admin/products/${productId}/sizes`);
}

export function addProductSize(productId, size) {
  return apiFetch(`/api/admin/products/${productId}/sizes`, {
    method: 'POST',
    body: JSON.stringify(size),
  });
}

export function deleteProductSize(sizeId) {
  return apiFetch(`/api/admin/sizes/${sizeId}`, { method: 'DELETE' });
}

export function getCategories() {
  return apiFetch('/api/admin/categories');
}

export function createCategory(name) {
  return apiFetch('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getAddonsAdmin() {
  return apiFetch('/api/admin/addons');
}

export function createAddon(addon) {
  return apiFetch('/api/admin/addons', {
    method: 'POST',
    body: JSON.stringify(addon),
  });
}

export function deleteAddon(id) {
  return apiFetch(`/api/admin/addons/${id}`, { method: 'DELETE' });
}

export function getActivity() {
  return apiFetch('/api/admin/activity');
}

export function getUsers() {
  return apiFetch('/api/admin/users');
}

export function createStaff(staff) {
  return apiFetch('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(staff),
  });
}

export function setStaffStatus(id, is_active) {
  return apiFetch(`/api/admin/staff/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  });
}