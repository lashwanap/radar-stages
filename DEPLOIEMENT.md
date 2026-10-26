# Mettre Radar à Stages en ligne (Render + domaine IONOS)

Durée : environ 20 minutes. Le code est prêt : `render.yaml` décrit le service, et le serveur limite déjà l'usage par visiteur.

## 1. Publier le code sur GitHub

Render déploie depuis un dépôt GitHub. Créez un dépôt **privé** : il ne contient aucune clé (`.env` est ignoré par git), mais rien ne vous oblige à rendre le code public.

```bash
gh auth login
```

```bash
cd C:\Users\lashw\Documents\radar-stages
gh repo create radar-stages --private --source=. --push
```

Sans le GitHub CLI : créez un dépôt vide sur https://github.com/new (privé, sans README), puis :

```bash
git remote add origin https://github.com/VOTRE-COMPTE/radar-stages.git
git push -u origin main
```

## 2. Créer le service sur Render

1. Créez un compte sur https://render.com (connexion avec GitHub, c'est le plus simple).
2. **New +** → **Blueprint** → autorisez Render à lire le dépôt `radar-stages` → **Connect**.
3. Render lit `render.yaml` et demande deux valeurs secrètes :
   - `ANTHROPIC_API_KEY` : votre clé Claude ;
   - `JSEARCH_API_KEY` : votre clé OpenWebNinja (`ak_…`).
   Copiez-les depuis votre fichier `.env` local.
4. **Apply**. Le premier déploiement prend 3 à 5 minutes. L'adresse ressemble à `https://radar-stages.onrender.com`.

Vérification : `https://radar-stages.onrender.com/api/status` doit répondre `{"claude":true,"search":true}`.

Chaque `git push` sur `main` redéploie automatiquement.

### Plan gratuit ou payant

| | Free | Starter (≈ 7 $ US/mois) |
|---|---|---|
| Mise en veille | Après 15 min sans visite ; le réveil prend ≈ 1 min | Jamais |
| Domaine personnalisé + HTTPS | Oui | Oui |

Pour changer : Render → service → **Settings** → **Instance Type**.

## 3. Brancher votre domaine IONOS

Exemple avec `stages.mondomaine.com` (un sous-domaine est le plus simple).

1. Render → service → **Settings** → **Custom Domains** → **Add Custom Domain** → `stages.mondomaine.com`.
   Render affiche la cible à utiliser, par exemple `radar-stages.onrender.com`.
2. IONOS → **Domaines & SSL** → votre domaine → **DNS** → **Ajouter un enregistrement** :
   - Type : **CNAME**
   - Nom d'hôte : `stages`
   - Pointe vers : `radar-stages.onrender.com`
   - TTL : 1 heure (par défaut)
3. Revenez sur Render et cliquez **Verify**. La propagation DNS prend de quelques minutes à quelques heures. Render émet ensuite le certificat HTTPS tout seul.

Pour le domaine nu (`mondomaine.com` sans sous-domaine) : IONOS n'accepte pas de CNAME à la racine. Ajoutez un enregistrement **A** vers l'adresse IP indiquée par Render dans **Custom Domains**, et supprimez l'ancien enregistrement A d'IONOS s'il existe.

## 4. Coûts et limites

Le site est public : chaque visiteur consomme **vos** crédits Claude et **votre** quota JSearch. Le serveur applique ces plafonds (modifiables dans Render → **Environment**, sans toucher au code) :

| Variable | Défaut | Effet |
|---|---|---|
| `LIMIT_ANALYZE_PER_HOUR` | 10 | Analyses de CV par visiteur et par heure |
| `LIMIT_SCORE_PER_HOUR` | 20 | Demandes de notation par visiteur et par heure (30 offres max chacune) |
| `LIMIT_SEARCH_PER_HOUR` | 10 | Recherches par visiteur et par heure |
| `LIMIT_CLAUDE_CALLS_PER_DAY` | 300 | Appels à Claude pour tout le site ; au-delà, notation par mots-clés jusqu'au lendemain |
| `LIMIT_SEARCHES_PER_DAY` | 20 | Appels JSearch pour tout le site (une recherche en compte jusqu'à 2) |

Les compteurs sont en mémoire : ils repartent à zéro à chaque redémarrage ou redéploiement.

Fixez aussi une **limite de dépense mensuelle** sur https://console.anthropic.com → **Settings** → **Limits** : c'est la seule protection absolue contre une facture imprévue.

## 5. Mettre à jour le site

```bash
git add -A
git commit -m "Ma modification"
git push
```

Render reconstruit et redéploie en quelques minutes ; l'onglet **Logs** du service montre l'avancement et les erreurs.
