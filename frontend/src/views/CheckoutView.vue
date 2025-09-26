<template>
  <div class="checkout-view">
    <div class="container">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Préparation du paiement...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button @click="goToCart" class="btn-primary">Retour au panier</button>
        </div>
      </div>
      
      <div v-else>
        <h1>Finalisation de votre commande</h1>
        
        <div class="checkout-grid">
          <div class="checkout-details">
            <div class="section">
              <h2>Adresse de livraison</h2>
              
              <div v-if="userAddresses.length > 0" class="address-selector">
                <label for="shipping-address">Choisir une adresse de livraison:</label>
                <select 
                  id="shipping-address" 
                  v-model="selectedShippingAddressId"
                  @change="updateSelectedShippingAddress(selectedShippingAddressId)"
                  class="address-select"
                >
                  <option value="" disabled>Sélectionnez une adresse</option>
                  <option 
                    v-for="address in userAddresses" 
                    :key="address._id" 
                    :value="address._id"
                  >
                    {{ address.name }} - {{ address.addressLine1 }} {{ address.addressLine2 }}, {{ address.postalCode }} {{ address.city }}
                    {{ address.isDefault ? ' (Par défaut)' : '' }}
                  </option>
                </select>
              </div>
              
              <div v-if="shippingAddress" class="address-card">
                <p><strong>{{ shippingAddress.name }}</strong></p>
                <p>{{ shippingAddress.firstName }} {{ shippingAddress.lastName }}</p>
                <p>{{ shippingAddress.addressLine1 }}</p>
                <p v-if="shippingAddress.addressLine2">{{ shippingAddress.addressLine2 }}</p>
                <p>{{ shippingAddress.postalCode }} {{ shippingAddress.city }}</p>
                <p>{{ shippingAddress.country }}</p>
                <p>{{ shippingAddress.phone }}</p>
                <button @click="router.push({ name: 'addresses', query: { redirect: '/checkout' } })" class="btn-secondary btn-sm">Gérer mes adresses</button>
              </div>
              
              <div v-else class="address-form">
                <p>Veuillez ajouter une adresse de livraison</p>
                <button @click="router.push({ name: 'addresses', query: { redirect: '/checkout' } })" class="btn-secondary">Ajouter une adresse</button>
              </div>
            </div>
            
            <div class="section">
              <h2>Adresse de facturation</h2>
              <div class="checkbox-container">
                <input type="checkbox" id="same-address" v-model="sameAddress">
                <label for="same-address">Identique à l'adresse de livraison</label>
              </div>
              
              <div v-if="sameAddress" class="address-card">
                <p>Identique à l'adresse de livraison</p>
              </div>
              
              <div v-else>
                <div v-if="userAddresses.length > 0" class="address-selector">
                  <label for="billing-address">Choisir une adresse de facturation:</label>
                  <select 
                    id="billing-address" 
                    v-model="selectedBillingAddressId"
                    @change="updateSelectedBillingAddress(selectedBillingAddressId)"
                    class="address-select"
                  >
                    <option value="" disabled>Sélectionnez une adresse</option>
                    <option 
                      v-for="address in userAddresses" 
                      :key="address._id" 
                      :value="address._id"
                    >
                      {{ address.name }} - {{ address.addressLine1 }} {{ address.addressLine2 }}, {{ address.postalCode }} {{ address.city }}
                      {{ address.isDefault ? ' (Par défaut)' : '' }}
                    </option>
                  </select>
                </div>
                
                <div v-if="billingAddressData" class="address-card">
                  <p><strong>{{ billingAddressData.name }}</strong></p>
                  <p>{{ billingAddressData.firstName }} {{ billingAddressData.lastName }}</p>
                  <p>{{ billingAddressData.addressLine1 }}</p>
                  <p v-if="billingAddressData.addressLine2">{{ billingAddressData.addressLine2 }}</p>
                  <p>{{ billingAddressData.postalCode }} {{ billingAddressData.city }}</p>
                  <p>{{ billingAddressData.country }}</p>
                  <p>{{ billingAddressData.phone }}</p>
                </div>
                <div v-else class="address-form">
                  <p>Veuillez ajouter une adresse de facturation</p>
                  <button @click="router.push({ name: 'addresses', query: { redirect: '/checkout' } })" class="btn-secondary">Ajouter une adresse</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="checkout-summary">
            <div class="section">
              <h2>Récapitulatif de commande</h2>
              
              <div class="cart-items">
                <div v-for="item in cartItems" :key="item.variantId" class="cart-item">
                  <div class="item-image">
                    <img :src="item.image" :alt="item.name">
                  </div>
                  <div class="item-details">
                    <h3>{{ item.name }}</h3>
                    <p>{{ item.variant.size }} - {{ item.variant.color }}</p>
                    <p>Quantité: {{ item.quantity }}</p>
                    <p class="item-price">{{ formatPrice(item.price * item.quantity) }}</p>
                  </div>
                </div>
              </div>
              
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Sous-total TTC:</span>
                  <span>{{ formatPrice(subtotal) }}</span>
                </div>
                <div class="summary-row">
                  <span>TVA (20%):</span>
                  <span>{{ formatPrice(subtotal - (subtotal / 1.2)) }}</span>
                </div>
                <div class="summary-row">
                  <span>Frais de livraison:</span>
                  <span>{{ formatPrice(shippingCost) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>{{ formatPrice(subtotal + shippingCost) }}</span>
                </div>
              </div>
            </div>
            
            <button 
              @click="proceedToPayment" 
              class="btn-payment" 
              :disabled="!canProceed || isProcessing"
            >
              <span v-if="isProcessing">Traitement en cours...</span>
              <span v-else>Procéder au paiement</span>
            </button>
            <p v-if="!hasCompleteShipping && cartItems.length > 0" class="hint-text">
              <strong>Veuillez sélectionner une adresse de livraison pour procéder au paiement.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useOrderStore } from '../stores/order';
import { useAuthStore } from '../stores/auth';
import api from '@/services/apiService';

const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const isProcessing = ref(false);
const error = ref<string | null>(null);
const sameAddress = ref(true);

const userAddresses = ref([]);
const shippingAddress = ref(null);
const billingAddressData = ref(null);
const selectedShippingAddressId = ref('');
const selectedBillingAddressId = ref('');

async function fetchUserAddresses() {
  if (!authStore.isAuthenticated) return;
  
  try {
    const response = await api.get('/user/addresses');
    
    if (response.data && Array.isArray(response.data.data)) {
      userAddresses.value = response.data.data;
      
      const defaultShippingAddress = userAddresses.value.find(addr => addr.isDefault && addr.type === 'shipping');
      const defaultAddress = userAddresses.value.find(addr => addr.isDefault);
      const anyAddress = userAddresses.value.length > 0 ? userAddresses.value[0] : null;
      
      if (defaultShippingAddress) {
        shippingAddress.value = defaultShippingAddress;
        selectedShippingAddressId.value = defaultShippingAddress._id;
      } else if (defaultAddress) {
        shippingAddress.value = defaultAddress;
        selectedShippingAddressId.value = defaultAddress._id;
      } else if (anyAddress) {
        shippingAddress.value = anyAddress;
        selectedShippingAddressId.value = anyAddress._id;
      }
    } else {
      console.warn('Format de réponse inattendu pour les adresses:', response.data);
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des adresses:', err);
    shippingAddress.value = {
      firstName: authStore.user?.firstName || '',
      lastName: authStore.user?.lastName || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: 'France',
      phone: authStore.user?.phone || ''
    };
  }
}

function updateSelectedShippingAddress(addressId) {
  const address = userAddresses.value.find(addr => addr._id === addressId);
  if (address) {
    shippingAddress.value = address;
  }
}

function updateSelectedBillingAddress(addressId) {
  const address = userAddresses.value.find(addr => addr._id === addressId);
  if (address) {
    billingAddressData.value = address;
  }
}

const billingAddress = computed(() => {
  if (sameAddress.value) {
    return shippingAddress.value;
  }
  
  return billingAddressData.value;
});

const hasCompleteShipping = computed(() => {
  if (!selectedShippingAddressId.value) {
    return false;
  }
  
  const address = shippingAddress.value as any;
  return !!(address && address.addressLine1 && address.city && address.postalCode);
});

const subtotal = computed(() => {
  return cartStore.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const shippingCost = computed(() => {
  return subtotal.value > 50 ? 0 : 5.95;
});

const cartItems = computed(() => {
  return cartStore.items;
});

const canProceed = computed(() => {
  return cartItems.value.length > 0 && hasCompleteShipping.value && !isLoading.value;
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
};
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    error.value = 'Vous devez être connecté pour accéder à la page de paiement';
    router.push('/login?redirect=/checkout');
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    
    if (!authStore.user) {
      await authStore.loadUser();
    }
    
    await cartStore.initCart();
    
    if (cartStore.items.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await cartStore.initCart();
    }
    
    await fetchUserAddresses();
    
    if (cartStore.items.length === 0) {
      error.value = 'Votre panier est vide';
    } else {
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la page de paiement:', err);
    error.value = 'Une erreur est survenue lors du chargement de la page';
  } finally {
    isLoading.value = false;
  }
});

const goToCart = () => {
  router.push('/cart');
};
async function proceedToPayment() {
  if (!canProceed.value) {
    if (cartItems.value.length > 0 && !hasCompleteShipping.value) {
      router.push({ name: 'addresses', query: { redirect: '/checkout' } });
    }
    return;
  }
  
  if (!sameAddress.value && (!billingAddress.value || !billingAddress.value.addressLine1 || !billingAddress.value.city || !billingAddress.value.postalCode)) {
    router.push({ name: 'addresses', query: { redirect: '/checkout' } });
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const session = await orderStore.createCheckoutSession(
      cartItems.value,
      shippingAddress.value,
      billingAddress.value
    );
    
    if (session && session.url) {
      window.location.href = session.url;
    } else {
      error.value = 'Erreur lors de la création de la session de paiement';
    }
  } catch (err) {
    error.value = err.message || 'Erreur lors du traitement du paiement';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.checkout-view {
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

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
}

.error-message h2 {
  color: #e53935;
  margin-bottom: 1rem;
}

.error-message button {
  margin-top: 1.5rem;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}

.section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.address-card {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.address-card p {
  margin: 0.3rem 0;
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.checkbox-container input {
  margin-right: 0.5rem;
}

.cart-items {
  margin-bottom: 1.5rem;
}

.cart-item {
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  flex-grow: 1;
}

.item-details h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.item-details p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
  color: #666;
}

.item-price {
  font-weight: bold;
  color: #000 !important;
}

.summary-totals {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-row.total {
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-payment {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 1rem;
  background-color: var(--black);
  color: var(--white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-payment:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease-in-out;
}

.btn-payment:disabled {
  background-color: #cccccc;
  color: #888888;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-payment:disabled:hover {
  transform: none;
}

.alert-warning {
  background-color: #fff7e6;
  border: 1px solid #ffe0a3;
  color: #8a6d3b;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.alert-warning .btn-primary.btn-sm {
  margin-top: 0.75rem;
}

.hint-text {
  margin-top: 0.75rem;
  color: #8a6d3b;
  font-size: 0.95rem;
  text-align: center;
  background-color: #fff7e6;
  border: 1px solid #ffe0a3;
  border-radius: 8px;
  padding: 0.75rem;
}
</style>
