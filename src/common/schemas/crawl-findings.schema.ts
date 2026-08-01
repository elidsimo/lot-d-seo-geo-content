// FORMAT PROVISOIRE - à confirmer avec Lot C
import { z } from 'zod';

export const InternalLinkSchema = z.object({
  url: z.string(),
  anchorText: z.string(),
});

export const CrawlFindingsSchema = z.object({
  url: z.string(),
  title: z.string().nullable(),
  metaDescription: z.string().nullable(),
  h1: z.array(z.string()),
  h2: z.array(z.string()),
  internalLinks: z.array(InternalLinkSchema),
});

export type InternalLink = z.infer<typeof InternalLinkSchema>;
export type CrawlFindings = z.infer<typeof CrawlFindingsSchema>;