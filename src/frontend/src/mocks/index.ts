import authMock from './auth.json' with { type: 'json' };
import registerMock from './register.json' with { type: 'json' };
import profileMock from './profile.json' with { type: 'json' };
import profileSkillsMock from './profile-skills.json' with { type: 'json' };
import profileCompletenessMock from './profile-completeness.json' with { type: 'json' };
import skillsCatalogueMock from './skills-catalogue.json' with { type: 'json' };
import careersMock from './careers.json' with { type: 'json' };
import recommendationsMock from './recommendations.json' with { type: 'json' };
import gapAnalysisMock from './gap-analysis.json' with { type: 'json' };
import metaMock from './meta.json' with { type: 'json' };
import pathMock from './path.json' with { type: 'json' };
import unitDetailMock from './unit-detail.json' with { type: 'json' };
import gameSummaryMock from './game-summary.json' with { type: 'json' };
import reviewsDueMock from './reviews-due.json' with { type: 'json' };
import projectsMock from './projects.json' with { type: 'json' };
import pathPreferencesMock from './path-preferences.json' with { type: 'json' };
import notificationsMock from './notifications.json' with { type: 'json' };

import type {
  AuthResponse,
  RegisterResponse,
  StudentProfile,
  SkillClaim,
  ProfileCompleteness,
  SkillDto,
  CareerDto,
  RecommendationResponseDto,
  GapAnalysisResponse,
  SystemMetaResponse,
  PathResponse,
  PathUnitDetail,
  GameSummaryResponse,
  ReviewsDueResponse,
  StudentProjectDto,
  PathPreferences,
  NotificationPreferences,
} from '../types/api.ts';

export const mockAuth: AuthResponse = authMock as unknown as AuthResponse;
export const mockRegister: RegisterResponse = registerMock as RegisterResponse;
export const mockProfile: StudentProfile = profileMock as StudentProfile;
export const mockProfileSkills: SkillClaim[] = profileSkillsMock as SkillClaim[];
export const mockProfileCompleteness: ProfileCompleteness =
  profileCompletenessMock as ProfileCompleteness;
export const mockSkillsCatalogue: SkillDto[] = skillsCatalogueMock as SkillDto[];
export const mockCareers: CareerDto[] = careersMock as CareerDto[];
export const mockRecommendations: RecommendationResponseDto =
  recommendationsMock as unknown as RecommendationResponseDto;
export const mockGapAnalysis: GapAnalysisResponse =
  gapAnalysisMock as unknown as GapAnalysisResponse;
export const mockMeta: SystemMetaResponse = metaMock as SystemMetaResponse;
export const mockPath: PathResponse = pathMock as PathResponse;
export const mockUnitDetail: PathUnitDetail = unitDetailMock as PathUnitDetail;
export const mockGameSummary: GameSummaryResponse = gameSummaryMock as GameSummaryResponse;
export const mockReviewsDue: ReviewsDueResponse = reviewsDueMock as ReviewsDueResponse;
export const mockProjects: StudentProjectDto[] = projectsMock as StudentProjectDto[];
export const mockPathPreferences: PathPreferences = pathPreferencesMock as PathPreferences;
export const mockNotifications: NotificationPreferences =
  notificationsMock as NotificationPreferences;

export const mocks = {
  auth: mockAuth,
  register: mockRegister,
  profile: mockProfile,
  skills: mockProfileSkills,
  completeness: mockProfileCompleteness,
  catalogue: mockSkillsCatalogue,
  careers: mockCareers,
  recommendations: mockRecommendations,
  gapAnalysis: mockGapAnalysis,
  meta: mockMeta,
  path: mockPath,
  unitDetail: mockUnitDetail,
  gameSummary: mockGameSummary,
  reviewsDue: mockReviewsDue,
  projects: mockProjects,
  pathPreferences: mockPathPreferences,
  notifications: mockNotifications,
};

export default mocks;
