<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';

const route = useRoute();
const store = usePartnerStore();
const order = ref<any>(null);

onMounted(async () => {
  order.value = await store.fetchMyOrderDetail(route.params.id as string);
});
</script>

<template>
  <div class="order-detail">
    <router-link to="/partner/orders" class="back">← Retour aux commandes</router-link>

    <div v-if="!order" class="loading">Chargement...</div>

    <template v-else>
      <div class="detail-header">
        <h1>Commande {{ order.orderNumber }}</h1>
        <span class="badge" :class="order.status">{{ order.status }}</span>
      </div>

      <p class="date">{{ new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>

      <div class="section">
        <h2>Articles (votre boutique)</h2>
        <div class="items">
          <div v-for="item in order.items" :key="item._id" class="item-row">
            <img :src="item.image" :alt="item.name" class="item-img" />
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-variant">{{ item.variant.size }} · {{ item.variant.color }}</p>
            </div>
            <div class="item-right">
              <p>× {{ item.qty }}</p>
              <p class="item-price">{{ (item.price * item.qty).toFixed(2) }} €</p>
            </div>
          </div>
        </div>
        <div class="total-row">
          <span>Total de vos articles</span>
          <strong>{{ order.totalPartner.toFixed(2) }} €</strong>
        </div>
      </div>

      <div class="section">
        <h2>Adresse de livraison</h2>
        <p>{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</p>
        <p>{{ order.shippingAddress.addressLine1 }}</p>
        <p v-if="order.shippingAddress.addressLine2">{{ order.shippingAddress.addressLine2 }}</p>
        <p>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.order-detail { max-width: 800px; margin: 0 auto; padding: 2rem 2rem 5rem; }
.back { font-size: 0.82rem; color: #111; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-bottom: 1.5rem; }
.loading { text-align: center; padding: 3rem; color: #888; }
.detail-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.3rem; }
.detail-header h1 { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 300; letter-spacing: 0.06em; }
.date { color: #888; font-size: 0.82rem; margin-bottom: 2rem; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
.badge.pending, .badge.processing { background: #fef3cd; color: #856404; }
.badge.shipped { background: #cce5ff; color: #004085; }
.badge.delivered { background: #d4edda; color: #155724; }
.badge.cancelled { background: #f8d7da; color: #721c24; }
.section { margin-bottom: 2rem; }
.section h2 { font-family: var(--font-heading); font-size: 1rem; font-weight: 400; letter-spacing: 0.06em; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.items { display: flex; flex-direction: column; gap: 1rem; }
.item-row { display: flex; align-items: center; gap: 1rem; }
.item-img { width: 60px; height: 60px; object-fit: cover; background: #f5f5f5; }
.item-info { flex: 1; }
.item-name { font-size: 0.88rem; color: #111; }
.item-variant { font-size: 0.75rem; color: #888; }
.item-right { text-align: right; font-size: 0.85rem; }
.item-price { font-weight: 600; }
.total-row { display: flex; justify-content: space-between; padding: 1rem 0; border-top: 1px solid rgba(17,17,17,0.1); margin-top: 1rem; font-size: 0.9rem; }
.section p { font-size: 0.85rem; color: #555; line-height: 1.6; }
</style>
