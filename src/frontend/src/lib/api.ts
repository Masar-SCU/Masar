import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiErrorEnvelope, ProblemDetails } from '../types/api.ts';
import { mocks } from '../mocks/index.ts';

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

// In-memory access token storage (ADR-0010 & v2.1.0 Contract §3 - prevents XSS token theft)
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Mock mode toggle (defaults to true in non-production/test environments if unset)
let mockDataEnabled =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK_DATA !== undefined
    ? import.meta.env.VITE_USE_MOCK_DATA === 'true'
    : true;

export function setUseMockData(enable: boolean): void {
  mockDataEnabled = enable;
}

export function isUseMockData(): boolean {
  return mockDataEnabled;
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Masar-Client': 'web',
  },
  timeout: 15000,
});

// =============================================================================
// Mock Adapter for Local Offline / Preview Development
// =============================================================================

export interface MockResolution {
  status: number;
  data?: unknown;
}

function resolveMockResponse(config: InternalAxiosRequestConfig): MockResolution | undefined {
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
    if (pathname === '/api/meta') return { status: 200, data: mocks.meta };
    if (pathname === '/api/health') {
      return { status: 200, data: { status: 'ok', timestamp: new Date().toISOString() } };
    }
    if (pathname === '/api/ready') {
      return {
        status: 200,
        data: { status: 'ready', database: 'ok', aiService: 'ok', contentHost: 'ok' },
      };
    }
    if (pathname === '/api/profile/completeness') return { status: 200, data: mocks.completeness };
    if (pathname === '/api/profile/skills') return { status: 200, data: mocks.skills };
    if (pathname === '/api/profile/projects') return { status: 200, data: mocks.projects };
    if (pathname === '/api/profile/notifications') return { status: 200, data: mocks.notifications };
    if (pathname === '/api/profile') return { status: 200, data: mocks.profile };
    if (pathname === '/api/skills') return { status: 200, data: mocks.catalogue };
    if (pathname === '/api/careers') return { status: 200, data: mocks.careers };
    if (pathname === '/api/recommendations') return { status: 200, data: mocks.recommendations };
    if (pathname === '/api/gap-analysis') return { status: 200, data: mocks.gapAnalysis };
    if (pathname === '/api/path/preferences') return { status: 200, data: mocks.pathPreferences };
    if (pathname === '/api/path') return { status: 200, data: mocks.path };
    if (pathname === '/api/game/summary') return { status: 200, data: mocks.gameSummary };
    if (pathname === '/api/reviews/due') return { status: 200, data: mocks.reviewsDue };
    if (pathname.startsWith('/api/path/units/')) return { status: 200, data: mocks.unitDetail };
  }

  if (method === 'post') {
    if (pathname === '/api/auth/login') {
      return { status: 200, data: mocks.auth };
    }
    if (pathname === '/api/auth/register') {
      return { status: 201, data: mocks.register };
    }
    if (pathname === '/api/auth/refresh') {
      return { status: 200, data: mocks.auth };
    }
    if (pathname === '/api/auth/logout') {
      return { status: 204 };
    }
    if (pathname.startsWith('/api/assessments/') && pathname.endsWith('/submit')) {
      return { status: 200, data: mocks.recommendations };
    }
    if (pathname === '/api/lessons') {
      return {
        status: 201,
        data: {
          sessionId: 's-mock-session-001',
          kind: 'lesson',
          contentVersion: 1,
          bundleUrl: '/content/v1/units/intro-cs.a1b2c3d4.json',
          expiresAt: '2026-11-20T00:00:00Z',
        },
      };
    }
    if (pathname.startsWith('/api/lessons/') && pathname.endsWith('/complete')) {
      return {
        status: 200,
        data: {
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
        },
      };
    }
    if (pathname.startsWith('/api/projects/') && pathname.endsWith('/start')) {
      return { status: 201, data: mocks.projects[0] };
    }
    if (pathname === '/api/content-reports') {
      return {
        status: 201,
        data: { reportId: 'cr-mock-001', status: 'pending', createdAt: new Date().toISOString() },
      };
    }
  }

  if (method === 'put') {
    if (pathname === '/api/profile/skills') {
      return { status: 200, data: { updated: mocks.skills.length, skills: mocks.skills } };
    }
    if (pathname === '/api/profile/notifications') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return { status: 200, data: body || mocks.notifications };
    }
    if (pathname === '/api/path/preferences') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return { status: 200, data: body || mocks.pathPreferences };
    }
    if (pathname === '/api/profile') {
      return { status: 200, data: mocks.profile };
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
        status: 200,
        data: {
          hoursPerWeek: hours,
          dailyGoalMinutes: Math.round((hours * 60) / 7),
          projectedCompletion: '2027-03-12',
        },
      };
    }
    if (pathname === '/api/game/daily-goal') {
      return { status: 200, data: { dailyGoalMinutes: 43 } };
    }
  }

  if (method === 'delete') {
    if (pathname === '/api/game/exam-pause') {
      return { status: 204 };
    }
  }

  return undefined;
}

// Request Interceptor: Auth Token, CSRF Header & Mock Adapter Injection
apiClient.interceptors.request.use((config) => {
  // Always attach client identification for CSRF defense on cookie auth
  if (config.headers) {
    config.headers['X-Masar-Client'] = 'web';
  }

  if (mockDataEnabled) {
    try {
      const mockResult = resolveMockResponse(config);
      if (mockResult) {
        config.adapter = async () => {
          return {
            data: mockResult.data !== undefined ? structuredClone(mockResult.data) : undefined,
            status: mockResult.status,
            statusText: mockResult.status === 204 ? 'No Content (Mock)' : 'OK (Mock)',
            headers: {},
            config,
          };
        };
        return config;
      }

      // Explicitly reject unsupported/unmocked endpoints in mock mode
      config.adapter = async () => {
        const problem: ProblemDetails = {
          type: 'https://masar.app/errors/not-found',
          title: 'Mock Route Not Found',
          status: 404,
          code: 'MOCK_NOT_FOUND',
          detail: `No mock handler registered for ${config.method?.toUpperCase()} ${config.url}`,
          correlationId: 'mock-correlation-id',
        };
        throw {
          response: {
            status: 404,
            data: problem,
            headers: {},
            config,
          },
        };
      };
      return config;
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

  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }

  return config;
});

// Response Interceptor: RFC 9457 ProblemDetails & RFC Error Envelope Unpacking
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ProblemDetails | ApiErrorEnvelope>) => {
    if (error.response) {
      const httpStatus = error.response.status || 500;
      const fallbackCode = `HTTP_${httpStatus}`;
      const data = error.response.data as
        | (ProblemDetails & {
            error?: {
              code?: string;
              message?: string;
              details?: ApiErrorDetail[];
              correlationId?: string;
            };
          })
        | undefined;

      if (data && typeof data === 'object') {
        // 1. Standard RFC 9457 ProblemDetails (preserves error even when custom code is absent)
        if (data.code || data.detail || data.title) {
          const code = data.code || fallbackCode;
          const message = data.detail || data.title || error.message || 'An error occurred.';
          throw new ApiClientError(
            data.status || httpStatus,
            code,
            message,
            data.details,
            data.correlationId,
            data as ProblemDetails
          );
        }

        // 2. Legacy { error: { ... } } fallback
        if (data.error) {
          const err = data.error;
          throw new ApiClientError(
            httpStatus,
            err.code || fallbackCode,
            err.message || 'An unexpected error occurred.',
            err.details,
            err.correlationId,
            undefined,
            data as ApiErrorEnvelope
          );
        }
      }

      // 3. HTTP response exists but body lacks ProblemDetails or standard error shape
      throw new ApiClientError(
        httpStatus,
        fallbackCode,
        error.message || `Request failed with status ${httpStatus}`
      );
    }

    // Pure network error (no response received from server)
    throw new ApiClientError(
      0,
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
