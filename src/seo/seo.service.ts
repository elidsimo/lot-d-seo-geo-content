import { Injectable } from '@nestjs/common';
import { CrawlFindings } from '../common/schemas/crawl-findings.schema';

@Injectable()
export class SeoService {
  auditPage(findings: CrawlFindings) {
    const problemes: string[] = [];

    if (!findings.title || findings.title.length > 60) {
      problemes.push('Title manquant ou trop long (> 60 caractères)');
    }
    if (!findings.metaDescription) {
      problemes.push('Meta description manquante');
    }
    if (findings.h1.length !== 1) {
      problemes.push('Il doit y avoir exactement un H1');
    }

    return { url: findings.url, problemes };
  }
}