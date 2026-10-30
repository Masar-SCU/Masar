import authMock from './auth.json' with { type: 'json' };
import profileMock from './profile.json' with { type: 'json' };
import profileSkillsMock from './profile-skills.json' with { type: 'json' };
import profileCompletenessMock from './profile-completeness.json' with { type: 'json' };
import skillsCatalogueMock from './skills-catalogue.json' with { type: 'json' };
import careersMock from './careers.json' with { type: 'json' };
import recommendationsMock from './recommendations.json' with { type: 'json' };
import gapAnalysisMock from './gap-analysis.json' with { type: 'json' };

import type {
  AuthResponse,
  StudentProfile,
  SkillClaim,
  ProfileCompleteness,
  SkillDto,
  CareerDto,
  CareerRecommendationResponse,
  GapAnalysisResponse,
} from '../types/api.ts';

export const mockAuth: AuthResponse = authMock as unknown as AuthResponse;
export const mockProfile: StudentProfile = profileMock as StudentProfile;
export const mockProfileSkills: SkillClaim[] = profileSkillsMock as SkillClaim[];
export const mockProfileCompleteness: ProfileCompleteness = profileCompletenessMock as ProfileCompleteness;
export const mockSkillsCatalogue: SkillDto[] = skillsCatalogueMock as SkillDto[];
export const mockCareers: CareerDto[] = careersMock as CareerDto[];
export const mockRecommendations: CareerRecommendationResponse =
  recommendationsMock as unknown as CareerRecommendationResponse;
export const mockGapAnalysis: GapAnalysisResponse = gapAnalysisMock as unknown as GapAnalysisResponse;

export const mocks = {
  auth: mockAuth,
  profile: mockProfile,
  skills: mockProfileSkills,
  completeness: mockProfileCompleteness,
  catalogue: mockSkillsCatalogue,
  careers: mockCareers,
  recommendations: mockRecommendations,
  gapAnalysis: mockGapAnalysis,
};

export default mocks;
