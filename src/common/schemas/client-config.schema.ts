// FORMAT PROVISOIRE - à confirmer avec le Lot A
import { z } from 'zod';

export const ClientConfigSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']),
  ragEnabled: z.boolean(),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;