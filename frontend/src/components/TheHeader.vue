<template>
  <header class="header">
    <div class="header-container">
      <button class="mobile-menu-toggle" aria-label="Menu" @click="toggleMobileMenu">
        <i class="material-icons">{{ isMobileMenuOpen ? 'close' : 'menu' }}</i>
      </button>
      
      <div class="logo">
        <router-link to="/" class="logo-link">
          <img src="@/assets/logos/veyron-monogram-1.svg" alt="VEYRON" class="logo-mobile" />
          <img src="@/assets/logos/veyron-emblem-1.svg" alt="VEYRON" class="logo-desktop" />
        </router-link>
      </div>
      
      <nav class="navigation desktop-nav">
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
          <button class="icon-button hide-on-mobile" aria-label="Déconnexion" @click="handleLogout">
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
    
    <!-- Menu mobile -->
    <div class="mobile-menu" :class="{ 'open': isMobileMenuOpen }">
      <nav class="mobile-nav">
        <ul>
          <li><router-link to="/category/femme" @click="closeMobileMenu">Femme</router-link></li>
          <li><router-link to="/category/homme" @click="closeMobileMenu">Homme</router-link></li>
          <li><router-link to="/category/accessoires" @click="closeMobileMenu">Accessoires</router-link></li>
          <li><router-link to="/category/collections" @click="closeMobileMenu">Collections</router-link></li>
          <li v-if="isAuthenticated"><router-link to="/account" @click="closeMobileMenu">Mon Compte</router-link></li>
          <li v-if="isAuthenticated"><button class="mobile-logout-btn" @click="handleLogoutMobile">Déconnexion</button></li>
          <li v-else><router-link to="/login" @click="closeMobileMenu">Connexion</router-link></li>
        </ul>
      </nav>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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
const isMobileMenuOpen = ref(false);

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
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.body.style.overflow = '';
});

const handleResize = () => {
  if (window.innerWidth > 768 && isMobileMenuOpen.value) {
    closeMobileMenu();
  }
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : '';
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

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

const handleLogoutMobile = async () => {
  await handleLogout();
  closeMobileMenu();
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
  /* Support pour les encoches iPhone (safe area) */
  padding-top: env(safe-area-inset-top);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.logo-desktop {
  height: 40px;
  display: block;
}

.logo-mobile {
  height: 40px;
  display: none;
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
  padding: 0;
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
  background-color: transparent;
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
  top: 0px;
  right: 6px;
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
  z-index: 1001;
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

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  font-size: 1.5rem;
  padding: 0.5rem;
}

.mobile-menu {
  display: none;
  position: fixed;
  top: calc(60px + env(safe-area-inset-top));
  left: 0;
  width: 100%;
  height: calc(100vh - 60px - env(safe-area-inset-top));
  background-color: #fff;
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  /* Padding pour les bords de l'iPhone */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-menu.open {
  transform: translateX(0);
}

.mobile-nav {
  padding: 2rem;
}

.mobile-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav li {
  margin-bottom: 1.5rem;
}

.mobile-nav a {
  display: block;
  font-size: 1.2rem;
  color: #333;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  padding: 0.5rem 0;
}

.mobile-logout-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  padding: 0.5rem 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: var(--font-body);
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
    min-height: 60px;
    gap: 0.5rem;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    order: 1;
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
  }
  
  .mobile-menu-toggle .material-icons {
    font-size: 24px;
  }
  
  .logo {
    order: 2;
    flex-grow: 1;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .logo-desktop {
    display: none;
  }
  
  .logo-mobile {
    display: block;
    height: 35px;
    max-width: 100%;
    object-fit: contain;
  }
  
  .header-actions {
    order: 3;
    gap: 0.5rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
  
  .icon-button {
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon-button .material-icons {
    font-size: 22px;
  }
  
  .hide-on-mobile {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .search-panel {
    padding: 1rem;
  }
  
  .search-input {
    font-size: 1rem;
    padding: 0.75rem 0;
  }
  
  .cart-count {
    font-size: 0.65rem;
    width: 16px;
    height: 16px;
    top: -3px;
    right: -3px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0.75rem;
    min-height: 56px;
  }
  
  .mobile-menu-toggle {
    min-width: 40px;
    min-height: 40px;
  }
  
  .icon-button {
    padding: 0.4rem;
    min-width: 40px;
    min-height: 40px;
  }
  
  .icon-button .material-icons {
    font-size: 20px;
  }
  
  .logo-mobile {
    height: 28px;
  }
  
  .header-actions {
    gap: 0.25rem;
  }
  
  .cart-count {
    font-size: 0.6rem;
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 360px) {
  .header-container {
    padding: 0.5rem;
  }
  
  .mobile-menu-toggle,
  .icon-button {
    min-width: 36px;
    min-height: 36px;
    padding: 0.3rem;
  }
  
  .icon-button .material-icons {
    font-size: 18px;
  }
  
  .logo-mobile {
    height: 24px;
  }
}
</style>
