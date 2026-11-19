import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiErrorEnvelope } from '../types/api.ts';
import { mocks } from '../mocks/index.ts';
import { AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY } from './constants.ts';

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
  const pathname = new URL(url, 'http://localhost').pathname;

  if (method === 'get') {
    if (pathname === '/api/meta') return mocks.meta;
    if (pathname === '/api/profile/completeness') return mocks.completeness;
    if (pathname === '/api/profile/skills') return mocks.skills;
    if (pathname === '/api/profile') return mocks.profile;
    if (pathname === '/api/skills') return mocks.catalogue;
    if (pathname === '/api/careers') return mocks.careers;
    if (pathname === '/api/recommendations') return mocks.recommendations;
    if (pathname === '/api/gap-analysis') return mocks.gapAnalysis;
    if (pathname === '/api/path') return mocks.path;
    if (pathname === '/api/game/summary') return mocks.gameSummary;
    if (pathname === '/api/reviews/due') return mocks.reviewsDue;
    if (pathname.startsWith('/api/path/units/')) return mocks.unitDetail;
  }

  if (method === 'post') {
    if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
      return mocks.auth;
    }
    if (pathname.startsWith('/api/assessments/') && pathname.endsWith('/submit')) {
      return mocks.recommendations;
    }
    if (pathname === '/api/lessons') {
      return { sessionId: 's-mock-session-001', contentVersion: 1 };
    }
    if (pathname.startsWith('/api/lessons/') && pathname.endsWith('/complete')) {
      return {
        accuracy: 1.0,
        xp: { base: 15, bonus: 5, totalAwarded: 20 },
        atomState: 'learned',
        streak: { current: 7, extendedToday: true },
        readiness: { before: 65.0, after: 66.5, delta: 1.5 },
        newlyUnlockedAtoms: [],
        achievements: [],
      };
    }
  }

  if (method === 'put') {
    if (pathname === '/api/profile/skills') {
      return { updated: mocks.skills.length, skills: mocks.skills };
    }
    if (pathname === '/api/profile') {
      return mocks.profile;
    }
    if (pathname === '/api/game/daily-goal') {
      return { dailyGoalMinutes: 30 };
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
          data: structuredClone(mockData),
          status: 200,
          statusText: 'OK (Mock)',
          headers: {},
          config,
        };
      };
      return config;
    }
  }

  const token =
    localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
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
