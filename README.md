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

- **SEO Agent** — audit on-page et technique : analyse les balises (title, meta description, Hn) et le maillage interne d'une page, détecte les problèmes
- **GEO Agent** — optimisation pour les moteurs de réponse IA : structure le contenu, améliore les FAQ, enrichit les entités nommées, adapte le style pour être clair et "citable" par les IA génératives
- **Content Agent** — génère du contenu à la demande : articles, FAQ, pages piliers, avec un ton adapté à chaque client

Ce lot produit aussi les propositions structurées de la fonctionnalité **"Correction automatique"** : il combine les analyses SEO/GEO en une liste de propositions concrètes (nouveau title, nouvelle meta description, etc.), envoyées au Lot A pour apparaître dans l'écran de validation humaine. Le Lot D ne publie jamais rien directement sur un site — cette responsabilité appartient au Lot C.

## Stack technique

- **Framework** : NestJS
- **Validation** : Zod (structure chaque proposition : champ modifié, ancienne valeur, nouvelle valeur, justification)
- **IA** : adaptateur LLM générique — le SDK du fournisseur n'est jamais appelé directement dans le code métier
- **Fournisseur LLM utilisé en développement** : Google Gemini (API gratuite)

## Prérequis

- Node.js et npm installés
- Une clé API Gemini gratuite (voir section Configuration ci-dessous)

## Installation

```bash
git clone <url-du-repo>
cd lot-d-seo-geo-content
npm install
```

## Configuration

Crée un fichier `.env` à la racine du projet (non versionné, à créer soi-même) :

```
LLM_PROVIDER_API_KEY=ta_cle_gemini_ici
LLM_PROVIDER_BASE_URL=https://generativelanguage.googleapis.com/v1beta
LOT_A_HISTORY_ENDPOINT=http://localhost:3001/history
MOCK_MODE=true
```

> Obtiens une clé Gemini gratuite sur https://aistudio.google.com/ → "Get API key" → "Create API key".

## Lancer le projet

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`.

## Endpoints disponibles

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/seo/audit/:siteId` | Audit SEO on-page (title, meta description, H1) |
| POST | `/geo/optimize/:pageId` | Optimisation du contenu pour les moteurs de réponse IA |
| POST | `/content/generate` | Génération de contenu (article, faq, pillar_page) |
| POST | `/corrections/propose/:pageUrl` | Combine SEO Agent + envoi des propositions au Lot A (mode mock actif) |

## Tester un endpoint

Crée un fichier `body.json` à la racine (non versionné) avec un exemple de requête, par exemple pour `/content/generate` :

```json
{"type":"article","sujet":"Le SEO en 2026","ton":"professionnel"}
```

Puis, en PowerShell :

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/content/generate" -Method Post -ContentType "application/json" -InFile "body.json"
```

Adapte le nom du fichier body et l'URL selon l'endpoint testé. Exemple pour `/corrections/propose/:pageUrl` :

```json
{"findings":{"url":"https://exemple.com/page1","title":null,"metaDescription":null,"h1":[],"h2":[],"internalLinks":[]}}
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/corrections/propose/exemple-page1" -Method Post -ContentType "application/json" -InFile "body-corrections.json"
```

## Lancer les tests

```bash
npm run test
```

## Schémas Zod (`src/common/schemas/`)

| Fichier | Rôle |
|---|---|
| `proposition.schema.ts` | Structure une proposition de correction (champ, valeur avant/après, justification) envoyée au Lot A |
| `crawl-findings.schema.ts` | Structure les findings reçus du Crawl Agent (Lot C) |
| `technical-report.schema.ts` | Structure le rapport technique reçu du Lot C |
| `generated-content.schema.ts` | Structure le contenu généré par le Content Agent (article, FAQ, page pilier) |

## Structure du projet

```
src/
  llm/            # adaptateur LLM générique
  seo/            # SEO Agent
  geo/            # GEO Agent
  content/        # Content Agent
  corrections/    # endpoint de correction automatique
  rag/            # prototype RAG SEO
  common/
    schemas/      # schémas Zod
    types/
  history-client/ # client HTTP vers le Lot A
```

## Règle importante

Le SDK du fournisseur LLM ne doit **jamais** être importé directement dans le code métier (SEO/GEO/Content). Tout appel LLM passe par `LlmService` (`src/llm/llm.service.ts`).