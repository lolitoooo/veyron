<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const store = usePartnerStore();
const orders = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const statusFilter = ref('');

async function loadOrders() {
  const data = await store.fetchMyOrders({ page: page.value, status: statusFilter.value || undefined });
  orders.value = data.orders;
  total.value = data.total;
}

onMounted(loadOrders);

function changePage(p: number) {
  page.value = p;
  loadOrders();
}
</script>

<template>
  <div class="partner-orders">
    <h1>Commandes</h1>

    <div class="filters">
      <select v-model="statusFilter" @change="page = 1; loadOrders()">
        <option value="">Tous les statuts</option>
        <option value="pending">En attente</option>
        <option value="processing">En cours</option>
        <option value="shipped">Expédiée</option>
        <option value="delivered">Livrée</option>
        <option value="cancelled">Annulée</option>
      </select>
    </div>

    <div v-if="orders.length === 0" class="empty">Aucune commande.</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>N° Commande</th>
          <th>Statut</th>
          <th>Date</th>
          <th>Articles</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order._id">
          <td>
            <router-link :to="{ name: 'partner-order-detail', params: { id: order._id } }">
              {{ order.orderNumber }}
            </router-link>
          </td>
          <td><span class="badge" :class="order.status">{{ order.status }}</span></td>
          <td>{{ new Date(order.createdAt).toLocaleDateString('fr-FR') }}</td>
          <td>{{ order.items.length }}</td>
          <td>{{ order.totalPartner.toFixed(2) }} €</td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 20" class="pagination">
      <button v-for="p in Math.ceil(total / 20)" :key="p" :class="{ active: p === page }" @click="changePage(p)">
        {{ p }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.partner-orders { max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
.filters { margin-bottom: 1.5rem; }
.filters select { padding: 0.5rem 1rem; border: 1px solid #ddd; font-size: 0.82rem; letter-spacing: 0.04em; background: #fff; }
.empty { text-align: center; padding: 3rem; color: #888; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); }
.table a { color: #111; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 0.5px; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
.badge.pending, .badge.processing { background: #fef3cd; color: #856404; }
.badge.shipped { background: #cce5ff; color: #004085; }
.badge.delivered { background: #d4edda; color: #155724; }
.badge.cancelled, .badge.refunded { background: #f8d7da; color: #721c24; }
.pagination { display: flex; gap: 0.5rem; margin-top: 1.5rem; justify-content: center; }
.pagination button { padding: 0.4rem 0.8rem; border: 1px solid #ddd; background: #fff; cursor: pointer; font-size: 0.82rem; }
.pagination button.active { background: #111; color: #fff; border-color: #111; }
</style>
