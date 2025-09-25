<template>
  <div class="search-view">
    <div class="container">
      <h1>Recherche</h1>
      
      <div class="search-form">
        <div class="search-input">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Rechercher un produit..." 
            @keyup.enter="performSearch"
          />
          <button @click="performSearch" class="search-button">
            <i class="material-icons">search</i>
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Recherche en cours...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="performSearch" class="retry-button">Réessayer</button>
      </div>
      
      <div v-else-if="searchPerformed && results.length === 0" class="no-results">
        <p>Aucun résultat trouvé pour "<strong>{{ searchQuery }}</strong>"</p>
        <p>Essayez avec d'autres mots-clés.</p>
      </div>
      
      <div v-else-if="searchPerformed" class="search-results">
        <h2>Résultats pour "{{ searchQuery }}" ({{ results.length }})</h2>
        
        <div class="products-grid">      
          <div 
            v-for="product in results" 
            :key="product._id" 
            class="product-card"
            @click="navigateToProduct(product._id, product)"
          >
            <div class="product-image">
              <img :src="getFullImageUrl(product.images[0].url)" :alt="product.name" />
            </div>
            
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">
                <template v-if="product.discountPrice">
                  <div class="price-container">
                    <span class="original-price">{{ formatPrice(product.price) }} EUR</span>
                    <span class="discount-percentage" v-if="product.discount">-{{ product.discount }}%</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWishlistStore } from '@/stores/wishlist';
import { useAuthStore } from '@/stores/auth';
import { getImageUrl as getFullImageUrl } from '@/utils/imageUrl';

const route = useRoute();
const router = useRouter();
const searchQuery = ref(route.query.q?.toString() || '');
const searchPerformed = ref(false);
const loading = ref(false);
const error = ref('');
const results = ref<any[]>([]);

const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.value)}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    results.value = data.products || [];
    searchPerformed.value = true;
  } catch (err) {
    console.error('Erreur lors de la recherche:', err);
    error.value = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
};

const isInWishlist = (productId: string) => {
  return wishlistStore.isInWishlist(productId);
};
const toggleWishlist = async (product: any, event: Event) => {
  event.stopPropagation();
  
  if (!authStore.isAuthenticated) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    if (isInWishlist(product.id)) {
      await wishlistStore.removeFromWishlist(product.id);
    } else {
      await wishlistStore.addToWishlist(product);
    }
  } catch (error) {
    console.error('Erreur lors de la modification des favoris:', error);
  }
};

const navigateToProduct = (productId: string, product?: any) => {
  
  if (product) {
    if (product.category) {
      if (typeof product.category === 'object' && product.category.slug) {
        router.push(`/category/${product.category.slug}/${productId}`);
        return;
      }
      else if (typeof product.category === 'object' && product.category.name) {
        const categorySlug = product.category.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '');
        router.push(`/category/${categorySlug}/${productId}`);
        return;
      }
    }
  }
};

onMounted(() => {
  if (searchQuery.value) {
    performSearch();
  }
  
  if (authStore.isAuthenticated) {
    wishlistStore.fetchWishlist();
  }
});
</script>

<style scoped>
.search-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  font-family: var(--font-heading);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.search-form {
  margin-bottom: 2rem;
}

.search-input {
  display: flex;
  margin-bottom: 1.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.search-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-right: none;
  font-size: 1rem;
}

.search-button {
  padding: 0 1.5rem;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
}

.loading, .error, .no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.spinner {
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

.no-results {
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

.retry-button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: none;
  background: #000;
  color: #fff;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
}
</style>
