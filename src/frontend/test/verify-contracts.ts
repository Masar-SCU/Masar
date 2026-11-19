import assert from 'node:assert';
import { ApiClientError } from '../src/lib/api.ts';
import type { ProblemDetails } from '../src/types/api.ts';
import {
  mockAuth,
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

// 3. Verify Auth mock
assert.ok(mockAuth.accessToken.length > 0, 'Auth mock must include accessToken');
assert.strictEqual(mockAuth.expiresIn, 900);
assert.ok(['student', 'advisor', 'admin', 'Student', 'Advisor', 'Admin'].includes(mockAuth.role));
assert.strictEqual(mockAuth.user?.email, 'student@ci.suez.edu.eg');
console.log('✓ Auth mock fixture verified.');

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

console.log('--- All Contract & Mock Fixture Assertions Passed! ---');
