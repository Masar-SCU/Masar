/**
 * Masar API Contract Type Definitions (v2.1.0)
 *
 * Single Source of Truth: docs/07-api-contract.md
 * Status: Revised 2026-11-19 (Pre-W9 Contract Freeze Reconciliation)
 * Casing: All JSON network properties follow camelCase format.
 *
 * Code Generation Policy & Migration Plan:
 * As defined in docs/07-api-contract.md §13, production TypeScript client types will be
 * generated automatically from the .NET OpenAPI specification once all endpoints are
 * implemented across Slices 1–5. In Slice 0, this hand-authored specification acts as the
 * authoritative pre-freeze baseline and contract test target until backend controllers are live.
 */

// =============================================================================
// 1. Common Conventions, RFC 9457 Errors & Pagination (§1, §2)
// =============================================================================

/**
 * Standard RFC 9457 ProblemDetails error structure.
 * Content-Type: application/problem+json
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  details?: Array<{ field: string; message: string }>;
  correlationId: string;
}

/**
 * @deprecated Legacy error code union kept for backwards compatibility.
 */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ENDPOINT_DEPRECATED'
  | 'PRECONDITION_UNMET'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DEPENDENCY_UNAVAILABLE';

/** @deprecated Legacy detail shape */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** @deprecated Legacy error body */
export interface ApiErrorBody {
  code: ApiErrorCode | string;
  message: string;
  details?: ApiErrorDetail[];
  correlationId?: string;
}

/** @deprecated Legacy error envelope */
export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

/**
 * Standard offset pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Standard offset-paginated response envelope.
 */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

/** @deprecated Alias for PagedResponse */
export type PaginatedResponse<T> = PagedResponse<T>;

/**
 * Cursor-paginated response envelope for append-only streams (e.g. AI Mentor turns).
 */
export interface CursorPagedResponse<T> {
  items: T[];
  nextBeforeId: string | null;
  hasMore: boolean;
}

// =============================================================================
// 2. Metadata and System Status (§3)
// =============================================================================

export interface SystemMetaResponse {
  contractVersion: string;
  contentVersion: number;
  algorithmVersion: string;
  demoMode: boolean;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadyResponse {
  status: 'ready' | 'loading' | 'unhealthy';
  database: string;
  aiService: string;
  contentHost: string;
}

// =============================================================================
// 3. Authentication (§4)
// =============================================================================

export type UserRole =
  | 'Student'
  | 'Advisor'
  | 'Admin'
  | 'student'
  | 'advisor'
  | 'admin';

export interface RegisterRequest {
  email: string;
  password: string;
  academicYear: number;
}

export interface RegisterResponse {
  userId: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request payload for token refresh.
 * Refresh token is supplied exclusively via browser-managed HttpOnly cookie.
 */
export type RefreshTokenRequest = Record<string, never>;

/**
 * Request payload for session logout.
 * Refresh token is cleared via browser-managed HttpOnly cookie.
 */
export type LogoutRequest = Record<string, never>;

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  academicYear: number;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  /** @deprecated Kept for backwards compatibility */
  expiresInSeconds?: number;
  role: UserRole;
  user?: AuthUser;
}

// =============================================================================
// 4. Profile, Preferences & Consent (§5)
// =============================================================================

export interface StudentProfile {
  userId: string;
  email: string;
  academicYear: number;
  /** Authoritative weekly study goal (1..20 hours, default 5) */
  hoursPerWeek: number;
  /** Read-only derived daily goal in minutes: round(hoursPerWeek * 60 / 7) */
  dailyGoalMinutes: number;
  /** IANA timezone string (e.g. 'Africa/Cairo') */
  timezone: string;
  careerGoalText: string;
  interests: string[];
  targetCareerId?: number | null;
  targetTrackId?: number | null;
  advisorVisibility?: boolean;
  researchUse?: boolean;
}

export interface UpdateProfileRequest {
  academicYear?: number;
  hoursPerWeek?: number;
  timezone?: string;
  careerGoalText?: string;
  interests?: string[];
}

export interface ProfileCompleteness {
  percentage: number;
  missing: string[];
}

export type SkillClaimSource = 'self' | 'calibration' | 'course';

export interface SkillClaim {
  skillId: number;
  canonicalName: string;
  selfLevel: number;
  calibratedLevel: number | null;
  effectiveLevel: number;
  source: SkillClaimSource;
  verified: boolean;
  evidenceUrl?: string;
}

export interface SkillClaimInput {
  skillId: number;
  selfLevel: number;
  evidenceUrl?: string;
}

export interface UpdateSkillsRequest {
  skills: SkillClaimInput[];
}

export interface UpdateSkillsResponse {
  updated: number;
  skills: SkillClaim[];
}

export interface CourseRecord {
  courseId: number;
  code: string;
  name: string;
  grade?: string;
  completedTerm?: string;
}

export interface CourseRecordInput {
  courseId: number;
  grade?: string;
  completedTerm?: string;
}

export interface SkillProposal {
  skillId: number;
  canonicalName: string;
  proposedLevel: number;
  confidence: number;
  sourceCourse: string;
}

export interface OnboardingProgress {
  step: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface UpdateOnboardingStepRequest {
  step: number;
}

export interface ConsentPreferences {
  advisorVisibility: boolean;
  researchUse: boolean;
}

export interface UpdateConsentRequest {
  advisorVisibility: boolean;
  researchUse: boolean;
}

export interface NotificationPreferences {
  emailStreakReminders: boolean;
  emailWeeklyDigest: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  emailStreakReminders: boolean;
  emailWeeklyDigest: boolean;
}

export interface RequirementGroupChoice {
  groupId: number;
  selectedSkillId: number;
}

export interface PathPreferences {
  requirementGroupChoices: RequirementGroupChoice[];
}

export interface UpdatePathPreferencesRequest {
  requirementGroupChoices: RequirementGroupChoice[];
}

// =============================================================================
// 5. Catalogue (§6)
// =============================================================================

export interface SkillDto {
  skillId: number;
  canonicalName: string;
  category: string;
  description: string;
  aliases: string[];
  prerequisites: number[];
}

export interface TrackDto {
  trackId: number;
  name: string;
  isDefault: boolean;
}

export interface CareerRequirementGroupDto {
  groupId: number;
  name: string;
  rule: 'all_of' | 'any_of';
  skills: Array<{
    skillId: number;
    canonicalName: string;
    requiredLevel: number;
    importance: number;
  }>;
}

export interface CareerDto {
  careerId: number;
  name: string;
  summary: string;
  tracks: TrackDto[];
  requirementGroups?: CareerRequirementGroupDto[];
}

export interface CareerRequirementDto {
  skillId: number;
  canonicalName: string;
  requiredLevel: number;
  importance: number;
  rationale: string;
}

export interface CourseDto {
  courseId: number;
  code: string;
  title: string;
  credits: number;
  department: string;
}

export type ResourceType = 'docs' | 'video' | 'course' | 'interactive';

export interface LearningResourceDto {
  resourceId: number;
  title: string;
  url: string;
  type: ResourceType;
  estimatedHours: number;
  isFree: boolean;
}

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ProjectDto {
  projectId: number;
  title: string;
  difficulty: ProjectDifficulty;
  estimatedHours: number;
  coveredGapSkills: string[];
}

// =============================================================================
// 6. Assessment, Adaptive Placement and Recommendations (§7)
// =============================================================================

export interface AssessmentQuestion {
  questionId: number;
  text: string;
  category: string;
  weight: number;
}

export interface StartAssessmentResponse {
  attemptId: number;
  questions: AssessmentQuestion[];
}

export interface SaveAnswersRequest {
  answers: Array<{ questionId: number; value: number }>;
}

export type RecommendationReasonType = 'skill' | 'interest';

export interface RecommendationReason {
  type: RecommendationReasonType;
  detail: string;
}

export interface CareerRecommendationBreakdown {
  constraintStatus: string;
  modelScore?: number;
  baselineScore?: number;
  skillFit?: number;
  interestFit?: number;
  coverage?: number;
}

export interface CareerRecommendation {
  careerId: number;
  name: string;
  matchScore: number;
  isActive?: boolean;
  contentAvailability?: number;
  contentLimited?: boolean;
  isSelectable?: boolean;
  breakdown: CareerRecommendationBreakdown;
  reasons: RecommendationReason[];
  tracks: TrackDto[];
}

export type RecommendationMode = 'model-first' | 'fallback' | 'unavailable';

export interface RecommendationResponseDto {
  mode: RecommendationMode;
  lowConfidence: boolean;
  recommendations: CareerRecommendation[];
}

/** @deprecated Alias for RecommendationResponseDto */
export type CareerRecommendationResponse = RecommendationResponseDto;

export interface SetTargetCareerRequest {
  careerId: number;
  trackId: number;
  requirementGroupChoices?: RequirementGroupChoice[];
}

export interface StartPlacementRequest {
  skillId: number;
}

export interface PlacementSessionResponse {
  sessionId: string;
  skillId: number;
  maxExercises: number;
  currentExercise: KeylessExercise;
}

export interface PlacementAnswerRequest {
  exerciseId: string;
  answer: ExerciseAnswer;
  msTaken: number;
}

export interface PlacementAnswerResponse {
  isFinal: boolean;
  verifiedLevel?: number;
  nextExercise?: KeylessExercise;
}

// =============================================================================
// 7. Atomic Roadmap, Path, Lessons, Projects & Gamification (§8)
// =============================================================================

export type SeverityLevel = 'critical' | 'moderate' | 'minor' | 'met' | 'strengths';
export type SeverityLabel = 'Critical' | 'Moderate' | 'Minor' | 'Met' | 'Strength';

export interface GapRow {
  skillId: number;
  canonicalName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importance: number;
  priority: number;
  severity: SeverityLevel;
  severityLabel: SeverityLabel | string;
  rationale: string;
  verified: boolean;
  atomsRemaining?: number;
  minutesRemaining?: number;
  nextAtomId?: string | null;
  progressToNextLevel?: number;
  postingFrequency?: number;
}

export type GapSummary = Record<SeverityLevel, number>;

export interface GapAnalysisResponse {
  careerId: number;
  careerName: string;
  trackName: string;
  readinessScore: number;
  computedAt: string;
  summary: GapSummary;
  rows: GapRow[];
}

export interface ReadinessResponse {
  score: number;
}

export interface ReadinessSnapshot {
  score: number;
  computedAt: string;
  trigger?: string;
}

export interface PathTotals {
  atomsTotal: number;
  atomsDone: number;
  remainingMinutes: number;
  projectedCompletion: string;
}

export type UnitState = 'available' | 'locked' | 'completed';
export type CheckpointState = 'locked' | 'available' | 'passed';

/**
 * 6 Derived UI Display States for atoms and units in the visual learning path.
 * Aligns docs/13-learning-experience.md §3 with docs/07-api-contract.md §8.
 */
export type AtomDisplayState =
  | 'learned'
  | 'assumed'
  | 'current'
  | 'available'
  | 'shaky'
  | 'locked';

/**
 * 3 Persisted Database Mastery States matching PostgreSQL table check constraints.
 * CHECK (status IN ('learned', 'shaky', 'assumed'))
 */
export type PersistedAtomState = 'learned' | 'shaky' | 'assumed';

/** @deprecated Alias for backward compatibility */
export type AtomMasteryState = PersistedAtomState | AtomDisplayState;

export interface PathUnitSummary {
  unitId: string;
  slug: string;
  title: string;
  state: UnitState;
  displayState: AtomDisplayState;
  bundleUrl: string;
  canTestOut: boolean;
  atomsTotal: number;
  atomsDone: number;
  minutesRemaining: number;
  checkpointState: CheckpointState;
}

export interface PathStage {
  stageId: number;
  name: string;
  units: PathUnitSummary[];
}

export type PathMode = 'canonical' | 'prioritized';

export interface PathResponse {
  pathVersion: number;
  careerName: string;
  trackName: string;
  mode: PathMode;
  totals: PathTotals;
  stages: PathStage[];
}

export interface PathAtomNode {
  atomId: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  displayState: AtomDisplayState;
  prerequisites: string[];
}

export interface PathUnitDetail {
  unitId: string;
  slug: string;
  title: string;
  state: UnitState;
  displayState: AtomDisplayState;
  bundleUrl: string;
  canTestOut: boolean;
  atoms: PathAtomNode[];
  checkpointState: CheckpointState;
}

export interface UpdatePathModeRequest {
  mode: PathMode;
}

/**
 * The 5 lesson session kinds supported by the learning engine.
 * 'placement' diagnostic is held strictly under /api/placement.
 */
export type LessonSessionKind =
  | 'lesson'
  | 'review'
  | 'checkpoint'
  | 'test_out'
  | 'replay';

export interface CreateLessonSessionRequest {
  kind: LessonSessionKind;
  atomId?: string;
  unitId?: string;
}

export interface BaseLessonSessionResponse {
  sessionId: string;
  contentVersion: number;
  expiresAt: string;
}

export interface BundleBackedLessonSessionResponse extends BaseLessonSessionResponse {
  kind?: 'lesson' | 'review' | 'replay';
  bundleUrl: string;
  exercises?: never;
  reviewItems?: Array<{ atomId: string; exercise: KeylessExercise }>;
}

export interface AssessmentLessonSessionResponse extends BaseLessonSessionResponse {
  kind: 'checkpoint' | 'test_out';
  bundleUrl?: string;
  exercises: KeylessExercise[];
  reviewItems?: never;
}

export type CreateLessonSessionResponse =
  | BundleBackedLessonSessionResponse
  | AssessmentLessonSessionResponse;

/**
 * Discriminated union of client answer submissions across the 8 canonical exercise types.
 */
export type ExerciseAnswer =
  | { type: 'multiple_choice'; selectedIndex: number }
  | { type: 'fill_blank_tokens'; selectedTokenIndices: number[] }
  | { type: 'true_false_code'; selected: boolean }
  | { type: 'reorder_tokens'; orderedTokenIds: string[] }
  | { type: 'match_pairs'; pairs: Array<{ leftId: string; rightId: string }> }
  | { type: 'predict_output'; selectedIndex: number }
  | { type: 'spot_defect'; selectedLine: number }
  | { type: 'multi_select'; selectedIndices: number[] };

export interface LessonAttemptItem {
  exerciseId: string;
  attemptNo: number;
  answer: ExerciseAnswer;
  msTaken: number;
  /** @deprecated Kept for backward compatibility with unmigrated clients */
  selected?: unknown;
}

export interface CompleteLessonSessionRequest {
  idempotencyKey?: string;
  attempts: LessonAttemptItem[];
}

export interface LessonExerciseFeedback {
  exerciseId: string;
  correct: boolean;
  explanation: string;
}

export interface LessonSessionCompletionResponse {
  sessionId: string;
  passed: boolean;
  accuracy: number;
  xp: {
    base: number;
    bonus: number;
    totalAwarded: number;
    replayDailyCapReached: boolean;
  };
  persistedState: PersistedAtomState;
  streak: {
    current: number;
    longest: number;
    extendedToday: boolean;
    freezesAvailable: number;
  };
  readiness: {
    before: number;
    after: number;
    delta: number;
  };
  newlyUnlockedAtoms: string[];
  achievements: string[];
  feedback: LessonExerciseFeedback[];
  telemetryFlags: string[];
}

export interface ReviewBatchItem {
  atomId: string;
  title: string;
  box: number;
  dueAt: string;
}

export interface ReviewsDueResponse {
  dueCount: number;
  nextReviewBatch: ReviewBatchItem[];
}

export interface ResetAtomStateResponse {
  atomId: string;
  previousState: PersistedAtomState;
  newState: PersistedAtomState;
  recalculatedReadiness: number;
}

// Stage Capstone Projects
export interface ProjectMilestoneDto {
  milestoneId: number;
  title: string;
  completed: boolean;
  note?: string;
}

export interface StudentProjectDto {
  projectId: number;
  title: string;
  difficulty: ProjectDifficulty;
  status: 'available' | 'in_progress' | 'submitted';
  repoUrl?: string;
  liveUrl?: string;
  milestones: ProjectMilestoneDto[];
}

export interface UpdateProjectMilestoneRequest {
  completed: boolean;
  note?: string;
}

export interface SubmitProjectRequest {
  repoUrl: string;
  liveUrl?: string;
  reflection?: string;
}

export interface SubmitProjectResponse {
  projectId: number;
  xpAwarded: number;
  portfolioItemId: string;
  submittedAt: string;
}

// Gamification
export interface ExamPauseStatus {
  active: boolean;
  until: string | null;
  pausesUsedThisYear: number;
  maxPausesPerYear: number;
}

export interface GameSummaryResponse {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  freezeActiveToday: boolean;
  hoursPerWeek: number;
  dailyGoalMinutes: number;
  minutesCompletedThisWeek: number;
  examPause: ExamPauseStatus;
}

export interface UpdateWeeklyGoalRequest {
  hoursPerWeek: number;
}

/** @deprecated Alias for UpdateWeeklyGoalRequest */
export interface UpdateDailyGoalRequest {
  dailyGoalMinutes: 10 | 20 | 30 | 45 | 60;
}

export interface WeeklyGoalResponse {
  hoursPerWeek: number;
  dailyGoalMinutes: number;
  projectedCompletion?: string;
}

export interface ExamPauseRequest {
  until: string; // ISO date format YYYY-MM-DD
}

export interface ExamPauseResponse {
  active: boolean;
  until: string;
  pausesUsedThisYear: number;
  maxPausesPerYear: number;
}

export interface AchievementDto {
  achievementId: string;
  title: string;
  description: string;
  unlockedAt: string;
  badgeUrl: string;
}

export interface CreateContentReportRequest {
  atomId?: string;
  exerciseId?: string;
  reason: string;
  text?: string;
}

export interface InternshipReadinessResponse {
  readinessScore: number;
  isEligible: boolean;
  completedProjectsCount: number;
  requiredProjectsCount: number;
  missingSkills: string[];
}

// =============================================================================
// 8. Static Content Bundle Specification (§9)
// =============================================================================

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank_tokens'
  | 'true_false_code'
  | 'reorder_tokens'
  | 'match_pairs'
  | 'predict_output'
  | 'spot_defect'
  | 'multi_select';

export interface BaseKeylessExercise {
  exerciseId: string;
  type: ExerciseType;
  prompt: string;
}

export interface KeylessMultipleChoiceExercise extends BaseKeylessExercise {
  type: 'multiple_choice';
  options: string[];
}

export interface KeylessFillBlankTokensExercise extends BaseKeylessExercise {
  type: 'fill_blank_tokens';
  codeTemplate: string;
  tokens: string[];
}

export interface KeylessTrueFalseCodeExercise extends BaseKeylessExercise {
  type: 'true_false_code';
  code: string;
}

export interface KeylessReorderTokensExercise extends BaseKeylessExercise {
  type: 'reorder_tokens';
  tokens: string[];
}

export interface MatchPairLeftItem {
  leftId: string;
  text: string;
}

export interface MatchPairRightItem {
  rightId: string;
  text: string;
}

export interface KeylessMatchPairsExercise extends BaseKeylessExercise {
  type: 'match_pairs';
  leftItems: MatchPairLeftItem[];
  rightItems: MatchPairRightItem[];
}

export interface KeylessPredictOutputExercise extends BaseKeylessExercise {
  type: 'predict_output';
  code: string;
  options: string[];
}

export interface KeylessSpotDefectExercise extends BaseKeylessExercise {
  type: 'spot_defect';
  codeLines: string[];
}

export interface KeylessMultiSelectExercise extends BaseKeylessExercise {
  type: 'multi_select';
  options: string[];
}

export type KeylessExercise =
  | KeylessMultipleChoiceExercise
  | KeylessFillBlankTokensExercise
  | KeylessTrueFalseCodeExercise
  | KeylessReorderTokensExercise
  | KeylessMatchPairsExercise
  | KeylessPredictOutputExercise
  | KeylessSpotDefectExercise
  | KeylessMultiSelectExercise;

// Formative exercises bundled with static answer keys for immediate local feedback
export interface FormativeMultipleChoiceExercise extends KeylessMultipleChoiceExercise {
  answerKey: number;
  explanation: string;
}

export interface FormativeFillBlankTokensExercise extends KeylessFillBlankTokensExercise {
  answerKey: number[];
  explanation: string;
}

export interface FormativeTrueFalseCodeExercise extends KeylessTrueFalseCodeExercise {
  answerKey: boolean;
  explanation: string;
}

export interface FormativeReorderTokensExercise extends KeylessReorderTokensExercise {
  answerKey: string[];
  explanation: string;
}

export interface FormativeMatchPairsExercise extends KeylessMatchPairsExercise {
  answerKey: Array<{ leftId: string; rightId: string }>;
  explanation: string;
}

export interface FormativePredictOutputExercise extends KeylessPredictOutputExercise {
  answerKey: number;
  explanation: string;
}

export interface FormativeSpotDefectExercise extends KeylessSpotDefectExercise {
  answerKey: number;
  explanation: string;
}

export interface FormativeMultiSelectExercise extends KeylessMultiSelectExercise {
  answerKey: number[];
  explanation: string;
}

export type ContentExercise =
  | FormativeMultipleChoiceExercise
  | FormativeFillBlankTokensExercise
  | FormativeTrueFalseCodeExercise
  | FormativeReorderTokensExercise
  | FormativeMatchPairsExercise
  | FormativePredictOutputExercise
  | FormativeSpotDefectExercise
  | FormativeMultiSelectExercise;

export interface ContentAtom {
  atomId: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  contentMd: string;
  exercises: ContentExercise[];
}

export interface StaticUnitBundle {
  unitId: string;
  version: number;
  title: string;
  guidebook: string;
  atoms: ContentAtom[];
}

// =============================================================================
// 9. Mentor (§10)
// =============================================================================

export interface MentorCitation {
  key: string;
  value: string;
}

export interface MentorRetrievedAtom {
  atomId: string;
  title: string;
}

export interface MentorMessage {
  messageId: number;
  question: string;
  answer: string;
  mode: 'llm' | 'template';
  citations: MentorCitation[];
  retrievedAtoms?: MentorRetrievedAtom[];
  createdAt: string;
}

export interface SendMentorMessageRequest {
  question: string;
  context?: {
    atomId?: string;
    exerciseId?: string;
    unitId?: string;
  };
}

/** @deprecated Alias for SendMentorMessageRequest */
export type AskMentorRequest = SendMentorMessageRequest;

export interface MentorQuotaResponse {
  usedThisHour: number;
  hourlyLimit: number;
  usedToday: number;
  dailyLimit: number;
  resetsAt: string;
}

/** @deprecated Alias for MentorQuotaResponse */
export interface MentorQuota {
  used: number;
  limit: number;
  resetsAt: string;
}

// =============================================================================
// 10. Advisor & Admin (§11)
// =============================================================================

export interface AdvisorSuppressedCell {
  suppressed: true;
  studentCount: null;
  meanLevel: null;
}

export interface AdvisorSuppressedGapItem {
  skillId?: number;
  skillName: string;
  suppressed: true;
  studentCount: null;
  meanLevel: null;
}

export interface AdvisorVisibleGapItem {
  skillId?: number;
  skillName: string;
  suppressed?: false;
  studentCount: number;
  meanLevel: number;
}

export type CohortGapItem = AdvisorSuppressedGapItem | AdvisorVisibleGapItem;

export interface CohortGapResponse {
  academicYear?: number | null;
  careerId?: number | null;
  careerName?: string | null;
  totalStudents: number;
  gaps: CohortGapItem[];
}

export interface AdvisorSuppressedAtomItem {
  atomId: string;
  atomTitle: string;
  unitId: string;
  unitTitle: string;
  suppressed: true;
  failCount: null;
  failureRate: null;
}

export interface AdvisorVisibleAtomItem {
  atomId: string;
  atomTitle: string;
  unitId: string;
  unitTitle: string;
  suppressed?: false;
  failCount: number;
  failureRate: number;
}

export type CohortAtomItem = AdvisorSuppressedAtomItem | AdvisorVisibleAtomItem;

export interface CohortAtomsResponse {
  unitId?: string | null;
  academicYear?: number | null;
  totalAttempts: number;
  atoms: CohortAtomItem[];
}

export interface CohortGapSummary {
  careerId: number;
  careerName: string;
  meanReadiness: number;
  totalStudents: number;
  topGaps: CohortGapItem[];
}

export interface CohortSummaryResponse {
  totalStudents: number;
  meanReadiness: number;
  activeRoadmapsCount: number;
  topGaps: CohortGapItem[];
  careerSummaries?: CohortGapSummary[];
}

export interface AdvisorStudentItem {
  userId: string;
  email: string;
  academicYear: number;
  targetCareerId?: number | null;
  targetCareerName?: string | null;
  readinessScore: number;
  lastActiveAt?: string | null;
}

export interface StudentListResponse {
  totalCount: number;
  students: AdvisorStudentItem[];
}

export interface ContentPublishJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string | null;
}

export interface ContentReportDto {
  reportId: string;
  atomId?: string;
  exerciseId?: string;
  reason: string;
  text?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// =============================================================================
// 11. Legacy Roadmap Types (@deprecated in v2.0.0+, kept for transition)
// =============================================================================

/** @deprecated Replaced by UnitState and AtomDisplayState in Atomic Roadmap */
export type RoadmapItemStatus = 'pending' | 'in_progress' | 'completed';

/** @deprecated Replaced by PathAtomNode */
export interface RoadmapItemDto {
  itemId: number;
  sequence: number;
  skillId: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  estimatedHours: number;
  status: RoadmapItemStatus;
  primaryResource: LearningResourceDto;
  blockedBy: number[];
}

/** @deprecated Replaced by PathStage */
export interface RoadmapPhaseDto {
  sequence: number;
  title: string;
  estimatedHours: number;
  targetStartDate: string;
  targetEndDate: string;
  items: RoadmapItemDto[];
}

/** @deprecated Replaced by PathResponse */
export interface RoadmapResponse {
  roadmapId: number;
  careerName: string;
  trackName: string;
  hoursPerWeek: number;
  generatedAt: string;
  algorithmVersion: string;
  inputHash: string;
  totalHours: number;
  estimatedWeeks: number;
  estimatedCompletion: string;
  phases: RoadmapPhaseDto[];
}
