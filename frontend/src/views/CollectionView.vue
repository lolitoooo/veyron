<script setup lang="ts">
import { onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';

const partnerStore = usePartnerStore();

onMounted(() => {
  partnerStore.fetchPartners();
});
</script>

<template>
  <div class="collection-page">
    <div class="collection-header">
      <h1>Nos Boutiques Partenaires</h1>
      <p>Découvrez les boutiques sélectionnées par VEYRON</p>
    </div>

    <div v-if="partnerStore.isLoading" class="loading">
      <p>Chargement...</p>
    </div>

    <div v-else-if="partnerStore.partners.length === 0" class="empty">
      <p>Aucune boutique disponible pour le moment.</p>
    </div>

    <div v-else class="partners-grid">
      <router-link
        v-for="partner in partnerStore.partners"
        :key="partner._id"
        :to="{ name: 'partner-shop', params: { slug: partner.slug } }"
        class="partner-card"
      >
        <div class="partner-card-inner">
          <div class="partner-logo-wrap">
            <img
              v-if="partner.logo"
              :src="partner.logo"
              :alt="partner.shopName"
              class="partner-logo"
            />
            <div v-else class="partner-logo-placeholder">
              {{ partner.shopName.charAt(0) }}
            </div>
          </div>
          <div class="partner-info">
            <h2>{{ partner.shopName }}</h2>
            <p v-if="partner.address?.city" class="partner-city">{{ partner.address.city }}</p>
            <span class="partner-cta">Découvrir →</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.collection-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem 5rem;
}

.collection-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.collection-header h1 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3.5vw, 3rem);
  font-weight: 300;
  letter-spacing: 0.08em;
  color: #111;
  margin-bottom: 0.6rem;
}

.collection-header p {
  font-size: 0.9rem;
  color: #666;
  letter-spacing: 0.04em;
}

.loading, .empty {
  text-align: center;
  padding: 4rem 0;
  color: #888;
  font-size: 0.95rem;
}

.partners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.partner-card {
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(17,17,17,0.1);
  transition: all 0.3s ease;
}

.partner-card:hover {
  border-color: #111;
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
}

.partner-card-inner {
  padding: 2.5rem 2rem;
  text-align: center;
}

.partner-logo-wrap {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.partner-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.partner-logo-placeholder {
  width: 100px;
  height: 100px;
  background: #111;
  color: #ece6d4;
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.partner-info h2 {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  color: #111;
  margin-bottom: 0.3rem;
}

.partner-city {
  font-size: 0.78rem;
  color: #888;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
}

.partner-cta {
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: #111;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 0.5px;
}

@media (max-width: 640px) {
  .collection-page {
    padding: 2rem 1rem 4rem;
  }

  .partners-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}
</style>
