const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "access_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function saveToken(response) {
  localStorage.setItem(TOKEN_KEY, response.data.access_token);
}

function logout() {
  clearToken();
  window.location.href = "login.html";
}

async function refreshAccessToken() {
  const response = await axios.post(
    `${API_BASE_URL}/refresh_access_token`,
    {},
    { withCredentials: true },
  );
  saveToken(response);
  return response.data.access_token;
}

async function apiRequest(config) {
  try {
    return await axios({
      ...config,
      url: `${API_BASE_URL}${config.url}`,
      withCredentials: true,
      headers: {
        ...(config.headers || {}),
        ...authHeaders(),
      },
    });
  } catch (error) {
    if (!error.response || error.response.status !== 401) {
      throw error;
    }

    try {
      const newToken = await refreshAccessToken();
      return await axios({
        ...config,
        url: `${API_BASE_URL}${config.url}`,
        withCredentials: true,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch (refreshError) {
      clearToken();
      if (!window.location.pathname.endsWith("/login.html")) {
        window.location.href = "login.html";
      }
      throw refreshError;
    }
  }
}

function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const detail =
    error.response && error.response.data && error.response.data.detail;
  if (Array.isArray(detail) && detail.length && detail[0].msg)
    return detail[0].msg;
  if (typeof detail === "string") {
    if (detail.toLowerCase().includes("invalid or expired token")) {
      return "Your session expired. Please login again.";
    }
    return detail;
  }
  if (error.message === "Network Error")
    return "Cannot reach the backend. Start Moha Duka API on port 8000.";
  return fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
