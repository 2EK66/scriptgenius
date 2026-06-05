## Objectif
Séparer clairement la création (privée par défaut) de la publication publique et de la mise en vente premium.

## 1. Workplace privé `/workplace` (nouveau)
Tableau de bord privé regroupant les œuvres de l'auteur connecté :
- Onglets : **Scénarios** · **BD / Épisodes** · **Séries**
- Chaque carte affiche le statut (Brouillon / Public / Premium) + actions :
  - Modifier / Continuer la génération
  - **Publier (Galerie publique)** → ouvre dialog de publication gratuite
  - **Mettre en vente (Premium)** → ouvre dialog premium (CGU + prix)
  - Repasser en privé
- Bouton « Créer » → redirige vers `/comic-generator`, `/scripts`, `/series/create`
- Toutes les nouvelles œuvres créées partent en `status = draft` / `is_public = false`

## 2. Galerie publique `/gallery` (mise à jour)
- Filtre strict : `is_public = true AND status = 'published' AND is_premium = false`
- Inclure également les **épisodes publiés gratuits** d'une série (`episodes.status = 'published' AND is_premium = false`) → affichés comme « extraits / 1er épisode gratuit »
- Retirer toute œuvre brouillon ou premium

## 3. Boutique Premium `/premium-store` (mise à jour)
- Filtre strict : `is_premium = true AND status = 'published'`
- Nouveau dialog « Mettre en vente » obligatoire avant publication :
  - ☑ Case à cocher : « J'accepte les CGU et conditions de vente »
  - Champ prix (XOF) ou bouton « Définir le prix plus tard » (œuvre stockée mais non listée tant que prix manquant)
  - Validation : refuse l'envoi si CGU non cochées

## Changements techniques

### Base de données (migration)
Ajout de colonnes manquantes :
- `scripts` : `is_premium boolean default false`, `price integer`, `terms_accepted_at timestamptz`
- `comics` : `is_premium boolean default false`, `price integer`, `terms_accepted_at timestamptz`
- `episodes` : `is_premium boolean default false`, `price integer`, `is_free_preview boolean default false`

Mise à jour des politiques RLS :
- Lecture publique uniquement si `is_public = true AND status = 'published'`
- Lecture premium publique : tout le monde voit la fiche, mais le contenu reste protégé (déjà géré côté Boutique)

### Frontend
- Nouveau fichier `src/pages/Workplace.tsx` + route `/workplace`
- Nouveau composant `src/components/PublishToGalleryDialog.tsx` (gratuit)
- Nouveau composant `src/components/PublishToPremiumDialog.tsx` (CGU + prix)
- Refactor `ComicPublishDialog` → propose 3 choix : **Garder privé**, **Publier en galerie**, **Mettre en vente**
- `Gallery.tsx` : ajuster la requête pour exclure premium et inclure épisodes gratuits
- `PremiumStore.tsx` : charger réellement les œuvres premium depuis `scripts` + `comics`
- Lien « Mon espace » dans `Header` vers `/workplace` (remplace ou complète le lien Auteur Dashboard)

### Hors scope (à confirmer si besoin)
- Système d'achat réel des épisodes payants (CinetPay existe déjà pour les slots, à étendre plus tard)
- Page CGU dédiée (on lie vers `/terms` placeholder pour l'instant)

## Livraison
1. Migration SQL (colonnes + RLS)
2. Composants de publication (Galerie / Premium)
3. Page Workplace + route + lien header
4. Mise à jour Galerie + Boutique Premium
