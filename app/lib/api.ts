
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Separate instance: session requests should not trigger
// the main API response interceptor.
const sessionApi = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken: string | null = null;



export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Restore session using your existing cookie-based endpoint.
let sessionPromise: Promise<string> | null = null;

export function initializeSession(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = sessionApi
      .get("/auth/session")
      .then((response) => {
        const token =
          response.data.access_token ??
          response.data.accessToken;

        if (!token) {
          throw new Error(
            "Session response does not contain an access token",
          );
        }

        setAccessToken(token);
        return token as string;
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
}

// RESPONSE INTERCEPTOR
let retrySessionPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.startsWith("/auth/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!retrySessionPromise) {
        retrySessionPromise = initializeSession().finally(() => {
          retrySessionPromise = null;
        });
      }

      const token = await retrySessionPromise;

      originalRequest.headers.Authorization = `Bearer ${token}`;

      return api(originalRequest);
    } catch (sessionError) {
      setAccessToken(null);
      return Promise.reject(sessionError);
    }
  },
);
