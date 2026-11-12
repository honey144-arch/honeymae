import { apiFetch } from './client';

export function getAddons() {
  return apiFetch('/api/addons');
}