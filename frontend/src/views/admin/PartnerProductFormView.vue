<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';
import api from '@/services/apiService';
import { getImageUrl } from '@/utils/imageUrl';

const route = useRoute();
const router = useRouter();
const store = usePartnerStore();

const partnerId = computed(() => route.params.id as string);
const productId = computed(() => route.params.productId as string | undefined);
const isEdit = computed(() => !!productId.value);

const saving = ref(false);
const uploading = ref(false);
const error = ref('');
const partnerName = ref('');

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unique'];

const form = ref({
  name: '',
  description: '',
  price: 0,
  discount: 0,
  brand: '',
  stock: 0,
  images: [] as { url: string; alt: string; isMain: boolean }[],
  sizes: [] as string[],
  colors: [] as { name: string; code: string; images: string[] }[],
  variants: [] as { size: string; color: string; stock: number; sku: string }[],
  isActive: true
});

const totalStock = computed(() => {
  if (form.value.variants.length === 0) return form.value.stock;
  return form.value.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
});

const finalPrice = computed(() => {
  if (form.value.discount > 0) {
    return parseFloat((form.value.price * (1 - form.value.discount / 100)).toFixed(2));
  }
  return form.value.price;
});

watch([() => form.value.sizes, () => form.value.colors, () => form.value.name], () => {
  if (form.value.sizes.length > 0 && form.value.colors.length > 0) {
    const newVariants: { size: string; color: string; stock: number; sku: string }[] = [];
    form.value.sizes.forEach(size => {
      form.value.colors.forEach(color => {
        const existing = form.value.variants.find(v => v.size === size && v.color === color.name);
        const autoSku = `${(form.value.name || 'XXX').substring(0, 3).toUpperCase()}-${color.name.substring(0, 3).toUpperCase()}-${size}`;
        newVariants.push({
          size,
          color: color.name,
          stock: existing?.stock || 0,
          sku: autoSku
        });
      });
    });
    form.value.variants = newVariants;
  }
}, { deep: true });

onMounted(async () => {
  await store.adminFetchPartners();
  const p = store.partners.find(p => p._id === partnerId.value);
  if (p) {
    partnerName.value = p.shopName;
    if (!isEdit.value) form.value.brand = p.shopName;
  }

  if (isEdit.value) {
    try {
      const res = await api.get(`/products/${productId.value}`);
      const prod = res.data.data || res.data;
      form.value = {
        name: prod.name || '',
        description: prod.description || '',
        price: prod.price || 0,
        discount: prod.discount || 0,
        brand: prod.brand || '',
        stock: prod.stock || 0,
        images: prod.images || [],
        sizes: prod.sizes || [],
        colors: prod.colors || [],
        variants: prod.variants || [],
        isActive: prod.isActive !== false
      };
    } catch {
      error.value = 'Erreur lors du chargement du produit';
    }
  }
});

async function uploadImages(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  uploading.value = true;
  const formData = new FormData();

  if (input.files.length === 1) {
    formData.append('image', input.files[0]);
    try {
      const res = await api.post('/upload/single', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        form.value.images.push({ url: res.data.data.url, alt: form.value.name, isMain: form.value.images.length === 0 });
      }
    } catch { error.value = 'Erreur upload'; }
  } else {
    for (const file of input.files) {
      formData.append('images', file);
    }
    try {
      const res = await api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        res.data.data.forEach((img: { url: string }) => {
          form.value.images.push({ url: img.url, alt: form.value.name, isMain: form.value.images.length === 0 });
        });
      }
    } catch { error.value = 'Erreur upload'; }
  }

  uploading.value = false;
  input.value = '';
}

function removeImage(index: number) {
  const wasMain = form.value.images[index].isMain;
  form.value.images.splice(index, 1);
  if (wasMain && form.value.images.length > 0) form.value.images[0].isMain = true;
}

function setMainImage(index: number) {
  form.value.images.forEach((img, i) => img.isMain = i === index);
}

function addColor() {
  form.value.colors.push({ name: '', code: '#000000', images: [] });
}

function removeColor(index: number) {
  form.value.colors.splice(index, 1);
}

function toggleSize(size: string) {
  const idx = form.value.sizes.indexOf(size);
  if (idx === -1) form.value.sizes.push(size);
  else form.value.sizes.splice(idx, 1);
}

async function submit() {
  if (!form.value.name || !form.value.description) {
    error.value = 'Veuillez remplir les champs obligatoires (nom, description)';
    return;
  }

  saving.value = true;
  error.value = '';

  const data = {
    ...form.value,
    stock: totalStock.value,
    discountPrice: form.value.discount > 0 ? finalPrice.value : undefined
  };

  try {
    if (isEdit.value) {
      await store.adminUpdatePartnerProduct(partnerId.value, productId.value!, data);
    } else {
      await store.adminCreatePartnerProduct(partnerId.value, data);
    }
    router.push({ name: 'admin-partner-products', params: { id: partnerId.value } });
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Erreur lors de la sauvegarde';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="partner-product-form">
    <router-link :to="{ name: 'admin-partner-products', params: { id: partnerId } }" class="back">
      ← Retour aux articles de {{ partnerName }}
    </router-link>

    <h1>{{ isEdit ? 'Modifier l\'article' : 'Nouvel article' }} — {{ partnerName }}</h1>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <form @submit.prevent="submit">
      <section class="form-section">
        <h2>Informations générales</h2>
        <div class="form-group">
          <label>Nom du produit *</label>
          <input v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea v-model="form.description" rows="4" required></textarea>
        </div>
        <div class="form-group">
          <label>Marque</label>
          <input v-model="form.brand" />
        </div>
      </section>

      <section class="form-section">
        <h2>Prix</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Prix de base (€) *</label>
            <input v-model.number="form.price" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Remise (%)</label>
            <input v-model.number="form.discount" type="number" min="0" max="100" />
          </div>
          <div class="form-group">
            <label>Prix final</label>
            <div class="final-price">{{ finalPrice.toFixed(2) }} €</div>
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2>Images</h2>
        <div class="images-grid" v-if="form.images.length">
          <div v-for="(img, i) in form.images" :key="i" class="image-item" :class="{ main: img.isMain }">
            <img :src="getImageUrl(img.url)" :alt="img.alt" />
            <div class="image-actions">
              <button type="button" @click="setMainImage(i)" class="btn-sm" :disabled="img.isMain">
                {{ img.isMain ? '★ Principale' : 'Principale' }}
              </button>
              <button type="button" @click="removeImage(i)" class="btn-sm btn-danger">✕</button>
            </div>
          </div>
        </div>
        <div class="upload-area">
          <label class="upload-btn" :class="{ disabled: uploading }">
            {{ uploading ? 'Upload en cours...' : '+ Ajouter des images' }}
            <input type="file" accept="image/*" multiple hidden @change="uploadImages" :disabled="uploading" />
          </label>
        </div>
      </section>

      <section class="form-section">
        <h2>Tailles</h2>
        <div class="sizes-grid">
          <button
            v-for="size in availableSizes"
            :key="size"
            type="button"
            class="size-btn"
            :class="{ selected: form.sizes.includes(size) }"
            @click="toggleSize(size)"
          >
            {{ size }}
          </button>
        </div>
      </section>

      <section class="form-section">
        <h2>Couleurs</h2>
        <div v-for="(color, i) in form.colors" :key="i" class="color-row">
          <input v-model="color.name" placeholder="Nom (ex: Noir)" />
          <input v-model="color.code" type="color" />
          <button type="button" @click="removeColor(i)" class="btn-sm btn-danger">✕</button>
        </div>
        <button type="button" @click="addColor" class="btn-add">+ Ajouter une couleur</button>
      </section>

      <section class="form-section" v-if="form.variants.length">
        <h2>Variants (stock par taille/couleur)</h2>
        <table class="variants-table">
          <thead><tr><th>Taille</th><th>Couleur</th><th>Stock</th><th>SKU</th></tr></thead>
          <tbody>
            <tr v-for="(v, i) in form.variants" :key="i">
              <td>{{ v.size }}</td>
              <td>{{ v.color }}</td>
              <td><input v-model.number="v.stock" type="number" min="0" class="stock-input" /></td>
              <td><input v-model="v.sku" placeholder="SKU" class="sku-input" /></td>
            </tr>
          </tbody>
        </table>
        <p class="stock-total">Stock total : <strong>{{ totalStock }}</strong></p>
      </section>

      <section class="form-section" v-else>
        <h2>Stock</h2>
        <div class="form-group" style="max-width: 200px;">
          <label>Quantité en stock</label>
          <input v-model.number="form.stock" type="number" min="0" />
        </div>
      </section>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn-save">
          {{ saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer l\'article' }}
        </button>
        <router-link :to="{ name: 'admin-partner-products', params: { id: partnerId } }" class="btn-cancel">Annuler</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.partner-product-form { max-width: 900px; margin: 0 auto; padding: 2rem 2rem 5rem; }
.back { font-size: 0.82rem; color: #111; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-bottom: 1.5rem; }
h1 { font-family: var(--font-heading); font-size: 1.6rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 2rem; }
.error-msg { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; }

.form-section { margin-bottom: 2.5rem; }
.form-section h2 { font-family: var(--font-heading); font-size: 1.05rem; font-weight: 400; letter-spacing: 0.04em; margin-bottom: 1.2rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(17,17,17,0.08); }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.75rem; letter-spacing: 0.08em; color: #888; text-transform: uppercase; margin-bottom: 0.3rem; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; font-size: 0.88rem; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #111; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }

.final-price { padding: 0.6rem 0.8rem; background: #f0f0f0; font-size: 1.1rem; font-weight: 600; color: #111; }

.images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.image-item { border: 1px solid #ddd; position: relative; }
.image-item.main { border-color: #111; border-width: 2px; }
.image-item img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.image-actions { display: flex; gap: 0.3rem; padding: 0.4rem; }
.btn-sm { padding: 0.2rem 0.5rem; font-size: 0.7rem; border: 1px solid #ddd; background: #fff; cursor: pointer; }
.btn-sm:disabled { opacity: 0.4; cursor: default; }
.btn-danger { border-color: #e74c3c; color: #e74c3c; }
.btn-danger:hover { background: #e74c3c; color: #fff; }
.upload-area { margin-top: 0.5rem; }
.upload-btn { padding: 0.6rem 1.5rem; background: #111; color: #fff; font-size: 0.82rem; letter-spacing: 0.06em; cursor: pointer; display: inline-block; transition: opacity 0.2s; }
.upload-btn:hover { opacity: 0.85; }
.upload-btn.disabled { opacity: 0.5; pointer-events: none; }

.sizes-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.size-btn { padding: 0.5rem 1rem; border: 1px solid #ddd; background: #fff; cursor: pointer; font-size: 0.82rem; transition: all 0.15s; }
.size-btn.selected { background: #111; color: #fff; border-color: #111; }

.color-row { display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.6rem; }
.color-row input[type="text"] { flex: 1; padding: 0.5rem 0.8rem; border: 1px solid #ddd; font-size: 0.85rem; }
.color-row input[type="color"] { width: 40px; height: 35px; padding: 2px; cursor: pointer; border: 1px solid #ddd; }
.btn-add { padding: 0.4rem 1rem; font-size: 0.78rem; border: 1px dashed #aaa; background: #fafafa; cursor: pointer; color: #666; margin-top: 0.5rem; }
.btn-add:hover { border-color: #111; color: #111; }

.variants-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.variants-table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.1em; color: #888; text-transform: uppercase; padding: 0.5rem 0.6rem; border-bottom: 1px solid rgba(17,17,17,0.1); }
.variants-table td { padding: 0.4rem 0.6rem; border-bottom: 1px solid rgba(17,17,17,0.05); }
.stock-input { width: 70px; padding: 0.3rem 0.5rem; border: 1px solid #ddd; font-size: 0.85rem; }
.sku-input { width: 140px; padding: 0.3rem 0.5rem; border: 1px solid #ddd; font-size: 0.85rem; }
.stock-total { margin-top: 0.8rem; font-size: 0.85rem; color: #666; }

.form-actions { margin-top: 2.5rem; display: flex; align-items: center; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(17,17,17,0.1); }
.btn-save { padding: 0.7rem 2rem; background: #111; color: #fff; border: none; font-size: 0.82rem; letter-spacing: 0.08em; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; }
.btn-cancel { font-size: 0.82rem; color: #888; text-decoration: underline; }

@media (max-width: 640px) {
  .form-row { grid-template-columns: 1fr; }
  .images-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
