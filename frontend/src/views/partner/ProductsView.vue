<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

interface Variant {
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  images?: { url: string }[];
  variants?: Variant[];
  colors?: { name: string }[];
  sizes?: string[];
}

const store = usePartnerStore();
const products = ref<Product[]>([]);
const editingId = ref<string | null>(null);
const editVariants = ref<Variant[]>([]);
const editSimpleStock = ref(0);
const saving = ref(false);

onMounted(async () => {
  products.value = await store.fetchMyProducts();
});

function hasVariants(product: Product) {
  return product.variants && product.variants.length > 0;
}

function startEdit(product: Product) {
  editingId.value = product._id;
  if (hasVariants(product)) {
    editVariants.value = product.variants!.map(v => ({ ...v }));
  } else {
    editSimpleStock.value = product.stock;
  }
}

function cancelEdit() {
  editingId.value = null;
  editVariants.value = [];
}

function totalEditStock(product: Product) {
  if (hasVariants(product) && editingId.value === product._id) {
    return editVariants.value.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return product.stock;
}

async function saveStock(product: Product) {
  saving.value = true;
  try {
    if (hasVariants(product)) {
      const totalStock = editVariants.value.reduce((sum, v) => sum + (v.stock || 0), 0);
      await store.updateMyProductStock(product._id, {
        stock: totalStock,
        variants: editVariants.value.map(v => ({ size: v.size, color: v.color, stock: v.stock }))
      });
    } else {
      await store.updateMyProductStock(product._id, { stock: editSimpleStock.value });
    }
    products.value = await store.fetchMyProducts();
    editingId.value = null;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="partner-products">
    <h1>Mes Articles</h1>

    <div v-if="products.length === 0" class="empty">Aucun article.</div>

    <div v-else class="products-list">
      <div v-for="product in products" :key="product._id" class="product-card">
        <div class="product-header">
          <img :src="product.images?.[0]?.url" class="thumb" />
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <span class="product-price">{{ product.price.toFixed(2) }} €</span>
          </div>
          <span class="badge" :class="product.isActive ? 'active' : 'inactive'">
            {{ product.isActive ? 'Actif' : 'Inactif' }}
          </span>
          <span class="total-stock" :class="{ 'low-stock': product.stock <= 5 }">
            Stock total : {{ editingId === product._id ? totalEditStock(product) : product.stock }}
          </span>
        </div>

        <!-- Mode lecture : afficher les variants -->
        <template v-if="editingId !== product._id">
          <div v-if="hasVariants(product)" class="variants-grid">
            <div v-for="v in product.variants" :key="`${v.size}-${v.color}`" class="variant-chip" :class="{ 'low-stock-chip': v.stock <= 2 }">
              <span class="variant-label">{{ v.size }} / {{ v.color }}</span>
              <span class="variant-stock">{{ v.stock }}</span>
            </div>
          </div>
          <div class="product-actions">
            <button @click="startEdit(product)" class="btn-edit">Modifier le stock</button>
          </div>
        </template>

        <!-- Mode édition -->
        <template v-else>
          <div v-if="hasVariants(product)" class="variants-edit">
            <table class="variants-table">
              <thead>
                <tr>
                  <th>Taille</th>
                  <th>Couleur</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, i) in editVariants" :key="i">
                  <td class="cell-size">{{ v.size }}</td>
                  <td class="cell-color">{{ v.color }}</td>
                  <td><input v-model.number="v.stock" type="number" min="0" class="stock-input" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="simple-stock-edit">
            <label>Stock :</label>
            <input v-model.number="editSimpleStock" type="number" min="0" class="stock-input" />
          </div>
          <div class="product-actions">
            <button @click="saveStock(product)" :disabled="saving" class="btn-save">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
            <button @click="cancelEdit" class="btn-cancel">Annuler</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.partner-products { max-width: 900px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
.empty { text-align: center; padding: 3rem; color: #888; }

.products-list { display: flex; flex-direction: column; gap: 1.5rem; }

.product-card { border: 1px solid rgba(17,17,17,0.08); padding: 1.2rem 1.5rem; }

.product-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.thumb { width: 50px; height: 50px; object-fit: cover; background: #f5f5f5; flex-shrink: 0; }
.product-info { flex: 1; min-width: 120px; }
.product-info h3 { font-family: var(--font-heading); font-size: 0.95rem; font-weight: 400; letter-spacing: 0.04em; color: #111; margin: 0; }
.product-price { font-size: 0.82rem; color: #666; }

.badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2px; flex-shrink: 0; }
.badge.active { background: #d4edda; color: #155724; }
.badge.inactive { background: #f8d7da; color: #721c24; }

.total-stock { font-size: 0.8rem; color: #666; letter-spacing: 0.04em; flex-shrink: 0; }
.total-stock.low-stock { color: #e74c3c; font-weight: 600; }

.variants-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.variant-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.7rem; background: #f5f5f5; font-size: 0.78rem; }
.variant-chip.low-stock-chip { background: #fef2f2; border: 1px solid #fecaca; }
.variant-label { color: #666; }
.variant-stock { font-weight: 600; color: #111; }
.low-stock-chip .variant-stock { color: #e74c3c; }

.variants-edit { margin-bottom: 1rem; }
.variants-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.variants-table th { text-align: left; font-size: 0.7rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.4rem 0.6rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.variants-table td { padding: 0.4rem 0.6rem; border-bottom: 1px solid rgba(17,17,17,0.04); }
.cell-size { font-weight: 500; }
.cell-color { color: #666; }
.stock-input { width: 70px; padding: 0.35rem 0.5rem; border: 1px solid #ddd; font-size: 0.85rem; text-align: center; }
.stock-input:focus { outline: none; border-color: #111; }

.simple-stock-edit { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; font-size: 0.85rem; }

.product-actions { display: flex; gap: 0.6rem; }
.btn-edit, .btn-save, .btn-cancel { padding: 0.4rem 1rem; font-size: 0.78rem; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; border: 1px solid #111; }
.btn-edit { background: #fff; color: #111; }
.btn-edit:hover { background: #111; color: #fff; }
.btn-save { background: #111; color: #fff; border-color: #111; }
.btn-save:disabled { opacity: 0.5; }
.btn-cancel { background: #fff; color: #888; border-color: #ddd; }
.btn-cancel:hover { border-color: #111; color: #111; }

@media (max-width: 640px) {
  .product-header { gap: 0.6rem; }
  .variants-grid { gap: 0.3rem; }
  .variant-chip { font-size: 0.72rem; padding: 0.25rem 0.5rem; }
}
</style>
