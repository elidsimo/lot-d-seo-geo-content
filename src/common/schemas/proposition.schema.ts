import { z } from 'zod';

export const PropositionSchema = z.object({
  champ: z.enum([
    'meta_title',
    'meta_description',
    'h1',
    'h2',
    'faq',
    'schema_org',
    'internal_linking',
    'open_graph',
    'reecriture',
  ]),
  valeurAvant: z.string().nullable(),
  valeurApres: z.string(),
  justification: z.string(),
});

export type Proposition = z.infer<typeof PropositionSchema>;