// JWT token storage helpers
const ACCESS_TOKEN_KEY = "jwt_access";
const REFRESH_TOKEN_KEY = "jwt_refresh";

export function setTokens(access, refresh) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}