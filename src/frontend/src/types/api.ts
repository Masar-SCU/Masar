/**
 * Masar API Contract Type Definitions (v2.0.0)
 *
 * Single Source of Truth: docs/07-api-contract.md
 * Status: Revised 2026-11-15 (Atomic Roadmap + Gamification + Defect Fixes)
 * Casing: All JSON properties follow camelCase network format.
 */

// =============================================================================
// 1. Common Conventions & RFC Error Envelopes (§1, §2)
// =============================================================================

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_UNMET'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DEPENDENCY_UNAVAILABLE';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode | string;
  message: string;
  details?: ApiErrorDetail[];
  correlationId?: string;
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// =============================================================================
// 2. Metadata and System Status (§3)
// =============================================================================

export interface SystemMetaResponse {
  contractVersion: string;
  contentVersion: number;
  algorithmVersion: string;
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

export interface RefreshTokenRequest {
  refreshToken?: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface VerifyEmailRequest {
  token: string;
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
  refreshToken?: string;
  expiresIn: number;
  /** @deprecated Kept for backwards compatibility with legacy client callers */
  expiresInSeconds?: number;
  role: UserRole;
  user?: AuthUser;
}

// =============================================================================
// 4. Profile & Skills (§5)
// =============================================================================

export interface StudentProfile {
  userId: string;
  email: string;
  academicYear: number;
  hoursPerWeek: number;
  dailyGoalMinutes?: number;
  timezone?: string;
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
  dailyGoalMinutes?: number;
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

export interface UpdateConsentRequest {
  advisorVisibility: boolean;
  researchUse: boolean;
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

export interface CareerDto {
  careerId: number;
  name: string;
  summary: string;
  tracks: TrackDto[];
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
// 6. Assessment, Placement and Recommendations (§7)
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
  answers: { questionId: number; value: number }[];
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

export type RecommendationMode = 'model-first' | 'fallback';

export interface CareerRecommendationResponse {
  mode: RecommendationMode;
  recommendations: CareerRecommendation[];
}

export interface SetTargetCareerRequest {
  careerId: number;
  trackId: number;
}

export interface PlacementSessionResponse {
  sessionId: string;
  skillId: number;
  skillName: string;
  firstQuestion: {
    questionId: string;
    prompt: string;
    codeSnippet?: string;
    options: string[];
  };
}

export interface PlacementAnswerRequest {
  answerIndex: number;
}

export interface PlacementAnswerResponse {
  isFinal: boolean;
  verifiedLevel?: number;
  nextQuestion?: {
    questionId: string;
    prompt: string;
    codeSnippet?: string;
    options: string[];
  };
}

// =============================================================================
// 7. Atomic Roadmap, Path, Lessons and Mastery (v2.0.0, §8)
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

export interface PathUnitSummary {
  unitId: string;
  slug: string;
  title: string;
  state: UnitState;
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

export type AtomMasteryState = 'locked' | 'available' | 'learned' | 'shaky' | 'assumed';

export interface PathAtomNode {
  atomId: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  state: AtomMasteryState;
  prerequisites: string[];
}

export interface PathUnitDetail {
  unitId: string;
  slug: string;
  title: string;
  state: UnitState;
  atoms: PathAtomNode[];
  checkpointState: CheckpointState;
}

export interface UpdatePathModeRequest {
  mode: PathMode;
}

export type LessonSessionKind = 'lesson' | 'review' | 'checkpoint' | 'placement';

export interface CreateLessonSessionRequest {
  kind: LessonSessionKind;
  atomId?: string;
  unitId?: string;
}

export interface CreateLessonSessionResponse {
  sessionId: string;
  contentVersion: number;
}

export interface LessonAttemptItem {
  exerciseId: string;
  attemptNo: number;
  selected: number | number[] | string | string[] | boolean;
  msTaken: number;
}

export interface CompleteLessonSessionRequest {
  idempotencyKey?: string;
  attempts: LessonAttemptItem[];
}

export interface LessonSessionCompletionResponse {
  accuracy: number;
  xp: {
    base: number;
    bonus: number;
    totalAwarded: number;
  };
  atomState: AtomMasteryState;
  streak: {
    current: number;
    extendedToday: boolean;
  };
  readiness: {
    before: number;
    after: number;
    delta: number;
  };
  newlyUnlockedAtoms: string[];
  achievements: string[];
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
  previousState: AtomMasteryState;
  newState: AtomMasteryState;
  recalculatedReadiness: number;
}

export interface GameSummaryResponse {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  freezeActiveToday: boolean;
  dailyGoalMinutes: 10 | 20 | 30 | 45 | 60;
  dailyGoalMetToday: boolean;
}

export interface UpdateDailyGoalRequest {
  dailyGoalMinutes: 10 | 20 | 30 | 45 | 60;
}

export interface ExamPauseRequest {
  until: string; // ISO date format YYYY-MM-DD
}

export interface CreateContentReportRequest {
  atomId?: string;
  exerciseId?: string;
  reason: string;
  text?: string;
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
  | 'predict_output';

export interface MultipleChoiceExercise {
  exerciseId: string;
  type: 'multiple_choice';
  prompt: string;
  options: string[];
  answerKey?: number;
  explanation?: string;
}

export interface FillBlankTokensExercise {
  exerciseId: string;
  type: 'fill_blank_tokens';
  prompt: string;
  codeTemplate: string;
  tokens: string[];
  answerKey?: string[];
  explanation?: string;
}

export interface TrueFalseCodeExercise {
  exerciseId: string;
  type: 'true_false_code';
  prompt: string;
  code: string;
  answerKey?: boolean;
  explanation?: string;
}

export interface ReorderTokensExercise {
  exerciseId: string;
  type: 'reorder_tokens';
  prompt: string;
  tokens: string[];
  answerKey?: string[];
  explanation?: string;
}

export interface MatchPairItem {
  left: string;
  right: string;
}

export interface MatchPairsExercise {
  exerciseId: string;
  type: 'match_pairs';
  prompt: string;
  pairs: MatchPairItem[];
  explanation?: string;
}

export interface PredictOutputExercise {
  exerciseId: string;
  type: 'predict_output';
  prompt: string;
  code: string;
  options: string[];
  answerKey?: number;
  explanation?: string;
}

export type ContentExercise =
  | MultipleChoiceExercise
  | FillBlankTokensExercise
  | TrueFalseCodeExercise
  | ReorderTokensExercise
  | MatchPairsExercise
  | PredictOutputExercise;

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

export interface AskMentorRequest {
  question: string;
}

export interface MentorQuota {
  used: number;
  limit: number;
  resetsAt: string;
}

// =============================================================================
// 10. Advisor & Admin (§11)
// =============================================================================

export interface CohortGapItem {
  skillName: string;
  studentCount: number;
}

export interface CohortGapSummary {
  careerId: number;
  careerName: string;
  meanReadiness: number;
  totalStudents: number;
  topGaps: CohortGapItem[];
}

// =============================================================================
// 11. Legacy Roadmap Types (@deprecated in v2.0.0, kept for backwards compatibility)
// =============================================================================

/** @deprecated Replaced by UnitState in Atomic Roadmap v2.0.0 */
export type RoadmapItemStatus = 'pending' | 'in_progress' | 'completed';

/** @deprecated Replaced by PathAtomNode in Atomic Roadmap v2.0.0 */
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

/** @deprecated Replaced by PathStage in Atomic Roadmap v2.0.0 */
export interface RoadmapPhaseDto {
  sequence: number;
  title: string;
  estimatedHours: number;
  targetStartDate: string;
  targetEndDate: string;
  items: RoadmapItemDto[];
}

/** @deprecated Replaced by PathResponse in Atomic Roadmap v2.0.0 */
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
