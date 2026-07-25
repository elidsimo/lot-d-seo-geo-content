# Lot D — Agents SEO, GEO & Content

Ce dépôt contient le code du **Lot D** de la plateforme AI SEO & GEO Automation Platform : les agents IA responsables de l'analyse SEO/GEO et de la génération de contenu.

## À propos du projet

Le projet global est découpé en 5 lots indépendants :
- **Lot A** — Platform Core, Multi-clients & Modèle économique
- **Lot B** — Frontend Web App
- **Lot C** — Agents Crawl, Technical & Publishing
- **Lot D (ce dépôt)** — Agents SEO, GEO & Content
- **Lot E** — Analytics, Competitor, Visibilité IA, Copilot & Orchestrateur

Ce lot construit 3 agents :
- **SEO Agent** — audit on-page/technique (balises, maillage interne)
- **GEO Agent** — optimisation pour les moteurs de réponse IA (FAQ, entités, structuration)
- **Content Agent** — génération d'articles, FAQ, pages piliers

Et produit les propositions structurées de la fonctionnalité **"Correction automatique"**, envoyées au Lot A pour validation humaine (jamais publiées directement).

## Stack technique

- **Framework** : NestJS
- **Validation** : Zod
- **IA** : adaptateur LLM générique (aucun appel direct au SDK fournisseur dans le code métier)
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

## Tester un endpoint

Crée un fichier `body.json` à la racine (non versionné) avec un exemple de requête, par exemple :

```json
{"type":"article","sujet":"Le SEO en 2026","ton":"professionnel"}
```

Puis, en PowerShell :

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/content/generate" -Method Post -ContentType "application/json" -InFile "body.json"
```

## État d'avancement

- [x] **Phase 1** — Setup du projet NestJS, structure des dossiers, dépendances
- [x] **Phase 2** — Adaptateur LLM générique (`src/llm/`), connecté à Google Gemini, testé et fonctionnel sur `/content/generate`
- [ ] **Phase 3** — Schémas Zod (findings, rapport technique, proposition, contenu généré)
- [ ] **Phase 4** — SEO Agent
- [ ] **Phase 5** — GEO Agent
- [ ] **Phase 6** — Content Agent (endpoint créé en Phase 2 pour tester le LLM, logique métier à finaliser en Phase 6)
- [ ] **Phase 7** — Endpoint de correction automatique
- [ ] **Phase 8** — Prototype RAG SEO
- [ ] **Phase 9** — Tests
- [ ] **Phase 10** — Intégration avec les autres lots

## Structure du projet

```
src/
  llm/            # adaptateur LLM générique (Phase 2 — fait)
  seo/            # SEO Agent (à venir)
  geo/            # GEO Agent (à venir)
  content/        # Content Agent (à venir)
  corrections/    # endpoint de correction automatique (à venir)
  rag/            # prototype RAG SEO (à venir)
  common/
    schemas/      # schémas Zod (à venir)
    types/
  history-client/ # client HTTP vers le Lot A (à venir)
```

## Règle importante

Le SDK du fournisseur LLM ne doit **jamais** être importé directement dans le code métier (SEO/GEO/Content). Tout appel LLM passe par `LlmService` (`src/llm/llm.service.ts`).

## Collaboration avec les autres lots

- **Lot A** : ce lot enverra ses propositions via `POST /history`, format à confirmer
- **Lot C** : ce lot consommera les findings de crawl et le rapport technique, format actuellement provisoire (voir commentaires `FORMAT PROVISOIRE` dans le code une fois la Phase 3 réalisée)
- **Lot B** : les schémas Zod des propositions seront partagés une fois la Phase 3 terminée
- **Lot E** : la documentation des endpoints sera partagée une fois tous les agents finalisés
-