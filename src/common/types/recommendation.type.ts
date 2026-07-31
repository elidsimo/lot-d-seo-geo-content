export type Severity = 'low' | 'medium' | 'high';

export interface Recommendation {
  type: string;
  severity: Severity;
  message: string;
  suggestion: string;
}

export interface AuditResult {
  url: string;
  score: number;
  recommendations: Recommendation[];
}