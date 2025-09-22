<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <router-link to="/">VEYRON</router-link>
      </div>
      
      <nav class="navigation">
        <ul>
          <li><router-link to="/category/femme">Femme</router-link></li>
          <li><router-link to="/category/homme">Homme</router-link></li>
          <li><router-link to="/category/accessoires">Accessoires</router-link></li>
          <li><router-link to="/category/collections">Collections</router-link></li>
        </ul>
      </nav>
      
      <div class="header-actions">
        <button class="icon-button" aria-label="Recherche" @click="toggleSearch">
          <i class="material-icons">search</i>
        </button>
        
        <template v-if="isAuthenticated">
          <router-link to="/account" class="icon-button account-button" aria-label="Mon compte">
            <i class="material-icons">person</i>
            <span class="account-indicator"></span>
          </router-link>
          <button class="icon-button" aria-label="Déconnexion" @click="handleLogout">
            <i class="material-icons">logout</i>
          </button>
        </template>
        
        <template v-else>
          <router-link to="/login" class="icon-button" aria-label="Connexion">
            <i class="material-icons">login</i>
          </router-link>
        </template>
        
        <router-link to="/cart" class="icon-button cart-button" aria-label="Panier">
          <i class="material-icons">shopping_cart</i>
          <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
          <span v-if="isCartLoading" class="cart-loading"></span>
        </router-link>
      </div>
    </div>
    
    <div v-if="isSearchOpen" class="search-panel">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Rechercher..." 
          class="search-input"
          @keyup.enter="performSearch"
        />
        <button class="search-close" @click="toggleSearch">
          <i class="material-icons">search</i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const { success } = useNotification();

const isSearchOpen = ref(false);
const searchQuery = ref('');
const isCartLoading = computed(() => cartStore.isLoading);

const isAuthenticated = computed(() => {
  const status = authStore.isAuthenticated;
  return status;
});

const cartItemCount = computed(() => {
  return cartStore.items.reduce((total, item) => total + item.quantity, 0);
});

watch(() => authStore.isAuthenticated, (newValue) => {
});

onMounted(() => {
});

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    setTimeout(() => {
      document.querySelector('.search-input')?.focus();
    }, 100);
  }
};

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value }
    });
    toggleSearch();
  }
};

const handleLogout = async () => {
  await authStore.logout();
  success('Déconnexion réussie');
  router.push('/');
};
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 1000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo a {
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.5rem;
  color: #000;
  text-decoration: none;
  font-family: 'Times New Roman', serif;
}

.navigation ul {
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.navigation a {
  color: #333;
  text-decoration: none;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.1rem;
  position: relative;
  transition: color 0.3s ease;
}

.navigation a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #000;
  transition: width 0.3s ease;
}

.navigation a:hover {
  color: #000;
}

.navigation a:hover::after,
.navigation a.router-link-active::after {
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  font-size: 1rem;
  padding: 0.5rem;
  transition: color 0.3s ease;
}

.icon-button:hover {
  color: #000;
}

.cart-button,
.account-button {
  position: relative;
}

.account-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #4CAF50;
  border-radius: 50%;
  border: 1px solid #fff;
}

.cart-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #000;
  color: #fff;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-loading {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #000;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  padding: 1.5rem 2rem;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.05);
  animation: slideDown 0.3s ease forwards;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 1rem 0;
  border: none;
  border-bottom: 1px solid #eaeaea;
  font-size: 1.2rem;
  outline: none;
  background: transparent;
}

.search-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  font-size: 1.2rem;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
  }
  
  .navigation {
    display: none;
  }
  
  .logo a {
    font-size: 1.2rem;
  }
}
</style>
