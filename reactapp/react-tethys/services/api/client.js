import axios from "axios";

import { getTethysPortalHost } from "react-tethys/services/utilities";
import { getAccessToken, getRefreshToken, setTokens } from "react-tethys/services/api/tokens";

const TETHYS_PORTAL_HOST = getTethysPortalHost();

const apiClient = axios.create({
  baseURL: `${TETHYS_PORTAL_HOST}`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

async function refreshAccess() {
  const res = await axios.post(
    `${TETHYS_PORTAL_HOST.origin}/api/token/refresh/`,
    { refresh: getRefreshToken() },
  );
  setTokens(res.data.access, res.data.refresh);
  return res.data.access;
}

export async function getFreshAccessToken() {
  const access = getAccessToken();
  const expiry = access && getExpiryMs(access);
  if (expiry && expiry - Date.now() > 30_000) return access;  /// still valid, use as-is
  return refreshAccess();  // expired or about to - refresh first
}

export function redirectToLogin() {
  window.location.assign(
    `${TETHYS_PORTAL_HOST.origin}/accounts/login?next=${window.location.pathname}`
  );
}

function getExpiryMs(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return null;
  }
}

let refreshTimer = null;

export function scheduleRefresh(access) {
  clearTimeout(refreshTimer);
  const expiry = getExpiryMs(access);
  if (!expiry) return;
  // refresh 60s before expiry
  const delay = Math.max(expiry - Date.now() - 60_000, 0);
  refreshTimer = setTimeout(async() => {
    try {
      scheduleRefresh(await refreshAccess());
    } catch {
      redirectToLogin();
    }
  }, delay);
}

function handleSuccess(response) {
  return response.data ? response.data : response;
}

async function handleError(error) {
  const res = error.response;
  const original = error.config;
  // try one refresh if the access token is expired, but don't retry if the refresh fails or if the request was to /api/token/ (to avoid infinite loops)
  if (res?.status === 401 && !original._retry && !original.url.includes("/api/token/")) {
    original._retry = true;
    try {
      const access = await refreshAccess();
      original.headers.Authorization = `Bearer ${access}`;
      return apiClient(original);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  }
  if (res?.status === 401) redirectToLogin();
  return Promise.reject(error);
}

apiClient.interceptors.request.use((config) => {
  const access = getAccessToken();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

apiClient.interceptors.response.use(handleSuccess, handleError);

export default apiClient;
