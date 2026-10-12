let accessToken = null;
export function setTokens(access) {
  accessToken = access;
}
export function getAccessToken() {
  return accessToken;
}
export function clearTokens() {
  accessToken = null;
}
