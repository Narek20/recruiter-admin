const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

export const env = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL,
  requestTimeoutMs: Number(process.env.REACT_APP_API_TIMEOUT_MS || 10000),
};
