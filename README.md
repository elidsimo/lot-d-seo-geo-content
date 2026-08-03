# Lot D — Agents SEO, GEO & Content

## À propos du projet global

**AI SEO & GEO Automation Platform** est une plateforme SaaS d'optimisation SEO et GEO (Generative Engine Optimization) pilotée par des agents IA collaboratifs. Elle analyse, recommande, génère et applique automatiquement des optimisations sur les sites web des clients, toujours après validation humaine.

L'objectif : réduire le temps consacré aux audits SEO, à la production de contenu et aux optimisations techniques, tout en améliorant la visibilité sur les moteurs de recherche traditionnels et sur les moteurs de réponse basés sur l'IA (ChatGPT, Gemini, Claude, Perplexity...).

Le projet est découpé en 5 lots indépendants :
- **Lot A** — Platform Core, Multi-clients & Modèle économique
- **Lot B** — Frontend Web App
- **Lot C** — Agents Crawl, Technical & Publishing
- **Lot D (ce dépôt)** — Agents SEO, GEO & Content
- **Lot E** — Analytics, Competitor, Visibilité IA, Copilot & Orchestrateur

## À propos du Lot D

Ce lot construit le moteur d'analyse et de génération IA de la plateforme. Il transforme les données brutes de crawl (fournies par le Lot C) en recommandations concrètes et en contenus générés, via 3 agents :

- **SEO Agent** — audit on-page (`auditOnPage`), technique (`auditTechnique`) et maillage interne (`auditInternalLinking`) : analyse les balises (title, meta description, H1), les Core Web Vitals (LCP, CLS, INP), et la structure des liens internes d'un site entier (pages orphelines, diversité et pertinence des ancres). Basé sur des règles, sans appel LLM.
- **GEO Agent** — optimisation pour les moteurs de réponse IA : structure le contenu, évalue et complète les FAQ existantes (`analyzeFaqQuality`), enrichit les entités nommées (`enrichEntities`), adapte le style pour être clair et "citable" par les IA génératives. Basé sur des appels LLM avec sortie JSON validée par Zod.
- **Content Agent** — génère du contenu à la demande : articles, FAQ, pages piliers, avec un ton/style/contraintes récupérés automatiquement par client (`fetchBrandParameters`, actuellement en mode mock — endpoint Lot A non encore documenté).

Ce lot produit aussi les propositions structurées de la fonctionnalité **"Correction automatique"** (`generateCorrectionsForPage`) : il combine les analyses SEO **et** GEO en une liste unique de propositions priorisées (nouveau title, nouvelle meta description, FAQ suggérée, etc.), triées par sévérité décroissante, puis les envoie une par une au Lot A (`postProposalsToHistory`) — chaque échec d'envoi est isolé et ne bloque pas les autres propositions. Le Lot D ne publie jamais rien directement sur un site — cette responsabilité appartient au Lot C.

Un **prototype de RAG SEO** (pgvector) permet d'indexer une base documentaire de bonnes pratiques SEO et de récupérer du contexte pertinent (`retrieveSeoKnowledge`) pour enrichir de futurs prompts LLM.

Toutes les fonctionnalités utilisant le LLM ou une base de données sont couvertes par une suite de **tests automatisés appelant les vraies API** (`npm run test:real`), en plus des tests unitaires et e2e classiques — voir la section "Lancer les tests" ci-dessous.

## Stack technique

- **Framework** : NestJS
- **Validation** : Zod (structure chaque proposition : champ modifié, ancienne valeur, nouvelle valeur, justification, priorité). Les données reçues du Lot C (`crawl-findings`, `technical-report`) et les payloads de toutes les routes sont validés en runtime avec `safeParse()` ; toute donnée invalide est rejetée avec un `400 Bad Request` détaillé
- **IA** : adaptateur LLM générique — le SDK du fournisseur n'est jamais appelé directement dans le code métier
- **Fournisseur LLM utilisé en développement** : Google Gemini (API gratuite)
- **Gestion d'erreur** : filtre d'exception global (`GlobalExceptionFilter`) — réponses HTTP cohérentes pour toute erreur non prévue, sans jamais exposer de stack trace au client
- **Logging** : chaque requête HTTP est loggée (méthode, route, code, durée) via un middleware global
- **Documentation API** : Swagger/OpenAPI généré automatiquement, disponible sur `/api`

## Prérequis

- Node.js et npm installés
- Docker (pour la base PostgreSQL + pgvector utilisée par le prototype RAG)
- Une clé API Gemini gratuite (voir section Configuration ci-dessous)

## Installation

```bash
git clone <url-du-repo>
cd lot-d-seo-geo-content
npm install
```

## Configuration

Copie `.env.example` vers `.env` et renseigne tes propres valeurs :
\`\`\`bash
cp .env.example .env
\`\`\`

> Obtiens une clé Gemini gratuite sur https://aistudio.google.com/ → "Get API key" → "Create API key".

### Base de données (prototype RAG)

Le prototype RAG (`src/rag/`) nécessite une base PostgreSQL avec l'extension `pgvector` :

```bash
docker run --name pgvector-db -e POSTGRES_PASSWORD=ton_mot_de_passe -p 5432:5432 -d ankane/pgvector
docker exec -it pgvector-db psql -U postgres -c "CREATE TABLE documents (id SERIAL PRIMARY KEY, client_id TEXT, texte TEXT, embedding vector(3072));"
```

Une petite base documentaire de test (bonnes pratiques SEO) est fournie dans `src/rag/seed-data/` et peut être indexée automatiquement :

```bash
npm run seed:rag
```

## Lancer le projet

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`.

La documentation interactive Swagger/OpenAPI est disponible sur `http://localhost:3000/api`.

## Endpoints disponibles

### SEO Agent

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/seo/audit/:siteId` | Audit on-page (title, meta description, H1) — renvoie `{ url, score, recommendations }` |
| POST | `/seo/audit-technique/:siteId` | Audit technique (Core Web Vitals, erreurs techniques) — même format de retour |
| POST | `/seo/internal-linking/:siteId` | Audit du maillage interne à l'échelle du site (`{ pages: CrawlFindings[] }` en entrée) — détecte pages orphelines, ancres génériques/peu diversifiées/non pertinentes |

### GEO Agent

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/geo/optimize/:pageId` | Optimisation complète : score, contenu reformulé, suggestions de FAQ, entités, recommandations |
| POST | `/geo/faq-quality/:pageId` | Analyse la FAQ existante : questions manquantes, problèmes de clarté/format |
| POST | `/geo/entities/:pageId` | Extraction et structuration des entités nommées |

### Content Agent

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/content/generate` | Route legacy — génération générique (`{ type, sujet, ton }`) |
| POST | `/content/article` | Génération d'article, ton/style récupérés via `clientId` optionnel |
| POST | `/content/faq` | Génération de FAQ |
| POST | `/content/pillar-page` | Génération de page pilier |

### Correction automatique

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/corrections/propose/:pageUrl` | Combine SEO + GEO (`pageContent` optionnel pour activer le GEO), priorise les propositions, les envoie au Lot A |

### RAG SEO (prototype)

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/rag/index` | Indexe un document (texte + embedding) pour un client donné |
| POST | `/rag/search` | Recherche par similarité sémantique, retourne les documents bruts |
| POST | `/rag/retrieve` | Retourne un contexte déjà formaté, prêt à injecter dans un prompt LLM |

⚠️ `/rag/index` et `/rag/search` sont réservés aux clients dont le plan autorise le RAG (fonctionnalité Premium, CDC section 3) — retournent `403` sinon. `/rag/retrieve` reste accessible à tous

## Tester un endpoint

Crée un fichier `body.json` à la racine (non versionné — voir `.gitignore`) avec un exemple de requête, par exemple pour `/content/generate` :

```json
{"type":"article","sujet":"Le SEO en 2026","ton":"professionnel"}
```

Puis, en PowerShell :

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/content/generate" -Method Post -ContentType "application/json" -InFile "body.json"
```

Exemple pour `/seo/audit/:siteId` (les champs `h1`, `h2` et `internalLinks` sont obligatoires, même vides ; `internalLinks` contient des objets `{ url, anchorText }`) :

```json
{"url":"https://exemple.com/page1","title":"","metaDescription":"","h1":[],"h2":[],"internalLinks":[]}
```

Exemple pour `/geo/optimize/:pageId` :

```json
{"content":"Notre agence propose des services d'optimisation SEO pour les petites entreprises locales."}
```

Exemple pour `/corrections/propose/:pageUrl` (SEO seul, sans `pageContent`) :

```json
{"findings":{"url":"https://exemple.com/page1","title":null,"metaDescription":null,"h1":[],"h2":[],"internalLinks":[]}}
```

Exemple pour `/corrections/propose/:pageUrl` (SEO + GEO combinés) :

```json
{"findings":{"url":"https://exemple.com/page1","title":"Un titre","metaDescription":null,"h1":["ok"],"h2":[],"internalLinks":[]},"pageContent":"Contenu de la page suffisamment long pour l'analyse GEO."}
```

Exemple pour `/rag/retrieve` :

```json
{"query":"Quelle est la longueur idéale pour une meta description ?"}
```

## Lancer les tests

Tests unitaires (services isolés, dépendances mockées) :
```bash
npm run test
```

Tests end-to-end (vraies routes HTTP, dépendances externes mockées) :
```bash
npm run test:e2e
```

Couverture de code :
```bash
npm run test:cov
```

Tests appelant les **vraies** API (Gemini, PostgreSQL — pas de mock), qui remplacent les vérifications manuelles Postman/PowerShell faites au fil du développement :
```bash
npm run test:real
```
⚠️ Nécessite un `.env` valide (clé Gemini), une connexion internet, Docker/PostgreSQL actif, et `npm run seed:rag` déjà exécuté au moins une fois. Plus lent (30s-1min) et non déterministe par nature (dépend des réponses du LLM) — jamais lancé automatiquement avec `npm run test`/`npm run test:e2e`. Fichiers dans `test/real-api/*.real-spec.ts`, config dédiée `test/jest-real.json`.

## Schémas Zod (`src/common/schemas/`)

| Fichier | Rôle |
|---|---|
| `proposition.schema.ts` | Structure une proposition de correction (champ, valeur avant/après, justification, priorité) envoyée au Lot A |
| `crawl-findings.schema.ts` | Structure les findings reçus du Crawl Agent (Lot C) — `internalLinks` en `{ url, anchorText }[]` |
| `internal-linking.schema.ts` | Structure la cartographie multi-pages d'un site pour l'analyse du maillage interne |
| `technical-report.schema.ts` | Structure le rapport technique reçu du Lot C |
| `generated-content.schema.ts` | Structure le contenu généré par le Content Agent (article, FAQ, page pilier) |
| `content-request.schema.ts` | Valide les payloads des routes `/content/*` |
| `geo-result.schema.ts` | Structure les résultats du GEO Agent (score, FAQ, entités, recommandations) |
| `geo-request.schema.ts` | Valide les payloads des routes `/geo/*` |
| `brand-parameters.schema.ts` | Structure le ton/style/contraintes d'un client (format provisoire, Lot A) |
| `corrections-request.schema.ts` | Valide le payload de `/corrections/propose/:pageUrl` |

## Structure du projet

```
src/
  llm/                      # adaptateur LLM générique
  seo/                      # SEO Agent (on-page, technique, maillage interne)
  geo/                      # GEO Agent
  content/                  # Content Agent
  corrections/              # endpoint de correction automatique (combine SEO+GEO)
  rag/                      # prototype RAG SEO + base documentaire de test (seed-data/)
  brand-parameters-client/  # client HTTP vers le Lot A (paramètres de marque, mock)
  history-client/           # client HTTP vers le Lot A (propositions, retry)
  common/
    schemas/                # schémas Zod
    types/                  # types partagés (Recommendation, AuditResult, ...)
    filters/                # filtre d'exception global
    middleware/             # middleware de logging HTTP
test/
  *.e2e-spec.ts             # tests e2e mockes (routes HTTP reelles, dependances mockees)
  real-api/                 # tests appelant les vraies API (npm run test:real)
```

## Règle importante

Le SDK du fournisseur LLM ne doit **jamais** être importé directement dans le code métier (SEO/GEO/Content). Tout appel LLM passe par `LlmService` (`src/llm/llm.service.ts`).

## Fiabilité

- `HistoryClientService` (`src/history-client/`) implémente un retry automatique (3 tentatives, backoff exponentiel) sur l'envoi des propositions au Lot A en mode réel (`MOCK_MODE=false`).
- `BrandParametersClientService` (`src/brand-parameters-client/`) suit le même principe de retry, mais retombe sur des valeurs de marque neutres par défaut en cas d'échec définitif plutôt que de bloquer la génération de contenu.
- `PropositionSchema.champ` est un enum limité (`meta_title`, `meta_description`, `h1`, `h2`, `faq`, `schema_org`, `internal_linking`, `open_graph`, `reecriture`). `CorrectionsService` convertit les types de recommandations SEO et GEO internes vers ces valeurs via des tables de correspondance avant validation Zod.
- `CorrectionsService.postProposalsToHistory()` isole chaque échec d'envoi individuellement : l'échec d'une proposition n'empêche jamais l'envoi des autres.
- Un filtre d'exception global (`src/common/filters/http-exception.filter.ts`) garantit qu'aucune erreur interne (bug, réponse LLM malformée, etc.) n'expose de détail technique au client — tout est loggé côté serveur avec le niveau approprié (`warn` pour les erreurs attendues, `error` pour les erreurs internes).
- `GeoService` (`generateAndValidate`) retente automatiquement une fois un appel LLM si la réponse n'est pas un JSON valide ou ne respecte pas le schéma attendu — le LLM produit parfois un JSON mal formé de façon ponctuelle, ce n'est pas systématique.
- `RagService` implémente `OnModuleDestroy` pour fermer proprement le pool PostgreSQL à l'arrêt de l'application.

## Formats provisoires — à confirmer avec les autres lots

Certains formats de données ont été définis unilatéralement en l'absence de spécification du Lot A ou du Lot C, et sont marqués `// FORMAT PROVISOIRE` dans le code :

- `crawl-findings.schema.ts` et `technical-report.schema.ts` (Lot C)
- `internal-linking.schema.ts` — cartographie multi-pages du site (Lot C)
- `brand-parameters.schema.ts` — endpoint de récupération du ton/style client (Lot A, non documenté dans le CDC)

## Endpoints hors cahier des charges

Quelques routes ont été ajoutées en plus de celles listées dans le CDC (section 5), pour correspondre au découpage des tâches Kanban : `/seo/internal-linking/:siteId`, `/geo/faq-quality/:pageId`, `/geo/entities/:pageId`, `/content/article`, `/content/faq`, `/content/pillar-page`, `/rag/retrieve`. À signaler aux lots B et E qui consomment ces endpoints.


## Guide de prise en main rapide (nouveau stagiaire)

1. Clone le dépôt et installe les dépendances : `npm install`
2. Copie `.env.example` vers `.env`, renseigne ta clé Gemini (gratuite sur https://aistudio.google.com/) et un mot de passe PostgreSQL de ton choix
3. Lance PostgreSQL avec pgvector (voir section "Base de données" ci-dessus)
4. Indexe la base documentaire de test : `npm run seed:rag`
5. Lance le serveur : `npm run start:dev`
6. Ouvre `http://localhost:3000/api` pour explorer tous les endpoints via Swagger
7. Lance `npm run test` puis `npm run test:e2e` pour vérifier que tout fonctionne
8. Consulte `src/common/schemas/` pour comprendre le format exact attendu par chaque route
9. Les fichiers marqués `// FORMAT PROVISOIRE` dépendent de décisions à confirmer avec le Lot A et le Lot C — vérifie s'ils ont été mis à jour avant de t'y fier