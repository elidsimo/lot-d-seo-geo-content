// FORMAT PROVISOIRE - à confirmer avec Lot C
import { z } from 'zod';

export const CrawlFindingsSchema = z.object({
  url: z.string(),
  title: z.string().nullable(),
  metaDescription: z.string().nullable(),
  h1: z.array(z.string()),
  h2: z.array(z.string()),
  internalLinks: z.array(z.string()),
});

export type CrawlFindings = z.infer<typeof CrawlFindingsSchema>;