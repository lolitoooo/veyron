# 📱 Comment tester l'application mobile - Guide rapide

## ✅ Étapes déjà complétées

1. ✅ **Build terminé** : `npm run build:mobile`
2. ✅ **Synchronisation iOS** : `npx cap sync ios`
3. ✅ **Xcode en cours d'ouverture** : `npx cap open ios`

---

## 🎯 Dans Xcode (qui devrait s'ouvrir maintenant)

### Étape 1 : Sélectionner une cible de test

En haut de Xcode, vous verrez :
```
App > [Sélectionner un appareil]
```

**Cliquez sur le menu déroulant** et choisissez :
- **iPhone 15 Pro** (ou n'importe quel simulateur iOS)
- **Ou votre iPhone physique** (si connecté en USB)

### Étape 2 : Configurer le Signing (première fois uniquement)

1. Dans le navigateur de gauche, cliquez sur **App** (icône bleue en haut)
2. Sélectionnez l'onglet **Signing & Capabilities**
3. Cochez **Automatically manage signing**
4. Dans **Team**, sélectionnez votre compte Apple :
   - Si vous n'avez pas de compte : cliquez sur **Add Account...**
   - Connectez-vous avec votre Apple ID (gratuit)
   - Xcode créera automatiquement un certificat de développement

### Étape 3 : Lancer l'application

**Cliquez sur le bouton ▶️ (Play)** en haut à gauche de Xcode

L'application va :
1. Se compiler (1-2 minutes la première fois)
2. S'installer sur le simulateur/appareil
3. Se lancer automatiquement

---

## 📱 Test sur simulateur iOS

**Avantages :**
- ✅ Pas besoin d'iPhone physique
- ✅ Rapide à tester
- ✅ Plusieurs modèles disponibles

**Ce que vous verrez :**
- Votre application Veyron Paris s'ouvre
- Interface identique au site web
- Connexion à votre API de production (`https://veyron-paris.fr`)

---

## 📱 Test sur iPhone physique (optionnel)

### Prérequis
1. **Connecter votre iPhone** en USB
2. **Activer le mode développeur** sur l'iPhone :
   - Réglages → Confidentialité et sécurité → Mode développeur → Activer

### Dans Xcode
1. Sélectionnez votre iPhone dans le menu déroulant (au lieu du simulateur)
2. Cliquez sur ▶️
3. **Sur votre iPhone**, une alerte apparaîtra :
   - Réglages → Général → Gestion des appareils
   - Faire confiance au certificat de développement

---

## 🔍 Tester les fonctionnalités

Une fois l'app lancée, testez :

### ✅ Authentification
- Connexion avec votre compte
- Le token est stocké dans localStorage (fonctionne !)

### ✅ Navigation
- Parcourir les produits
- Voir les catégories
- Rechercher

### ✅ Panier
- Ajouter des produits
- Le panier est sauvegardé (localStorage + API)

### ✅ Images
- Les images se chargent depuis `https://veyron-paris.fr`

### ✅ API
- Toutes les requêtes vont vers votre backend de production

---

## 🐛 Debug

### Voir les logs de l'application

**Dans Xcode :**
- Ouvrez le panneau **Console** (en bas)
- Vous verrez tous les `console.log()` de votre code Vue.js

**Avec Safari (pour le debug web) :**
1. Ouvrez Safari sur votre Mac
2. Menu **Développement** → **Simulateur** → **[Votre App]**
3. Vous aurez accès à la console JavaScript complète !

### Problèmes courants

**L'app ne compile pas :**
- Vérifiez que vous avez sélectionné un Team dans Signing & Capabilities

**L'app se lance mais écran blanc :**
- Ouvrez la console Safari pour voir les erreurs JavaScript
- Vérifiez que l'API est accessible : `https://veyron-paris.fr/api`

**Les images ne s'affichent pas :**
- Vérifiez la console : les URLs doivent pointer vers `https://veyron-paris.fr`

---

## 🔄 Modifier et retester

Quand vous modifiez votre code Vue.js :

```bash
# Dans le terminal
cd frontend
npm run mobile:ios
```

Cette commande :
1. Rebuild l'app Vue.js
2. Synchronise avec iOS
3. Ouvre Xcode

Ensuite dans Xcode, cliquez simplement sur ▶️ pour relancer.

---

## 🎯 Commandes utiles

```bash
# Build + Sync + Ouvrir Xcode (tout-en-un)
npm run mobile:ios

# Juste synchroniser (après un build)
npx cap sync ios

# Juste ouvrir Xcode
npx cap open ios
```

---

## 🚀 Prochaines étapes

Une fois que l'app fonctionne bien :

1. **Ajouter des icônes personnalisées**
2. **Configurer le splash screen**
3. **Ajouter des fonctionnalités natives** (push notifications, etc.)
4. **Préparer pour l'App Store**

Consultez `MOBILE_APP_GUIDE.md` pour plus de détails !

---

## ✅ Résumé rapide

1. ✅ Build fait
2. ✅ Sync fait
3. 🔄 **Xcode devrait s'ouvrir maintenant**
4. ▶️ **Cliquez sur Play dans Xcode**
5. 🎉 **Votre app se lance !**

**Bon test ! 📱**
