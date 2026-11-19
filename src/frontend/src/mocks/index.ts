import authMock from './auth.json' with { type: 'json' };
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

import type {
  AuthResponse,
  StudentProfile,
  SkillClaim,
  ProfileCompleteness,
  SkillDto,
  CareerDto,
  CareerRecommendationResponse,
  GapAnalysisResponse,
  SystemMetaResponse,
  PathResponse,
  PathUnitDetail,
  GameSummaryResponse,
  ReviewsDueResponse,
} from '../types/api.ts';

export const mockAuth: AuthResponse = authMock as unknown as AuthResponse;
export const mockProfile: StudentProfile = profileMock as StudentProfile;
export const mockProfileSkills: SkillClaim[] = profileSkillsMock as SkillClaim[];
export const mockProfileCompleteness: ProfileCompleteness =
  profileCompletenessMock as ProfileCompleteness;
export const mockSkillsCatalogue: SkillDto[] = skillsCatalogueMock as SkillDto[];
export const mockCareers: CareerDto[] = careersMock as CareerDto[];
export const mockRecommendations: CareerRecommendationResponse =
  recommendationsMock as unknown as CareerRecommendationResponse;
export const mockGapAnalysis: GapAnalysisResponse =
  gapAnalysisMock as unknown as GapAnalysisResponse;
export const mockMeta: SystemMetaResponse = metaMock as SystemMetaResponse;
export const mockPath: PathResponse = pathMock as PathResponse;
export const mockUnitDetail: PathUnitDetail = unitDetailMock as PathUnitDetail;
export const mockGameSummary: GameSummaryResponse = gameSummaryMock as GameSummaryResponse;
export const mockReviewsDue: ReviewsDueResponse = reviewsDueMock as ReviewsDueResponse;

export const mocks = {
  auth: mockAuth,
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
};

export default mocks;
