import { CrawlFindings } from '../../src/common/schemas/crawl-findings.schema';
import { TechnicalReport } from '../../src/common/schemas/technical-report.schema';

interface ProblemProfile {
  name: string;
  build: (index: number) => Partial<CrawlFindings>;
}

const GOOD_TITLE = (topic: string) => `Guide complet sur ${topic} pour les professionnels`;
const GOOD_META = (topic: string) =>
  `Découvrez notre guide détaillé sur ${topic}, avec des conseils pratiques et des exemples concrets pour votre activité.`;

const TOPICS = [
  'le SEO local', 'le maillage interne', 'les Core Web Vitals', 'la meta description',
  'les balises title', 'le contenu evergreen', 'le netlinking', 'la recherche de mots-cles',
  "l'audit technique", 'la structure Hn', 'le GEO', 'les FAQ enrichies',
];

// variété de problèmes 
const PROFILES: ProblemProfile[] = [
  {
    name: 'perfect',
    build: (i) => ({
      title: GOOD_TITLE(TOPICS[i % TOPICS.length]),
      metaDescription: GOOD_META(TOPICS[i % TOPICS.length]),
      h1: [GOOD_TITLE(TOPICS[i % TOPICS.length])],
      h2: ['Introduction', 'Bonnes pratiques', 'Conclusion'],
    }),
  },
  { name: 'missing_title', build: () => ({ title: null }) },
  {
    name: 'title_too_long',
    build: (i) => ({
      title: `${GOOD_TITLE(TOPICS[i % TOPICS.length])} - Le guide ultime et complet pour tous les niveaux en 2026`,
    }),
  },
  { name: 'title_too_short', build: () => ({ title: 'SEO' }) },
  { name: 'missing_meta', build: () => ({ metaDescription: null }) },
  {
    name: 'meta_too_long',
    build: (i) => ({
      metaDescription: `${GOOD_META(TOPICS[i % TOPICS.length])} ${GOOD_META(TOPICS[(i + 1) % TOPICS.length])}`,
    }),
  },
  { name: 'missing_h1', build: () => ({ h1: [] }) },
  {
    name: 'multiple_h1',
    build: (i) => ({ h1: [GOOD_TITLE(TOPICS[i % TOPICS.length]), 'Autre titre principal'] }),
  },
  {
    name: 'title_special_chars',
    build: (i) => ({ title: `<${GOOD_TITLE(TOPICS[i % TOPICS.length])}>` }),
  },
];

export function generateCrawlFixtures(count: number): CrawlFindings[] {
  const pages: CrawlFindings[] = [];

  for (let i = 0; i < count; i++) {
    const profile = PROFILES[i % PROFILES.length];
    const topic = TOPICS[i % TOPICS.length];
    const base: CrawlFindings = {
      url: `https://exemple-site.com/page-${i}`,
      title: GOOD_TITLE(topic),
      metaDescription: GOOD_META(topic),
      h1: [GOOD_TITLE(topic)],
      h2: ['Introduction', 'Bonnes pratiques', 'Conclusion'],
      internalLinks: [],
    };
    pages.push({ ...base, ...profile.build(i) } as CrawlFindings);
  }

  const orphanIndexes = new Set<number>();
  for (let i = 0; i < count; i += 20) {
    orphanIndexes.add(i);
  }

  for (let i = 0; i < count; i++) {
    const nextIndex = (i + 1) % count;
    if (orphanIndexes.has(nextIndex)) {
      continue;
    }
    const anchorText =
      i % 2 === 0
        ? `en savoir plus sur ${TOPICS[nextIndex % TOPICS.length]}`
        : 'cliquez ici';
    pages[i].internalLinks = [{ url: pages[nextIndex].url, anchorText }];
  }

  return pages;
}

export function generateTechnicalReportFixtures(count: number): TechnicalReport[] {
  const reports: TechnicalReport[] = [];

  for (let i = 0; i < count; i++) {
    const bucket = i % 4;
    const lcp = bucket === 0 ? 1800 : bucket === 1 ? 3200 : bucket === 2 ? 4500 : 2200;
    const cls = bucket === 0 ? 0.05 : bucket === 1 ? 0.15 : bucket === 2 ? 0.3 : 0.08;
    const inp = bucket === 0 ? 150 : bucket === 1 ? 250 : bucket === 2 ? 600 : 180;

    reports.push({
      url: `https://exemple-site.com/page-${i}`,
      coreWebVitals: { lcp, cls, inp },
      erreursTechniques: bucket === 2 ? ['Lien casse detecte (404)'] : [],
    });
  }

  return reports;
}