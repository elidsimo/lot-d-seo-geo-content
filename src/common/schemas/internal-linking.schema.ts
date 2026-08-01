// FORMAT PROVISOIRE - à confirmer avec Lot C

import { z } from 'zod';
import { CrawlFindingsSchema } from './crawl-findings.schema';

export const SiteCrawlSchema = z.object({
  pages: z.array(CrawlFindingsSchema).min(1, 'Au moins une page est requise'),
});

export type SiteCrawl = z.infer<typeof SiteCrawlSchema>;