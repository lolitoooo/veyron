<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const store = usePartnerStore();
const stats = ref<any>(null);

onMounted(async () => {
  stats.value = await store.fetchMyStats();
});
</script>

<template>
  <div class="partner-stats">
    <h1>Statistiques</h1>

    <div v-if="!stats" class="loading">Chargement...</div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">CA Brut total</span>
          <span class="value">{{ stats.totalGross.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="label">Commission ({{ stats.commissionRate }}%)</span>
          <span class="value">{{ stats.totalCommission.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="label">Net total</span>
          <span class="value highlight">{{ stats.totalNet.toFixed(2) }} €</span>
        </div>
        <div class="stat-card">
          <span class="label">Commandes totales</span>
          <span class="value">{{ stats.totalOrders }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Articles vendus</span>
          <span class="value">{{ stats.totalItems }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Panier moyen</span>
          <span class="value">{{ stats.avgBasket.toFixed(2) }} €</span>
        </div>
      </div>

      <div class="section" v-if="Object.keys(stats.monthly).length">
        <h2>Évolution mensuelle</h2>
        <table class="table">
          <thead>
            <tr><th>Mois</th><th>CA</th><th>Commandes</th><th>Articles</th></tr>
          </thead>
          <tbody>
            <tr v-for="(data, month) in stats.monthly" :key="month">
              <td>{{ month }}</td>
              <td>{{ data.revenue.toFixed(2) }} €</td>
              <td>{{ data.orders }}</td>
              <td>{{ data.items }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section" v-if="stats.topProducts.length">
        <h2>Produits les plus vendus</h2>
        <table class="table">
          <thead>
            <tr><th>Produit</th><th>Quantité</th><th>CA</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in stats.topProducts" :key="p.name">
              <td>{{ p.name }}</td>
              <td>{{ p.qty }}</td>
              <td>{{ p.revenue.toFixed(2) }} €</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.partner-stats { max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
.loading { text-align: center; padding: 3rem; color: #888; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
.stat-card { border: 1px solid rgba(17,17,17,0.08); padding: 1.4rem 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; }
.label { font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; }
.value { font-size: 1.4rem; font-weight: 600; color: #111; }
.value.highlight { color: #27ae60; }
.section { margin-bottom: 2.5rem; }
.section h2 { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; letter-spacing: 0.04em; margin-bottom: 1rem; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); }
</style>
