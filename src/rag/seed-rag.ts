import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { RagService } from './rag.service';

export const SHARED_SEO_GUIDES_CLIENT_ID = 'shared-seo-guides';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ragService = app.get(RagService);

  const seedDir = path.join(__dirname, 'seed-data');
  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.md'));

  console.log(`Indexation de ${files.length} document(s) dans la base documentaire de test...`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(seedDir, file), 'utf-8');
    await ragService.indexDocument(SHARED_SEO_GUIDES_CLIENT_ID, content);
    console.log(`  - ${file} indexe`);
  }

  console.log('Indexation terminee.');
  await app.close();
}

seed().catch((error) => {
  console.error('Erreur lors du seeding RAG :', error);
  process.exit(1);
});