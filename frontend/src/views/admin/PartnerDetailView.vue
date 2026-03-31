<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';
import type { Partner } from '@/stores/partner';

const route = useRoute();
const store = usePartnerStore();
const partner = ref<Partner | null>(null);
const stats = ref<any>(null);
const payouts = ref<any[]>([]);
const showPayoutForm = ref(false);
const payoutPeriod = ref('');

const id = route.params.id as string;

onMounted(async () => {
  await store.adminFetchPartners();
  partner.value = store.partners.find(p => p._id === id) || null;
  stats.value = await store.adminFetchPartnerStats(id);

  try {
    const res = await import('@/services/apiService').then(m => m.default.get(`/partners/admin/${id}/payouts`));
    payouts.value = res.data.payouts;
  } catch { /* ignore */ }
});

async function generatePayout() {
  if (!payoutPeriod.value) return;
  const result = await store.adminGeneratePayout(id, payoutPeriod.value);
  if (result) {
    payouts.value.unshift(result);
    showPayoutForm.value = false;
    payoutPeriod.value = '';
  }
}

async function markPaid(payoutId: string) {
  const ref = prompt('Référence du virement (optionnel) :');
  const result = await store.adminMarkPayoutPaid(payoutId, { reference: ref || '' });
  if (result) {
    const idx = payouts.value.findIndex(p => p._id === payoutId);
    if (idx !== -1) payouts.value[idx] = result;
  }
}
</script>

<template>
  <div class="partner-detail">
    <router-link to="/admin/partners" class="back">← Retour aux partenaires</router-link>

    <div v-if="!partner" class="loading">Chargement...</div>

    <template v-else>
      <div class="detail-header">
        <h1>{{ partner.shopName }}</h1>
        <span class="badge" :class="partner.isActive ? 'active' : 'off'">
          {{ partner.isActive ? 'Actif' : 'Inactif' }}
        </span>
      </div>
      <p class="slug">/collection/{{ partner.slug }}</p>

      <div class="info-grid" v-if="partner">
        <div><span class="label">Commission</span><span>{{ partner.commission }}%</span></div>
        <div><span class="label">Email</span><span>{{ partner.email }}</span></div>
        <div><span class="label">Téléphone</span><span>{{ partner.phone || '—' }}</span></div>
        <div><span class="label">Ville</span><span>{{ partner.address?.city || '—' }}</span></div>
      </div>

      <template v-if="stats">
        <h2>Statistiques</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">CA Brut</span><span class="val">{{ stats.totalGross.toFixed(2) }} €</span></div>
          <div class="stat"><span class="label">Commission</span><span class="val">{{ stats.totalCommission.toFixed(2) }} €</span></div>
          <div class="stat"><span class="label">Net</span><span class="val highlight">{{ stats.totalNet.toFixed(2) }} €</span></div>
          <div class="stat"><span class="label">Commandes</span><span class="val">{{ stats.totalOrders }}</span></div>
          <div class="stat"><span class="label">Panier moyen</span><span class="val">{{ stats.avgBasket.toFixed(2) }} €</span></div>
          <div class="stat"><span class="label">Articles vendus</span><span class="val">{{ stats.totalItems }}</span></div>
        </div>

        <div v-if="stats.topProducts?.length" class="section">
          <h3>Top produits</h3>
          <table class="table">
            <thead><tr><th>Produit</th><th>Qté</th><th>CA</th></tr></thead>
            <tbody>
              <tr v-for="p in stats.topProducts" :key="p.name">
                <td>{{ p.name }}</td><td>{{ p.qty }}</td><td>{{ p.revenue.toFixed(2) }} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div class="section">
        <div class="section-header">
          <h2>Reversements</h2>
          <button @click="showPayoutForm = !showPayoutForm" class="btn-small">
            {{ showPayoutForm ? 'Annuler' : '+ Générer' }}
          </button>
        </div>

        <div v-if="showPayoutForm" class="payout-form">
          <input v-model="payoutPeriod" type="month" placeholder="2026-03" />
          <button @click="generatePayout" class="btn-save">Générer</button>
        </div>

        <table v-if="payouts.length" class="table">
          <thead><tr><th>Période</th><th>Brut</th><th>Commission</th><th>Net</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="p in payouts" :key="p._id">
              <td>{{ p.period }}</td>
              <td>{{ p.grossAmount.toFixed(2) }} €</td>
              <td>{{ p.commissionAmount.toFixed(2) }} €</td>
              <td><strong>{{ p.netAmount.toFixed(2) }} €</strong></td>
              <td><span class="badge" :class="p.status">{{ p.status === 'paid' ? 'Payé' : 'En attente' }}</span></td>
              <td>
                <button v-if="p.status === 'pending'" @click="markPaid(p._id)" class="btn-small">Marquer payé</button>
                <span v-else>{{ p.reference || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions-bar">
        <router-link :to="{ name: 'admin-partner-edit', params: { id: partner._id } }" class="btn-save">Modifier</router-link>
        <router-link :to="{ name: 'admin-partner-products', params: { id: partner._id } }" class="btn-outline">Gérer les articles</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.partner-detail { max-width: 1000px; margin: 0 auto; padding: 2rem 2rem 5rem; }
.back { font-size: 0.82rem; color: #111; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-bottom: 1.5rem; }
.loading { text-align: center; padding: 3rem; color: #888; }
.detail-header { display: flex; align-items: center; gap: 1rem; }
.detail-header h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; }
.slug { color: #aaa; font-size: 0.78rem; margin-bottom: 1.5rem; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; }
.badge.active, .badge.paid { background: #d4edda; color: #155724; }
.badge.off, .badge.pending { background: #fef3cd; color: #856404; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.info-grid > div { display: flex; flex-direction: column; gap: 0.2rem; }
.label { font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; }
h2 { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; letter-spacing: 0.04em; margin: 2rem 0 1rem; }
h3 { font-size: 0.95rem; margin-bottom: 0.8rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.stat { border: 1px solid rgba(17,17,17,0.08); padding: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
.val { font-size: 1.3rem; font-weight: 600; color: #111; }
.val.highlight { color: #27ae60; }
.section { margin-bottom: 2rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.5rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); }
.payout-form { display: flex; gap: 0.8rem; margin: 1rem 0; align-items: center; }
.payout-form input { padding: 0.5rem 0.8rem; border: 1px solid #ddd; font-size: 0.85rem; }
.btn-save { padding: 0.5rem 1.5rem; background: #111; color: #fff; border: none; font-size: 0.82rem; letter-spacing: 0.06em; cursor: pointer; text-decoration: none; display: inline-block; }
.btn-outline { padding: 0.5rem 1.5rem; background: #fff; color: #111; border: 1px solid #111; font-size: 0.82rem; letter-spacing: 0.06em; cursor: pointer; text-decoration: none; display: inline-block; }
.btn-small { padding: 0.3rem 0.8rem; font-size: 0.78rem; border: 1px solid #111; background: #fff; color: #111; cursor: pointer; }
.actions-bar { display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(17,17,17,0.1); }
</style>
