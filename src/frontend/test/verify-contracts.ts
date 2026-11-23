import assert from 'node:assert';
import {
  api,
  apiClient,
  ApiClientError,
  setAccessToken,
  getAccessToken,
  setUseMockData,
  isUseMockData,
} from '../src/lib/api.ts';
import type {
  ProblemDetails,
  CohortGapItem,
  CohortGapResponse,
  CohortAtomsResponse,
  StudentListResponse,
  CreateLessonSessionResponse,
  SystemMetaResponse,
  AuthResponse,
  RegisterResponse,
} from '../src/types/api.ts';
import {
  mockAuth,
  mockRegister,
  mockProfile,
  mockProfileSkills,
  mockProfileCompleteness,
  mockSkillsCatalogue,
  mockCareers,
  mockRecommendations,
  mockGapAnalysis,
  mockMeta,
  mockPath,
  mockUnitDetail,
  mockGameSummary,
  mockReviewsDue,
  mockProjects,
  mockPathPreferences,
  mockNotifications,
} from '../src/mocks/index.ts';

console.log('--- Verifying API Contract Types & Mocks (v2.1.0) ---');

// Ensure mock adapter is active for request-level testing
setUseMockData(true);

// 1. Verify ApiClientError structure & RFC 9457 ProblemDetails extraction
const testProblem: ProblemDetails = {
  type: 'https://masar.app/errors/validation-failed',
  title: 'Validation Failed',
  status: 400,
  code: 'VALIDATION_FAILED',
  detail: 'Field hoursPerWeek is invalid.',
  details: [{ field: 'hoursPerWeek', message: 'Must be between 1 and 20.' }],
  correlationId: '0HN7A2K3P9QRS',
};

const testError = new ApiClientError(
  testProblem.status,
  testProblem.code,
  testProblem.detail,
  testProblem.details,
  testProblem.correlationId,
  testProblem
);

assert.strictEqual(testError.name, 'ApiClientError');
assert.strictEqual(testError.status, 400);
assert.strictEqual(testError.code, 'VALIDATION_FAILED');
assert.strictEqual(testError.correlationId, '0HN7A2K3P9QRS');
assert.strictEqual(testError.details?.length, 1);
assert.strictEqual(testError.details?.[0]?.field, 'hoursPerWeek');
assert.strictEqual(testError.problemDetails?.type, 'https://masar.app/errors/validation-failed');
console.log('✓ ApiClientError RFC 9457 ProblemDetails extraction verified.');

// 2. Verify System Meta mock
assert.strictEqual(mockMeta.contractVersion, '2.1.0');
assert.strictEqual(mockMeta.contentVersion, 1);
assert.strictEqual(mockMeta.algorithmVersion, '2.1.0');
assert.strictEqual(typeof mockMeta.demoMode, 'boolean');
console.log('✓ System Meta mock fixture (v2.1.0) verified.');

// 3. Verify Auth & Register mocks (Findings 4 & 7)
assert.ok(mockAuth.accessToken.length > 0, 'Auth mock must include accessToken');
assert.strictEqual(mockAuth.expiresIn, 900);
assert.ok(['student', 'advisor', 'admin', 'Student', 'Advisor', 'Admin'].includes(mockAuth.role));
assert.strictEqual(mockAuth.user?.email, 'student@ci.suez.edu.eg');
assert.strictEqual(
  (mockAuth as unknown as { refreshToken?: unknown }).refreshToken,
  undefined,
  'AuthResponse must not expose refreshToken in JSON contract'
);
assert.strictEqual(mockRegister.userId, 'd3b07384-d113-404d-b0a8-b6159670eb82');
console.log('✓ Auth & Register mock fixtures verified (no refreshToken, dedicated RegisterResponse).');

// 4. Verify Profile mock & goal derivation invariant
assert.strictEqual(typeof mockProfile.academicYear, 'number');
assert.ok(mockProfile.hoursPerWeek >= 1 && mockProfile.hoursPerWeek <= 20, 'hoursPerWeek must be 1..20');
assert.strictEqual(
  mockProfile.dailyGoalMinutes,
  Math.round((mockProfile.hoursPerWeek * 60) / 7),
  'dailyGoalMinutes must be derived as round(hoursPerWeek * 60 / 7)'
);
assert.strictEqual(typeof mockProfile.timezone, 'string');
assert.strictEqual(typeof mockProfile.targetCareerId, 'number');
assert.strictEqual(typeof mockProfile.targetTrackId, 'number');
assert.ok(mockProfile.interests.length > 0);
console.log('✓ Student Profile & derived dailyGoalMinutes verified.');

// 5. Verify Profile Skills mock
assert.ok(Array.isArray(mockProfileSkills));
for (const s of mockProfileSkills) {
  assert.strictEqual(typeof s.skillId, 'number');
  assert.strictEqual(typeof s.canonicalName, 'string');
  assert.ok(s.effectiveLevel >= 0 && s.effectiveLevel <= 5, 'Level must be 0-5');
}
console.log('✓ Profile Skills mock fixture verified.');

// 6. Verify Profile Completeness mock
assert.ok(mockProfileCompleteness.percentage >= 0 && mockProfileCompleteness.percentage <= 100);
assert.ok(Array.isArray(mockProfileCompleteness.missing));
console.log('✓ Profile Completeness mock fixture verified.');

// 7. Verify Skills Catalogue mock
assert.ok(mockSkillsCatalogue.length >= 5);
for (const item of mockSkillsCatalogue) {
  assert.strictEqual(typeof item.skillId, 'number');
  assert.ok(Array.isArray(item.aliases), 'Aliases must be array');
}
console.log('✓ Skills Catalogue mock fixture verified.');

// 8. Verify Careers mock
assert.ok(mockCareers.length >= 3);
for (const c of mockCareers) {
  assert.strictEqual(typeof c.careerId, 'number');
  assert.ok(c.tracks.length > 0, 'Career must have tracks');
}
console.log('✓ Careers mock fixture verified.');

// 9. Verify Career Recommendations mock
assert.strictEqual(typeof mockRecommendations.lowConfidence, 'boolean');
assert.ok(['model-first', 'fallback', 'unavailable'].includes(mockRecommendations.mode));
assert.ok(mockRecommendations.recommendations.length > 0);
for (const rec of mockRecommendations.recommendations) {
  assert.ok(rec.matchScore >= 0 && rec.matchScore <= 100);
  assert.ok(rec.reasons.length > 0);
}
console.log('✓ Recommendations mock fixture verified.');

// 10. Verify Gap Analysis mock invariants
assert.strictEqual(typeof mockGapAnalysis.readinessScore, 'number');
const summaryTotal =
  mockGapAnalysis.summary.critical +
  mockGapAnalysis.summary.moderate +
  mockGapAnalysis.summary.minor +
  mockGapAnalysis.summary.met +
  mockGapAnalysis.summary.strengths;
assert.strictEqual(
  summaryTotal,
  mockGapAnalysis.rows.length,
  'Summary counts must match rows.length'
);

for (const row of mockGapAnalysis.rows) {
  assert.ok(row.gap >= 0, `Gap cannot be negative: found ${row.gap} for ${row.canonicalName}`);
  assert.ok(['critical', 'moderate', 'minor', 'met', 'strengths'].includes(row.severity));
  assert.strictEqual(typeof row.priority, 'number');
  assert.ok(row.severityLabel.length > 0);

  // Check monotone severity boundaries (F-16)
  if (row.currentLevel > row.requiredLevel) {
    assert.strictEqual(row.severity, 'strengths');
  } else if (row.gap === 0) {
    assert.strictEqual(row.severity, 'met');
  } else if (row.priority >= 1.5) {
    assert.strictEqual(row.severity, 'critical');
  } else if (row.priority >= 0.75) {
    assert.strictEqual(row.severity, 'moderate');
  } else {
    assert.strictEqual(row.severity, 'minor');
  }
}
console.log('✓ Gap Analysis mock & monotone severity invariants verified.');

// 11. Verify Atomic Roadmap Path mock & canonical bundleUrl regex
const bundleUrlRegex = /^\/content\/v\d+\/units\/[a-z0-9-]+\.[a-f0-9]{8}\.json$/;
const validDisplayStates = ['learned', 'assumed', 'current', 'available', 'shaky', 'locked'];

assert.strictEqual(mockPath.pathVersion, 1);
assert.strictEqual(mockPath.careerName, 'Backend Development');
assert.ok(mockPath.totals.atomsTotal > 0);
assert.ok(mockPath.stages.length > 0);
for (const stage of mockPath.stages) {
  assert.ok(stage.units.length > 0);
  for (const unit of stage.units) {
    assert.ok(
      bundleUrlRegex.test(unit.bundleUrl),
      `Unit ${unit.slug} bundleUrl ${unit.bundleUrl} does not match canonical pattern /content/v{n}/units/{slug}.{hash}.json`
    );
    assert.ok(
      validDisplayStates.includes(unit.displayState),
      `Unit ${unit.slug} has invalid displayState: ${unit.displayState}`
    );
    assert.strictEqual(typeof unit.canTestOut, 'boolean');
    assert.ok(['available', 'locked', 'completed'].includes(unit.state));
    assert.ok(['locked', 'available', 'passed'].includes(unit.checkpointState));
  }
}
console.log('✓ Atomic Roadmap Path & canonical bundleUrl regex verified.');

// 12. Verify Unit Detail mock
assert.strictEqual(mockUnitDetail.unitId, 'u1111111-0000-0000-0000-000000000001');
assert.ok(mockUnitDetail.atoms.length > 0);
for (const atom of mockUnitDetail.atoms) {
  assert.ok(
    validDisplayStates.includes(atom.displayState),
    `Atom ${atom.slug} has invalid displayState: ${atom.displayState}`
  );
}
console.log('✓ Unit Detail 6-state displayState verified.');

// 13. Verify Game Summary mock & examPause invariants
assert.ok(mockGameSummary.totalXp >= 0);
assert.ok(mockGameSummary.currentStreak >= 0);
assert.strictEqual(mockGameSummary.hoursPerWeek, 5);
assert.strictEqual(mockGameSummary.dailyGoalMinutes, 43);
assert.strictEqual(typeof mockGameSummary.minutesCompletedThisWeek, 'number');
assert.strictEqual(mockGameSummary.examPause.maxPausesPerYear, 2);
assert.ok(
  mockGameSummary.examPause.pausesUsedThisYear <= mockGameSummary.examPause.maxPausesPerYear,
  'pausesUsedThisYear cannot exceed maxPausesPerYear'
);
console.log('✓ Gamification Summary & examPause bounds verified.');

// 14. Verify Spaced Repetition Reviews mock
assert.strictEqual(typeof mockReviewsDue.dueCount, 'number');
assert.ok(Array.isArray(mockReviewsDue.nextReviewBatch));
for (const review of mockReviewsDue.nextReviewBatch) {
  assert.ok(review.box >= 1 && review.box <= 5, 'Leitner queue boxes are 1 to 5');
}
console.log('✓ Spaced Repetition Reviews mock fixture verified.');

// 15. Verify Capstone Projects, Path Preferences, and Notifications mocks
assert.ok(Array.isArray(mockProjects) && mockProjects.length > 0);
assert.strictEqual(typeof mockProjects[0].projectId, 'number');
assert.ok(mockProjects[0].milestones.length > 0);
assert.ok(Array.isArray(mockPathPreferences.requirementGroupChoices));
assert.strictEqual(typeof mockNotifications.emailStreakReminders, 'boolean');
assert.strictEqual(typeof mockNotifications.emailWeeklyDigest, 'boolean');
console.log('✓ Capstone Projects, Path Preferences & Notifications verified.');

// 16. Verify In-memory Auth Token Management (Finding 3)
setAccessToken('test-in-memory-token-123');
assert.strictEqual(getAccessToken(), 'test-in-memory-token-123');
setAccessToken(null);
assert.strictEqual(getAccessToken(), null);
console.log('✓ In-memory access token storage and lifecycle verified.');

// 17. Verify Advisor Privacy Suppression & Discriminated Union (Findings 8 & 10)
const suppressedGap: CohortGapItem = {
  skillId: 101,
  skillName: 'Advanced Distributed Systems',
  suppressed: true,
  studentCount: null,
  meanLevel: null,
};
assert.strictEqual(suppressedGap.suppressed, true);
assert.strictEqual(suppressedGap.studentCount, null);
assert.strictEqual(suppressedGap.meanLevel, null);

const visibleGap: CohortGapItem = {
  skillId: 102,
  skillName: 'Relational Database Design',
  suppressed: false,
  studentCount: 18,
  meanLevel: 3.2,
};
assert.strictEqual(visibleGap.suppressed, false);
assert.strictEqual(visibleGap.studentCount, 18);
assert.strictEqual(visibleGap.meanLevel, 3.2);

const cohortGapResponse: CohortGapResponse = {
  academicYear: 3,
  careerId: 1,
  careerName: 'Backend Development',
  totalStudents: 42,
  gaps: [suppressedGap, visibleGap],
};
assert.strictEqual(cohortGapResponse.gaps.length, 2);

const cohortAtomsResponse: CohortAtomsResponse = {
  unitId: 'u1111111-0000-0000-0000-000000000001',
  academicYear: 3,
  totalAttempts: 150,
  atoms: [
    {
      atomId: 'a1',
      atomTitle: 'B-Trees',
      unitId: 'u1',
      unitTitle: 'Storage Engines',
      suppressed: false,
      failCount: 22,
      failureRate: 0.147,
    },
    {
      atomId: 'a2',
      atomTitle: 'Write-Ahead Log',
      unitId: 'u1',
      unitTitle: 'Storage Engines',
      suppressed: true,
      failCount: null,
      failureRate: null,
    },
  ],
};
assert.strictEqual(cohortAtomsResponse.atoms.length, 2);

const studentListResponse: StudentListResponse = {
  totalCount: 1,
  students: [
    {
      userId: 's-001',
      email: 'student@ci.suez.edu.eg',
      academicYear: 3,
      readinessScore: 78.5,
    },
  ],
};
assert.strictEqual(studentListResponse.students.length, 1);
console.log('✓ Advisor Privacy Suppression & response DTOs verified.');

// 18. Request-level Client & Mock Adapter Tests (Findings 1, 5, 6, 11, 14)

// 18a. Supported No-Content Routes (Finding 1 & 6)
const logoutResponse = await apiClient.post('/api/auth/logout');
assert.strictEqual(logoutResponse.status, 204, 'POST /api/auth/logout must return 204');
assert.strictEqual(logoutResponse.data, undefined, '204 response must not have body');

const examPauseDelResponse = await apiClient.delete('/api/game/exam-pause');
assert.strictEqual(examPauseDelResponse.status, 204, 'DELETE /api/game/exam-pause must return 204');
assert.strictEqual(examPauseDelResponse.data, undefined);

// 18b. Unsupported Routes Rejected in Mock Mode (Finding 1)
await assert.rejects(
  async () => {
    await apiClient.delete('/api/game/unsupported-endpoint');
  },
  (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.strictEqual(err.status, 404);
    assert.strictEqual(err.code, 'MOCK_NOT_FOUND');
    return true;
  },
  'Unsupported DELETE route in mock mode must be rejected with 404 MOCK_NOT_FOUND'
);

await assert.rejects(
  async () => {
    await apiClient.get('/api/unsupported-get-route');
  },
  (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.strictEqual(err.status, 404);
    assert.strictEqual(err.code, 'MOCK_NOT_FOUND');
    return true;
  },
  'Unsupported GET route in mock mode must be rejected with 404 MOCK_NOT_FOUND'
);

// Retired daily-goal endpoint must be rejected (Finding 3)
await assert.rejects(
  async () => {
    await apiClient.put('/api/game/daily-goal', { dailyGoalMinutes: 45 });
  },
  (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.strictEqual(err.status, 404);
    assert.strictEqual(err.code, 'MOCK_NOT_FOUND');
    return true;
  },
  'Retired PUT /api/game/daily-goal must be rejected in mock mode'
);

// Mock mode control verification (Finding 1)
setUseMockData(false);
assert.strictEqual(isUseMockData(), false);
setUseMockData(true);
assert.strictEqual(isUseMockData(), true);

// 18c. Dedicated Registration Mock & 201 Created (Finding 7)
const registerResponse = await apiClient.post<RegisterResponse>('/api/auth/register', {
  email: 'newstudent@ci.suez.edu.eg',
  password: 'SecurePassword123!',
  academicYear: 1,
});
assert.strictEqual(registerResponse.status, 201, 'POST /api/auth/register must return 201 Created');
assert.strictEqual(registerResponse.data.userId, 'd3b07384-d113-404d-b0a8-b6159670eb82');

// 18d. Login Mock returning 200 OK without refreshToken (Finding 4 & 6)
const loginResponse = await apiClient.post<AuthResponse>('/api/auth/login', {
  email: 'student@ci.suez.edu.eg',
  password: 'SecurePassword123!',
});
assert.strictEqual(loginResponse.status, 200, 'POST /api/auth/login must return 200 OK');
assert.ok(loginResponse.data.accessToken);

// 18e. Lesson Creation returns 201 Created with bundleUrl (Finding 6 & 14)
const lessonResponse = await apiClient.post<CreateLessonSessionResponse>('/api/lessons', {
  kind: 'lesson',
  atomId: 'a1111111-0000-0000-0000-000000000001',
});
assert.strictEqual(lessonResponse.status, 201, 'POST /api/lessons must return 201 Created');
assert.ok(lessonResponse.data.bundleUrl, 'Lesson session response must contain bundleUrl');
assert.strictEqual(lessonResponse.data.contentVersion, 1);

// 18f. Deprecated Legacy Route returns 410 Gone
await assert.rejects(
  async () => {
    await apiClient.get('/api/roadmap');
  },
  (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.strictEqual(err.status, 410);
    assert.strictEqual(err.code, 'ENDPOINT_DEPRECATED');
    return true;
  },
  'GET /api/roadmap must reject with 410 ENDPOINT_DEPRECATED'
);

// 18g. Convenience Helper api.get
const metaViaHelper = await api.get<SystemMetaResponse>('/api/meta');
assert.strictEqual(metaViaHelper.contractVersion, '2.1.0');

// 18h. ProblemDetails Error Parsing Fallback when code is missing (Finding 5)
try {
  // @ts-expect-error accessing response interceptor handler for unit test verification
  const responseErrorHandler = apiClient.interceptors.response.handlers[0]?.rejected;
  if (responseErrorHandler) {
    await responseErrorHandler({
      response: {
        status: 502,
        data: {
          type: 'https://masar.app/errors/bad-gateway',
          title: 'Bad Gateway',
          status: 502,
          detail: 'Reverse proxy upstream error',
        },
      },
      message: 'Request failed with status code 502',
    });
  }
  assert.fail('Should have thrown ApiClientError for 502');
} catch (err: unknown) {
  assert.ok(err instanceof ApiClientError);
  assert.strictEqual(err.status, 502);
  assert.strictEqual(err.code, 'HTTP_502', 'Missing custom code must fall back to HTTP_<status>');
  assert.strictEqual(err.message, 'Reverse proxy upstream error');
}

console.log('✓ Request-level API client, status codes, and mock adapter handling verified.');

console.log('--- All Contract & Mock Fixture Assertions Passed! ---');
