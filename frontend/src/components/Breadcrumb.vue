<template>
  <nav aria-label="Fil d'Ariane" class="breadcrumb">
    <ol>
      <li>
        <router-link to="/" class="home-link">Veyron</router-link>
      </li>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <li class="separator">/</li>
        <li>
          <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.to">
            {{ crumb.label }}
          </router-link>
          <span v-else class="current">{{ crumb.label }}</span>
        </li>
      </template>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';

const route = useRoute();
const router = useRouter();
const categoryNames = ref<Record<string, string>>({});
const productNames = ref<Record<string, string>>({});

const breadcrumbItems = ref<Array<{label: string, to: string}>>([]);

const routeNameMap: Record<string, string> = {
  'account': 'Mon Compte',
  'wishlist': 'Favoris',
  'orders': 'Commandes',
  'profile': 'Profil',
  'addresses': 'Adresses',
  'cart': 'Panier',
  'checkout': 'Paiement',
  'product': 'Produit',
  'category': 'Catégorie',
  'search': 'Recherche',
  'about': 'À propos',
  'contact': 'Contact',
  'terms': 'Conditions Générales',
  'privacy': 'Politique de Confidentialité',
  'shipping': 'Livraison',
  'return-policy': 'Politique de Retour'
};

const getCategoryNameById = async (categoryId: string): Promise<string> => {
  if (categoryNames.value[categoryId]) {
    return categoryNames.value[categoryId];
  }
  
  try {
    const response = await api.get(`/categories/${categoryId}`);
    const category = response.data;
    
    if (category && category.name) {
      categoryNames.value[categoryId] = category.name;
      return category.name;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de la catégorie ${categoryId}:`, error);
  }
  
  return 'Catégorie';
};

const getProductNameById = async (productId: string): Promise<string> => {
  if (productNames.value[productId]) {
    return productNames.value[productId];
  }
  
  try {
    const response = await api.get(`/products/${productId}`);
    
    let productData;
    
    if (response.data && response.data.success && response.data.data) {
      productData = response.data.data;
    } else if (response.data && response.data.name) {
      productData = response.data;
    } else {
      return 'Produit';
    }
    
    if (productData && productData.name) {
      productNames.value[productId] = productData.name;
      return productData.name;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit ${productId}:`, error);
  }
  
  return 'Produit';
};

const getRoutePath = (segments: any[]): string => {
  let path = '';
  
  for (const segment of segments) {
    if (segment.path.startsWith('/')) {
      path = segment.path;
    } else {
      path += '/' + segment.path;
    }
  }
  
  Object.entries(route.params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value as string);
  });
  
  return path;
};

const generateBreadcrumbs = async () => {
  const result: Array<{label: string, to: string}> = [];
  const matchedRoutes = route.matched;
  
  if (route.path.includes('/category/') && route.params.id) {
    const categorySlug = route.params.slug as string;
    const productId = route.params.id as string;
    
    result.push({
      label: 'Catégories',
      to: '/category'
    });
    
    result.push({
      label: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      to: `/category/${categorySlug}`
    });
    
    if (/^[0-9a-f]{24}$/i.test(productId)) {
      const productName = await getProductNameById(productId);
      result.push({
        label: productName,
        to: route.path
      });
    }
    
    breadcrumbItems.value = result;
    return;
  }
  
  if (route.path.includes('/account/orders/') && route.params.id) {
    const orderId = route.params.id as string;
    
    result.push({
      label: 'Mon compte',
      to: '/account'
    });
    
    result.push({
      label: 'Mes commandes',
      to: '/account/orders'
    });
    
    result.push({
      label: 'Détail de commande',
      to: route.path
    });
    
    breadcrumbItems.value = result;
    return;
  }
  
  if (route.path === '/category/homme' || route.path === '/category/femme' || route.path === '/category/accessoires') {
    const categorySlug = route.path.split('/').pop() || '';
    
    result.push({
      label: 'Catégories',
      to: '/category'
    });
    
    result.push({
      label: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      to: route.path
    });
    
    breadcrumbItems.value = result;
    return;
  }
  
  if (route.path.startsWith('/admin')) {
    result.push({
      label: 'Administration',
      to: '/admin'
    });
    
    if (route.path.includes('/admin/orders/') && route.params.id) {
      result.push({
        label: 'Gestion des commandes',
        to: '/admin/orders'
      });
    }
    
    if ((route.path.includes('/admin/users/') && route.params.id) && 
        (route.path.includes('/detail') || route.path.includes('/edit') || route.path.includes('/delete'))) {
      result.push({
        label: 'Gestion des utilisateurs',
        to: '/admin/users'
      });
    }
    
    if (route.path.includes('/admin/products/') && route.params.id && route.path.includes('/edit')) {
      result.push({
        label: 'Gestion des produits',
        to: '/admin/products'
      });
    }
    
    if (route.path === '/admin/products/create') {
      result.push({
        label: 'Gestion des produits',
        to: '/admin/products'
      });
    }
    
    if (route.path === '/admin/users/create') {
      result.push({
        label: 'Gestion des utilisateurs',
        to: '/admin/users'
      });
    }
  }
  
  const currentPath = '';
  
  for (let i = 1; i < matchedRoutes.length; i++) {
    const routeItem = matchedRoutes[i];
    const routeName = routeItem.name?.toString() || '';
    
    if (!routeName || routeName === 'MainLayout') {
      continue;
    }
    
    let label = '';
    
    if (routeItem.meta && routeItem.meta.breadcrumb) {
      label = routeItem.meta.breadcrumb as string;
    } 
    else if (routeNameMap[routeName]) {
      label = routeNameMap[routeName];
    } 
    else if (routeName === 'category' && route.params.slug) {
      const slug = route.params.slug as string;
      if (/^[0-9a-f]{24}$/i.test(slug)) {
        label = await getCategoryNameById(slug);
      } else {
        label = slug.charAt(0).toUpperCase() + slug.slice(1);
      }
    } 
    else {
      label = routeName || routeItem.path.split('/').pop() || '';
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }
    
    const path = getRoutePath(matchedRoutes.slice(0, i + 1));
    
    if (result.findIndex(item => item.to === path) === -1) {
      result.push({
        label,
        to: path
      });
    }
  }
  
  breadcrumbItems.value = result;
};

const breadcrumbs = computed(() => {
  return breadcrumbItems.value;
});

watch(
  () => route.fullPath,
  async () => {
    await generateBreadcrumbs();
  },
  { immediate: true }
);

onMounted(async () => {
  await generateBreadcrumbs();
});
</script>

<style scoped>
.breadcrumb {
  padding-top: 3rem;
  font-size: 0.875rem;
  background-color: transparent;
  margin-bottom: -3rem;
  position: relative;
  z-index: 10;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .breadcrumb {
    display: none;
  }
}

.breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
}

.breadcrumb li {
  display: inline-flex;
  align-items: center;
}

.breadcrumb a {
  color: var(--color-primary, #000);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: var(--color-accent, #666);
  text-decoration: underline;
}

.breadcrumb .current {
  color: var(--color-text-light, #666);
  font-weight: 500;
}

.breadcrumb .separator {
  margin: 0 0.5rem;
  color: var(--color-text-light, #666);
}

.breadcrumb .home-link {
  font-weight: 600;
}
</style>
