import { z } from 'zod';
// FORMAT PROVISOIRE - à confirmer avec le Lot A


export const BrandParametersSchema = z.object({
  ton: z.string(),
  style: z.string(),
  contraintes: z.array(z.string()).default([]),
});

export type BrandParameters = z.infer<typeof BrandParametersSchema>;