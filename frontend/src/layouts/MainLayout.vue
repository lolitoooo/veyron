<template>
  <div class="main-layout">
    <TheHeader />
    <main id="main-content" class="content" :class="{ 'home-content': isHomePage }" tabindex="-1">
      <Breadcrumb v-if="!isHomePage" class="breadcrumb-container" />
      <RouterView />
    </main>
    <TheFooter />
    <CookieBanner />
    <CookieSettings />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
import TheHeader from '@/components/TheHeader.vue';
import TheFooter from '@/components/TheFooter.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import CookieBanner from '@/components/CookieBanner.vue';
import CookieSettings from '@/components/CookieSettings.vue';

const route = useRoute();
const isHomePage = computed(() => route.path === '/');
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.content {
  flex: 1;
  padding-top: calc(80px + env(safe-area-inset-top));
  width: 100%;
  max-width: 100%;
}

.content:focus {
  outline: none;
}

.home-content {
  padding-top: env(safe-area-inset-top);
}

.breadcrumb-container {
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 10;
  padding: 0 1rem;
}

@media (max-width: 800px) {
  .content {
    padding-top: calc(60px + env(safe-area-inset-top));
  }
  
  .home-content {
    padding-top: env(safe-area-inset-top);
  }
}

@media (max-width: 480px) {
  .content {
    padding-top: calc(56px + env(safe-area-inset-top));
  }
}
</style>
