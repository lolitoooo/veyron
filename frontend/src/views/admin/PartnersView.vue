<script setup lang="ts">
import { onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const store = usePartnerStore();

onMounted(() => {
  store.adminFetchPartners();
});

async function toggleActive(partner: any) {
  await store.adminUpdatePartner(partner._id, { isActive: !partner.isActive });
  store.adminFetchPartners();
}
</script>

<template>
  <div class="admin-partners">
    <div class="page-header">
      <h1>Gestion des Partenaires</h1>
      <router-link to="/admin/partners/create" class="btn-create">+ Nouveau partenaire</router-link>
    </div>

    <div v-if="store.isLoading" class="loading">Chargement...</div>

    <div v-else-if="store.partners.length === 0" class="empty">Aucun partenaire.</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Boutique</th>
          <th>Contact</th>
          <th>Commission</th>
          <th>Statut</th>
          <th>Créé le</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in store.partners" :key="p._id" :class="{ inactive: !p.isActive }">
          <td>
            <strong>{{ p.shopName }}</strong>
            <br /><small class="slug">/collection/{{ p.slug }}</small>
          </td>
          <td>
            <span v-if="(p as any).user">{{ (p as any).user.firstName }} {{ (p as any).user.lastName }}</span>
            <br /><small>{{ p.email }}</small>
          </td>
          <td>{{ p.commission }}%</td>
          <td>
            <span class="badge" :class="p.isActive ? 'active' : 'off'">
              {{ p.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </td>
          <td>{{ new Date(p.createdAt).toLocaleDateString('fr-FR') }}</td>
          <td class="actions">
            <router-link :to="{ name: 'admin-partner-detail', params: { id: p._id } }" class="action-link">Détail</router-link>
            <router-link :to="{ name: 'admin-partner-edit', params: { id: p._id } }" class="action-link">Modifier</router-link>
            <router-link :to="{ name: 'admin-partner-products', params: { id: p._id } }" class="action-link">Articles</router-link>
            <button @click="toggleActive(p)" class="action-btn">
              {{ p.isActive ? 'Désactiver' : 'Activer' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.admin-partners { max-width: 1200px; margin: 0 auto; padding: 2rem 2rem 5rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-header h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; }
.btn-create { padding: 0.6rem 1.5rem; background: #111; color: #fff; text-decoration: none; font-size: 0.82rem; letter-spacing: 0.06em; transition: opacity 0.2s; }
.btn-create:hover { opacity: 0.85; }
.loading, .empty { text-align: center; padding: 3rem; color: #888; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); vertical-align: top; }
.table tr.inactive { opacity: 0.5; }
.slug { color: #aaa; font-size: 0.72rem; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; }
.badge.active { background: #d4edda; color: #155724; }
.badge.off { background: #f8d7da; color: #721c24; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.action-link { font-size: 0.78rem; color: #111; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 0.5px; }
.action-btn { font-size: 0.78rem; padding: 0.2rem 0.6rem; border: 1px solid #999; background: #fff; cursor: pointer; }
.action-btn:hover { background: #f5f5f5; }
</style>
