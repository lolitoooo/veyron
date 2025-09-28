<template>
  <div class="product-detail-container">
    <div v-if="notification.show" class="notification" :class="notification.type">
      {{ notification.message }}
      <button class="close-btn" @click="closeNotification">×</button>
    </div>
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Chargement du produit...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="!product" class="no-product">
      <p>Produit non trouvé.</p>
    </div>
    
    <div v-else class="product-detail">
      <div class="product-gallery">
        <div class="main-image">
          <img :src="currentImage" :alt="product.name" />
        </div>
        
        <div class="thumbnails">
          <div 
            v-for="(image, index) in productImages" 
            :key="index" 
            class="thumbnail"
            :class="{ active: currentImageIndex === index }"
            @click="setCurrentImage(index)"
          >
            <img :src="image.url" :alt="`${product.name} - vue ${index + 1}`" />
          </div>
        </div>
      </div>
      
      <div class="product-info">
        <h1 class="product-name">{{ product.name }}</h1>
        <div class="product-price">
          <template v-if="hasDiscount(product)">
            <div class="price-container">
              <span class="original-price">{{ formatPrice(product.price) }} EUR</span>
              <span class="discount-badge">-{{ product.discount }}%</span>
              <span class="discounted-price">{{ formatPrice(getDiscountedPrice(product)) }} EUR</span>
            </div>
          </template>
          <template v-else>
            <span class="current-price">{{ formatPrice(product.price) }} EUR</span>
          </template>
        </div>
        
        <div v-if="product.colors && product.colors.length > 0" class="color-options">
          <div class="color-label">{{ selectedColor ? selectedColor.name : 'COULEUR' }}</div>
          <div class="color-swatches">
            <div 
              v-for="color in product.colors" 
              :key="color.code"
              class="color-swatch"
              :class="{ active: selectedColor && selectedColor.code === color.code }"
              :style="{ backgroundColor: color.code }"
              @click="selectColor(color)"
            ></div>
          </div>
        </div>
        
        <div v-if="product.sizes && product.sizes.length > 0" class="size-options">
          <div class="size-label">TAILLE</div>
          <div class="size-buttons">
            <button 
              v-for="size in product.sizes" 
              :key="size"
              class="size-button"
              :class="{ active: selectedSize === size }"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
        </div>
        
        <div class="product-description">
          <p>{{ product.description }}</p>
        </div>
        
        <div class="product-actions">
          <button 
            class="add-to-cart-button" 
            @click="addToCart"
            :disabled="!selectedSize || !selectedColor"
          >
            AJOUTER
          </button>
          <button 
            class="wishlist-button" 
            @click="toggleWishlist"
            :class="{ 'active': isInWishlist }"
            :aria-pressed="isInWishlist"
            aria-label="Ajouter aux favoris"
          >
            <span class="material-icons">
              {{ isInWishlist ? 'favorite' : 'favorite_border' }}
            </span>
          </button>
        </div>
        
        <div class="product-details">
          <div class="detail-section">
            <h3 @click="toggleSection('dimensions')" class="section-title">
              DIMENSIONS DU PRODUIT
              <span class="toggle-icon">{{ sections.dimensions ? '−' : '+' }}</span>
            </h3>
            <div v-if="sections.dimensions" class="section-content">
              <p>Informations sur les dimensions du produit.</p>
            </div>
          </div>
          
          <div class="detail-section">
            <h3 @click="toggleSection('composition')" class="section-title">
              COMPOSITION & CARACTÉRISTIQUES ENVIRONNEMENTALES
              <span class="toggle-icon">{{ sections.composition ? '−' : '+' }}</span>
            </h3>
            <div v-if="sections.composition" class="section-content">
              <p>Composition: 100% coton</p>
            </div>
          </div>
          
          <div class="detail-section">
            <h3 @click="toggleSection('availability')" class="section-title">
              VOIR DISPONIBILITÉ EN MAGASIN
              <span class="toggle-icon">{{ sections.availability ? '−' : '+' }}</span>
            </h3>
            <div v-if="sections.availability" class="section-content">
              <p>Vérifiez la disponibilité dans votre magasin le plus proche.</p>
            </div>
          </div>
          
          <div class="detail-section">
            <h3 @click="toggleSection('shipping')" class="section-title">
              LIVRAISON, ÉCHANGE ET RETOURS
              <span class="toggle-icon">{{ sections.shipping ? '−' : '+' }}</span>
            </h3>
            <div v-if="sections.shipping" class="section-content">
              <p>Informations sur la livraison, les échanges et les retours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/apiService';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useAuthStore } from '@/stores/auth';
import { getImageUrl } from '@/utils/imageUrl';

const route = useRoute();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

interface ProductImage {
  url: string;
  alt?: string;
  isMain?: boolean;
}

interface ProductColor {
  name: string;
  code: string;
  images?: ProductImage[];
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  discountPrice?: number;
  category: string | { _id: string, name: string };
  stock?: number;
  isActive?: boolean;
  images?: ProductImage[];
  image?: string;
  colors?: ProductColor[];
  sizes?: string[];
}
const product = ref<Product | null>(null);
const isLoading = ref(true);
const error = ref('');
const currentImageIndex = ref(0);
const selectedColor = ref<ProductColor | null>(null);
const selectedSize = ref<string | null>(null);
const isInWishlist = ref(false);
const sections = ref({
  dimensions: false,
  composition: false,
  availability: false,
  shipping: false
});

const notification = ref({
  show: false,
  message: '',
  type: 'success',
  timeout: null
});

const closeNotification = () => {
  notification.value.show = false;
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }
};

const loadProduct = async () => {
  const productId = route.params.id;
  if (!productId) {
    error.value = 'ID du produit manquant';
    isLoading.value = false;
    return;
  }
  
  try {
    const response = await api.get(`/products/${productId}`);
    
    if (response.data && response.data.data) {
      product.value = response.data.data;
    } else if (response.data) {
      product.value = response.data;
    } else {
      throw new Error('Format de réponse API inattendu');
    }
    
    if (product.value?.colors && product.value.colors.length > 0) {
      selectedColor.value = product.value.colors[0];
    }
    
    if (product.value?.sizes && product.value.sizes.length > 0) {
      selectedSize.value = product.value.sizes[0];
    }
    
    if (authStore.isAuthenticated && product.value) {
      checkWishlistStatus();
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du produit:', err);
    error.value = err.response?.data?.message || 'Erreur lors du chargement du produit';
  } finally {
    isLoading.value = false;
  }
};

const getFullImageUrl = (imagePath: string): string => {
  return getImageUrl(imagePath);
};

const productImages = computed(() => {
  if (!product.value) return [];
  
  if (selectedColor.value && selectedColor.value.images && selectedColor.value.images.length > 0) {
    return selectedColor.value.images.map(img => ({
      ...img,
      url: getFullImageUrl(img.url)
    }));
  }
  
  if (product.value.images && product.value.images.length > 0) {
    return product.value.images.map(img => ({
      ...img,
      url: getFullImageUrl(img.url)
    }));
  }
  
  if (product.value.image) {
    return [{
      url: getFullImageUrl(product.value.image),
      alt: product.value.name,
      isMain: true
    }];
  }
  
  return [{
    url: '/placeholder.jpg',
    alt: 'Image non disponible',
    isMain: true
  }];
});

const currentImage = computed(() => {
  if (productImages.value.length === 0) return '/placeholder.jpg';
  return productImages.value[currentImageIndex.value].url;
});

const formatPrice = (price: number) => {
  return price.toFixed(2).replace('.', ',');
};

const hasDiscount = (product: Product): boolean => {
  return !!product.discount && product.discount > 0;
};

const getDiscountedPrice = (product: Product): number => {
  if (!product.discount || product.discount <= 0) return product.price;
  
  if (product.discountPrice) return product.discountPrice;
  
  const discountFactor = (100 - product.discount) / 100;
  return parseFloat((product.price * discountFactor).toFixed(2));
};
const setCurrentImage = (index: number) => {
  if (productImages.value.length === 0) return;
  const max = productImages.value.length - 1;
  currentImageIndex.value = Math.min(Math.max(index, 0), max);
};

const nextImage = () => {
  if (productImages.value.length === 0) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length;
};

const prevImage = () => {
  if (productImages.value.length === 0) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + productImages.value.length) % productImages.value.length;
};

const selectColor = (color: ProductColor) => {
  selectedColor.value = color;
  currentImageIndex.value = 0;
};

const toggleSection = (section: keyof typeof sections.value) => {
  sections.value[section] = !sections.value[section];
};

const addToCart = async () => {
  
  if (!product.value || !selectedColor.value || !selectedSize.value) {
    notification.value = {
      show: true,
      message: 'Veuillez sélectionner une taille et une couleur',
      type: 'warning',
      timeout: null
    };
    notification.value.timeout = setTimeout(() => {
      notification.value.show = false;
    }, 3000);
    return;
  }
  
  let imageUrl = '';
  if (productImages.value.length > 0) {
    imageUrl = productImages.value[currentImageIndex.value].url;
  } else if (product.value.image) {
    imageUrl = getFullImageUrl(product.value.image);
  }
  
  const cartItem = {
    productId: product.value._id,
    name: product.value.name,
    price: hasDiscount(product.value) ? getDiscountedPrice(product.value) : product.value.price,
    quantity: 1,
    image: imageUrl,
    variant: {
      size: selectedSize.value,
      color: selectedColor.value.name,
      colorCode: selectedColor.value.code
    },
    variantId: `${product.value._id}-${selectedSize.value}-${selectedColor.value.name}`
  };
  
  
  try {
    await cartStore.addToCart(cartItem);
    
    notification.value = {
      show: true,
      message: `${product.value.name} (${selectedColor.value.name}, ${selectedSize.value}) ajouté au panier`,
      type: 'success',
      timeout: null
    };
    
    notification.value.timeout = setTimeout(() => {
      notification.value.show = false;
    }, 3000);
    
  } catch (error) {
    notification.value = {
      show: true,
      message: 'Erreur lors de l\'ajout au panier',
      type: 'error',
      timeout: null
    };
    
    notification.value.timeout = setTimeout(() => {
      notification.value.show = false;
    }, 3000);
  }
};

const checkWishlistStatus = async () => {
  if (!product.value || !authStore.isAuthenticated) return;
  
  try {
    if (wishlistStore.items.length > 0) {
      isInWishlist.value = wishlistStore.isInWishlist(product.value._id);
      return;
    }
    
    const result = await wishlistStore.checkWishlistItem(product.value._id);
    isInWishlist.value = result.inWishlist;
  } catch (error) {
    console.error('Erreur lors de la vérification des favoris:', error);
    isInWishlist.value = false;
  }
};

const toggleWishlist = async () => {
  if (!authStore.isAuthenticated) {
    notification.value = {
      show: true,
      message: 'Veuillez vous connecter pour ajouter ce produit à vos favoris',
      type: 'info',
      timeout: setTimeout(() => {
        notification.value.show = false;
      }, 3000)
    };
    return;
  }
  
  if (!product.value) return;
  
  try {
    if (isInWishlist.value) {
      await wishlistStore.removeProductFromWishlist(product.value._id);
      isInWishlist.value = false;
      
      notification.value = {
        show: true,
        message: 'Produit retiré de vos favoris',
        type: 'success',
        timeout: setTimeout(() => {
          notification.value.show = false;
        }, 3000)
      };
    } else {
      await wishlistStore.addToWishlist(product.value._id);
      isInWishlist.value = true;
      
      notification.value = {
        show: true,
        message: 'Produit ajouté à vos favoris',
        type: 'success',
        timeout: setTimeout(() => {
          notification.value.show = false;
        }, 3000)
      };
    }
  } catch (error: any) {
    notification.value = {
      show: true,
      message: error.message || 'Erreur lors de la gestion des favoris',
      type: 'error',
      timeout: setTimeout(() => {
        notification.value.show = false;
      }, 3000)
    };
  }
};

onMounted(() => {
  loadProduct();
  
  if (authStore.isAuthenticated) {
    wishlistStore.fetchWishlist();
  }
});
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background-color: #4caf50;
}

.notification.error {
  background-color: #f44336;
}

.notification.warning {
  background-color: #ff9800;
}

.notification.info {
  background-color: #2196f3;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 15px;
  padding: 0;
}

.product-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  overflow-x: hidden;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #333;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message, .no-product {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.product-gallery {
  display: flex;
  flex-direction: column;
}

.main-image {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: var(--color-bg);
  margin-bottom: 10px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.thumbnail {
  scroll-snap-align: start;
}

.thumbnail {
  width: 80px;
  height: 80px;
  background-color: #f5f5f5;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.thumbnail.active {
  opacity: 1;
  border: 1px solid #333;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-name {
  font-size: 1.5rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.price-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 1.2rem;
}

.discount-badge {
  background-color: #000;
  color: #fff;
  padding: 2px 8px;
  font-weight: 500;
  font-size: 1.1rem;
}

.discounted-price {
  font-weight: 600;
  color: #000;
  font-size: 1.5rem;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 10px 0 20px;
  color: #333;
}

.color-options, .size-options {
  margin-top: 10px;
}

.color-label, .size-label {
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.color-swatches {
  display: flex;
  gap: 10px;
}

.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #ddd;
}

.color-swatch.active {
  border: 2px solid #333;
}

.size-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.size-button {
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 0.9rem;
}

.size-button.active {
  background-color: #333;
  color: white;
  border-color: #333;
}

.product-description {
  margin-top: 20px;
  line-height: 1.6;
}

.product-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .product-actions {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px;
    margin: 0 -20px;
    z-index: 5;
    width: 100%;
  }
}

.add-to-cart-button {
  flex: 1;
  padding: 14px 22px;
  background-color: #111;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.12rem;
}
.add-to-cart-button:disabled { opacity: 0.5; cursor: not-allowed; }

.wishlist-button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
}
.wishlist-button:hover { border-color: #bbb; }

.wishlist-button.active {
  background-color: #f8e0e0;
  border-color: #e57373;
}

.wishlist-button.active .material-icons {
  color: #e53935;
}

.product-details {
  margin-top: 40px;
}

.detail-section {
  border-top: 1px solid #ddd;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 400;
  text-transform: uppercase;
  cursor: pointer;
}

.toggle-icon {
  font-size: 1.2rem;
}

.section-content {
  padding-bottom: 15px;
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 992px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .main-image {
    height: 480px;
  }

  .product-name {
    font-size: 1.4rem;
  }

  .discounted-price, .product-price { font-size: 1.3rem; }
}

@media (max-width: 768px) {
  .main-image {
    height: 420px;
  }

  .thumbnail { width: 70px; height: 70px; }

  .color-swatch { width: 34px; height: 34px; }

  .size-button { padding: 10px 14px; font-size: 1rem; }
}

@media (max-width: 480px) {
  .main-image { height: 360px; }
  .product-name { font-size: 1.25rem; }
  .discounted-price, .product-price { font-size: 1.15rem; }
}
</style>
