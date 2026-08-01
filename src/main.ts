import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Lot D - SEO, GEO & Content Agents')
    .setDescription(
      "API des agents IA d'analyse et de génération (SEO Agent, GEO Agent, Content Agent) et de la correction automatique — AI SEO & GEO Automation Platform",
    )
    .setVersion('1.0')
    .addTag('seo', 'Audit SEO on-page et technique')
    .addTag('geo', 'Optimisation pour les moteurs de réponse IA')
    .addTag('content', 'Génération de contenu (articles, FAQ, pages piliers)')
    .addTag('corrections', 'Propositions de correction automatique')
    .addTag('rag', 'Prototype RAG SEO')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();