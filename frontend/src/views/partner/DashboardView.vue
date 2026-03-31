<script setup lang="ts">
import { onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const store = usePartnerStore();

onMounted(() => {
  store.fetchMyDashboard();
  store.fetchMyPartner();
});
</script>

<template>
  <div class="partner-dashboard">
    <div class="dash-header">
      <h1>Tableau de bord</h1>
      <p v-if="store.myPartner">{{ store.myPartner.shopName }}</p>
    </div>

    <div v-if="store.isLoading" class="loading">Chargement...</div>

    <template v-else-if="store.dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">CA Brut</span>
          <span class="stat-value">{{ store.dashboard.totalGross.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Commission Veyron</span>
          <span class="stat-value">{{ store.dashboard.totalCommission.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Net à percevoir</span>
          <span class="stat-value highlight">{{ store.dashboard.totalNet.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">En attente de reversement</span>
          <span class="stat-value pending">{{ store.dashboard.pendingPayout.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Commandes</span>
          <span class="stat-value">{{ store.dashboard.ordersCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Articles vendus</span>
          <span class="stat-value">{{ store.dashboard.itemsSold }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Panier moyen</span>
          <span class="stat-value">{{ store.dashboard.avgBasket.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Articles en ligne</span>
          <span class="stat-value">{{ store.dashboard.productsCount }}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Commandes récentes</h2>
          <router-link to="/partner/orders" class="see-all">Voir tout →</router-link>
        </div>
        <div v-if="store.dashboard.recentOrders.length === 0" class="empty">Aucune commande.</div>
        <table v-else class="orders-table">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Articles</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in store.dashboard.recentOrders" :key="order._id">
              <td>
                <router-link :to="{ name: 'partner-order-detail', params: { id: order._id } }">
                  {{ order.orderNumber }}
                </router-link>
              </td>
              <td><span class="badge" :class="order.status">{{ order.status }}</span></td>
              <td>{{ new Date(order.createdAt).toLocaleDateString('fr-FR') }}</td>
              <td>{{ order.items.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section" v-if="store.dashboard.recentPayouts?.length">
        <div class="section-header">
          <h2>Derniers reversements</h2>
          <router-link to="/partner/payouts" class="see-all">Voir tout →</router-link>
        </div>
        <table class="orders-table">
          <thead>
            <tr>
              <th>Période</th>
              <th>Montant net</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.dashboard.recentPayouts" :key="p._id">
              <td>{{ p.period }}</td>
              <td>{{ p.netAmount.toFixed(2) }} €</td>
              <td><span class="badge" :class="p.status">{{ p.status === 'paid' ? 'Payé' : 'En attente' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="partner-nav">
        <router-link to="/partner/orders">Commandes</router-link>
        <router-link to="/partner/products">Articles</router-link>
        <router-link to="/partner/stats">Statistiques</router-link>
        <router-link to="/partner/payouts">Reversements</router-link>
        <router-link to="/partner/profile">Ma boutique</router-link>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.partner-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 2rem 5rem;
}

.dash-header h1 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: #111;
}

.dash-header p {
  color: #888;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  margin-top: 0.2rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #888;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  border: 1px solid rgba(17,17,17,0.08);
  padding: 1.4rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #888;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 600;
  color: #111;
}

.stat-value.highlight { color: #27ae60; }
.stat-value.pending { color: #e67e22; }

.section {
  margin-top: 2.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.see-all {
  font-size: 0.78rem;
  color: #111;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.orders-table th {
  text-align: left;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #888;
  text-transform: uppercase;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid rgba(17,17,17,0.1);
}

.orders-table td {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid rgba(17,17,17,0.05);
}

.orders-table a {
  color: #111;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 0.5px;
}

.badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 2px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.badge.pending, .badge.processing { background: #fef3cd; color: #856404; }
.badge.shipped { background: #cce5ff; color: #004085; }
.badge.delivered, .badge.paid { background: #d4edda; color: #155724; }
.badge.cancelled, .badge.refunded { background: #f8d7da; color: #721c24; }

.partner-nav {
  margin-top: 3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(17,17,17,0.1);
}

.partner-nav a {
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: #111;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 0.5px;
}

@media (max-width: 640px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .orders-table { font-size: 0.78rem; }
}
</style>
