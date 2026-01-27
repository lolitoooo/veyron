<template>
  <div class="mobile-account-nav">
    <button @click="toggleMobileMenu" class="mobile-menu-toggle">
      <span class="material-icons">{{ showMobileMenu ? 'close' : 'menu' }}</span>
      <span>Menu du compte</span>
    </button>
    
    <div class="mobile-menu" :class="{ 'active': showMobileMenu }">
      <nav class="mobile-nav-items">
        <router-link :to="{ name: 'account' }" class="nav-item" exact-active-class="active" @click="closeMobileMenu">
          <i class="material-icons">home</i>
          <span>Tableau de bord</span>
        </router-link>
        <router-link :to="{ name: 'orders' }" class="nav-item" active-class="active" @click="closeMobileMenu">
          <i class="material-icons">shopping_bag</i>
          <span>Mes commandes</span>
        </router-link>
        <router-link :to="{ name: 'profile' }" class="nav-item" active-class="active" @click="closeMobileMenu">
          <i class="material-icons">account_box</i>
          <span>Mon profil</span>
        </router-link>
        <router-link :to="{ name: 'addresses' }" class="nav-item" active-class="active" @click="closeMobileMenu">
          <i class="material-icons">location_on</i>
          <span>Mes adresses</span>
        </router-link>
        <router-link :to="{ name: 'wishlist' }" class="nav-item" active-class="active" @click="closeMobileMenu">
          <i class="material-icons">favorite</i>
          <span>Mes favoris</span>
        </router-link>
        <router-link :to="{ name: 'loyalty' }" class="nav-item" active-class="active" @click="closeMobileMenu">
          <i class="material-icons">loyalty</i>
          <span>Mon loyalty</span>
        </router-link>
        <a href="#" class="nav-item" @click.prevent="logout">
          <i class="material-icons">logout</i>
          <span>Déconnexion</span>
        </a>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const showMobileMenu = ref(false);

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.mobile-account-nav {
  display: none;
  margin-bottom: 1.5rem;
}

.mobile-menu-toggle {
  display: flex;
  align-items: center;
  background-color: #000;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  width: 100%;
  justify-content: space-between;
  font-family: var(--font-body);
  cursor: pointer;
}

.mobile-menu-toggle span {
  display: inline-flex;
  align-items: center;
}

.mobile-menu-toggle .material-icons {
  margin-right: 0.5rem;
}

.mobile-menu {
  display: none;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  overflow: hidden;
}

.mobile-menu.active {
  display: block;
}

.mobile-nav-items {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #212529;
  text-decoration: none;
  border-bottom: 1px solid #f1f1f1;
  transition: background-color 0.3s;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:hover {
  background-color: #f8f9fa;
}

.nav-item.active {
  background-color: #f8f9fa;
  font-weight: 500;
  border-left: 3px solid #000;
}

.nav-item i {
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .mobile-account-nav {
    display: block;
  }
}
</style>
