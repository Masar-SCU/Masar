/**
 * Shared storage keys and client constants for Masar Frontend.
 *
 * NOTE: Per the v2.1.0 contract and security architecture, active JWT access tokens
 * are maintained strictly in memory via setAccessToken() in src/lib/api.ts to mitigate XSS risks.
 * Refresh tokens are managed exclusively through HttpOnly cookies.
 * The keys below are retained strictly for backward compatibility, migration, and logout cleanup.
 */

export const AUTH_TOKEN_KEY = 'masar_access_token';
export const LEGACY_AUTH_TOKEN_KEY = 'masar_token';
