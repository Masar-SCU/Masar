import assert from 'node:assert';
import { ApiClientError } from '../src/lib/api.ts';
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
} from '../src/mocks/index.ts';

console.log('--- Verifying API Contract Types & Mocks (v2.0.0) ---');

// 1. Verify ApiClientError structure & RFC error mapping
const testError = new ApiClientError(
  400,
  'VALIDATION_FAILED',
  'Field hoursPerWeek is invalid.',
  [{ field: 'hoursPerWeek', message: 'Must be between 1 and 20.' }],
  '0HN7A2K3P9QRS'
);

assert.strictEqual(testError.name, 'ApiClientError');
assert.strictEqual(testError.status, 400);
assert.strictEqual(testError.code, 'VALIDATION_FAILED');
assert.strictEqual(testError.correlationId, '0HN7A2K3P9QRS');
assert.strictEqual(testError.details?.length, 1);
assert.strictEqual(testError.details?.[0]?.field, 'hoursPerWeek');
console.log('✓ ApiClientError RFC envelope extraction verified.');

// 2. Verify System Meta mock
assert.strictEqual(mockMeta.contractVersion, '2.0.0');
assert.strictEqual(mockMeta.contentVersion, 1);
assert.strictEqual(mockMeta.algorithmVersion, '2.0.0');
console.log('✓ System Meta mock fixture verified.');

// 3. Verify Auth mock
assert.ok(mockAuth.accessToken.length > 0, 'Auth mock must include accessToken');
assert.strictEqual(mockAuth.expiresIn, 900);
assert.ok(['student', 'advisor', 'admin', 'Student', 'Advisor', 'Admin'].includes(mockAuth.role));
assert.strictEqual(mockAuth.user?.email, 'student@ci.suez.edu.eg');
console.log('✓ Auth mock fixture verified.');

// 4. Verify Profile mock
assert.strictEqual(typeof mockProfile.academicYear, 'number');
assert.strictEqual(typeof mockProfile.hoursPerWeek, 'number');
assert.strictEqual(typeof mockProfile.targetCareerId, 'number');
assert.strictEqual(typeof mockProfile.targetTrackId, 'number');
assert.ok(mockProfile.interests.length > 0);
console.log('✓ Student Profile mock fixture verified.');

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
assert.ok(mockRecommendations.mode === 'model-first' || mockRecommendations.mode === 'fallback');
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

// 11. Verify Atomic Roadmap Path mock
assert.strictEqual(mockPath.pathVersion, 1);
assert.strictEqual(mockPath.careerName, 'Backend Development');
assert.ok(mockPath.totals.atomsTotal > 0);
assert.ok(mockPath.stages.length > 0);
for (const stage of mockPath.stages) {
  assert.ok(stage.units.length > 0);
  for (const unit of stage.units) {
    assert.ok(['available', 'locked', 'completed'].includes(unit.state));
    assert.ok(['locked', 'available', 'passed'].includes(unit.checkpointState));
  }
}
console.log('✓ Atomic Roadmap Path mock fixture verified.');

// 12. Verify Unit Detail mock
assert.strictEqual(mockUnitDetail.unitId, 'u1111111-0000-0000-0000-000000000001');
assert.ok(mockUnitDetail.atoms.length > 0);
for (const atom of mockUnitDetail.atoms) {
  assert.ok(['locked', 'available', 'learned', 'shaky', 'assumed'].includes(atom.state));
}
console.log('✓ Unit Detail mock fixture verified.');

// 13. Verify Game Summary mock
assert.ok(mockGameSummary.totalXp >= 0);
assert.ok(mockGameSummary.currentStreak >= 0);
assert.ok([10, 20, 30, 45, 60].includes(mockGameSummary.dailyGoalMinutes));
console.log('✓ Gamification Summary mock fixture verified.');

// 14. Verify Reviews Due mock
assert.strictEqual(typeof mockReviewsDue.dueCount, 'number');
assert.ok(Array.isArray(mockReviewsDue.nextReviewBatch));
for (const review of mockReviewsDue.nextReviewBatch) {
  assert.ok(review.box >= 1 && review.box <= 5, 'Leitner queue boxes are 1 to 5');
}
console.log('✓ Spaced Repetition Reviews mock fixture verified.');

console.log('--- All Contract & Mock Fixture Assertions Passed! ---');
