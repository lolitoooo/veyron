<template>
  <div class="product-view">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement du produit...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchProduct" class="btn-retry">Réessayer</button>
      </div>
      
      <div v-else-if="product" class="product-container">
        <div class="product-gallery">
          <div class="main-image">
            <img :src="currentImage" :alt="product.name" />
          </div>
          <div class="thumbnails" v-if="displayImages && displayImages.length > 0">
            <div 
              v-for="(image, index) in displayImages" 
              :key="index" 
              class="thumbnail"
              @click="selectImage(image.url)"
              :class="{ 'active': currentImage === image.url }"
            >
              <img :src="image.url" :alt="image.alt || `${product.name} - vue ${index + 1}`" />
            </div>
          </div>
        </div>
        
        <div class="product-info">
          <h1 class="product-name">{{ product.name }}</h1>
          
          <div class="product-price">
            <span v-if="product.discountPrice" class="discount-price">{{ formatPrice(product.discountPrice) }}</span>
            <span :class="{ 'original-price': product.discountPrice }">{{ formatPrice(selectedVariant?.price || product.price) }}</span>
          </div>
          
          <div class="product-availability">
            <span v-if="stockAvailable" class="in-stock">En stock ({{ stockAvailable }})</span>
            <span v-else class="out-of-stock">Rupture de stock</span>
          </div>
          
          <div class="product-description">
            <p>{{ product.description }}</p>
          </div>
          
          <div class="product-options" v-if="product.colors && product.colors.length > 0">
            <div class="option">
              <h3>Couleur</h3>
              <div class="color-options">
                <button 
                  v-for="color in product.colors" 
                  :key="color.name"
                  class="color-option"
                  :class="{ 'selected': selectedColor === color.name }"
                  @click="selectColor(color)"
                  :style="{ backgroundColor: color.code }"
                  :title="color.name"
                >
                  <span class="color-check" v-if="selectedColor === color.name">✓</span>
                </button>
              </div>
              <p class="selected-option-name">{{ selectedColor }}</p>
            </div>
          </div>
          
          <div class="product-options" v-if="product.sizes && product.sizes.length > 0">
            <div class="option">
              <h3>Taille</h3>
              <div class="size-options">
                <button 
                  v-for="size in product.sizes" 
                  :key="size"
                  class="size-option"
                  :class="{ 
                    'selected': selectedSize === size,
                    'disabled': !isSizeAvailable(size)
                  }"
                  @click="selectSize(size)"
                  :disabled="!isSizeAvailable(size)"
                >
                  {{ size }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <div class="quantity-selector">
              <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
              <input type="number" v-model.number="quantity" min="1" :max="stockAvailable" />
              <button @click="increaseQuantity" :disabled="quantity >= stockAvailable">+</button>
            </div>
            
            <button 
              @click="addToCart" 
              class="add-to-cart-btn"
              :disabled="!stockAvailable || !selectedSize || !selectedColor"
            >
              Ajouter au panier
            </button>
          </div>
          
          <div class="product-details">
            <div class="detail" v-if="product.brand">
              <h3>Marque</h3>
              <p>{{ product.brand }}</p>
            </div>
            
            <div class="detail" v-if="product.attributes && product.attributes.length > 0">
              <h3>Caractéristiques</h3>
              <ul>
                <li v-for="(attr, index) in product.attributes" :key="index">
                  <strong>{{ attr.name }}:</strong> {{ attr.value }}
                </li>
              </ul>
            </div>
            
            <div class="shipping">
              <h3>Livraison</h3>
              <p>Livraison gratuite pour toute commande supérieure à 150€</p>
              <p>Livraison en 2-4 jours ouvrables</p>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="not-found">
        <p>Produit non trouvé</p>
        <router-link to="/" class="btn-home">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const product = ref(null);
const loading = ref(true);
const error = ref('');
const quantity = ref(1);

const selectedColor = ref('');
const selectedSize = ref('');
const currentImage = ref('');
const fetchProduct = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.get(`/api/products/${route.params.id}`);
    product.value = response.data;
    
    if (product.value) {
      if (product.value.colors && product.value.colors.length > 0) {
        selectColor(product.value.colors[0]);
      }
      
      if (product.value.sizes && product.value.sizes.length > 0) {
        for (const size of product.value.sizes) {
          if (isSizeAvailable(size)) {
            selectedSize.value = size;
            break;
          }
        }
      }
      
      initializeMainImage();
    }
    
    loading.value = false;
  } catch (err) {
    error.value = "Une erreur est survenue lors du chargement du produit.";
    loading.value = false;
    console.error(err);
  }
};

const initializeMainImage = () => {
  if (!product.value) return;
  
  if (selectedColor.value && product.value.colors) {
    const colorObj = product.value.colors.find(c => c.name === selectedColor.value);
    if (colorObj && colorObj.images && colorObj.images.length > 0) {
      const mainImage = colorObj.images.find(img => img.isMain);
      if (mainImage) {
        currentImage.value = mainImage.url;
        return;
      }
      currentImage.value = colorObj.images[0].url;
      return;
    }
  }
  
  if (product.value.images && product.value.images.length > 0) {
    const mainImage = product.value.images.find(img => img.isMain);
    if (mainImage) {
      currentImage.value = mainImage.url;
      return;
    }
    currentImage.value = product.value.images[0].url;
    return;
  }
  
  currentImage.value = 'https://via.placeholder.com/600x800?text=Image+non+disponible';
};

const displayImages = computed(() => {
  if (!product.value) return [];
  
  if (selectedColor.value && product.value.colors) {
    const colorObj = product.value.colors.find(c => c.name === selectedColor.value);
    if (colorObj && colorObj.images && colorObj.images.length > 0) {
      return colorObj.images;
    }
  }
  
  return product.value.images || [];
});

const selectColor = (color) => {
  selectedColor.value = color.name;
  
  if (color.images && color.images.length > 0) {
    const mainImage = color.images.find(img => img.isMain);
    currentImage.value = mainImage ? mainImage.url : color.images[0].url;
  }
  
  if (selectedSize.value && !isSizeAvailable(selectedSize.value)) {
    const availableSize = product.value.sizes.find(size => isSizeAvailable(size));
    if (availableSize) {
      selectedSize.value = availableSize;
    } else {
      selectedSize.value = '';
    }
  }
};

const selectSize = (size) => {
  if (isSizeAvailable(size)) {
    selectedSize.value = size;
  }
};

const isSizeAvailable = (size) => {
  if (!product.value || !selectedColor.value) return false;
  
  const variant = product.value.variants.find(v => 
    v.size === size && v.color === selectedColor.value
  );
  
  return variant && variant.stock > 0;
};

const selectedVariant = computed(() => {
    if (!product.value || !selectedColor.value || !selectedSize.value) {
    return null;
  }
  
  if (!product.value.variants || !Array.isArray(product.value.variants)) {
    console.error('Le produit n\'a pas de tableau de variantes valide');
    return null;
  }
  
  const variant = product.value.variants.find(v => 
    v.size === selectedSize.value && v.color === selectedColor.value
  );
  
  return variant;
});

const stockAvailable = computed(() => {
  if (!selectedVariant.value) return 0;
  return selectedVariant.value.stock;
});

const selectImage = (imageUrl) => {
  currentImage.value = imageUrl;
};

const increaseQuantity = () => {
  if (!stockAvailable.value) return;
  if (quantity.value < stockAvailable.value) {
    quantity.value++;
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const addToCart = () => {
  if (!product.value || !selectedVariant.value || !stockAvailable.value) {
    notification.value = {
      show: true,
      type: 'error',
      message: 'Veuillez sélectionner une taille et une couleur'
    };
    return;
  }
  
  const cartItem = {
    productId: product.value._id,
    name: product.value.name,
    price: selectedVariant.value.price || product.value.price,
    quantity: quantity.value,
    image: currentImage.value,
    variant: {
      size: selectedSize.value,
      color: selectedColor.value,
      colorCode: product.value.colors.find(c => c.name === selectedColor.value)?.code
    },
    variantId: selectedVariant.value._id
  };
  
  
  try {
    cartStore.addToCart(cartItem);
    
    alert(`${product.value.name} (${selectedColor.value}, ${selectedSize.value}) ajouté au panier`);
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
};

watch(selectedVariant, () => {
  quantity.value = 1;
});
onMounted(() => {
  fetchProduct();
});
</script>

<style scoped>
.product-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.loading, .error, .not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #000;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.product-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.product-gallery {
  flex: 1;
  min-width: 300px;
}

.main-image {
  margin-bottom: 1rem;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.main-image img:hover {
  transform: scale(1.05);
}

.thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.3s ease, transform 0.2s ease;
  overflow: hidden;
  border-radius: 4px;
}

.thumbnail:hover {
  border-color: #000;
  transform: translateY(-2px);
}

.thumbnail.active {
  border: 2px solid #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  min-width: 300px;
}

.product-name {
  font-family: var(--font-heading);
  font-size: 2rem;
  margin-bottom: 1rem;
}

.product-price {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.discount-price {
  color: #d32f2f;
  margin-right: 1rem;
}

.original-price {
  text-decoration: line-through;
  color: var(--color-text-light);
  font-size: 1.2rem;
}

.product-availability {
  margin-bottom: 1rem;
}

.in-stock {
  color: #388e3c;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}

.in-stock::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #388e3c;
  margin-right: 6px;
}

.out-of-stock {
  color: #d32f2f;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}

.out-of-stock::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d32f2f;
  margin-right: 6px;
}

.product-description {
  margin-bottom: 2rem;
  line-height: 1.6;
}

.product-options {
  margin-bottom: 2rem;
}

.option {
  margin-bottom: 1rem;
}

.option h3 {
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}

.option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.option-values button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-values button:hover {
  background: #f5f5f5;
}

.option-values button.selected {
  background: #000;
  color: #fff;
  border-color: #000;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, border-color 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #000;
}

.color-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.selected-option-name {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.size-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.size-option {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-option:hover:not(.disabled) {
  border-color: #000;
  background-color: #f9f9f9;
}

.size-option.selected {
  background-color: #000;
  color: white;
  border-color: #000;
}

.size-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: line-through;
}

.product-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
}

.quantity-selector button {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.quantity-selector button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-selector input {
  width: 50px;
  height: 40px;
  border: none;
  text-align: center;
  font-size: 1rem;
}

.add-to-cart-btn {
  flex: 1;
  padding: 0 2rem;
  height: 40px;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
}

.add-to-cart-btn:hover {
  background: #333;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.add-to-cart-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.add-to-cart-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.product-details {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.detail, .shipping {
  margin-bottom: 1.5rem;
}

.detail h3, .shipping h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.detail ul {
  padding-left: 1.5rem;
}

.btn-retry, .btn-home {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #000;
  color: #fff;
  text-decoration: none;
  margin-top: 1rem;
  cursor: pointer;
  border: none;
  font-family: var(--font-body);
}

.btn-retry:hover, .btn-home:hover {
  background: #333;
}

@media (max-width: 768px) {
  .product-container {
    flex-direction: column;
  }
  
  .product-gallery, .product-info {
    width: 100%;
  }
}
</style>
