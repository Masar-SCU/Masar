/**
 * Masar API Contract Type Definitions (v1)
 *
 * Single Source of Truth: docs/07-api-contract.md
 * Status: Frozen at Slice 0
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
// 2. Authentication (§3)
// =============================================================================

export type UserRole = 'student' | 'advisor' | 'admin';

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
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
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
  refreshToken: string;
  expiresInSeconds: number;
  role: UserRole;
  user?: AuthUser;
}

// =============================================================================
// 3. Profile & Skills (§4)
// =============================================================================

export interface StudentProfile {
  userId: string;
  email: string;
  academicYear: number;
  hoursPerWeek: number;
  careerGoalText: string;
  interests: string[];
  advisorVisibility?: boolean;
  researchUse?: boolean;
}

export interface UpdateProfileRequest {
  academicYear: number;
  hoursPerWeek: number;
  careerGoalText: string;
  interests: string[];
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
// 4. Catalogue (§5)
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
// 5. Assessment and Recommendations (§6)
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

export interface CareerRecommendation {
  careerId: number;
  name: string;
  matchScore: number;
  breakdown: { constraintStatus: string };
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

export interface CalibrationCandidateDto {
  skillId: number;
  canonicalName: string;
  selfLevel: number;
  reason: string;
}

export interface QuizItemDto {
  itemId: number;
  question: string;
  options: string[];
}

export interface QuizSubmitRequest {
  answers: { itemId: number; selectedOption: number }[];
}

export interface QuizSubmitResponse {
  skillId: number;
  calibratedLevel: number;
  score: number;
}

// =============================================================================
// 6. Gap Analysis, Readiness & Roadmap (§7)
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
  postingFrequency: number;
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

export interface ReadinessSnapshot {
  score: number;
  computedAt: string;
  trigger?: string;
}

export type RoadmapItemStatus = 'pending' | 'in_progress' | 'completed';

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

export interface RoadmapPhaseDto {
  sequence: number;
  title: string;
  estimatedHours: number;
  targetStartDate: string;
  targetEndDate: string;
  items: RoadmapItemDto[];
}

export interface RoadmapCapstoneDto {
  projectId: number;
  title: string;
  estimatedHours: number;
  coveredGapSkills: string[];
}

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
  capstone: RoadmapCapstoneDto;
}

export interface UpdateRoadmapItemStatusRequest {
  status: RoadmapItemStatus;
}

// =============================================================================
// 7. Mentor (§8)
// =============================================================================

export interface MentorCitation {
  key: string;
  value: string;
}

export interface MentorMessage {
  messageId: number;
  question: string;
  answer: string;
  mode: 'llm' | 'template';
  citations: MentorCitation[];
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
// 8. Advisor & Admin (§9)
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
