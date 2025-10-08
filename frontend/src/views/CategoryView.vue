<template>
  <div class="category-page">
    <div class="category-header">
      <h1>{{ categoryTitle }}</h1>
    </div>
    
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Chargement des produits...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="products.length === 0" class="no-products">
      <p>Aucun produit trouvé dans cette catégorie.</p>
    </div>
    
    <div v-else class="products-grid">      
      <div 
        v-for="product in products" 
        :key="product._id" 
        class="product-card"
        @click="navigateToProduct(product)"
      >
        <div class="product-image">
          <img :src="getImageUrl(product)" :alt="product.name" />
        </div>
        
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <div class="product-price">
            <template v-if="hasDiscount(product)">
              <div class="price-container">
                <span class="original-price">{{ formatPrice(product.price) }} EUR</span>
                <span class="discount-percentage">-{{ product.discount }}%</span>
                <span class="discounted-price">{{ formatPrice(product.discountPrice) }} EUR</span>
              </div>
            </template>
            <template v-else>
              <span class="current-price">
                {{ formatPrice(product.price) }} EUR
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';
import { getImageUrl as getImageUrlUtil } from '@/utils/imageUrl';

const props = defineProps({
  slug: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const router = useRouter();

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string | { _id: string, name: string, slug?: string };
  images?: Array<{ url: string, alt?: string, isMain?: boolean }>;
  image?: string;
  colors?: Array<{ name: string, code: string, images?: Array<{ url: string, alt?: string, isMain?: boolean }> }>;
  discount?: number;
  discountPrice?: number;
  slug?: string; // Ajout du champ slug
}

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const error = ref('');
const categorySlug = computed(() => {
  if (props.slug) {
    return props.slug;
  }
  
  if (route.params.slug) {
    return route.params.slug as string;
  }
  
  const pathSegments = route.path.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  return lastSegment;
});

const categoryTitle = computed(() => {
  const slug = categorySlug.value;
  if (slug === 'femme') return 'Collection Femme';
  if (slug === 'homme') return 'Collection Homme';
  if (slug === 'accessoires') return 'Accessoires';
  if (slug === 'collections') return 'Collections Exclusives';
  return 'Produits';
});

const getCategoryIdBySlug = async (slug: string): Promise<string | null> => {
  try {
    const response = await api.get('/categories');
    
    let categoriesList = [];
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      categoriesList = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      categoriesList = response.data;
    } else {
      return null;
    }
    
    
    const category = categoriesList.find(cat => 
      cat.slug === slug || 
      cat.name.toLowerCase() === slug.toLowerCase()
    );
    
    if (category) {
      return category._id;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories:', err);
    return null;
  }
};

const loadProducts = async () => {
  isLoading.value = true;
  error.value = '';
  products.value = [];
  
  try {
    const slug = categorySlug.value;
    const categoryId = await getCategoryIdBySlug(slug);
    
    if (!categoryId) {
      error.value = `Catégorie "${slug}" introuvable`;
      isLoading.value = false;
      return;
    }
    
    const response = await api.get(`/products?category=${categoryId}`);
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      products.value = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      products.value = response.data;
    } else {
      products.value = [];
    }
    
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des produits:', err);
    error.value = err.message || 'Erreur lors du chargement des produits';
  } finally {
    isLoading.value = false;
  }
};

const getImageUrl = (product: Product): string => {  
  if (product.images && product.images.length > 0) {
    const mainImage = product.images.find(img => img.isMain);
    const image = mainImage || product.images[0];
    
    if (image && image.url) {
      return getImageUrlUtil(image.url);
    }
  }
  
  if (typeof product.image === 'string') {
    return getImageUrlUtil(product.image);
  }
  
  return getImageUrlUtil('/placeholder.jpg');
};

const hasDiscount = (product: Product): boolean => {
  return !!product.discount && product.discount > 0 && !!product.discountPrice;
};

const getDiscountedPrice = (product: Product): number => {
  if (!product.discount || product.discount <= 0) return product.price;
  return product.discountPrice || product.price;
};

const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

const navigateToProduct = (product: Product) => {
  try {
    const productSlug = generateProductSlug(product);
    router.push(`/category/${categorySlug.value}/${productSlug}`);
  } catch (err) {
    console.error('Erreur lors de la navigation vers le produit:', err);
    router.push(`/category/${categorySlug.value}/${product._id}`);
  }
};

const generateProductSlug = (product: Product): string => {
  if (!product._id) {
    console.error('Produit sans ID valide:', product);
    return '';
  }
  
  if (product.slug) {
    if (product.slug.includes(product._id)) {
      return product.slug;
    }
    return `${product.slug}-${product._id}`;
  }
  let slug = '';
  if (product.name) {
    slug = product.name
      .toLowerCase()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } else {
    slug = 'produit';
  }
  
  return `${slug}-${product._id}`;
};

watch(categorySlug, (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    loadProducts();
  }
}, { immediate: false });

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.category-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-header h1 {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.1rem;
  margin: 0;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: #666;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  background-color: #fff;
  font-size: 0.9rem;
  min-width: 150px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 1rem;
  margin: 2rem 0;
  border-left: 3px solid #dc3545;
}

.no-products {
  text-align: center;
  padding: 4rem 0;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.product-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3/4;
  background-color: #f9f9f9;
  margin-bottom: 1rem;
}

.wishlist-button {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.wishlist-button:hover {
  background-color: rgba(255, 255, 255, 1);
}

.wishlist-button.active {
  background-color: rgba(255, 0, 0, 0.1);
}

.wishlist-button.active .material-icons {
  color: #ff0000;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #111;
  color: #fff;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.product-info {
  padding: 0.5rem 0;
}

.product-name {
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  color: #333;
}

.product-price {
  display: flex;
  flex-direction: column;
}

.price-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 0.9rem;
}

.discount-percentage {
  background-color: #000;
  color: white;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.discounted-price {
  font-weight: 600;
  color: #111;
  font-size: 1.1rem;
}

.current-price {
  font-weight: 500;
  color: #111;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 1rem;
}

.pagination-button {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.pagination-button:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover:not(.active) {
  background-color: #f5f5f5;
}

.page-number.active {
  background-color: #111;
  color: #fff;
  border-color: #111;
}

@media (max-width: 768px) {
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filters {
    width: 100%;
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-group select {
    width: 100%;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
}
</style>
