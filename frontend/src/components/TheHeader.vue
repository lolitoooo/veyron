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
          <li 
            @mouseenter="showCategoryMenu('femme')" 
            @mouseleave="hideCategoryMenu"
            class="nav-item-with-dropdown"
          >
            <router-link to="/category/femme">Femme</router-link>
            <div v-if="hoveredCategory === 'femme' && subcategoriesByCategory.femme.length > 0" class="dropdown-menu dropdown-menu-split">
              <div class="dropdown-column">
                <h4 class="dropdown-title">Haut</h4>
                <router-link 
                  v-for="sub in subcategoriesByCategory.femme.filter(s => s.type === 'Haut')" 
                  :key="sub._id"
                  :to="`/category/femme?subcategory=${sub.slug}`"
                  class="dropdown-item"
                  :data-slug="sub.slug"
                  :data-name="sub.name"
                >
                  {{ sub.name }}
                </router-link>
              </div>
              <div class="dropdown-column">
                <h4 class="dropdown-title">Bas</h4>
                <router-link 
                  v-for="sub in subcategoriesByCategory.femme.filter(s => s.type === 'Bas')" 
                  :key="sub._id"
                  :to="`/category/femme?subcategory=${sub.slug}`"
                  class="dropdown-item"
                >
                  {{ sub.name }}
                </router-link>
              </div>
            </div>
          </li>
          <li 
            @mouseenter="showCategoryMenu('homme')" 
            @mouseleave="hideCategoryMenu"
            class="nav-item-with-dropdown"
          >
            <router-link to="/category/homme">Homme</router-link>
            <div v-if="hoveredCategory === 'homme' && subcategoriesByCategory.homme.length > 0" class="dropdown-menu dropdown-menu-split">
              <div class="dropdown-column">
                <h4 class="dropdown-title">Haut</h4>
                <router-link 
                  v-for="sub in subcategoriesByCategory.homme.filter(s => s.type === 'Haut')" 
                  :key="sub._id"
                  :to="`/category/homme?subcategory=${sub.slug}`"
                  class="dropdown-item"
                >
                  {{ sub.name }}
                </router-link>
              </div>
              <div class="dropdown-column">
                <h4 class="dropdown-title">Bas</h4>
                <router-link 
                  v-for="sub in subcategoriesByCategory.homme.filter(s => s.type === 'Bas')" 
                  :key="sub._id"
                  :to="`/category/homme?subcategory=${sub.slug}`"
                  class="dropdown-item"
                >
                  {{ sub.name }}
                </router-link>
              </div>
            </div>
          </li>
          <li 
            @mouseenter="showCategoryMenu('accessoires')" 
            @mouseleave="hideCategoryMenu"
            class="nav-item-with-dropdown"
          >
            <router-link to="/category/accessoires">Accessoires</router-link>
            <div v-if="hoveredCategory === 'accessoires' && subcategoriesByCategory.accessoires.length > 0" class="dropdown-menu">
              <router-link 
                v-for="sub in subcategoriesByCategory.accessoires" 
                :key="sub._id"
                :to="`/category/accessoires?subcategory=${sub.slug}`"
                class="dropdown-item"
              >
                {{ sub.name }}
              </router-link>
            </div>
          </li>
          <li><router-link to="/category/collections">Collections</router-link></li>
        </ul>
      </nav>
      
      <div class="header-actions">
        <button class="icon-button" aria-label="Recherche" @click="toggleSearch">
          <i class="material-icons">search</i>
        </button>
        
        <template v-if="isAuthenticated">
          <router-link v-if="isPartner" to="/partner" class="icon-button" aria-label="Espace partenaire" title="Espace partenaire">
            <i class="material-icons">storefront</i>
          </router-link>
          <router-link v-if="isAdmin" to="/admin" class="icon-button" aria-label="Administration" title="Administration">
            <i class="material-icons">admin_panel_settings</i>
          </router-link>
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
          <li v-if="isPartner"><router-link to="/partner" @click="closeMobileMenu">Espace Partenaire</router-link></li>
          <li v-if="isAdmin"><router-link to="/admin" @click="closeMobileMenu">Administration</router-link></li>
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
import axios from 'axios';

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  type?: string;
}

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const { success } = useNotification();

const isSearchOpen = ref(false);
const searchQuery = ref('');
const isCartLoading = computed(() => cartStore.isLoading);
const isMobileMenuOpen = ref(false);
const subcategories = ref<Subcategory[]>([]);
const hoveredCategory = ref<string | null>(null);
let hideMenuTimeout: ReturnType<typeof setTimeout> | null = null;

const subcategoriesByCategory = computed(() => {
  const grouped: Record<string, Subcategory[]> = {
    femme: [],
    homme: [],
    accessoires: [],
    collections: []
  };
  
  subcategories.value.forEach(sub => {
    const category = sub.categorySlug?.toLowerCase() || 'accessoires';
    if (grouped[category]) {
      grouped[category].push({ ...sub });
    }
  });
  
  const tshirtsFemme = grouped.femme.filter(s => s.name === 'T-shirts');
  const tshirtsHomme = grouped.homme.filter(s => s.name === 'T-shirts');
  
  console.log('T-shirts Femme:', tshirtsFemme.map(s => ({ name: s.name, slug: s.slug, categorySlug: s.categorySlug })));
  console.log('T-shirts Homme:', tshirtsHomme.map(s => ({ name: s.name, slug: s.slug, categorySlug: s.categorySlug })));
  
  return grouped;
});

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isPartner = computed(() => authStore.isPartner);
const isAdmin = computed(() => authStore.isAdmin);

const cartItemCount = computed(() => {
  return cartStore.items.reduce((total, item) => total + item.quantity, 0);
});

watch(() => authStore.isAuthenticated, (newValue) => {
});

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await loadSubcategories();
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

const loadSubcategories = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/subcategories`);
    if (response.data.success) {
      subcategories.value = response.data.data;
      console.log('Sous-catégories chargées:', response.data.data.filter(s => s.name === 'T-shirts'));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des sous-catégories:', error);
  }
};

const showCategoryMenu = (category: string) => {
  if (hideMenuTimeout) {
    clearTimeout(hideMenuTimeout);
    hideMenuTimeout = null;
  }
  hoveredCategory.value = category;
};

const hideCategoryMenu = () => {
  hideMenuTimeout = setTimeout(() => {
    hoveredCategory.value = null;
  }, 200);
};
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(250, 250, 248, 0.96);
  backdrop-filter: blur(12px);
  z-index: 1000;
  border-bottom: 1px solid var(--color-gray-200);
  padding-top: env(safe-area-inset-top);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  max-width: var(--container-xl);
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
  gap: var(--space-6);
  margin: 0;
  padding: 0;
}

.navigation li {
  position: relative;
}

.nav-item-with-dropdown {
  position: relative;
}

.navigation a {
  color: var(--color-gray-700);
  text-decoration: none;
  text-transform: uppercase;
  font-family: var(--font-secondary);
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  position: relative;
  padding-bottom: 4px;
  transition: color var(--transition-base);
}

.navigation a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: var(--color-primary);
  transition: width var(--transition-base);
}

.navigation a:hover {
  color: var(--color-primary);
}

.navigation a:hover::after,
.navigation a.router-link-active::after {
  width: 100%;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  padding: var(--space-2) 0;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
}

.dropdown-menu-split {
  display: flex;
  gap: var(--space-4);
  min-width: 350px;
  padding: var(--space-3);
}

.dropdown-column {
  flex: 1;
  min-width: 150px;
}

.dropdown-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
  padding: 0 var(--space-2);
}

.dropdown-menu::before {
  content: '';
  position: absolute;
  top: -0.5rem;
  left: 0;
  right: 0;
  height: 0.5rem;
  background: transparent;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.dropdown-item {
  display: block;
  padding: var(--space-1) var(--space-2);
  color: var(--color-gray-700);
  text-decoration: none;
  font-size: 0.75rem;
  transition: background-color var(--transition-base), color var(--transition-base);
  white-space: nowrap;
  border-radius: 3px;
}

.dropdown-item::after {
  display: none;
}

.dropdown-item:hover {
  background-color: var(--color-gray-50);
  color: var(--color-primary);
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-gray-700);
  font-size: 1rem;
  padding: 0.5rem;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-base);
}

.icon-button:hover {
  color: var(--color-primary);
}

.cart-button,
.account-button {
  position: relative;
}

.account-indicator {
  position: absolute;
  top: 2px;
  right: 6px;
  width: 8px;
  height: 8px;
  background-color: var(--color-secondary);
  border-radius: 50%;
  border: 1px solid var(--color-white);
}

.cart-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--color-primary);
  color: var(--color-white);
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
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-top-color: var(--color-primary);
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
  background-color: var(--color-white);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-gray-200);
  z-index: 1001;
}

.search-container {
  max-width: 640px;
  margin: 0 auto;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 1px solid var(--color-gray-300);
  font-size: 1rem;
  outline: none;
  background: transparent;
  font-family: var(--font-secondary);
}

.search-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-600);
  font-size: 1.1rem;
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-800);
  font-size: 1.5rem;
  padding: 0.25rem;
}

.mobile-menu {
  display: none;
}

@media (max-width: 768px) {
  .header-container {
    padding: var(--space-3) var(--space-4);
    gap: var(--space-2);
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
  }

  .logo {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .logo-desktop {
    display: none;
  }

  .logo-mobile {
    display: block;
    height: 32px;
  }

  .header-actions {
    gap: var(--space-2);
  }

  .mobile-menu {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    height: calc(100vh - 64px);
    background-color: var(--color-white);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    overflow-y: auto;
  }

  .mobile-menu.open {
    transform: translateX(0);
  }

  .mobile-nav {
    padding: var(--space-6) var(--space-5);
  }

  .mobile-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .mobile-nav li {
    margin-bottom: var(--space-4);
  }

  .mobile-nav a,
  .mobile-logout-btn {
    display: block;
    font-size: 1rem;
    color: var(--color-gray-800);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    padding: 0.5rem 0;
    background: none;
    border: none;
    text-align: left;
    width: 100%;
    font-family: var(--font-secondary);
  }

  .hide-on-mobile {
    display: none;
  }

  .search-panel {
    padding: var(--space-3) var(--space-4);
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: var(--space-2) var(--space-3);
  }

  .logo-mobile {
    height: 28px;
  }

  .cart-count {
    width: 16px;
    height: 16px;
    font-size: 0.65rem;
  }
}
</style>