<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';

const route = useRoute();
const partnerStore = usePartnerStore();
const products = ref<any[]>([]);

const slug = computed(() => route.params.slug as string);

onMounted(async () => {
  await partnerStore.fetchPartnerBySlug(slug.value);
  products.value = await partnerStore.fetchPartnerProducts(slug.value);
});

const partner = computed(() => partnerStore.currentPartner);
</script>

<template>
  <div class="shop-page" v-if="partner" :style="{ backgroundColor: partner.design?.backgroundColor || '#fff' }">
    <div
      class="shop-banner"
      v-if="partner.design?.bannerImage"
      :style="{ backgroundImage: `url(${partner.design.bannerImage})` }"
    ></div>

    <div class="shop-header">
      <h1 class="shop-title" :style="{ color: partner.design?.primaryColor || '#111' }">
        VEYRON × {{ partner.shopName.toUpperCase() }}
      </h1>
      <p v-if="partner.description" class="shop-desc">{{ partner.description }}</p>

      <div class="shop-meta" v-if="partner.address?.city || partner.socialLinks">
        <span v-if="partner.address?.city" class="shop-location">{{ partner.address.city }}</span>
        <a v-if="partner.socialLinks?.instagram" :href="partner.socialLinks.instagram" target="_blank" rel="noopener" class="social-link">Instagram</a>
        <a v-if="partner.socialLinks?.facebook" :href="partner.socialLinks.facebook" target="_blank" rel="noopener" class="social-link">Facebook</a>
      </div>

      <a
        v-if="partner.socialLinks?.website"
        :href="partner.socialLinks.website"
        target="_blank"
        rel="noopener"
        class="visit-site-btn"
      >
        Visiter le site {{ partner.shopName }} ↗
      </a>
    </div>

    <div class="shop-products">
      <div v-if="products.length === 0" class="empty">
        <p>Aucun article disponible pour le moment.</p>
      </div>
      <div v-else class="products-grid">
        <router-link
          v-for="product in products"
          :key="product._id"
          :to="{ name: 'product', params: { productSlug: `${product.slug}-${product._id}` } }"
          class="product-card"
        >
          <div class="product-image">
            <img
              :src="product.images?.[0]?.url || ''"
              :alt="product.name"
            />
          </div>
          <div class="product-details">
            <h3>{{ product.name }}</h3>
            <p class="product-price">
              <span v-if="product.discount > 0" class="price-original">{{ product.price.toFixed(2) }} €</span>
              <span :class="{ 'price-sale': product.discount > 0 }">
                {{ product.discount > 0 ? product.discountPrice.toFixed(2) : product.price.toFixed(2) }} €
              </span>
            </p>
          </div>
        </router-link>
      </div>
    </div>
  </div>

  <div v-else-if="partnerStore.isLoading" class="loading-page">
    <p>Chargement de la boutique...</p>
  </div>

  <div v-else class="error-page">
    <h2>Boutique introuvable</h2>
    <router-link to="/category/collections">← Retour aux boutiques</router-link>
  </div>
</template>

<style scoped>
.shop-page {
  min-height: 80vh;
}

.shop-banner {
  width: 100%;
  height: 300px;
  background-size: cover;
  background-position: center;
}

.shop-header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem 2rem;
  text-align: center;
}

.shop-title {
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 4vw, 3.2rem);
  font-weight: 300;
  letter-spacing: 0.12em;
  margin-bottom: 0.8rem;
}

.shop-desc {
  font-size: 0.9rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto 1.2rem;
  line-height: 1.6;
}

.shop-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  color: #888;
}

.social-link {
  color: #111;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 0.5px;
  transition: opacity 0.2s;
}

.social-link:hover {
  opacity: 0.5;
}

.visit-site-btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  border: 1px solid #111;
  color: #111;
  text-decoration: none;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.25s ease;
}

.visit-site-btn:hover {
  background: #111;
  color: #fff;
}

.shop-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2rem 5rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.product-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
}

.product-image {
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-details {
  padding: 0.8rem 0;
}

.product-details h3 {
  font-family: var(--font-heading);
  font-size: 0.88rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: #111;
  margin-bottom: 0.3rem;
}

.product-price {
  font-size: 0.82rem;
  color: #111;
}

.price-original {
  text-decoration: line-through;
  color: #999;
  margin-right: 0.5rem;
}

.price-sale {
  color: #c0392b;
}

.loading-page, .error-page, .empty {
  text-align: center;
  padding: 5rem 2rem;
  color: #888;
}

.error-page a {
  color: #111;
  text-decoration: underline;
  margin-top: 1rem;
  display: inline-block;
}

@media (max-width: 640px) {
  .shop-banner { height: 180px; }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
</style>
