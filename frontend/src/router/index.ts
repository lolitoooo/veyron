import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          meta: { title: 'VEYRON - Mode de luxe', breadcrumb: 'Accueil' }
        },
        {
          path: 'category/homme',
          name: 'category-men',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'homme' },
          meta: { title: 'Collection Homme | VEYRON', breadcrumb: 'Homme' }
        },
        {
          path: 'category/femme',
          name: 'category-women',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'femme' },
          meta: { title: 'Collection Femme | VEYRON', breadcrumb: 'Femme' }
        },
        {
          path: 'category/accessoires',
          name: 'category-accessories',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'accessoires' },
          meta: { title: 'Collection Accessoires | VEYRON', breadcrumb: 'Accessoires' }
        },
        {
          path: 'category/collections',
          name: 'category-collections',
          component: () => import('@/views/CollectionView.vue'),
          meta: { title: 'Nos Boutiques | VEYRON', breadcrumb: 'Boutiques' }
        },
        {
          path: 'collection/:slug',
          name: 'partner-shop',
          component: () => import('@/views/PartnerShopView.vue'),
          props: true,
          meta: { title: 'Boutique | VEYRON', breadcrumb: 'Boutique' }
        },
        {
          path: 'category/:slug',
          name: 'category',
          component: () => import('@/views/CategoryView.vue'),
          props: true,
          meta: { title: 'Catégorie | VEYRON' }
        },
        {
          path: 'category/:slug/:productSlug',
          name: 'product-in-category',
          component: () => import('@/views/ProductDetailView.vue'),
          props: true,
          meta: { title: 'Produit | VEYRON', breadcrumb: 'Produit' }
        },
        {
          path: 'product/:productSlug',
          name: 'product',
          component: () => import('@/views/ProductDetailView.vue'),
          meta: { title: 'Produit | VEYRON', breadcrumb: 'Produit' }
        },
        {
          path: 'cart',
          name: 'cart',
          component: () => import('@/views/CartView.vue'),
          meta: { title: 'Panier | VEYRON' }
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: () => import('@/views/CheckoutView.vue'),
          meta: { title: 'Paiement | VEYRON' }
        },
        {
          path: 'payment-checkout',
          name: 'payment-checkout',
          component: () => import('@/views/PaymentCheckoutView.vue'),
          meta: { title: 'Paiement sécurisé | VEYRON' }
        },
        {
          path: 'payment-result',
          name: 'payment-result',
          component: () => import('@/views/PaymentResultView.vue'),
          meta: { title: 'Résultat du paiement | VEYRON' }
        },
        {
          path: 'payment-success',
          name: 'payment-success',
          component: () => import('@/views/PaymentSuccessView.vue'),
          meta: { title: 'Paiement réussi | VEYRON' }
        },
        {
          path: 'payment-failed',
          name: 'payment-failed',
          component: () => import('@/views/PaymentFailedView.vue'),
          meta: { title: 'Paiement échoué | VEYRON' }
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/SearchView.vue'),
          meta: { title: 'Recherche | VEYRON', breadcrumb: 'Recherche' }
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
          meta: { title: 'À propos | VEYRON', breadcrumb: 'À propos' }
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('@/views/ContactView.vue'),
          meta: { title: 'Contact | VEYRON', breadcrumb: 'Contact' }
        },
        {
          path: 'voyage/tahiti',
          name: 'travel-us-stopover-checklist',
          component: () => import('@/views/TravelTahitiUsStopoverView.vue'),
          meta: { title: 'Voyage à Tahiti – Escale US | VEYRON', breadcrumb: 'Voyage' }
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('@/views/legal/TermsView.vue'),
          meta: { title: 'Conditions générales | VEYRON', breadcrumb: 'Conditions générales' }
        },
        {
          path: 'cgu',
          name: 'cgu',
          component: () => import('@/views/legal/CGUView.vue'),
          meta: { title: 'Conditions générales d\'utilisation | VEYRON', breadcrumb: 'CGU' }
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/legal/PrivacyView.vue'),
          meta: { title: 'Politique de confidentialité | VEYRON', breadcrumb: 'Politique de confidentialité' }
        },
        {
          path: 'legal',
          name: 'legal',
          component: () => import('@/views/legal/LegalView.vue'),
          meta: { title: 'Mentions légales | VEYRON', breadcrumb: 'Mentions légales' }
        },
        {
          path: 'sustainability',
          name: 'sustainability',
          component: () => import('@/views/legal/SustainabilityView.vue'),
          meta: { title: 'Développement durable | VEYRON', breadcrumb: 'Développement durable' }
        },
        {
          path: 'review/verified/:token',
          name: 'verified-review',
          component: () => import('@/views/VerifiedReviewView.vue'),
          meta: { title: 'Laisser un avis vérifié | VEYRON' }
        },
        {
          path: 'careers',
          name: 'careers',
          component: () => import('@/views/legal/CareersView.vue'),
          meta: { title: 'Carrières | VEYRON', breadcrumb: 'Carrières' }
        },
        {
          path: 'faq',
          name: 'faq',
          component: () => import('@/views/legal/FaqView.vue'),
          meta: { title: 'FAQ | VEYRON', breadcrumb: 'FAQ' }
        },
        {
          path: 'returns',
          name: 'returns',
          component: () => import('@/views/legal/ReturnPolicyView.vue'),
          meta: { title: 'Retours et échanges | VEYRON', breadcrumb: 'Retours et échanges' }
        },
        {
          path: 'shipping',
          name: 'shipping',
          component: () => import('@/views/legal/ShippingView.vue'),
          meta: { title: 'Livraison | VEYRON', breadcrumb: 'Livraison' }
        },
        {
          path: 'cookies',
          name: 'cookies',
          component: () => import('@/views/legal/CookiesView.vue'),
          meta: { title: 'Politique des cookies | VEYRON', breadcrumb: 'Politique des cookies' }
        },
        {
          path: 'accessibility',
          name: 'accessibility',
          component: () => import('@/views/legal/AccessibilityView.vue'),
          meta: { title: 'Déclaration d\'accessibilité | VEYRON', breadcrumb: 'Accessibilité' }
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Connexion | VEYRON', guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: 'Inscription | VEYRON', guest: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { title: 'Mot de passe oublié | VEYRON', guest: true }
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { title: 'Réinitialiser le mot de passe | VEYRON', guest: true }
    },
    {
      path: '/activate-account/:token',
      name: 'activate-account',
      component: () => import('@/views/ActivateAccountView.vue'),
      meta: { title: 'Activer mon compte | VEYRON', guest: true }
    },
    {
      path: '/account',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'account',
          component: () => import('@/views/account/AccountView.vue'),
          meta: { title: 'Mon compte | VEYRON', breadcrumb: 'Mon compte' }
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/OrdersView.vue'),
          meta: { title: 'Mes commandes | VEYRON', breadcrumb: 'Mes commandes' }
        },
        {
          path: 'orders/:id',
          name: 'order-detail',
          component: () => import('@/views/account/OrderDetailView.vue'),
          meta: { title: 'Détail de commande | VEYRON', breadcrumb: 'Détail de commande' }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/account/ProfileView.vue'),
          meta: { title: 'Mon profil | VEYRON', breadcrumb: 'Mon profil' }
        },
        {
          path: 'addresses',
          name: 'addresses',
          component: () => import('@/views/account/AddressesView.vue'),
          meta: { title: 'Mes adresses | VEYRON', breadcrumb: 'Mes adresses' }
        },
        {
          path: 'wishlist',
          name: 'wishlist',
          component: () => import('@/views/account/WishlistView.vue'),
          meta: { title: 'Mes favoris | VEYRON', breadcrumb: 'Mes favoris' }
        },
        {
          path: 'loyalty',
          name: 'loyalty',
          component: () => import('@/views/account/LoyaltyView.vue'),
          meta: { title: 'Ma Fidélité | VEYRON', breadcrumb: 'Ma Fidélité' }
        },
        {
          path: 'security',
          name: 'security',
          component: () => import('@/views/account/TwoFactorView.vue'),
          meta: { title: 'Sécurité | VEYRON', breadcrumb: 'Sécurité' }
        },
      ]
    },
    {
      path: '/auth/2fa',
      name: '2fa-validate',
      component: () => import('@/views/auth/TwoFactorValidateView.vue'),
      meta: { title: 'Authentification à deux facteurs | VEYRON' }
    },
    {
      path: '/auth/callback',
      name: 'oauth-callback',
      component: () => import('@/views/auth/OAuthCallbackView.vue'),
      meta: { title: 'Connexion en cours | VEYRON' }
    },
    {
      path: '/auth/magic-link/verify',
      name: 'magic-link-verify',
      component: () => import('@/views/auth/MagicLinkVerifyView.vue'),
      meta: { title: 'Vérification du lien magique | VEYRON' }
    },
    {
      path: '/partner',
      component: MainLayout,
      meta: { requiresAuth: true, requiresPartner: true },
      children: [
        {
          path: '',
          name: 'partner-dashboard',
          component: () => import('@/views/partner/DashboardView.vue'),
          meta: { title: 'Tableau de bord | Partenaire VEYRON', breadcrumb: 'Tableau de bord' }
        },
        {
          path: 'orders',
          name: 'partner-orders',
          component: () => import('@/views/partner/OrdersView.vue'),
          meta: { title: 'Commandes | Partenaire VEYRON', breadcrumb: 'Commandes' }
        },
        {
          path: 'orders/:id',
          name: 'partner-order-detail',
          component: () => import('@/views/partner/OrderDetailView.vue'),
          meta: { title: 'Détail commande | Partenaire VEYRON', breadcrumb: 'Détail commande' }
        },
        {
          path: 'products',
          name: 'partner-products',
          component: () => import('@/views/partner/ProductsView.vue'),
          meta: { title: 'Mes articles | Partenaire VEYRON', breadcrumb: 'Articles' }
        },
        {
          path: 'stats',
          name: 'partner-stats',
          component: () => import('@/views/partner/StatsView.vue'),
          meta: { title: 'Statistiques | Partenaire VEYRON', breadcrumb: 'Statistiques' }
        },
        {
          path: 'payouts',
          name: 'partner-payouts',
          component: () => import('@/views/partner/PayoutsView.vue'),
          meta: { title: 'Reversements | Partenaire VEYRON', breadcrumb: 'Reversements' }
        },
        {
          path: 'profile',
          name: 'partner-profile',
          component: () => import('@/views/partner/ProfileView.vue'),
          meta: { title: 'Ma boutique | Partenaire VEYRON', breadcrumb: 'Ma boutique' }
        }
      ]
    },
    {
      path: '/admin',
      component: MainLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: 'Tableau de bord | Admin VEYRON', breadcrumb: 'Tableau de bord' }
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/views/admin/ProductsView.vue'),
          meta: { title: 'Gestion des produits | Admin VEYRON', breadcrumb: 'Gestion des produits' }
        },
        {
          path: 'products/create',
          name: 'admin-product-create',
          component: () => import('@/views/admin/ProductFormView.vue'),
          meta: { title: 'Créer un produit | Admin VEYRON', breadcrumb: 'Créer un produit' }
        },
        {
          path: 'products/:id/edit',
          name: 'admin-product-edit',
          component: () => import('@/views/admin/ProductFormView.vue'),
          meta: { title: 'Modifier un produit | Admin VEYRON', breadcrumb: 'Modifier un produit' }
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/views/admin/CategoriesView.vue'),
          meta: { title: 'Gestion des catégories | Admin VEYRON', breadcrumb: 'Gestion des catégories' }
        },
        {
          path: 'reviews',
          name: 'admin-reviews',
          component: () => import('@/views/admin/ReviewsView.vue'),
          meta: { title: 'Gestion des avis | Admin VEYRON', breadcrumb: 'Gestion des avis' }
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/views/admin/OrdersView.vue'),
          meta: { title: 'Gestion des commandes | Admin VEYRON', breadcrumb: 'Gestion des commandes' }
        },
        {
          path: 'orders/:id',
          name: 'admin-order-detail',
          component: () => import('@/views/admin/OrderDetailView.vue'),
          meta: { title: 'Détail de commande | Admin VEYRON', breadcrumb: 'Détail de commande' }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { title: 'Gestion des utilisateurs | Admin VEYRON', breadcrumb: 'Gestion des utilisateurs' }
        },
        {
          path: 'users/:id/detail',
          name: 'admin-user-detail',
          component: () => import('@/views/admin/UserDetailView.vue'),
          meta: { title: 'Détail de l\'utilisateur | Admin VEYRON', breadcrumb: 'Détail de l\'utilisateur' }
        },
        {
          path: 'users/:id/edit',
          name: 'admin-user-edit',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Modifier l\'utilisateur | Admin VEYRON', breadcrumb: 'Modifier l\'utilisateur' }
        },
        {
          path: 'users/create',
          name: 'admin-user-create',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Créer un utilisateur | Admin VEYRON', breadcrumb: 'Créer un utilisateur' }
        },
        {
          path: 'statistics',
          name: 'admin-statistics',
          component: () => import('@/views/admin/StatisticsView.vue'),
          meta: { title: 'Statistiques avancées | Admin VEYRON', breadcrumb: 'Statistiques avancées' }
        },
        {
          path: 'promo-codes',
          name: 'admin-promo-codes',
          component: () => import('@/views/admin/PromoCodesView.vue'),
          meta: { title: 'Gestion des codes promo | Admin VEYRON', breadcrumb: 'Codes promo' }
        },
        {
          path: 'shipping',
          name: 'admin-shipping',
          component: () => import('@/views/admin/ShippingConfigView.vue'),
          meta: { title: 'Configuration de livraison | Admin VEYRON', breadcrumb: 'Livraison' }
        },
        {
          path: 'loyalty-config',
          name: 'admin-loyalty-config',
          component: () => import('@/views/admin/LoyaltyConfigView.vue'),
          meta: { title: 'Configuration Fidélité | Admin VEYRON', breadcrumb: 'Fidélité' }
        },
        {
          path: 'users/:id/delete',
          name: 'admin-user-delete',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Supprimer l\'utilisateur | Admin VEYRON', breadcrumb: 'Supprimer l\'utilisateur' }
        },
        {
          path: 'partners',
          name: 'admin-partners',
          component: () => import('@/views/admin/PartnersView.vue'),
          meta: { title: 'Gestion des partenaires | Admin VEYRON', breadcrumb: 'Partenaires' }
        },
        {
          path: 'partners/create',
          name: 'admin-partner-create',
          component: () => import('@/views/admin/PartnerFormView.vue'),
          meta: { title: 'Créer un partenaire | Admin VEYRON', breadcrumb: 'Créer un partenaire' }
        },
        {
          path: 'partners/:id',
          name: 'admin-partner-detail',
          component: () => import('@/views/admin/PartnerDetailView.vue'),
          meta: { title: 'Détail partenaire | Admin VEYRON', breadcrumb: 'Détail partenaire' }
        },
        {
          path: 'partners/:id/edit',
          name: 'admin-partner-edit',
          component: () => import('@/views/admin/PartnerFormView.vue'),
          meta: { title: 'Modifier le partenaire | Admin VEYRON', breadcrumb: 'Modifier le partenaire' }
        },
        {
          path: 'partners/:id/products',
          name: 'admin-partner-products',
          component: () => import('@/views/admin/PartnerProductsView.vue'),
          meta: { title: 'Articles partenaire | Admin VEYRON', breadcrumb: 'Articles partenaire' }
        },
        {
          path: 'partners/:id/products/create',
          name: 'admin-partner-product-create',
          component: () => import('@/views/admin/PartnerProductFormView.vue'),
          meta: { title: 'Ajouter un article partenaire | Admin VEYRON', breadcrumb: 'Ajouter un article' }
        },
        {
          path: 'partners/:id/products/:productId/edit',
          name: 'admin-partner-product-edit',
          component: () => import('@/views/admin/PartnerProductFormView.vue'),
          meta: { title: 'Modifier un article partenaire | Admin VEYRON', breadcrumb: 'Modifier un article' }
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Page non trouvée | VEYRON' }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title as string || 'VEYRON'
  
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const requiresPartner = to.matched.some(record => record.meta.requiresPartner)
  const isGuestRoute = to.matched.some(record => record.meta.guest)
  
  if (!authStore.user && authStore.isAuthenticated) {
    try {
      await authStore.loadUser()
    } catch {
    }
  }
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
    return
  }
  
  if (requiresPartner && !authStore.isPartner) {
    next({ name: 'home' })
    return
  }
  
  if (isGuestRoute && authStore.isAuthenticated) {
    next({ name: 'account' })
    return
  }
  
  next()
})

router.afterEach(() => {
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    mainContent.focus()
  }
})

export default router
