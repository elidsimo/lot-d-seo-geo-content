import { z } from 'zod';
import { CrawlFindingsSchema } from './crawl-findings.schema';

export const CorrectionsRequestSchema = z.object({
  findings: CrawlFindingsSchema,
  pageContent: z.string().min(20).optional(),
});

export type CorrectionsRequest = z.infer<typeof CorrectionsRequestSchema>;