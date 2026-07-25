import { PropositionSchema } from './proposition.schema';

describe('PropositionSchema', () => {
  it('valide une proposition correcte', () => {
    const result = PropositionSchema.safeParse({
      champ: 'meta_title',
      valeurAvant: 'Ancien titre',
      valeurApres: 'Nouveau titre optimisé',
      justification: 'Le titre dépassait 60 caractères',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un champ invalide', () => {
    const result = PropositionSchema.safeParse({
      champ: 'champ_inexistant',
      valeurAvant: null,
      valeurApres: 'x',
      justification: 'x',
    });
    expect(result.success).toBe(false);
  });
});