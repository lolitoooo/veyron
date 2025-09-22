<template>
  <nav aria-label="Fil d'Ariane" class="breadcrumb">
    <ol>
      <li>
        <router-link to="/" class="home-link">Veyron</router-link>
      </li>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <li class="separator">/</li>
        <li>
          <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path">
            {{ crumb.name }}
          </router-link>
          <span v-else class="current">{{ crumb.name }}</span>
        </li>
      </template>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const categoryNames = ref<Record<string, string>>({});
const productNames = ref<Record<string, string>>({});
const breadcrumbItems = ref<Array<{name: string, path: string}>>([]);

const getCategoryNameById = async (categoryId: string): Promise<string> => {
  if (categoryNames.value[categoryId]) {
    return categoryNames.value[categoryId];
  }
  
  try {
    const response = await axios.get(`http://localhost:3000/api/categories/${categoryId}`);
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
    const response = await axios.get(`http://localhost:3000/api/products/${productId}`);
    
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

const routeNameMap = {
  'home': 'Accueil',
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

const generateBreadcrumbItems = async () => {
  
  const result = [];
  const pathSegments = route.path.split('/').filter(segment => segment);
  
  let currentPath = '';
  
  const isProductInCategory = pathSegments.length >= 3 && 
                            pathSegments[0] === 'category' && 
                            /^[0-9a-f]{24}$/i.test(pathSegments[pathSegments.length - 1]);
    
  result.push({
    name: 'Accueil',
    path: '/'
  });
  
  if (isProductInCategory) {
    const categorySlug = pathSegments[1];
    const productId = pathSegments[2];
        
    result.push({
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      path: `/category/${categorySlug}`
    });
    
    try {
      const productName = await getProductNameById(productId);
      result.push({
        name: productName,
        path: `/category/${categorySlug}/${productId}`
      });
    } catch (error) {
      result.push({
        name: 'Produit',
        path: `/category/${categorySlug}/${productId}`
      });
    }
    
    breadcrumbItems.value = result;
    return;
  }
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    
    const matchedRoute = router.resolve(currentPath).matched[0];
    if (!matchedRoute) continue;
    
    const routeName = matchedRoute.name?.toString() || '';
    
    let name = '';
    
    if (routeName === 'product' && route.params.id) {
      const productId = route.params.id.toString();
      if (/^[0-9a-f]{24}$/i.test(productId)) {
        try {
          name = await getProductNameById(productId);
        } catch (error) {
          name = 'Produit';
        }
      } else {
        name = 'Produit';
      }
    } 
    else if (routeName === 'category' && route.params.slug) {
      if (/^[0-9a-f]{24}$/i.test(route.params.slug.toString())) {
        try {
          name = await getCategoryNameById(route.params.slug.toString());
        } catch (error) {
          name = 'Catégorie';
        }
      } else {
        name = route.params.slug.toString().charAt(0).toUpperCase() + route.params.slug.toString().slice(1);
      }
    } 
    else {
      name = routeNameMap[routeName] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    result.push({
      name,
      path: currentPath
    });
  }
  
  breadcrumbItems.value = result;
};

watch(
  () => route.fullPath,
  () => generateBreadcrumbItems(),
  { immediate: true }
);

const breadcrumbs = computed(() => {
  return breadcrumbItems.value;
});

onMounted(() => {
  generateBreadcrumbItems();
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
