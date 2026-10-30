import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiErrorEnvelope } from '../types/api.ts';
import { mocks } from '../mocks/index.ts';

/**
 * Standard RFC-compliant API error thrown by Masar client.
 * Matches envelope specified in docs/07-api-contract.md §2.
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: ApiErrorDetail[];
  public readonly correlationId?: string;
  public readonly envelope?: ApiErrorEnvelope;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
    correlationId?: string,
    envelope?: ApiErrorEnvelope
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.envelope = envelope;
  }
}

const baseURL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5080';
const useMockData =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK_DATA === 'true';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// =============================================================================
// Mock Adapter for Local Offline / Preview Development
// =============================================================================
function resolveMockResponse(config: InternalAxiosRequestConfig): unknown | null {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  if (method === 'get') {
    if (url.includes('/api/profile/completeness')) return mocks.completeness;
    if (url.includes('/api/profile/skills')) return mocks.skills;
    if (url.includes('/api/profile')) return mocks.profile;
    if (url.includes('/api/skills')) return mocks.catalogue;
    if (url.includes('/api/careers')) return mocks.careers;
    if (url.includes('/api/recommendations')) return mocks.recommendations;
    if (url.includes('/api/gap-analysis')) return mocks.gapAnalysis;
  }

  if (method === 'post') {
    if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
      return mocks.auth;
    }
    if (url.includes('/api/assessments/') && url.includes('/submit')) {
      return mocks.recommendations;
    }
  }

  if (method === 'put') {
    if (url.includes('/api/profile/skills')) {
      return { updated: mocks.skills.length, skills: mocks.skills };
    }
    if (url.includes('/api/profile')) {
      return mocks.profile;
    }
  }

  return null;
}

// Request Interceptor: Auth Token & Mock Adapter Injection
apiClient.interceptors.request.use((config) => {
  if (useMockData) {
    const mockData = resolveMockResponse(config);
    if (mockData !== null) {
      config.adapter = async () => {
        return {
          data: mockData,
          status: 200,
          statusText: 'OK (Mock)',
          headers: {},
          config,
        };
      };
      return config;
    }
  }

  const token = localStorage.getItem('masar_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: RFC Error Envelope Unpacking
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      throw new ApiClientError(
        error.response.status,
        err.code || 'UNKNOWN_ERROR',
        err.message || 'An unexpected error occurred.',
        err.details,
        err.correlationId,
        error.response.data
      );
    }

    throw new ApiClientError(
      error.response?.status || 500,
      'NETWORK_ERROR',
      error.message || 'Network communication error.'
    );
  }
);

/**
 * Convenience typed API client helpers returning response.data directly.
 */
export const api = {
  get: async <T>(url: string, config?: Parameters<typeof apiClient.get>[1]): Promise<T> => {
    const res = await apiClient.get<T>(url, config);
    return res.data;
  },
  post: async <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.post>[2]
  ): Promise<T> => {
    const res = await apiClient.post<T>(url, data, config);
    return res.data;
  },
  put: async <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.put>[2]
  ): Promise<T> => {
    const res = await apiClient.put<T>(url, data, config);
    return res.data;
  },
  delete: async <T>(url: string, config?: Parameters<typeof apiClient.delete>[1]): Promise<T> => {
    const res = await apiClient.delete<T>(url, config);
    return res.data;
  },
};

export default api;
