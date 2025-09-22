<template>
  <div class="flashlight-container" ref="container" @mousemove="handleMouseMove" @touchmove="handleTouchMove">
    <div class="flashlight" :style="{ '--x': `${mouseX}px`, '--y': `${mouseY}px` }">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Page non trouvée</h2>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <router-link to="/" class="btn-primary">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const container = ref<HTMLElement | null>(null);
const mouseX = ref(0);
const mouseY = ref(0);

const handleMouseMove = (event: MouseEvent) => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    mouseX.value = event.clientX - rect.left;
    mouseY.value = event.clientY - rect.top;
  }
};

const handleTouchMove = (event: TouchEvent) => {
  if (container.value && event.touches.length > 0) {
    const rect = container.value.getBoundingClientRect();
    mouseX.value = event.touches[0].clientX - rect.left;
    mouseY.value = event.touches[0].clientY - rect.top;
    event.preventDefault(); // Empêche le défilement sur mobile
  }
};

// Initialiser la position au centre de l'écran
onMounted(() => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    mouseX.value = rect.width / 2;
    mouseY.value = rect.height / 2;
    
    // Changer le style du curseur
    document.body.style.cursor = 'none';
  }
});

onUnmounted(() => {
  // Restaurer le curseur par défaut
  document.body.style.cursor = 'auto';
});
</script>

<style scoped>
.flashlight-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  z-index: 9999;
  cursor: none;
}

.flashlight {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
  mask-image: radial-gradient(
    circle 180px at var(--x) var(--y),
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.8) 30%,
    rgba(255, 255, 255, 0) 70%
  );
  -webkit-mask-image: radial-gradient(
    circle 180px at var(--x) var(--y),
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.8) 30%,
    rgba(255, 255, 255, 0) 70%
  );
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  color: #333;
  z-index: 1;
}

h1 {
  font-size: 8rem;
  margin: 0;
  color: #333;
  line-height: 1;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

h2 {
  font-size: 2.5rem;
  margin: 0 0 1.5rem 0;
  color: #333;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #555;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  display: inline-block;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.2s;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  background-color: #2980b9;
}

/* Curseur personnalisé */
.flashlight-container::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.2) 70%,
    transparent 100%
  );
  transform: translate(-50%, -50%);
  left: var(--x);
  top: var(--y);
  pointer-events: none;
  z-index: 10;
  filter: blur(2px);
}
</style>
