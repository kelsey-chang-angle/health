const CLIENT_ID_KEY = 'food_diet_client_id';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function createClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getClientId() {
  const current = localStorage.getItem(CLIENT_ID_KEY);
  if (current) return current;
  const nextId = createClientId();
  localStorage.setItem(CLIENT_ID_KEY, nextId);
  return nextId;
}

export async function fetchRemoteProfile(clientId) {
  const response = await fetch(`${API_BASE}/profile/${clientId}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}`);
  }
  return response.json();
}

export async function saveRemoteProfile(clientId, profile) {
  const response = await fetch(`${API_BASE}/profile/${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    throw new Error(`Failed to save profile: ${response.status}`);
  }
  return response.json();
}

export async function resetRemoteProfile(clientId) {
  const response = await fetch(`${API_BASE}/profile/${clientId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset profile: ${response.status}`);
  }
}
