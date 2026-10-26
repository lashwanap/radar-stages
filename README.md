# Radar à Stages

App web qui t'aide à trouver un stage : tu importes ton CV, l'app en tire ton profil, cherche des offres et les classe selon leur correspondance avec ton CV et le domaine que tu vises.

## Ce que fait l'app

1. **Lit ton CV** (PDF, DOCX ou texte) et en extrait compétences, langues, niveau d'études et intitulés de stage à chercher.
2. **Cherche des offres** automatiquement via l'API JSearch (qui agrège Indeed, LinkedIn, Glassdoor… par Google Emplois), ou t'ouvre Indeed, LinkedIn, Jobillico, Guichet-Emplois, Welcome to the Jungle, etc. avec la bonne recherche.
3. **Note chaque offre de 0 à 100** : compétences qui collent, compétences manquantes, et un conseil pour postuler.
4. **Filtre et trie** par score minimum ou par date.

Tes offres et ton profil restent dans ton navigateur (localStorage).

## Installation

Il faut [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
cp .env.example .env
```

Remplis ensuite `.env` :

| Variable | À quoi elle sert | Où l'obtenir |
|---|---|---|
| `ANTHROPIC_API_KEY` | Analyse du CV et notation des offres par Claude | https://console.anthropic.com |
| `JSEARCH_API_KEY` | Recherche automatique d'offres de stage (Canada, France, Belgique, Suisse) | https://www.openwebninja.com/api/jsearch : crée un compte et copie ta clé API (`ak_…`) |

Les deux sont facultatives. Sans clé Claude, la notation se fait par mots-clés. Sans clé JSearch, tu colles les annonces toi-même.

La recherche demande d'abord les offres marquées « stage » ; s'il n'y en a aucune, elle élargit à toutes les offres du mois. Le plan gratuit de JSearch a un quota mensuel de requêtes.

## Lancer l'app

```bash
npm run dev
```

Ouvre ensuite http://localhost:5173.

Pour une version de production (un seul serveur sur le port 3001) :

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

## Structure

```
server/
  index.js    routes de l'API (Express)
  cv.js       lecture des PDF / DOCX
  claude.js   analyse du CV et notation avec Claude (claude-opus-5-5)
  jsearch.js  recherche d'offres JSearch
  local.js    analyse et notation par mots-clés (sans Claude)
src/
  App.jsx     état de l'app et sauvegarde locale
  components/ panneaux CV, profil, recherche, ajout et liste des offres
  sites.js    liens de recherche vers les sites d'emploi
```

## Bon à savoir

- Les appels à Claude utilisent le repli automatique (`fallbacks: "default"`) : si une demande est refusée, l'API la relance sur un autre modèle.
- Chaque analyse ou notation par Claude consomme des crédits sur ton compte Anthropic.
