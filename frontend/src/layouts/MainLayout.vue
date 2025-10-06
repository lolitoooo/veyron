<template>
  <div class="main-layout">
    <TheHeader />
    <main class="content" :class="{ 'home-content': isHomePage }">
      <Breadcrumb v-if="!isHomePage" class="breadcrumb-container" />
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
import TheHeader from '@/components/TheHeader.vue';
import TheFooter from '@/components/TheFooter.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';

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
  padding-top: 80px;
  width: 100%;
  max-width: 100%;
}

.home-content {
  padding-top: 0;
}

.breadcrumb-container {
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 10;
  padding: 0 1rem;
}

@media (max-width: 800px) {
  .content {
    padding-top: 50px;
  }
  
  .home-content {
    padding-top: 0;
  }
}

@media (max-width: 480px) {
  .content {
    padding-top: 45px;
  }
}
</style>
