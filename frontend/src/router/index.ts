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
          meta: { title: 'VEYRON - Mode de luxe' }
        },
        {
          path: 'category',
          name: 'categories',
          component: () => import('@/views/CategoriesView.vue'),
          meta: { title: 'Nos Collections | VEYRON' }
        },
        {
          path: 'category/:slug',
          name: 'category',
          component: () => import('@/views/CategoryView.vue'),
          props: true,
          meta: { title: 'Catégorie | VEYRON' }
        },
        {
          path: 'category/:slug/:id',
          name: 'product-in-category',
          component: () => import('@/views/ProductDetailView.vue'),
          props: true,
          meta: { title: 'Produit | VEYRON' }
        },
        {
          path: 'category/homme',
          name: 'category-men',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'homme' },
          meta: { title: 'Collection Homme | VEYRON' }
        },
        {
          path: 'category/femme',
          name: 'category-women',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'femme' },
          meta: { title: 'Collection Femme | VEYRON' }
        },
        {
          path: 'category/accessoires',
          name: 'category-accessories',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'accessoires' },
          meta: { title: 'Collection Accessoires | VEYRON' }
        },
        {
          path: 'category/collections',
          name: 'category-collections',
          component: () => import('@/views/CategoryView.vue'),
          props: { slug: 'collections' },
          meta: { title: 'Collections | VEYRON' }
        },
        {
          path: 'product/:id',
          name: 'product',
          component: () => import('@/views/ProductDetailView.vue'),
          meta: { title: 'Produit | VEYRON' }
        },
        {
          path: 'cart',
          name: 'cart',
          component: () => import('@/views/CartView.vue'),
          meta: { title: 'Panier | VEYRON', requiresAuth: true }
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: () => import('@/views/CheckoutView.vue'),
          meta: { title: 'Paiement | VEYRON', requiresAuth: true }
        },
        {
          path: 'payment-result',
          name: 'payment-result',
          component: () => import('@/views/PaymentResultView.vue'),
          meta: { title: 'Résultat du paiement | VEYRON', requiresAuth: true }
        },
        {
          path: 'payment-success',
          name: 'payment-success',
          component: () => import('@/views/PaymentSuccessView.vue'),
          meta: { title: 'Paiement réussi | VEYRON', requiresAuth: true }
        },
        {
          path: 'payment-failed',
          name: 'payment-failed',
          component: () => import('@/views/PaymentFailedView.vue'),
          meta: { title: 'Paiement échoué | VEYRON', requiresAuth: true }
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/SearchView.vue'),
          meta: { title: 'Recherche | VEYRON' }
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
          meta: { title: 'À propos | VEYRON' }
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('@/views/ContactView.vue'),
          meta: { title: 'Contact | VEYRON' }
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('@/views/legal/TermsView.vue'),
          meta: { title: 'Conditions générales | VEYRON' }
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/legal/PrivacyView.vue'),
          meta: { title: 'Politique de confidentialité | VEYRON' }
        },
        {
          path: 'legal',
          name: 'legal',
          component: () => import('@/views/legal/LegalView.vue'),
          meta: { title: 'Mentions légales | VEYRON' }
        },
        {
          path: 'sustainability',
          name: 'sustainability',
          component: () => import('@/views/legal/SustainabilityView.vue'),
          meta: { title: 'Développement durable | VEYRON' }
        },
        {
          path: 'careers',
          name: 'careers',
          component: () => import('@/views/legal/CareersView.vue'),
          meta: { title: 'Carrières | VEYRON' }
        },
        {
          path: 'faq',
          name: 'faq',
          component: () => import('@/views/legal/FaqView.vue'),
          meta: { title: 'FAQ | VEYRON' }
        },
        {
          path: 'returns',
          name: 'returns',
          component: () => import('@/views/legal/ReturnPolicyView.vue'),
          meta: { title: 'Retours et échanges | VEYRON' }
        },
        {
          path: 'shipping',
          name: 'shipping',
          component: () => import('@/views/legal/ShippingView.vue'),
          meta: { title: 'Livraison | VEYRON' }
        },
        {
          path: 'cookies',
          name: 'cookies',
          component: () => import('@/views/legal/CookiesView.vue'),
          meta: { title: 'Politique des cookies | VEYRON' }
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
      path: '/account',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'account',
          component: () => import('@/views/account/AccountView.vue'),
          meta: { title: 'Mon compte | VEYRON' }
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/OrdersView.vue'),
          meta: { title: 'Mes commandes | VEYRON' }
        },
        {
          path: 'orders/:id',
          name: 'order-detail',
          component: () => import('@/views/account/OrderDetailView.vue'),
          meta: { title: 'Détail de commande | VEYRON' }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/account/ProfileView.vue'),
          meta: { title: 'Mon profil | VEYRON' }
        },
        {
          path: 'addresses',
          name: 'addresses',
          component: () => import('@/views/account/AddressesView.vue'),
          meta: { title: 'Mes adresses | VEYRON' }
        },
        {
          path: 'wishlist',
          name: 'wishlist',
          component: () => import('@/views/account/WishlistView.vue'),
          meta: { title: 'Mes favoris | VEYRON' }
        },
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
          meta: { title: 'Tableau de bord | Admin VEYRON' }
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/views/admin/ProductsView.vue'),
          meta: { title: 'Gestion des produits | Admin VEYRON' }
        },
        {
          path: 'products/create',
          name: 'admin-product-create',
          component: () => import('@/views/admin/ProductFormView.vue'),
          meta: { title: 'Créer un produit | Admin VEYRON' }
        },
        {
          path: 'products/:id/edit',
          name: 'admin-product-edit',
          component: () => import('@/views/admin/ProductFormView.vue'),
          meta: { title: 'Modifier un produit | Admin VEYRON' }
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/views/admin/CategoriesView.vue'),
          meta: { title: 'Gestion des catégories | Admin VEYRON' }
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/views/admin/OrdersView.vue'),
          meta: { title: 'Gestion des commandes | Admin VEYRON' }
        },
        {
          path: 'orders/:id',
          name: 'admin-order-detail',
          component: () => import('@/views/admin/OrderDetailView.vue'),
          meta: { title: 'Détail de commande | Admin VEYRON' }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { title: 'Gestion des utilisateurs | Admin VEYRON' }
        },
        {
          path: 'users/:id/detail',
          name: 'admin-user-detail',
          component: () => import('@/views/admin/UserDetailView.vue'),
          meta: { title: 'Détail de l\'utilisateur | Admin VEYRON' }
        },
        {
          path: 'users/:id/edit',
          name: 'admin-user-edit',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Modifier l\'utilisateur | Admin VEYRON' }
        },
        {
          path: 'users/create',
          name: 'admin-user-create',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Créer un utilisateur | Admin VEYRON' }
        },
        {
          path: 'statistics',
          name: 'admin-statistics',
          component: () => import('@/views/admin/StatisticsView.vue'),
          meta: { title: 'Statistiques avancées | Admin VEYRON' }
        },
        {
          path: 'users/:id/delete',
          name: 'admin-user-delete',
          component: () => import('@/views/admin/UserFormView.vue'),
          meta: { title: 'Supprimer l\'utilisateur | Admin VEYRON' }
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
  const isGuestRoute = to.matched.some(record => record.meta.guest)
  
  if (!authStore.user && authStore.isAuthenticated) {
    try {
      await authStore.loadUser()
    } catch (error) {
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
  
  if (isGuestRoute && authStore.isAuthenticated) {
    next({ name: 'account' })
    return
  }
  
  next()
})

export default router
