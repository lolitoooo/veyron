<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';

const route = useRoute();
const store = usePartnerStore();
const products = ref<any[]>([]);
const partnerName = ref('');
const id = route.params.id as string;

onMounted(async () => {
  products.value = await store.adminFetchPartnerProducts(id);
  await store.adminFetchPartners();
  const p = store.partners.find(p => p._id === id);
  if (p) partnerName.value = p.shopName;
});

async function deleteProduct(productId: string) {
  if (!confirm('Désactiver cet article ?')) return;
  await store.adminDeletePartnerProduct(id, productId);
  products.value = await store.adminFetchPartnerProducts(id);
}
</script>

<template>
  <div class="partner-products-admin">
    <router-link :to="{ name: 'admin-partner-detail', params: { id } }" class="back">← Retour au partenaire</router-link>

    <div class="page-header">
      <h1>Articles — {{ partnerName }}</h1>
      <router-link :to="{ name: 'admin-partner-product-create', params: { id } }" class="btn-create">+ Ajouter un article</router-link>
    </div>

    <div v-if="products.length === 0" class="empty">
      <p>Aucun article pour ce partenaire.</p>
      <router-link :to="{ name: 'admin-partner-product-create', params: { id } }" class="btn-create" style="margin-top: 1rem; display: inline-block;">+ Ajouter le premier article</router-link>
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Nom</th>
          <th>Prix</th>
          <th>Stock</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product._id" :class="{ inactive: !product.isActive }">
          <td><img :src="product.images?.[0]?.url" class="thumb" /></td>
          <td>{{ product.name }}</td>
          <td>{{ product.price.toFixed(2) }} €</td>
          <td :class="{ 'low-stock': product.stock <= 5 }">{{ product.stock }}</td>
          <td>
            <span class="badge" :class="product.isActive ? 'active' : 'off'">
              {{ product.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </td>
          <td class="actions">
            <router-link :to="{ name: 'admin-partner-product-edit', params: { id, productId: product._id } }" class="btn-edit">Modifier</router-link>
            <button @click="deleteProduct(product._id)" class="btn-del">Désactiver</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.partner-products-admin { max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 5rem; }
.back { font-size: 0.82rem; color: #111; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-bottom: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-header h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; }
.empty { text-align: center; padding: 3rem; color: #888; }
.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid rgba(17,17,17,0.05); vertical-align: middle; }
.table tr.inactive { opacity: 0.5; }
.thumb { width: 45px; height: 45px; object-fit: cover; background: #f5f5f5; }
.low-stock { color: #e74c3c; font-weight: 600; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; }
.badge.active { background: #d4edda; color: #155724; }
.badge.off { background: #f8d7da; color: #721c24; }
.btn-create { padding: 0.6rem 1.5rem; background: #111; color: #fff; text-decoration: none; font-size: 0.82rem; letter-spacing: 0.06em; transition: opacity 0.2s; }
.btn-create:hover { opacity: 0.85; }
.actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-edit { padding: 0.3rem 0.8rem; font-size: 0.78rem; border: 1px solid #111; color: #111; text-decoration: none; }
.btn-edit:hover { background: #111; color: #fff; }
.btn-del { padding: 0.3rem 0.8rem; font-size: 0.78rem; border: 1px solid #e74c3c; background: #fff; color: #e74c3c; cursor: pointer; }
.btn-del:hover { background: #e74c3c; color: #fff; }
</style>
