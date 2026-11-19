import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiErrorEnvelope, ProblemDetails } from '../types/api.ts';
import { mocks } from '../mocks/index.ts';
import { AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY } from './constants.ts';

/**
 * Standard RFC 9457 / ProblemDetails-compliant API error thrown by Masar client.
 * Matches envelope specified in docs/07-api-contract.md §2.
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Array<{ field?: string; message: string }>;
  public readonly correlationId?: string;
  public readonly problemDetails?: ProblemDetails;
  public readonly envelope?: ApiErrorEnvelope;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ field?: string; message: string }>,
    correlationId?: string,
    problemDetails?: ProblemDetails,
    envelope?: ApiErrorEnvelope
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.problemDetails = problemDetails;
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
    'X-Masar-Client': 'web',
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

  // Deprecated legacy roadmap routes strictly return 410 Gone per contract §8
  if (pathname === '/api/roadmap' || pathname.startsWith('/api/roadmap/')) {
    throw new ApiClientError(
      410,
      'ENDPOINT_DEPRECATED',
      'Legacy roadmap endpoint deprecated in v2.1.0; use /api/path.'
    );
  }

  if (method === 'get') {
    if (pathname === '/api/meta') return mocks.meta;
    if (pathname === '/api/health') {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }
    if (pathname === '/api/ready') {
      return { status: 'ready', database: 'ok', aiService: 'ok', contentHost: 'ok' };
    }
    if (pathname === '/api/profile/completeness') return mocks.completeness;
    if (pathname === '/api/profile/skills') return mocks.skills;
    if (pathname === '/api/profile/projects') return mocks.projects;
    if (pathname === '/api/profile/notifications') return mocks.notifications;
    if (pathname === '/api/profile') return mocks.profile;
    if (pathname === '/api/skills') return mocks.catalogue;
    if (pathname === '/api/careers') return mocks.careers;
    if (pathname === '/api/recommendations') return mocks.recommendations;
    if (pathname === '/api/gap-analysis') return mocks.gapAnalysis;
    if (pathname === '/api/path/preferences') return mocks.pathPreferences;
    if (pathname === '/api/path') return mocks.path;
    if (pathname === '/api/game/summary') return mocks.gameSummary;
    if (pathname === '/api/reviews/due') return mocks.reviewsDue;
    if (pathname.startsWith('/api/path/units/')) return mocks.unitDetail;
  }

  if (method === 'post') {
    if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
      return mocks.auth;
    }
    if (pathname === '/api/auth/refresh') {
      return mocks.auth;
    }
    if (pathname === '/api/auth/logout') {
      return null;
    }
    if (pathname.startsWith('/api/assessments/') && pathname.endsWith('/submit')) {
      return mocks.recommendations;
    }
    if (pathname === '/api/lessons') {
      return { sessionId: 's-mock-session-001', contentVersion: 1, expiresAt: '2026-11-20T00:00:00Z' };
    }
    if (pathname.startsWith('/api/lessons/') && pathname.endsWith('/complete')) {
      return {
        sessionId: 's-mock-session-001',
        passed: true,
        accuracy: 1.0,
        xp: { base: 15, bonus: 5, totalAwarded: 20, replayDailyCapReached: false },
        persistedState: 'learned',
        streak: { current: 7, longest: 14, extendedToday: true, freezesAvailable: 2 },
        readiness: { before: 65.0, after: 66.5, delta: 1.5 },
        newlyUnlockedAtoms: [],
        achievements: [],
        feedback: [],
        telemetryFlags: [],
      };
    }
  }

  if (method === 'put') {
    if (pathname === '/api/profile/skills') {
      return { updated: mocks.skills.length, skills: mocks.skills };
    }
    if (pathname === '/api/profile/notifications') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return body || mocks.notifications;
    }
    if (pathname === '/api/path/preferences') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return body || mocks.pathPreferences;
    }
    if (pathname === '/api/profile') {
      return mocks.profile;
    }
    if (pathname === '/api/game/weekly-goal') {
      let hours = 5;
      try {
        if (config.data) {
          const parsed = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          if (parsed && typeof parsed.hoursPerWeek === 'number') hours = parsed.hoursPerWeek;
        }
      } catch {
        // fallback to default
      }
      return {
        hoursPerWeek: hours,
        dailyGoalMinutes: Math.round((hours * 60) / 7),
        projectedCompletion: '2027-03-12',
      };
    }
    if (pathname === '/api/game/daily-goal') {
      return { dailyGoalMinutes: 43 };
    }
  }

  if (method === 'delete') {
    if (pathname === '/api/game/exam-pause') {
      return null;
    }
  }

  return null;
}

// Request Interceptor: Auth Token, CSRF Header & Mock Adapter Injection
apiClient.interceptors.request.use((config) => {
  // Always attach client identification for CSRF defense on cookie auth
  if (config.headers) {
    config.headers['X-Masar-Client'] = 'web';
  }

  if (useMockData) {
    try {
      const mockData = resolveMockResponse(config);
      if (mockData !== null || (config.method || '').toLowerCase() === 'delete') {
        config.adapter = async () => {
          return {
            data: mockData !== null ? structuredClone(mockData) : undefined,
            status: mockData === null ? 204 : 200,
            statusText: mockData === null ? 'No Content (Mock)' : 'OK (Mock)',
            headers: {},
            config,
          };
        };
        return config;
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        config.adapter = async () => {
          const problem: ProblemDetails = {
            type: 'https://masar.app/errors/' + err.code.toLowerCase().replace(/_/g, '-'),
            title: err.message,
            status: err.status,
            code: err.code,
            detail: err.message,
            correlationId: 'mock-correlation-id',
          };
          throw {
            response: {
              status: err.status,
              data: problem,
              headers: {},
              config,
            },
          };
        };
        return config;
      }
      throw err;
    }
  }

  const token =
    localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: RFC 9457 ProblemDetails & RFC Error Envelope Unpacking
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ProblemDetails | ApiErrorEnvelope>) => {
    const data = error.response?.data as
      | (ProblemDetails & { error?: { code?: string; message?: string; details?: ApiErrorDetail[]; correlationId?: string } })
      | undefined;

    if (data) {
      // 1. Standard RFC 9457 ProblemDetails
      if (data.code && (data.detail || data.title)) {
        throw new ApiClientError(
          data.status || error.response?.status || 500,
          data.code,
          data.detail || data.title || 'An error occurred.',
          data.details,
          data.correlationId,
          data as ProblemDetails
        );
      }

      // 2. Legacy { error: { ... } } fallback
      if (data.error) {
        const err = data.error;
        throw new ApiClientError(
          error.response?.status || 500,
          err.code || 'UNKNOWN_ERROR',
          err.message || 'An unexpected error occurred.',
          err.details,
          err.correlationId,
          undefined,
          data as ApiErrorEnvelope
        );
      }
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
