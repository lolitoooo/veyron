<template>
  <div class="account-view">
    <div class="container">
      <h1 class="page-title">Mon Compte</h1>
      
      <AccountMobileMenu />
      
      <div v-if="authStore.error" class="server-error-message">
        <div class="error-icon">
          <i class="material-icons">error</i>
        </div>
        <div class="error-content">
          <h3>Erreur de connexion</h3>
          <p>{{ authStore.error }}</p>
          <button @click="retryLoadUser" class="btn-retry">
            <i class="material-icons">retry</i> Réessayer
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading-indicator">
        <i class="material-icons">spinner</i> Chargement des données...
      </div>
      
      <div class="account-content" v-if="authStore.user">
        <div class="account-sidebar">
          <div class="user-info">
            <div class="user-avatar">
              <img 
                v-if="authStore.user.profilePhotoUrl" 
                :src="getFullPhotoUrl(authStore.user.profilePhotoUrl)" 
                alt="Photo de profil" 
                class="profile-photo"
              />
              <div v-else class="profile-photo-placeholder">
                {{ authStore.user.firstName && authStore.user.lastName ? 
                  authStore.user.firstName.charAt(0) + authStore.user.lastName.charAt(0) : 
                  'UT' }}
              </div>
            </div>
            <div class="user-details">
              <h2>{{ authStore.user.firstName }} {{ authStore.user.lastName }}</h2>
              <p>{{ authStore.user.email }}</p>
              <p class="member-since">Membre depuis {{ formatDate(authStore.user.createdAt) }}</p>
            </div>
          </div>
          
          <nav class="account-nav">
            <router-link :to="{ name: 'account' }" class="nav-item" exact-active-class="active">
              <i class="material-icons">home</i>
              <span>Tableau de bord</span>
            </router-link>
            <router-link :to="{ name: 'orders' }" class="nav-item" active-class="active">
              <i class="material-icons">shopping_bag</i>
              <span>Mes commandes</span>
            </router-link>
            <router-link :to="{ name: 'profile' }" class="nav-item" active-class="active">
              <i class="material-icons">account_box</i>
              <span>Mon profil</span>
            </router-link>
            <router-link :to="{ name: 'addresses' }" class="nav-item" active-class="active">
              <i class="material-icons">location_on</i>
              <span>Mes adresses</span>
            </router-link>
            <router-link :to="{ name: 'wishlist' }" class="nav-item" active-class="active">
              <i class="material-icons">favorite</i>
              <span>Mes favoris</span>
            </router-link>
            <router-link :to="{ name: 'loyalty' }" class="nav-item" active-class="active">
              <i class="material-icons">loyalty</i>
              <span>Mon loyalty</span>
            </router-link>
            <a href="#" class="nav-item" @click.prevent="logout">
              <i class="material-icons">logout</i>
              <span>Déconnexion</span>
            </a>
          </nav>
        </div>
        
        <div class="account-dashboard">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AccountMobileMenu from '@/components/account/AccountMobileMenu.vue';
import { getServerUrl } from '@/utils/imageUrl';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

const retryLoadUser = async () => {
  try {
    await authStore.loadUser();
  } catch (error) {
    console.error('Erreur lors du rechargement des données utilisateur:', error);
  }
};

const getFullPhotoUrl = (relativeUrl: string | undefined): string => {
  if (!relativeUrl) return '';
  
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  const serverUrl = getServerUrl();
  return `${serverUrl}${relativeUrl}`;
};

onMounted(async () => {
  loading.value = true;
  
  try {
    await authStore.loadUser();
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.account-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-family: var(--font-heading);
  margin-bottom: 1.5rem;
}

.account-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.account-sidebar {
  flex: 0 0 250px;
}

.user-info {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-photo-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 1px;
}

.user-details h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.user-details p {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.member-since {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.account-nav {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
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

.account-dashboard {
  flex: 1;
  min-width: 0;
}

.loading-indicator {
  text-align: center;
  padding: 2rem 0;
  color: #6c757d;
}

.server-error-message {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  border-left: 5px solid #dc3545;
}

.error-icon {
  font-size: 2rem;
  color: #dc3545;
  margin-right: 1.5rem;
}

.error-content h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.error-content p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: background-color 0.3s;
}

.btn-retry i {
  margin-right: 0.5rem;
}

.btn-retry:hover {
  background-color: #c82333;
}

@media (max-width: 992px) {
  .account-dashboard {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .account-content {
    flex-direction: column;
  }
  
  .account-sidebar {
    display: none;
  }
  
  .profile-photo-placeholder {
    width: 80px;
    height: 80px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .server-error-message {
    flex-direction: column;
    padding: 1.5rem;
  }
  
  .error-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
