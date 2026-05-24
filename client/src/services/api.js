import axios from 'axios';

let memoryToken = null;
let logoutCallback = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Sends HTTP-only refresh cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set token in-memory
export const setMemoryToken = (token) => {
  memoryToken = token;
};

// Clear token on logout
export const clearMemoryToken = () => {
  memoryToken = null;
};

// Register logout callback for Auth Context when refresh token expires
export const registerLogoutCallback = (cb) => {
  logoutCallback = cb;
};

// Request Interceptor: Attach bearer token if present
api.interceptors.request.use(
  (config) => {
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Automatically refresh access token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: ignore if not 401 or if it's already a retry/refresh request
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue requests while refreshing is active
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Hit the refresh endpoint (cookies are sent automatically)
      const res = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = res.data.data;
      setMemoryToken(accessToken);
      
      // Update original request headers and retry
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      
      // Refresh token expired - force logout in frontend
      if (logoutCallback) {
        logoutCallback();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
