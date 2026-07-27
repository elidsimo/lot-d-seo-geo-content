import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class RagService {
  private pool: Pool;

  constructor(
    private llm: LlmService,
    private config: ConfigService,
  ) {
    this.pool = new Pool({
      connectionString: this.config.get('DATABASE_URL'),
    });
  }

  async indexDocument(clientId: string, texte: string) {
    const embedding = await this.llm.embed(texte);
    await this.pool.query(
      'INSERT INTO documents (client_id, texte, embedding) VALUES ($1, $2, $3)',
      [clientId, texte, JSON.stringify(embedding)],
    );
    return { indexed: true };
  }

  async search(clientId: string, requete: string, limit = 5) {
    const embeddingRecherche = await this.llm.embed(requete);
    const result = await this.pool.query(
      `SELECT texte FROM documents WHERE client_id = $1 ORDER BY embedding <-> $2 LIMIT $3`,
      [clientId, JSON.stringify(embeddingRecherche), limit],
    );
    return result.rows;
  }
}