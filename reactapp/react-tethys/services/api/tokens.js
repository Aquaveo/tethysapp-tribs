let accessToken = null;
const listeners = new Set();

export function setTokens(access) {
  accessToken = access;
  listeners.forEach((fn) => fn(access));
}

export function onTokenChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAccessToken() {
  return accessToken;
}
export function clearTokens() {
  accessToken = null;
}
