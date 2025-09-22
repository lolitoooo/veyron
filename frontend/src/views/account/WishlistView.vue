<template>
  <div class="wishlist-page">
    <div class="page-header">
      <h1>Mes favoris</h1>
      <p>Gérez vos produits favoris</p>
    </div>

    <div class="wishlist-content">
      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement de vos favoris...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!wishlist || wishlist.length === 0" class="empty-state">
        <i class="material-icons">favorite_border</i>
        <p>Vous n'avez pas encore de produits favoris.</p>
        <router-link :to="{ name: 'home' }" class="btn-primary">Découvrir nos produits</router-link>
      </div>

      <div v-else class="wishlist-grid">
        <div v-for="item in wishlist" :key="item._id" class="wishlist-item">
          <div class="product-card">
            <div class="product-image">
              <img 
                :src="getFullImageUrl(item.product.images[0].url)" 
                :alt="item.product.name" 
              />
              <button 
                @click="removeFromWishlist(item._id)" 
                class="remove-btn"
                title="Retirer des favoris"
              >
                <i class="material-icons">close</i>
              </button>
            </div>
            <div class="product-info">
              <h3>{{ item.product.name }}</h3>
              <div class="product-price">
                <template v-if="hasDiscount(item.product)">
                  <div class="price-container">
                    <span class="original-price">{{ formatPrice(item.product.price) }}</span>
                    <span class="discount-percentage">-{{ item.product.discount }}%</span>
                    <span class="discounted-price">{{ formatPrice(item.product.discountPrice) }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="current-price">{{ formatPrice(item.product.price) }}</span>
                </template>
              </div>
              <div class="product-actions">
                <router-link :to="getProductUrl(item.product)" class="btn-secondary">
                  Voir le produit
                </router-link>
                <button @click="addToCart(item.product)" class="btn-primary">
                  <i class="material-icons">shopping_cart</i>
                  Ajouter au panier
                </button>
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
import { useAuthStore } from '@/stores/auth';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';
import axios from 'axios';

const authStore = useAuthStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

const wishlist = computed(() => wishlistStore.items);
const loading = computed(() => wishlistStore.loading);
const error = computed(() => wishlistStore.error);

const categoriesCache = ref({});
const loadingCategories = ref(false);

const loadCategories = async () => {
  try {
    loadingCategories.value = true;
    const response = await axios.get('/api/categories');
    
    let categories = [];
    if (response.data && response.data.data) {
      categories = response.data.data;
    } else if (Array.isArray(response.data)) {
      categories = response.data;
    } else {
      console.error('Format de réponse inattendu pour les catégories');
      return;
    }
    
    if (Array.isArray(categories)) {
      categories.forEach(category => {
        if (category && category._id) {
          categoriesCache.value[category._id] = category;
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
  } finally {
    loadingCategories.value = false;
  }
};

const loadWishlist = async () => {
  if (!authStore.isAuthenticated || !authStore.user) {
    return;
  }
  
  await wishlistStore.fetchWishlist();
};

const removeFromWishlist = async (wishlistItemId) => {
  try {
    await wishlistStore.removeFromWishlist(wishlistItemId);
  } catch (err) {
    console.error('Erreur lors de la suppression du favori:', err);
  }
};

const addToCart = (product) => {
  cartStore.addToCart({
    product: product._id,
    name: product.name,
    price: product.price,
    image: product.images[0].url,
    quantity: 1
  });
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const hasDiscount = (product) => {
  return product && product.discount && product.discount > 0 && product.discountPrice;
};

const getFullImageUrl = (imagePath: string): string => {
  if (!imagePath) return '/placeholder.jpg';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  } else {
    const serverUrl = 'http://localhost:3000';
    if (imagePath.startsWith('/')) {
      return `${serverUrl}${imagePath}`;
    } else {
      return `${serverUrl}/${imagePath}`;
    }
  }
};

const getProductUrl = (product) => {
  
  if (product.category && typeof product.category === 'string' && categoriesCache.value[product.category]) {
    const categorySlug = categoriesCache.value[product.category].slug;
    return `/category/${categorySlug}/${product._id}`;
  }
  
};

onMounted(async () => {
  await loadCategories();
  await loadWishlist();
});
</script>

<style scoped>
.wishlist-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.loading-spinner, .error-message, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner i, .error-message i, .empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.empty-state i {
  color: #ccc;
}

.error-message i {
  color: var(--error-color);
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.product-image {
  position: relative;
  height: 430px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #f5f5f5;
}

.remove-btn i {
  font-size: 18px;
  color: #666;
}

.product-info {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.product-price {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.price-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
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
  color: var(--primary-color);
  font-size: 1.1rem;
}

.current-price {
  font-weight: bold;
  color: var(--primary-color);
}

.product-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e5e5e5;
}

@media (max-width: 768px) {
  .wishlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .product-image {
    height: 220px;
  }
}
</style>
