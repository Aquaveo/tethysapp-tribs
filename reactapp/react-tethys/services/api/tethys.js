import apiClient, { scheduleRefresh } from "react-tethys/services/api/client";
import { setTokens } from "react-tethys/services/api/tokens";

async function getJWTToken() {
  const response = await apiClient.get("/api/token/", {});
  const access = response.access;
  setTokens(access);
  scheduleRefresh(access);
  return { access };
}

function getUserData() {
  return apiClient.get("/api/whoami/");
}

function getAppData(tethys_app_url) {
  return apiClient.get(`/api/apps/${tethys_app_url}/`);
}

const tethysAPI = {
  getJWTToken,
  getAppData,
  getUserData,
};

export default tethysAPI;
