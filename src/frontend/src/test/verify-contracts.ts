import assert from 'node:assert';
import { ApiClientError } from '../lib/api.ts';
import {
  mockAuth,
  mockProfile,
  mockProfileSkills,
  mockProfileCompleteness,
  mockSkillsCatalogue,
  mockCareers,
  mockRecommendations,
  mockGapAnalysis,
} from '../mocks/index.ts';

console.log('--- Verifying API Contract Types & Mocks ---');

// 1. Verify ApiClientError structure & RFC error mapping
const testError = new ApiClientError(
  400,
  'VALIDATION_FAILED',
  'Field hoursPerWeek is invalid.',
  [{ field: 'hoursPerWeek', message: 'Must be between 1 and 60.' }],
  '0HN7A2K3P9QRS'
);

assert.strictEqual(testError.name, 'ApiClientError');
assert.strictEqual(testError.status, 400);
assert.strictEqual(testError.code, 'VALIDATION_FAILED');
assert.strictEqual(testError.correlationId, '0HN7A2K3P9QRS');
assert.strictEqual(testError.details?.length, 1);
assert.strictEqual(testError.details?.[0]?.field, 'hoursPerWeek');
console.log('✓ ApiClientError RFC envelope extraction verified.');

// 2. Verify Auth mock
assert.ok(mockAuth.accessToken.length > 0, 'Auth mock must include accessToken');
assert.strictEqual(mockAuth.role, 'student');
assert.strictEqual(mockAuth.user?.email, 'student@ci.suez.edu.eg');
console.log('✓ Auth mock fixture verified.');

// 3. Verify Profile mock
assert.strictEqual(typeof mockProfile.academicYear, 'number');
assert.strictEqual(typeof mockProfile.hoursPerWeek, 'number');
assert.ok(mockProfile.interests.length > 0);
console.log('✓ Student Profile mock fixture verified.');

// 4. Verify Profile Skills mock
assert.ok(Array.isArray(mockProfileSkills));
for (const s of mockProfileSkills) {
  assert.strictEqual(typeof s.skillId, 'number');
  assert.strictEqual(typeof s.canonicalName, 'string');
  assert.ok(s.effectiveLevel >= 0 && s.effectiveLevel <= 5, 'Level must be 0-5');
}
console.log('✓ Profile Skills mock fixture verified.');

// 5. Verify Profile Completeness mock
assert.ok(mockProfileCompleteness.percentage >= 0 && mockProfileCompleteness.percentage <= 100);
assert.ok(Array.isArray(mockProfileCompleteness.missing));
console.log('✓ Profile Completeness mock fixture verified.');

// 6. Verify Skills Catalogue mock
assert.ok(mockSkillsCatalogue.length >= 5);
for (const item of mockSkillsCatalogue) {
  assert.strictEqual(typeof item.skillId, 'number');
  assert.ok(Array.isArray(item.aliases), 'Aliases must be array');
}
console.log('✓ Skills Catalogue mock fixture verified.');

// 7. Verify Careers mock
assert.ok(mockCareers.length >= 3);
for (const c of mockCareers) {
  assert.strictEqual(typeof c.careerId, 'number');
  assert.ok(c.tracks.length > 0, 'Career must have tracks');
}
console.log('✓ Careers mock fixture verified.');

// 8. Verify Career Recommendations mock
assert.ok(mockRecommendations.mode === 'model-first' || mockRecommendations.mode === 'fallback');
assert.ok(mockRecommendations.recommendations.length > 0);
for (const rec of mockRecommendations.recommendations) {
  assert.ok(rec.matchScore >= 0 && rec.matchScore <= 100);
  assert.ok(rec.reasons.length > 0);
}
console.log('✓ Recommendations mock fixture verified.');

// 9. Verify Gap Analysis mock
assert.strictEqual(typeof mockGapAnalysis.readinessScore, 'number');
assert.strictEqual(typeof mockGapAnalysis.summary.critical, 'number');
assert.ok(mockGapAnalysis.rows.length > 0);
for (const row of mockGapAnalysis.rows) {
  assert.ok(['critical', 'moderate', 'minor', 'met', 'strengths'].includes(row.severity));
  assert.strictEqual(typeof row.priority, 'number');
  assert.ok(row.severityLabel.length > 0);
}
console.log('✓ Gap Analysis mock fixture verified.');

console.log('--- All Contract & Mock Fixture Assertions Passed! ---');
