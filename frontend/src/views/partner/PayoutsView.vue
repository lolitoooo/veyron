<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const store = usePartnerStore();
const payouts = ref<any[]>([]);

onMounted(async () => {
  payouts.value = await store.fetchMyPayouts();
});

const totalPending = computed(() =>
  payouts.value.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.netAmount, 0)
);

const totalPaid = computed(() =>
  payouts.value.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.netAmount, 0)
);
</script>

<template>
  <div class="partner-payouts">
    <h1>Reversements</h1>

    <div class="summary">
      <div class="summary-card">
        <span class="label">En attente</span>
        <span class="value pending">{{ totalPending.toFixed(2) }} €</span>
      </div>
      <div class="summary-card">
        <span class="label">Total reversé</span>
        <span class="value paid">{{ totalPaid.toFixed(2) }} €</span>
      </div>
    </div>

    <div v-if="payouts.length === 0" class="empty">Aucun reversement pour le moment.</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Période</th>
          <th>CA Brut</th>
          <th>Commission</th>
          <th>Montant net</th>
          <th>Commandes</th>
          <th>Statut</th>
          <th>Référence</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in payouts" :key="p._id">
          <td>{{ p.period }}</td>
          <td>{{ p.grossAmount.toFixed(2) }} €</td>
          <td>{{ p.commissionAmount.toFixed(2) }} € ({{ p.commissionRate }}%)</td>
          <td><strong>{{ p.netAmount.toFixed(2) }} €</strong></td>
          <td>{{ p.ordersCount }}</td>
          <td><span class="badge" :class="p.status">{{ p.status === 'paid' ? 'Payé' : 'En attente' }}</span></td>
          <td>{{ p.reference || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.partner-payouts { max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
.summary { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
.summary-card { border: 1px solid rgba(17,17,17,0.08); padding: 1.4rem 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.label { font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; }
.value { font-size: 1.5rem; font-weight: 600; }
.value.pending { color: #e67e22; }
.value.paid { color: #27ae60; }
.empty { text-align: center; padding: 3rem; color: #888; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
.badge.pending { background: #fef3cd; color: #856404; }
.badge.paid { background: #d4edda; color: #155724; }
</style>
