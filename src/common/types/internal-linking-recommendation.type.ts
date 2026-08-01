import { Recommendation } from './recommendation.type';

export type InternalLinkingRecommendation = Recommendation & {
  page: string;
};

export interface InternalLinkingAuditResult {
  score: number;
  recommendations: InternalLinkingRecommendation[];
}
