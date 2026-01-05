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
            <h2>Mode de livraison</h2>
            
            <div class="shipping-methods">
              <div 
                v-for="config in cartStore.shippingConfigs" 
                :key="config._id"
                :class="['shipping-method-card', { selected: cartStore.shippingMethod === config.name }]"
                @click="selectShippingMethod(config.name)"
              >
                <div class="method-header">
                  <div class="radio-button">
                    <div v-if="cartStore.shippingMethod === config.name" class="radio-checked"></div>
                  </div>
                  <div class="method-info">
                    <h3>{{ config.displayName }}</h3>
                    <p class="method-description">{{ config.description }}</p>
                    <p class="method-delivery">Livraison en {{ config.estimatedDays.min }}-{{ config.estimatedDays.max }} jours</p>
                  </div>
                  <div class="method-price">
                    <span v-if="cartStore.isFreeShipping" class="free-badge">Gratuit</span>
                    <span v-else class="price">{{ formatPrice(config.price) }}</span>
                  </div>
                </div>
                
                <!-- Section Point Relais -->
                <div v-if="config.name === 'relay_point' && cartStore.shippingMethod === 'relay_point'" class="relay-point-section">
                  <div class="relay-search">
                    <h4>Sélectionner un point relais</h4>
                    <div class="search-input">
                      <input 
                        v-model="relaySearchQuery"
                        type="text" 
                        placeholder="Code postal (5 chiffres)"
                        maxlength="5"
                        @input="handleRelaySearchInput"
                        @keyup.enter="searchRelayPoints"
                      />
                      <button @click="searchRelayPoints" class="btn-search">
                        <span class="material-icons">search</span>
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="isLoadingRelayPoints" class="loading-relay">
                    <div class="spinner-small"></div>
                    <p>Recherche des points relais...</p>
                  </div>
                  
                  <div v-else-if="relayPoints.length > 0" class="relay-points-list">
                    <div 
                      v-for="point in relayPoints" 
                      :key="point.id"
                      :class="['relay-point-item', { selected: selectedRelayPoint?.id === point.id }]"
                      @click="selectRelayPoint(point)"
                    >
                      <div class="relay-icon">
                        <span class="material-icons">store</span>
                      </div>
                      <div class="relay-info">
                        <h5>{{ point.name }}</h5>
                        <p>{{ point.address }}</p>
                        <p>{{ point.postalCode }} {{ point.city }}</p>
                        <p class="relay-distance">{{ point.distance }} km</p>
                      </div>
                      <div v-if="selectedRelayPoint?.id === point.id" class="relay-check">
                        <span class="material-icons">check_circle</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else-if="relaySearchQuery" class="no-relay-points">
                    <p>Aucun point relais trouvé pour cette recherche</p>
                  </div>
                </div>
              </div>
            </div>
          
            <div v-if="!cartStore.isFreeShipping && cartStore.remainingForFreeShipping > 0" class="free-shipping-banner">
              <span class="material-icons">local_shipping</span>
              <p>Plus que {{ formatPrice(cartStore.remainingForFreeShipping) }} pour bénéficier de la livraison gratuite !</p>
            </div>
          </div>
            
            <!-- Adresse de livraison uniquement pour livraison à domicile -->
            <div v-if="cartStore.shippingMethod === 'home_delivery'" class="section">
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
            
            <!-- Affichage du point relais sélectionné -->
            <div v-else-if="cartStore.shippingMethod === 'relay_point' && selectedRelayPoint" class="section">
              <h2>Point relais sélectionné</h2>
              <div class="address-card relay-selected">
                <div class="relay-header">
                  <span class="material-icons">store</span>
                  <strong>{{ selectedRelayPoint.name }}</strong>
                </div>
                <p>{{ selectedRelayPoint.address }}</p>
                <p>{{ selectedRelayPoint.postalCode }} {{ selectedRelayPoint.city }}</p>
                <p class="relay-distance-info">À {{ selectedRelayPoint.distance }} km</p>
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
              
              <div v-if="cartStore.promoCode" class="promo-code-section">
                <h3>Code promo appliqué</h3>
                <div class="promo-code-success">
                  <p><strong>{{ cartStore.promoCode.title }}</strong> ({{ cartStore.promoCode.code }})</p>
                  <p v-if="cartStore.promoCode.discountType === 'percentage'">
                    {{ cartStore.promoCode.discountValue }}% de réduction
                  </p>
                  <p v-else>
                    {{ formatPrice(cartStore.promoCode.discountValue) }} de réduction
                  </p>
                  <p>Vous économisez {{ formatPrice(cartStore.discountAmount) }}</p>
                </div>
              </div>
              
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Sous-total HT:</span>
                  <span>{{ formatPrice(subtotalHT) }}</span>
                </div>
                <div class="summary-row">
                  <span>TVA (20%):</span>
                  <span>{{ formatPrice(subtotal - subtotalHT) }}</span>
                </div>
                <div class="summary-row">
                  <span>Sous-total TTC:</span>
                  <span>{{ formatPrice(subtotal) }}</span>
                </div>
                <div v-if="cartStore.promoCode" class="summary-row discount">
                  <span>Réduction:</span>
                  <span>-{{ formatPrice(cartStore.discountAmount) }}</span>
                </div>
                <div class="summary-row">
                  <span>Frais de livraison:</span>
                  <span>{{ formatPrice(shippingCost) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>{{ formatPrice(totalWithDiscount) }}</span>
                </div>
                <div v-if="cartStore.promoCode" class="summary-savings">
                  <p>Vous économisez {{ formatPrice(cartStore.discountAmount) }} !</p>
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
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useOrderStore } from '@/stores/order';
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

const relaySearchQuery = ref('');
const relayPoints = ref([]);
const selectedRelayPoint = ref(null);
const isLoadingRelayPoints = ref(false);

const discountAmount = computed(() => cartStore.discountAmount || 0);

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
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const subtotalHT = computed(() => {
  return parseFloat((subtotal.value / 1.2).toFixed(2));
});

const shippingCost = computed(() => {
  return cartStore.isFreeShipping ? 0 : cartStore.shippingCost;
});

const totalWithDiscount = computed(() => {
  return subtotal.value - discountAmount.value + shippingCost.value;
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

function selectShippingMethod(method: 'home_delivery' | 'relay_point') {
  cartStore.setShippingMethod(method);
  
  if (method === 'home_delivery') {
    selectedRelayPoint.value = null;
    relayPoints.value = [];
    relaySearchQuery.value = '';
  } else if (method === 'relay_point') {
    // Ne pas pré-remplir automatiquement, laisser l'utilisateur saisir
    // Si vous voulez suggérer le code postal, décommentez les lignes ci-dessous:
    // if (shippingAddress.value && !relaySearchQuery.value) {
    //   relaySearchQuery.value = shippingAddress.value.postalCode || '';
    // }
  }
}

function handleRelaySearchInput() {
  // Déclencher automatiquement la recherche uniquement si 5 chiffres sont saisis
  if (relaySearchQuery.value && relaySearchQuery.value.length === 5 && /^\d{5}$/.test(relaySearchQuery.value)) {
    searchRelayPoints();
  }
}

async function searchRelayPoints() {
  // Valider que c'est un code postal à 5 chiffres
  if (!relaySearchQuery.value || !/^\d{5}$/.test(relaySearchQuery.value)) {
    relayPoints.value = [];
    return;
  }
  
  isLoadingRelayPoints.value = true;
  
  try {
    const response = await api.get('/shipping/relay-points/search', {
      params: {
        postalCode: relaySearchQuery.value,
        country: 'FR',
        limit: 10
      }
    });
    
    if (response.data && response.data.success) {
      relayPoints.value = response.data.data.map(point => ({
        id: point.id,
        carrier: point.carrier,
        name: point.name,
        address: point.address,
        postalCode: point.postalCode,
        city: point.city,
        distance: point.distance,
        openingHours: point.openingHours
      }));
    } else {
      relayPoints.value = [];
    }
  } catch (err) {
    console.error('Erreur lors de la recherche des points relais:', err);
    relayPoints.value = [];
  } finally {
    isLoadingRelayPoints.value = false;
  }
}

function selectRelayPoint(point: any) {
  selectedRelayPoint.value = point;
  localStorage.setItem('veyron_selected_relay_point', JSON.stringify(point));
}

function loadSavedRelayPoint() {
  const saved = localStorage.getItem('veyron_selected_relay_point');
  if (saved) {
    try {
      selectedRelayPoint.value = JSON.parse(saved);
    } catch (e) {
      console.error('Erreur lors du chargement du point relais:', e);
    }
  }
}

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
    
    if (cartStore.shippingMethod === 'relay_point') {
      loadSavedRelayPoint();
    }
    
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
  
  isProcessing.value = true;
  error.value = null;
  
  try {
    if (cartStore.shippingMethod === 'relay_point' && !selectedRelayPoint.value) {
      error.value = 'Veuillez sélectionner un point relais';
      isProcessing.value = false;
      return;
    }
    
    const orderData = {
      items: cartItems.value.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.variant,
        variantId: item.variantId
      })),
      shippingAddress: shippingAddress.value,
      billingAddress: sameAddress.value ? shippingAddress.value : billingAddressData.value,
      shippingMethod: cartStore.shippingMethod,
      shippingCost: shippingCost.value,
      ...(cartStore.shippingMethod === 'relay_point' && selectedRelayPoint.value && {
        relayPoint: {
          id: selectedRelayPoint.value.id,
          carrier: selectedRelayPoint.value.carrier,
          name: selectedRelayPoint.value.name,
          address: selectedRelayPoint.value.address,
          postalCode: selectedRelayPoint.value.postalCode,
          city: selectedRelayPoint.value.city
        }
      }),
      ...(cartStore.promoCode && {
        promoCode: {
          code: cartStore.promoCode.code,
          title: cartStore.promoCode.title,
          discountType: cartStore.promoCode.discountType,
          discountValue: cartStore.promoCode.discountValue,
          promoCodeId: cartStore.promoCode.promoCodeId,
          discountAmount: cartStore.discountAmount
        }
      })
    };
    
    const response = await api.post('/stripe/create-checkout-session', orderData);
    
    if (response.data && response.data.url) {
      window.location.href = response.data.url;
    } else {
      throw new Error('Erreur lors de la création de la session de paiement');
    }
  } catch (err) {
    console.error('Erreur lors du paiement:', err);
    error.value = err.response?.data?.message || 'Erreur lors du traitement du paiement';
    isProcessing.value = false;
  }
}
</script>

<style scoped>
@import '@/styles/shipping-checkout.css';
.checkout-view {
  padding: 2rem 0;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.checkout-view * {
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
  box-sizing: border-box;
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
  .checkout-view {
    padding: 1rem 0;
    overflow-x: hidden;
  }

  .container {
    padding: 0 0.75rem;
    max-width: 100%;
    overflow-x: hidden;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .checkout-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .address-selector select {
    font-size: 0.9rem;
    padding: 0.75rem;
  }

  .address-card {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .cart-item {
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-image {
    width: 100%;
    max-width: 100%;
    height: 200px;
    margin-right: 0;
  }

  .item-image img {
    width: 100%;
    max-width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-details h3 {
    font-size: 1rem;
  }

  .item-details p {
    font-size: 0.85rem;
  }

  .summary-row {
    font-size: 0.9rem;
  }

  .summary-row.total {
    font-size: 1rem;
  }

  .btn-payment {
    padding: 0.875rem;
    font-size: 1rem;
  }

  .btn-secondary {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }

  .hint-text {
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .promo-code-form {
    flex-direction: column;
  }

  .promo-code-form button {
    width: 100%;
  }

  .checkout-grid,
  .checkout-details,
  .checkout-summary,
  .section {
    max-width: 100%;
    overflow-x: hidden;
  }

  .address-selector select {
    max-width: 100%;
    width: 100%;
  }

  .cart-items,
  .cart-item {
    max-width: 100%;
    overflow-x: hidden;
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
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
}

.summary-row.discount {
  color: #d32f2f;
}

.summary-savings {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #2e7d32;
  font-weight: 500;
  text-align: right;
}

.promo-code-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.promo-code-section h3 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.promo-code-form {
  display: flex;
  gap: 0.5rem;
}

.promo-code-form input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.promo-code-form button {
  white-space: nowrap;
}

.btn-remove {
  background-color: #f5f5f5;
  color: #d32f2f;
  border-color: #ffcdd2;
}

.btn-remove:hover {
  background-color: #ffebee;
}

.promo-code-error {
  margin-top: 0.5rem;
  color: #d32f2f;
  font-size: 0.9rem;
}

.promo-code-success {
  margin-top: 0.5rem;
  color: #2e7d32;
  font-size: 0.9rem;
  background-color: #e8f5e9;
  padding: 0.5rem;
  border-radius: 4px;
}

.promo-code-success p {
  margin: 0;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
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
