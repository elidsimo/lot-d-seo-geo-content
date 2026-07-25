// FORMAT PROVISOIRE - à confirmer avec Lot C
import { z } from 'zod';

export const TechnicalReportSchema = z.object({
  url: z.string(),
  coreWebVitals: z.object({
    lcp: z.number(),
    cls: z.number(),
    inp: z.number(),
  }),
  erreursTechniques: z.array(z.string()),
});

export type TechnicalReport = z.infer<typeof TechnicalReportSchema>;