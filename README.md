# Projet VEYRON - Boutique en ligne

## Présentation du projet

VEYRON est une plateforme e-commerce complète développée avec Vue.js 3 pour le frontend et Node.js/Express/MongoDB pour le backend. Cette application propose une expérience d'achat moderne et fluide avec un design responsive et des fonctionnalités avancées.

## Fonctionnalités principales

### Côté client
- Catalogue de produits avec filtres et recherche avancée
- Système de panier d'achat
- Processus de paiement sécurisé avec Stripe
- Gestion de compte utilisateur
- Suivi des commandes
- Galerie d'images pour les produits
- Système de notation et d'avis

### Côté administrateur
- Tableau de bord avec statistiques avancées
- Gestion des produits et catégories
- Gestion des commandes avec mise à jour des statuts
- Gestion des utilisateurs
- Statistiques détaillées (ventes, produits, utilisateurs, chiffre d'affaires)
- Génération de factures

## Architecture technique

### Frontend
- **Framework**: Vue.js 3 avec Composition API
- **Langage**: TypeScript
- **Routage**: Vue Router
- **Gestion d'état**: Pinia
- **Compilation**: Vite
- **Graphiques**: ECharts
- **UI/UX**: CSS personnalisé avec design responsive

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: MongoDB
- **Authentification**: JWT (JSON Web Tokens)
- **Paiement**: Intégration Stripe
- **API**: RESTful

## Structure du projet

```
├── frontend/            # Code source frontend
│   ├── src/             # Code source Vue.js
│   │   ├── assets/      # Ressources statiques
│   │   ├── components/  # Composants Vue réutilisables
│   │   ├── router/      # Configuration des routes
│   │   ├── services/    # Services API et utilitaires
│   │   ├── stores/      # Stores Pinia
│   │   ├── types/       # Définitions TypeScript
│   │   └── views/       # Composants de page
│   ├── public/          # Fichiers statiques publics
│   └── Dockerfile       # Configuration Docker pour le frontend
├── backend/             # Code source backend
│   ├── controllers/     # Contrôleurs API
│   ├── middleware/      # Middleware Express
│   ├── models/          # Modèles MongoDB
│   ├── routes/          # Routes API
│   ├── utils/           # Utilitaires
│   └── Dockerfile       # Configuration Docker pour le backend
└── docker-compose.yml   # Configuration Docker Compose
```

## Installation et démarrage

### Prérequis
- Docker et Docker Compose
- Compte Stripe (pour les paiements)

### Configuration avec Docker

1. Cloner le dépôt :
```sh
git clone [url-du-repo] veyron
cd veyron
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env` dans le dossier backend
   - Remplir avec vos propres informations (clés Stripe, etc.)

3. Lancer les conteneurs avec Docker Compose :
```sh
docker-compose up -d
```

4. Accéder à l'application :
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Configuration sans Docker

1. Cloner le dépôt :
```sh
git clone [url-du-repo] veyron
cd veyron
```

2. Installer les dépendances frontend :
```sh
cd frontend
npm install
```

3. Installer les dépendances backend :
```sh
cd ../backend
npm install
```

4. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env` dans le dossier backend
   - Remplir avec vos propres informations (MongoDB URI, clés Stripe, etc.)

### Démarrage en développement sans Docker

1. Démarrer le serveur backend :
```sh
cd backend
node server.js
```

2. Dans un autre terminal, démarrer le frontend :
```sh
cd frontend
npm run dev
```

3. Accéder à l'application :
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Compilation pour production

```sh
cd frontend
npm run build
```

## Licence

Ce projet est développé dans le cadre d'un cours à l'ESGI.
