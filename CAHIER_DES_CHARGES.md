# Cahier des Charges - Veyron Paris
## Projet Annuel - E-commerce de Luxe

---

## 1. Présentation du Projet

### 1.1 Contexte
Veyron Paris est une plateforme e-commerce spécialisée dans la vente de produits de luxe (vêtements, accessoires, bijoux). Le projet répond à un besoin métier réel de commercialisation en ligne avec une expérience utilisateur premium et des fonctionnalités avancées de fidélisation.

### 1.2 Objectifs
- Créer une plateforme e-commerce complète et sécurisée
- Offrir une expérience utilisateur fluide et moderne
- Implémenter un système de fidélité innovant
- Garantir la sécurité des données utilisateurs et des transactions
- Assurer une infrastructure scalable et observable

### 1.3 Technologies Utilisées
- **Frontend**: Vue.js 3, TypeScript, TailwindCSS, Pinia
- **Backend**: Node.js, Express.js
- **Base de données**: MongoDB
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Paiement**: Stripe
- **Email**: Nodemailer
- **Hébergement**: VPS avec nom de domaine (veyron-paris.fr)

---

## 2. Sécurité ✅

### 2.1 Authentification et Autorisation

#### ✅ Inscription
- Formulaire d'inscription avec validation stricte
- Activation de compte par email
- Vérification de l'unicité de l'email

#### ✅ Connexion
- Authentification par email et mot de passe
- Gestion de sessions sécurisées avec JWT
- Tokens avec expiration

#### ✅ Mot de passe oublié
- Système de réinitialisation par email
- Token unique avec expiration (10 minutes)
- Lien sécurisé de réinitialisation

#### ✅ Réinitialisation de mot de passe
- Interface dédiée avec validation en temps réel
- Indicateur visuel de force du mot de passe
- Mise à jour sécurisée du mot de passe

### 2.2 Politique de Mot de Passe ✅

#### ✅ Mot de passe fort
- **Minimum 12 caractères**
- Au moins une lettre majuscule
- Au moins une lettre minuscule
- Au moins un chiffre
- Au moins un symbole spécial
- Validation côté frontend et backend
- Composant visuel de force du mot de passe avec feedback en temps réel

#### ✅ Réinitialisation périodique
- **Email automatique tous les 60 jours**
- Job automatique quotidien (12h00) via node-cron
- Template d'email personnalisé
- Champ `lastPasswordChange` dans le schéma User
- Mise à jour automatique lors du changement de mot de passe

#### ✅ Blocage après tentatives infructueuses
- **Blocage après 3 tentatives échouées**
- Verrouillage du compte pendant 5 minutes
- Compteur de tentatives restantes
- Messages explicites à l'utilisateur
- Déblocage automatique après expiration
- Champs `loginAttempts` et `lockUntil` dans le schéma User

### 2.3 Conformité CNIL et RGPD ✅

#### ✅ Politique de cookies
- Banner de consentement des cookies
- Paramètres détaillés des cookies (essentiels, analytiques, marketing)
- Stockage du consentement utilisateur
- Respect du choix utilisateur

#### ✅ Pages légales
- Conditions Générales d'Utilisation (CGU)
- Conditions Générales de Vente (CGV)
- Politique de confidentialité
- Page de contact

#### ✅ Protection des données
- Hashage des mots de passe (bcrypt)
- Tokens JWT sécurisés
- Validation et sanitization des entrées utilisateur
- Protection contre les injections SQL/NoSQL
- CORS configuré avec origines autorisées
- Rate limiting sur les endpoints sensibles

---

## 3. Infrastructure ✅

### 3.1 Conteneurisation Docker ✅

#### Services déployés
- **MongoDB**: Base de données conteneurisée
- **Backend**: API Node.js/Express conteneurisée
- **Frontend**: Application Vue.js conteneurisée
- **Nginx**: Reverse proxy et serveur web

#### Environnements
- **Development**: `docker-compose.yml`
- **Preprod**: `docker-compose.preprod.yml`
- **Production**: `docker-compose.prod.yml`
- **Monitoring**: `docker-compose.monitoring.yml`

### 3.2 Serveur VPS ✅

#### Configuration
- **Hébergement**: VPS dédié
- **Nom de domaine**: veyron-paris.fr
- **Certificat SSL**: Let's Encrypt (autorité de confiance)
- **HTTPS**: Activé sur tous les environnements
- **Pare-feu**: Configuré avec protection des ports non-utilisés

#### Services exposés
- **Frontend**: Port 8091 (production), 8090 (preprod)
- **Backend API**: Port 3000 (production), 3001 (preprod)
- **MongoDB**: Port interne uniquement (non exposé)

### 3.3 Registre Docker
- Images Docker buildées et déployées
- Versioning des images
- Déploiement automatisé via Docker Compose

---

## 4. Réponse Métier et Architecture

### 4.1 Problématique Métier
Veyron Paris répond au besoin de commercialisation en ligne de produits de luxe avec :
- Catalogue produits organisé par catégories
- Gestion de panier et wishlist
- Processus de commande sécurisé
- Système de paiement intégré
- Programme de fidélité pour fidéliser la clientèle

### 4.2 Architecture Applicative

#### Backend (API RESTful)
```
backend/
├── controllers/       # Logique métier
├── models/           # Schémas MongoDB
├── routes/           # Endpoints API
├── middleware/       # Authentification, validation
├── services/         # Services (email, paiement)
├── templates/        # Templates d'emails
├── jobs/             # Tâches planifiées (cron)
├── scripts/          # Scripts de migration
└── utils/            # Utilitaires
```

#### Frontend (SPA Vue.js)
```
frontend/
├── src/
│   ├── components/   # Composants réutilisables
│   ├── views/        # Pages de l'application
│   ├── stores/       # Gestion d'état (Pinia)
│   ├── router/       # Routing
│   ├── composables/  # Logique réutilisable
│   ├── layouts/      # Layouts de page
│   └── assets/       # Ressources statiques
```

### 4.3 Fonctionnalités Métier

#### Gestion des Produits
- Catalogue avec filtres et recherche
- Catégories et sous-catégories
- Fiches produits détaillées
- Images produits optimisées
- Gestion des stocks

#### Gestion des Utilisateurs
- Profil utilisateur éditable
- Historique des commandes
- Adresses de livraison multiples
- Wishlist personnalisée

#### Processus de Commande
- Panier persistant
- Checkout invité ou authentifié
- Calcul automatique des frais de livraison
- Application de codes promo
- Paiement sécurisé Stripe
- Génération de factures PDF
- Emails de confirmation

#### Système de Fidélité
- **Cashback**: Points gagnés sur chaque achat
- **Système d'XP**: Progression par niveau
- **Rangs**: Bronze, Argent, Or, Platine, Diamant
- **Badges**: Récompenses pour actions spécifiques
- Avantages exclusifs par rang

#### Administration
- Gestion des produits (CRUD)
- Gestion des commandes
- Gestion des utilisateurs
- Statistiques de vente
- Gestion des codes promo
- Configuration de la livraison

---

## 5. Design et Accessibilité ✅

### 5.1 Interface Utilisateur

#### Design moderne
- Interface épurée et élégante
- Palette de couleurs cohérente (noir, blanc, accents dorés)
- Typographie premium
- Animations fluides et transitions
- Responsive design (mobile, tablette, desktop)

#### Composants UI
- Boutons et formulaires stylisés
- Modales et overlays
- Cartes produits attractives
- Navigation intuitive
- Footer informatif

### 5.2 Expérience Utilisateur (UX)

#### Navigation
- Menu principal clair
- Fil d'Ariane sur les pages produits
- Recherche rapide
- Filtres et tri des produits

#### Feedback utilisateur
- Messages de succès/erreur explicites
- Indicateurs de chargement
- Validation en temps réel des formulaires
- Confirmations d'actions

### 5.3 Accessibilité

#### Bonnes pratiques
- Attributs ARIA sur les éléments interactifs
- Labels explicites sur les formulaires
- Contraste de couleurs suffisant
- Navigation au clavier
- Textes alternatifs sur les images
- Structure sémantique HTML

#### SEO
- Meta tags optimisés
- URLs propres et descriptives
- Sitemap XML
- Temps de chargement optimisé
- Images optimisées (WebP, lazy loading)

---

## 6. Tests

### 6.1 Tests Unitaires
- Tests des fonctions utilitaires
- Tests des composables Vue.js
- Tests des services backend
- Tests des modèles de données

### 6.2 Tests Fonctionnels
- Tests des endpoints API
- Tests des flux utilisateur
- Tests du processus de commande
- Tests du système de paiement

### 6.3 Tests d'Interface
- Tests des composants Vue
- Tests de navigation
- Tests de formulaires
- Tests responsive

### 6.4 Couverture
- Couverture raisonnable des fonctionnalités critiques
- Tests des cas limites
- Tests de sécurité (injection, XSS)

---

## 7. Observabilité ✅

### 7.1 État de Santé des Conteneurs

#### Monitoring prévu
- **Uptime Kuma** / **Prometheus** / **Grafana**
- Surveillance de l'uptime des services
- Alertes en cas de défaillance
- Métriques de performance

### 7.2 Signalement des Erreurs

#### Solution prévue
- **Sentry** / **GlitchTip** / **DataDog**
- Capture des erreurs frontend et backend
- Stack traces détaillées
- Notifications en temps réel

### 7.3 Analytique

#### Solution prévue
- **Plausible** / **Matomo** (respect RGPD)
- Suivi des visites et conversions
- Analyse du comportement utilisateur
- Rapports de performance

### 7.4 Logs
- Logs applicatifs structurés
- Logs d'accès Nginx
- Logs de transactions
- Rotation des logs

---

## 8. Gestion de Projet ✅

### 8.1 Méthodologie Agile

#### Organisation
- Sprints de 2 semaines
- Réunions de suivi régulières
- Répartition équitable des tâches
- Revues de code

#### Outils
- **GitHub Projects** pour la gestion des tâches
- Issues et Pull Requests
- Milestones pour les versions
- Labels pour la catégorisation

### 8.2 Versioning

#### Git
- Repository GitHub
- Branches par fonctionnalité
- Commits atomiques et descriptifs
- Merge via Pull Requests
- Protection de la branche main

#### Branches
- `main`: Production
- `dev`: Développement
- `feature/*`: Nouvelles fonctionnalités
- `fix/*`: Corrections de bugs
- `hotfix/*`: Corrections urgentes

---

## 9. Politique de Recouvrement

### 9.1 Stratégie 3-2-1 ✅

#### 3 sauvegardes identiques
- Sauvegarde quotidienne automatique
- Sauvegarde hebdomadaire
- Sauvegarde mensuelle

#### 2 médiums différents
- Volume Block Storage (VPS)
- Stockage S3 (AWS/Backblaze)

#### 1 sauvegarde externe
- Réplication sur cloud provider différent
- Sauvegarde hors site

### 9.2 Contenu Sauvegardé
- Base de données MongoDB (dump complet)
- Images produits uploadées
- Fichiers utilisateurs
- Configuration de l'application

### 9.3 Infrastructure as Code (IaC) ✅

#### Reproductibilité
- **Dockerfile** pour chaque service
- **Docker Compose** pour l'orchestration
- Scripts de déploiement automatisés
- Documentation de configuration

---

## 10. Bonus

### 10.1 Authentification Avancée

#### Implémenté
- ✅ Email et mot de passe
- ✅ Réinitialisation par email

#### À implémenter
- ⏳ OAuth2/OIDC (Google, Facebook)
- ⏳ Lien magique (Magic Link)
- ⏳ Authentification à deux facteurs (TOTP)

### 10.2 Application Mobile

#### Technologies suggérées
- **Capacitor** (recommandé pour Vue.js)
- React Native
- Flutter

#### Fonctionnalités
- Catalogue produits mobile
- Panier et commandes
- Notifications push
- Paiement mobile

### 10.3 Auto-hébergement et Réplication

#### Infrastructure avancée
- Serveur physique avec Proxmox
- Virtualisation des services
- Cluster k3s ou Docker Swarm
- Réplication des services (2+ réplicas)
- DNS inversé (CloudFlare Tunnel)

### 10.4 Analytiques Avancées

#### Visualisation
- Dashboards Grafana
- Métriques business
- Analyse des ventes
- Comportement utilisateur

---

## 11. Conformité et Contraintes

### 11.1 Contraintes Techniques ✅
- ✅ Groupe de 3-4 personnes
- ✅ Code versionné avec Git (.git inclus)
- ✅ Documentation claire et reproductible
- ✅ Infrastructure Docker
- ✅ VPS avec nom de domaine et SSL

### 11.2 Livrables
- Code source complet avec historique Git
- Documentation technique
- Guide d'installation et de déploiement
- Cahier des charges (ce document)
- Présentation finale

### 11.3 Documentation

#### README.md
- Description du projet
- Prérequis et installation
- Configuration des variables d'environnement
- Commandes de déploiement
- Architecture technique

#### Documentation API
- Endpoints disponibles
- Paramètres et réponses
- Exemples d'utilisation
- Codes d'erreur

---

## 12. Roadmap et Évolutions

### 12.1 Phase 1 - MVP ✅ (Complété)
- Authentification et sécurité
- Catalogue produits
- Panier et commande
- Paiement Stripe
- Administration basique

### 12.2 Phase 2 - Fidélisation ✅ (Complété)
- Système de fidélité (cashback, XP, rangs)
- Badges et récompenses
- Checkout invité
- Amélioration UX

### 12.3 Phase 3 - Sécurité Avancée ✅ (Complété)
- Validation stricte des mots de passe
- Blocage après tentatives échouées
- Réinitialisation périodique (60 jours)
- Indicateur de force du mot de passe

### 12.4 Phase 4 - Observabilité (En cours)
- Monitoring des conteneurs
- Alertes et notifications
- Analytique utilisateur
- Dashboards de performance

### 12.5 Phase 5 - Bonus (À venir)
- Authentification OAuth2
- Application mobile (Capacitor)
- 2FA (TOTP)
- Réplication et haute disponibilité

---

## 13. Équipe et Responsabilités

### 13.1 Répartition des Tâches
- **Frontend**: Développement Vue.js, UX/UI
- **Backend**: API, base de données, sécurité
- **DevOps**: Infrastructure, déploiement, monitoring
- **Transverse**: Tests, documentation, gestion de projet

### 13.2 Compétences Mobilisées
- Développement web fullstack
- Architecture logicielle
- Sécurité applicative
- Infrastructure et conteneurisation
- Gestion de projet Agile
- Design et accessibilité

---

## 14. Conclusion

Veyron Paris est une plateforme e-commerce complète qui répond aux exigences du projet annuel en matière de :
- **Sécurité**: Authentification robuste, politique de mots de passe stricte, conformité RGPD
- **Infrastructure**: Conteneurisation Docker, VPS avec SSL, architecture scalable
- **Métier**: Réponse claire au besoin de commercialisation en ligne de produits de luxe
- **Qualité**: Tests, observabilité, documentation complète
- **Gestion**: Méthodologie Agile, versioning Git, répartition équitable

Le projet démontre une maîtrise des technologies modernes et des bonnes pratiques de développement web, tout en offrant une expérience utilisateur premium adaptée au marché du luxe.

---

**Document rédigé le**: 6 février 2026  
**Version**: 1.0  
**Projet**: Veyron Paris - E-commerce de Luxe  
**Contexte**: Projet Annuel - Cahier des Charges Technique
