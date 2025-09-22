<template>
  <div class="profile-view">
    <div class="container">
      <h1>Mon profil</h1>
      
      <div class="profile-content">
        <div v-if="loading" class="loading-indicator">
          <p>Chargement de votre profil...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="loadUserProfile">Réessayer</button>
        </div>
        
        <div v-else class="profile-details">
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="form-section">
              <h2>Informations personnelles</h2>
              
              <div class="profile-photo-section">
                <div class="profile-photo-container">
                  <img 
                    v-if="profileData.profilePhotoUrl" 
                    :src="getFullPhotoUrl(profileData.profilePhotoUrl)" 
                    alt="Photo de profil" 
                    class="profile-photo"
                  />
                  <div v-else class="profile-photo-placeholder">
                    {{ profileData.firstName && profileData.lastName ? 
                      profileData.firstName.charAt(0) + profileData.lastName.charAt(0) : 
                      'UT' }}
                  </div>
                </div>
                
                <div class="profile-photo-actions">
                  <label for="profile-photo-upload" class="btn-outline photo-upload-btn">
                    {{ profileData.profilePhotoUrl ? 'Changer la photo' : 'Ajouter une photo' }}
                  </label>
                  <input 
                    type="file" 
                    id="profile-photo-upload" 
                    accept="image/*"
                    @change="handlePhotoUpload"
                    :disabled="updating"
                    class="hidden-input"
                  />
                  <button 
                    v-if="profileData.profilePhotoUrl" 
                    type="button" 
                    class="btn-text" 
                    @click="removeProfilePhoto"
                    :disabled="updating"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label for="firstName">Prénom</label>
                <input 
                  type="text" 
                  id="firstName" 
                  v-model="profileData.firstName" 
                  required
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="lastName">Nom</label>
                <input 
                  type="text" 
                  id="lastName" 
                  v-model="profileData.lastName" 
                  required
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="profileData.email" 
                  required
                  :disabled="updating || true" 
                  title="Contactez le support pour modifier votre email"
                />
                <small>L'email ne peut pas être modifié directement. Contactez le support.</small>
              </div>
              
              <div class="form-group">
                <label for="phone">Téléphone</label>
                <input 
                  type="tel" 
                  id="phone" 
                  v-model="profileData.phone"
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="birthDate">Date de naissance</label>
                <input 
                  type="date" 
                  id="birthDate" 
                  v-model="profileData.birthDate"
                  :disabled="updating"
                />
              </div>
            </div>
            
            <div class="form-section">
              <h2>Préférences</h2>
              
              <div class="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="newsletterSubscribed" 
                  v-model="profileData.newsletterSubscribed"
                  :disabled="updating"
                />
                <label for="newsletterSubscribed">Recevoir la newsletter</label>
              </div>
              
              <div class="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="smsNotifications" 
                  v-model="profileData.smsNotifications"
                  :disabled="updating"
                />
                <label for="smsNotifications">Recevoir des notifications par SMS</label>
              </div>
            </div>
            
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-primary" 
                :disabled="updating || !formChanged"
              >
                {{ updating ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
              
              <button 
                type="button" 
                class="btn-secondary" 
                @click="resetForm" 
                :disabled="updating || !formChanged"
              >
                Annuler
              </button>
            </div>
            
            <div v-if="updateSuccess" class="success-message">
              Votre profil a été mis à jour avec succès.
            </div>
            
            <div v-if="updateError" class="error-message update-error">
              {{ updateError }}
            </div>
          </form>
          
          <div class="password-section">
            <h2>Sécurité</h2>
            <button 
              class="btn-outline" 
              @click="showPasswordModal = true"
              :disabled="updating"
            >
              Changer mon mot de passe
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="password-modal-overlay">
      <div class="password-modal">
        <div class="modal-header">
          <h3>Changer mon mot de passe</h3>
          <button class="close-button" @click="closePasswordModal">&times;</button>
        </div>
        
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label for="currentPassword">Mot de passe actuel</label>
            <input 
              type="password" 
              id="currentPassword" 
              v-model="passwordData.currentPassword" 
              required
              :disabled="changingPassword"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="passwordData.newPassword" 
              required
              :disabled="changingPassword"
              minlength="8"
            />
            <small>Le mot de passe doit contenir au moins 8 caractères.</small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmer le nouveau mot de passe</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="passwordData.confirmPassword" 
              required
              :disabled="changingPassword"
            />
          </div>
          
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          
          <div v-if="passwordSuccess" class="success-message">
            {{ passwordSuccess }}
          </div>
          
          <div class="modal-actions">
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="changingPassword || !passwordFormValid"
            >
              {{ changingPassword ? 'Modification...' : 'Modifier le mot de passe' }}
            </button>
            
            <button 
              type="button" 
              class="btn-secondary" 
              @click="closePasswordModal"
              :disabled="changingPassword"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  newsletterSubscribed: boolean;
  smsNotifications: boolean;
  profilePhotoUrl?: string;
}

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const updating = ref(false);
const updateSuccess = ref(false);
const updateError = ref('');
const showPasswordModal = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');
const changingPassword = ref(false);

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const passwordData = ref<PasswordData>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordFormValid = computed(() => {
  return (
    passwordData.value.currentPassword.length > 0 &&
    passwordData.value.newPassword.length >= 8 &&
    passwordData.value.newPassword === passwordData.value.confirmPassword
  );
});

const profileData = ref<ProfileData>({
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  newsletterSubscribed: false,
  smsNotifications: false,
  profilePhotoUrl: ''
});

const originalProfileData = ref<ProfileData | null>(null);

const formChanged = computed(() => {
  if (!originalProfileData.value) return false;
  
  return (
    profileData.value.firstName !== originalProfileData.value.firstName ||
    profileData.value.lastName !== originalProfileData.value.lastName ||
    profileData.value.phone !== originalProfileData.value.phone ||
    profileData.value.birthDate !== originalProfileData.value.birthDate ||
    profileData.value.newsletterSubscribed !== originalProfileData.value.newsletterSubscribed ||
    profileData.value.smsNotifications !== originalProfileData.value.smsNotifications ||
    profileData.value.profilePhotoUrl !== originalProfileData.value.profilePhotoUrl
  );
});

const getFullPhotoUrl = (relativeUrl: string | undefined): string => {
  if (!relativeUrl) return '';
  
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  return `http://localhost:3000${relativeUrl}`;
};

const loadUserProfile = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    if (!authStore.isAuthenticated) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }
    
    await authStore.loadUser();
    
    if (authStore.user) {      
      profileData.value = {
        id: parseInt(authStore.user.id) || 0,
        firstName: authStore.user.firstName || '',
        lastName: authStore.user.lastName || '',
        email: authStore.user.email || '',
        phone: authStore.user.phone || '',
        birthDate: authStore.user.birthDate || '',
        newsletterSubscribed: authStore.user.newsletterSubscribed || false,
        smsNotifications: authStore.user.smsNotifications || false,
        profilePhotoUrl: authStore.user.profilePhotoUrl || ''
      };
      
      originalProfileData.value = { ...profileData.value };
    } else {
      console.warn('Aucune donnée utilisateur n\'a été chargée');
      error.value = 'Impossible de charger vos informations de profil. Veuillez réessayer.';
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du profil:', err);
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    } else {
      error.value = 'Une erreur est survenue lors du chargement de votre profil. Veuillez réessayer.';
    }
  } finally {
    loading.value = false;
  }
};

const updateProfile = async () => {
  updateSuccess.value = false;
  updateError.value = '';
  updating.value = true;
  
  try {
    const userData = {
      firstName: profileData.value.firstName,
      lastName: profileData.value.lastName,
      phone: profileData.value.phone,
      birthDate: profileData.value.birthDate,
      newsletterSubscribed: profileData.value.newsletterSubscribed,
      smsNotifications: profileData.value.smsNotifications,
      profilePhotoUrl: profileData.value.profilePhotoUrl
    };
    
    const response = await api.put('/user/profile', userData, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    let updatedUserData;
    if (response.data && response.data.success && response.data.data) {
      updatedUserData = response.data.data;
    } else if (response.data) {
      updatedUserData = response.data;
    } else {
      throw new Error('Format de réponse invalide');
    }
    
    profileData.value = {
      ...profileData.value,
      ...updatedUserData
    };
    originalProfileData.value = { ...profileData.value };
    
    updateSuccess.value = true;
    
    if (authStore.user) {
      Object.assign(authStore.user, {
        firstName: profileData.value.firstName,
        lastName: profileData.value.lastName,
        phone: profileData.value.phone,
        birthDate: profileData.value.birthDate,
        newsletterSubscribed: profileData.value.newsletterSubscribed,
        smsNotifications: profileData.value.smsNotifications,
        profilePhotoUrl: profileData.value.profilePhotoUrl
      });
    }
    
    setTimeout(() => {
      updateSuccess.value = false;
    }, 3000);
    
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour du profil:', err);
    
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login' });
    } else if (err.response && err.response.data && err.response.data.message) {
      updateError.value = err.response.data.message;
    } else {
      updateError.value = 'Une erreur est survenue lors de la mise à jour de votre profil. Veuillez réessayer.';
    }
  } finally {
    updating.value = false;
  }
};

const resetForm = () => {
  if (originalProfileData.value) {
    profileData.value = { ...originalProfileData.value };
  }
  updateError.value = '';
  updateSuccess.value = false;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError.value = '';
  passwordSuccess.value = '';
};

const changePassword = async () => {
  passwordError.value = '';
  passwordSuccess.value = '';
  
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordError.value = 'Les mots de passe ne correspondent pas.';
    return;
  }
  
  changingPassword.value = true;
  
  try {
    await axios.post('/api/user/change-password', {
      currentPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    passwordSuccess.value = 'Votre mot de passe a été modifié avec succès.';
    
    setTimeout(() => {
      closePasswordModal();
    }, 2000);
    
  } catch (err: any) {
    console.error('Erreur lors du changement de mot de passe:', err);
    
    if (err.response && err.response.status === 401) {
      passwordError.value = 'Mot de passe actuel incorrect.';
    } else if (err.response && err.response.data && err.response.data.message) {
      passwordError.value = err.response.data.message;
    } else {
      passwordError.value = 'Une erreur est survenue lors du changement de mot de passe. Veuillez réessayer.';
    }
  } finally {
    changingPassword.value = false;
  }
};

const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  const formData = new FormData();
  formData.append('profilePhoto', file);
  
  updating.value = true;
  updateError.value = '';
  
  try {
    const response = await api.post('/user/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    let photoUrl = '';
    if (response.data && response.data.success && response.data.data) {
      photoUrl = response.data.data.profilePhotoUrl;
    } else if (response.data && response.data.profilePhotoUrl) {
      photoUrl = response.data.profilePhotoUrl;
    } else {
      throw new Error('Format de réponse invalide');
    }
    
    profileData.value.profilePhotoUrl = photoUrl;
    
    if (originalProfileData.value) {
      originalProfileData.value.profilePhotoUrl = photoUrl;
    }
    
    if (authStore.user) {
      authStore.user.profilePhotoUrl = photoUrl;
    }
    
    updateSuccess.value = true;
    setTimeout(() => {
      updateSuccess.value = false;
    }, 3000);
    
  } catch (err: any) {
    console.error('Erreur lors du téléchargement de la photo:', err);
    
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login' });
    } else if (err.response && err.response.data && err.response.data.message) {
      updateError.value = err.response.data.message;
    } else {
      updateError.value = 'Une erreur est survenue lors du téléchargement de votre photo. Veuillez réessayer.';
    }
  } finally {
    updating.value = false;
    (target as HTMLInputElement).value = '';
  }
};

const removeProfilePhoto = async () => {
  updating.value = true;
  updateError.value = '';
  
  try {
    await api.delete('/user/profile-photo', {
    });
    
    profileData.value.profilePhotoUrl = '';
    
    if (originalProfileData.value) {
      originalProfileData.value.profilePhotoUrl = '';
    }
    
    if (authStore.user) {
      authStore.user.profilePhotoUrl = '';
    }
    
    updateSuccess.value = true;
    setTimeout(() => {
      updateSuccess.value = false;
    }, 3000);
    
  } catch (err: any) {
    console.error('Erreur lors de la suppression de la photo:', err);
    
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login' });
    } else if (err.response && err.response.data && err.response.data.message) {
      updateError.value = err.response.data.message;
    } else {
      updateError.value = 'Une erreur est survenue lors de la suppression de votre photo. Veuillez réessayer.';
    }
  } finally {
    updating.value = false;
  }
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.profile-view {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #333;
}

.profile-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.loading-indicator {
  text-align: center;
  padding: 2rem 0;
}

.error-message {
  text-align: center;
  padding: 2rem 0;
  color: #e74c3c;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #34495e;
  border: 1px solid #bdc3c7;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  margin-left: 1rem;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: #3498db;
  border: 1px solid #3498db;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-outline:hover {
  background-color: #3498db;
  color: white;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #ecf0f1;
}

.form-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #34495e;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="date"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group input {
  margin-right: 0.5rem;
}

.checkbox-group label {
  margin-bottom: 0;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  align-items: center;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #d4edda;
  color: #155724;
  border-radius: 4px;
}

.update-error {
  margin-top: 1rem;
  padding: 0.75rem;
}

.password-section {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.password-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.password-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  padding: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
}

.close-button:hover {
  color: #34495e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.profile-photo-section {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.profile-photo-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1.5rem;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3498db;
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.profile-photo-actions {
  display: flex;
  flex-direction: column;
}

.photo-upload-btn {
  margin-bottom: 0.75rem;
}

.hidden-input {
  display: none;
}

.btn-text {
  background: none;
  border: none;
  color: #e74c3c;
  padding: 0;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
}

.btn-text:hover {
  color: #c0392b;
}
</style>
