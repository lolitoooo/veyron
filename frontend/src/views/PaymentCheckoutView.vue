<template>
  <div class="payment-checkout-page">
    <div class="payment-container">
      <div class="payment-header">
        <div class="header-main">
          <h1>Paiement sécurisé</h1>
          <p class="subtitle">
            Vous restez sur le site officiel Veyron Paris pour finaliser votre paiement.
          </p>
        </div>
        <button class="header-back" @click="goToCart">
          Retour au panier
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Préparation de la page de paiement...</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>Impossible d'afficher la page de paiement</h2>
        <p>{{ error }}</p>
        <button class="btn-primary" @click="goBackToCheckout">
          Retour au récapitulatif de commande
        </button>
      </div>

      <div v-else class="payment-content">
        <div class="payment-summary" v-if="order">
          <h2>Récapitulatif de votre commande</h2>

          <div class="items-list" v-if="order.orderItems && order.orderItems.length">
            <div
              v-for="item in order.orderItems"
              :key="item._id || item.product"
              class="item-row"
            >
              <div class="item-image" v-if="item.image">
                <img :src="getItemImageUrl(item.image)" :alt="item.name" />
              </div>
              <div class="item-info">
                <p class="item-name">
                  {{ item.name }}
                </p>
                <p class="item-meta">
                  {{ item.variant?.size }} • {{ item.variant?.color }}
                </p>
                <p class="item-qty-price">
                  x{{ item.qty }} · {{ formatPrice(item.price) }}
                </p>
              </div>
            </div>
          </div>

          <div class="totals">
            <div class="row">
              <span>Sous-total </span>
              <span>{{ formatPrice(order.subtotalTTC ?? orderTotal ?? 0) }}</span>
            </div>
            <div class="row" v-if="order.cashbackUsed && order.cashbackUsed > 0">
              <span>Cashback fidélité </span>
              <span>-{{ formatPrice(order.cashbackUsed) }}</span>
            </div>
            <div
              class="row"
              v-if="order.discountAmount && order.discountAmount > 0"
            >
              <span>Réduction </span>
              <span>-{{ formatPrice(order.discountAmount) }}</span>
            </div>
            <div class="row">
              <span>Livraison</span>
              <span>
                <template v-if="order.shippingPrice === 0">
                  Offerte
                </template>
                <template v-else>
                  {{ formatPrice(order.shippingPrice) }}
                </template>
              </span>
            </div>
            <div class="row total-due">
              <span>Montant total dû </span>
              <span>{{ formatPrice(order.totalPrice ?? orderTotal ?? 0) }}</span>
            </div>
            <p class="order-ref" v-if="orderNumber">
              Référence commande : <strong>{{ orderNumber }}</strong>
            </p>
          </div>
        </div>

        <div class="embedded-wrapper">
          <div id="embedded-checkout"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadStripe } from '@stripe/stripe-js';
import api from '@/services/apiService';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref<string | null>(null);
const orderTotal = ref<number | null>(null);
const orderNumber = ref<string | null>(null);
const order = ref<any | null>(null);

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const getItemImageUrl = (path: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    import.meta.env.VITE_IMAGE_URL ||
    import.meta.env.VITE_BASE_URL ||
    '';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};

const goBackToCheckout = () => {
  router.push('/checkout');
};

const goToCart = () => {
  router.push('/cart');
};

onMounted(async () => {
  const sessionId = route.query.session_id as string | undefined;

  if (!sessionId) {
    error.value = 'Identifiant de session manquant.';
    loading.value = false;
    return;
  }

  try {
    const response = authStore.isAuthenticated
      ? await api.get(`/stripe/checkout-session/${sessionId}`)
      : await api.get(`/stripe/checkout-session-public/${sessionId}`);

    if (!response.data || !response.data.success || !response.data.session?.clientSecret) {
      throw new Error('Impossible de récupérer les informations de paiement.');
    }

    const clientSecret = response.data.session.clientSecret as string;

    if (response.data.order) {
      order.value = response.data.order;
      orderTotal.value =
        typeof response.data.order.totalPrice === 'number'
          ? response.data.order.totalPrice
          : null;
      orderNumber.value =
        response.data.order.invoiceNumber || response.data.order.id || null;
    }

    loading.value = false;
    await nextTick();

    const stripe = await loadStripe(
      import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
        import.meta.env.STRIPE_PUBLISHABLE_KEY ||
        'pk_test_votreclépublique'
    );

    if (!stripe) {
      throw new Error('Impossible de charger le module Stripe.');
    }

    const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
    await checkout.mount('#embedded-checkout');
  } catch (e: any) {
    console.error('Erreur lors de l’affichage de la page de paiement:', e);
    error.value = e?.message || 'Une erreur est survenue lors du chargement de la page de paiement.';
  } finally {
    if (loading.value) {
      loading.value = false;
    }
  }
});
</script>

<style scoped>
.payment-checkout-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-off-white, #f5f5f5);
  padding: 2rem 1rem;
}

.payment-container {
  width: 100%;
  max-width: 960px;
  background: var(--color-white, #ffffff);
  border-radius: 1rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  padding: 2.5rem 2rem;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.header-main {
  text-align: left;
}

.payment-header h1 {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.payment-header .subtitle {
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
  font-size: 0.9rem;
  color: var(--color-gray-500, #6b6b6b);
}

.header-back {
  border: 1px solid var(--color-gray-300, #d4d4d4);
  background: transparent;
  color: var(--color-primary, #1a1a1a);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.header-back:hover {
  background: var(--color-gray-100, #f8f8f8);
}

.loading,
.error {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-secondary, #c9a961);
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-primary {
  margin-top: 1.5rem;
  padding: 0.85rem 1.75rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  background: var(--color-primary, #1a1a1a);
  color: var(--color-white, #ffffff);
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.payment-content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 2fr);
  gap: 2rem;
  align-items: flex-start;
}

.payment-summary {
  border-right: 1px solid var(--color-gray-200, #e8e8e8);
  padding-right: 1.5rem;
}

.payment-summary h2 {
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-gray-700, #2d2d2d);
  margin-bottom: 1rem;
}

.payment-summary p {
  font-size: 0.95rem;
  color: var(--color-gray-600, #4a4a4a);
  margin-bottom: 0.5rem;
}

.embedded-wrapper {
  border-radius: 0.75rem;
  border: 1px solid var(--color-gray-200, #e8e8e8);
  padding: 1.5rem;
  background: var(--color-cream, #f5f3ef);
}

@media (max-width: 768px) {
  .payment-checkout-page {
    padding: 0;
    background: var(--color-white, #ffffff);
    align-items: stretch;
  }

  .payment-container {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    padding: 1rem 0 0;
  }

  .payment-content {
    display: block;
  }

  .payment-header {
    padding: 0 1rem 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-gray-200, #e8e8e8);
  }

  .payment-summary {
    display: none;
  }

  .embedded-wrapper {
    border: none;
    border-radius: 0;
    padding: 0 1rem 1.5rem;
    background: transparent;
  }
}
</style>

