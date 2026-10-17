/**
 * client.ts — Reusable Axios HTTP client with interceptors, dev authorization, and error handling.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { DEV_ADMIN_TOKEN } from '@/config/constants';
import { ENV } from '@/config/environment';
import { ApiResponse } from '@/types/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Auto-attach Dev Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${DEV_ADMIN_TOKEN}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Format errors and unpack standard ApiResponse
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }>; message?: string }>) => {
    let friendlyMessage = 'An unexpected server error occurred.';

    if (!error.response) {
      friendlyMessage = 'Backend service is currently unreachable. Ensure FastAPI server is running on port 8000.';
    } else if (error.response.data) {
      const data = error.response.data;
      if (typeof data.detail === 'string') {
        friendlyMessage = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        friendlyMessage = data.detail.map((d) => d.msg).join(', ');
      } else if (data.message) {
        friendlyMessage = data.message;
      }
    }

    const enhancedError = new Error(friendlyMessage);
    (enhancedError as unknown as { status?: number }).status = error.response?.status;
    (enhancedError as unknown as { originalError: AxiosError }).originalError = error;

    return Promise.reject(enhancedError);
  }
);

export async function fetchApi<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data.data;
}

export async function postApi<T, B = unknown>(url: string, body: B): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function deleteApi<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data.data;
}
