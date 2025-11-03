<template>
  <div class="cart-view">
    <div class="container">
      <h1>Votre Panier</h1>
      
      <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
        {{ notification.message }}
      </div>
      
      <div v-if="cartStore.isLoading" class="loading">
        <div class="spinner"></div>
        <p>Chargement de votre panier...</p>
      </div>
      
      <div v-else-if="cartStore.error" class="error">
        <p>{{ cartStore.error }}</p>
        <button @click="cartStore.initCart" class="btn-retry">Réessayer</button>
      </div>
      
      <div v-else-if="cartStore.items.length === 0" class="empty-cart">
        <div class="empty-cart-icon">
          <span class="material-icons">shopping_cart</span>
        </div>
        <h2>Votre panier est vide</h2>
        <p>Découvrez nos produits et ajoutez-les à votre panier</p>
        <router-link to="/" class="btn-continue-shopping">Continuer mes achats</router-link>
      </div>
      
      <div v-else class="cart-content">
        <div class="cart-items">
          <div class="cart-header">
            <div class="product-info">Produit</div>
            <div class="product-price">Prix</div>
            <div class="product-quantity">Quantité</div>
            <div class="product-total">Total</div>
            <div class="product-actions">Actions</div>
          </div>
          
          <div 
            v-for="item in cartStore.items" 
            :key="`${item.productId}-${item.variantId}`" 
            class="cart-item"
          >
            <div class="product-info">
              <div class="product-image">
                <img :src="item.image" :alt="item.name" />
              </div>
              <div class="product-details">
                <h3>{{ item.name }}</h3>
                <div class="product-options">
                  <span class="option-color" :style="{ backgroundColor: item.variant.colorCode, width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }"></span>
                  <span class="option-size">{{ item.variant.size }}</span>
                </div>
              </div>
            </div>
            
            <div class="product-price">
              {{ formatPrice(item.price) }}
            </div>
            
            <div class="product-quantity">
              <div class="quantity-selector">
                <button 
                  @click="updateQuantity(item.productId, item.variantId, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                >
                  -
                </button>
                <input 
                  type="number" 
                  v-model.number="item.quantity"
                  @change="updateQuantity(item.productId, item.variantId, item.quantity)"
                  min="1"
                />
                <button @click="updateQuantity(item.productId, item.variantId, item.quantity + 1)">
                  +
                </button>
              </div>
            </div>
            
            <div class="product-total">
              {{ formatPrice(item.price * item.quantity) }}
            </div>
            
            <div class="product-actions">
              <button @click="removeItem(item.productId, item.variantId)" class="btn-remove">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="cart-summary">
          <h2>Récapitulatif</h2>
          
          <div class="summary-row">
            <span>Sous-total:</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          
          <div v-if="cartStore.promoCode" class="summary-row discount">
            <span>Réduction ({{ cartStore.promoCode.code }}):</span>
            <span>-{{ formatPrice(cartStore.discountAmount) }}</span>
          </div>
          
          <div class="summary-row">
            <span>Frais de livraison:</span>
            <span>{{ formatPrice(shippingCost) }}</span>
          </div>
          
          <div class="summary-row total">
            <span>Total:</span>
            <span>{{ formatPrice(cartStore.total + shippingCost) }}</span>
          </div>
          
          <div v-if="cartStore.promoCode" class="promo-code-applied">
            <div class="promo-badge">
              <span class="material-icons">local_offer</span>
              <span>{{ cartStore.promoCode.title }}</span>
            </div>
            <button @click="removePromoCode" class="btn-remove-promo">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="promo-code">
            <input 
              type="text" 
              v-model="promoCode" 
              placeholder="Code promo" 
            />
            <button @click="applyPromoCode" class="btn-apply">Appliquer</button>
          </div>
          
          <router-link to="/checkout" class="btn-checkout">
            Procéder au paiement
          </router-link>
          
          <router-link to="/" class="btn-continue-shopping">
            Continuer mes achats
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import api from '@/services/apiService';

const router = useRouter();
const cartStore = useCartStore();
const promoCode = ref('');
const shippingCost = ref(0);

const notification = ref({
  show: false,
  message: '',
  type: 'success',
  timeout: null as NodeJS.Timeout | null
});

const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }
  
  notification.value = {
    show: true,
    message,
    type,
    timeout: null
  };
  
  notification.value.timeout = setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
};

const updateQuantity = async (productId, variantId, quantity) => {
  if (quantity < 1) {
    quantity = 1;
  }
  
  const item = cartStore.items.find(item => 
    item.productId === productId && item.variantId === variantId
  );
  
  if (!item) return;
  
  try {
    const parts = variantId.split('-');
    const size = parts[1];
    const color = parts.slice(2).join('-');
    
    const response = await api.get(`/products/${productId}`);
    
    if (response.data && response.data.success) {
      const product = response.data.data;
      
      const variant = product.variants?.find((v: { size: string; color: string; stock: number }) => 
        v.size === size && v.color === color
      );
      
      if (variant) {
        const stockDisponible = variant.stock;
        
        if (quantity > stockDisponible) {
          showNotification(`Désolé, il ne reste que ${stockDisponible} article(s) en stock pour cette variante`, 'warning');
          quantity = stockDisponible;
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du stock:', err);
  }
  
  cartStore.updateQuantity(productId, variantId, quantity);
};

const removeItem = (productId, variantId) => {
  cartStore.removeFromCart(productId, variantId);
};

const applyPromoCode = async () => {
  if (!promoCode.value) {
    showNotification('Veuillez entrer un code promo', 'error');
    return;
  }
  
  try {
    const response = await api.post('/promo-codes/verify', {
      code: promoCode.value,
      orderTotal: cartStore.subtotal
    });
    
    if (response.data && response.data.success) {
      const { promoCode: promoDetails, discount } = response.data.data;
      
      cartStore.setPromoCode({
        code: promoCode.value,
        title: promoDetails.title,
        discountType: promoDetails.discountType,
        discountValue: promoDetails.discountValue,
        discountAmount: discount,
        promoCodeId: promoDetails._id
      });
      
      showNotification(`Code promo "${promoCode.value}" appliqué : ${formatPrice(discount)} de réduction`, 'success');
      promoCode.value = '';
    } else {
      showNotification('Code promo invalide', 'error');
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du code promo:', err);
    showNotification(err.response?.data?.message || 'Erreur lors de la vérification du code promo', 'error');
  }
};

const removePromoCode = () => {
  cartStore.removePromoCode();
  showNotification('Code promo retiré', 'success');
};

const goToCheckout = () => {
  if (cartStore.items.length === 0) {
    showNotification('Votre panier est vide', 'error');
    return;
  }
  router.push('/checkout');
};

const calculateShippingCost = () => {
  if (cartStore.total >= 150) {
    shippingCost.value = 0;
  } else {
    shippingCost.value = 9.99;
  }
};

cartStore.initCart();
</script>

<style scoped>
.cart-view {
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

.loading, .error, .empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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

.empty-cart-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.empty-cart-icon .material-icons {
  font-size: 4rem;
}

.empty-cart h2 {
  margin-bottom: 1rem;
  font-family: var(--font-heading);
}

.empty-cart p {
  margin-bottom: 2rem;
  color: var(--color-text-light);
}

.cart-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.cart-items {
  flex: 2;
  min-width: 300px;
}

.cart-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  font-weight: bold;
  display: none;
}

@media (min-width: 768px) {
  .cart-header {
    display: grid;
  }
}

.cart-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

@media (max-width: 767px) {
  .cart-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .product-info {
    grid-column: 1 / -1;
  }
  
  .product-price, .product-quantity, .product-total, .product-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .product-price::before {
    content: 'Prix:';
    font-weight: bold;
  }
  
  .product-quantity::before {
    content: 'Quantité:';
    font-weight: bold;
  }
  
  .product-total::before {
    content: 'Total:';
    font-weight: bold;
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 80px;
  height: 80px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details h3 {
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}

.product-options {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.product-options span {
  display: block;
  margin-bottom: 0.25rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  width: fit-content;
}

.quantity-selector button {
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.quantity-selector button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-selector input {
  width: 40px;
  height: 30px;
  border: none;
  text-align: center;
}

.btn-remove {
  background: transparent;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 1rem;
}

.btn-remove .material-icons {
  font-size: 1.2rem;
  vertical-align: middle;
}

.cart-summary {
  flex: 1;
  min-width: 300px;
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  align-self: flex-start;
  position: sticky;
  top: 100px;
}

.cart-summary h2 {
  margin-bottom: 1.5rem;
  font-family: var(--font-heading);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.summary-row.total {
  font-weight: bold;
  font-size: 1.2rem;
  border-bottom: none;
}

.promo-code {
  display: flex;
  margin-bottom: 1.5rem;
}

.promo-code input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
  outline: none;
}

.promo-code input:focus {
  border-color: #000;
}

.btn-apply {
  background-color: #000;
  color: #fff;
  border: none;
  padding: 0 1rem;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 500;
}

.btn-checkout {
  display: block;
  width: 100%;
  background: #000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  margin-bottom: 1rem;
  font-family: var(--font-body);
}

.promo-code-applied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f5f5;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.promo-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.promo-badge .material-icons {
  color: var(--color-primary);
  font-size: 1.2rem;
}

.btn-remove-promo {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.btn-remove-promo:hover {
  background-color: #e0e0e0;
  color: #333;
}

.summary-row.discount {
  color: #2e7d32;
  font-weight: 500;
}

.btn-continue-shopping {
  display: block;
  width: 100%;
  background: transparent;
  border: 1px solid #000;
  color: #000;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  font-family: var(--font-body);
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
  max-width: 400px;
}

.notification-success {
  background-color: #4caf50;
}

.notification-error {
  background-color: #f44336;
}

.notification-warning {
  background-color: #ff9800;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
