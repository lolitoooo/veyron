<template>
  <div class="addresses-view">
    <div class="container">
      <h1>Mes adresses</h1>
      
      <div class="addresses-content">
        <div v-if="loading" class="loading-indicator">
          <p>Chargement de vos adresses...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="loadAddresses">Réessayer</button>
        </div>
        
        <div v-else class="addresses-list">
          <div class="addresses-header">
            <h2>Adresses enregistrées</h2>
            <button class="btn-primary" @click="showAddressModal(null)">Ajouter une adresse</button>
          </div>
          
          <div v-if="addresses.length === 0" class="empty-addresses">
            <p>Vous n'avez pas encore enregistré d'adresse.</p>
            <button class="btn-primary" @click="showAddressModal(null)">Ajouter ma première adresse</button>
          </div>
          
          <div v-else class="addresses-grid">
            <div v-for="address in validAddresses" :key="address._id || address.id" class="address-card">
              <div class="address-card-content">
                <div class="address-type">
                  <span :class="['badge', { 'badge-primary': address.isDefault }]">
                    {{ address.type === 'shipping' ? 'Livraison' : 'Facturation' }}
                  </span>
                  <span v-if="address.isDefault" class="badge badge-success">Par défaut</span>
                </div>
                
                <div class="address-details">
                  <p class="address-title">{{ address.name || 'Adresse' }}</p>
                  <p class="address-name">{{ `${address.firstName || ''} ${address.lastName || ''}` }}</p>
                  <p>{{ address.addressLine1 || '' }}</p>
                  <p v-if="address.addressLine2">{{ address.addressLine2 }}</p>
                  <p>{{ address.postalCode || '' }} {{ address.city || '' }}</p>
                  <p>{{ address.country || '' }}</p>
                  <p v-if="address.phone">{{ address.phone }}</p>
                </div>
                
                <div class="address-actions">
                  <button class="btn-outline" @click="showAddressModal(address)">Modifier</button>
                  <button 
                    v-if="!address.isDefault" 
                    class="btn-outline" 
                    @click="setDefaultAddress(address)"
                  >
                    Définir par défaut
                  </button>
                  <button 
                    v-if="!address.isDefault" 
                    class="btn-danger" 
                    @click="confirmDeleteAddress(address)"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    
    <div v-if="isAddressModalOpen" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ currentAddress && currentAddress.id ? 'Modifier l\'adresse' : 'Ajouter une adresse' }}</h3>
          <button class="close-btn" @click="isAddressModalOpen = false">&times;</button>
        </div>
        
        <div class="modal-body">
          <div v-if="formError" class="form-error">
            {{ formError }}
          </div>
          
          <form @submit.prevent="saveAddress">
            <div class="form-group">
              <label for="addressName">Nom de l'adresse <span class="required">*</span></label>
              <input 
                type="text" 
                id="addressName" 
                v-model="currentAddress.name"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">Prénom <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="firstName" 
                  v-model="currentAddress.firstName" 
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="lastName">Nom <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="lastName" 
                  v-model="currentAddress.lastName" 
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="addressLine1">Adresse <span class="required">*</span></label>
              <input 
                type="text" 
                id="addressLine1" 
                v-model="currentAddress.addressLine1" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="addressLine2">Complément d'adresse (optionnel)</label>
              <input 
                type="text" 
                id="addressLine2" 
                v-model="currentAddress.addressLine2" 
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="postalCode">Code postal <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="postalCode" 
                  v-model="currentAddress.postalCode" 
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="city">Ville <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="city" 
                  v-model="currentAddress.city" 
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="country">Pays <span class="required">*</span></label>
              <input 
                type="text" 
                id="country" 
                v-model="currentAddress.country" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="phone">Téléphone <span class="required">*</span></label>
              <input 
                type="tel" 
                id="phone" 
                v-model="currentAddress.phone"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="type">Type d'adresse <span class="required">*</span></label>
              <select id="type" v-model="currentAddress.type">
                <option value="shipping">Adresse de livraison</option>
                <option value="billing">Adresse de facturation</option>
              </select>
            </div>
            
            <div class="form-group checkbox">
              <input 
                type="checkbox" 
                id="isDefault" 
                v-model="currentAddress.isDefault"
              />
              <label for="isDefault">Définir comme adresse par défaut</label>
            </div>
            
            <div class="form-actions">
              <button 
                type="button" 
                class="btn-outline" 
                @click="isAddressModalOpen = false"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn-primary" 
                :disabled="isSaving"
              >
                {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <div v-if="isDeleteModalOpen" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirmer la suppression</h3>
          <button class="close-btn" @click="cancelDelete">&times;</button>
        </div>
        
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer cette adresse ?</p>
          
          <div v-if="addressToDelete" class="address-preview">
            <p><strong>{{ addressToDelete.name }}</strong></p>
            <p>{{ addressToDelete.firstName }} {{ addressToDelete.lastName }}</p>
            <p>{{ addressToDelete.addressLine1 }}</p>
            <p v-if="addressToDelete.addressLine2">{{ addressToDelete.addressLine2 }}</p>
            <p>{{ addressToDelete.postalCode }} {{ addressToDelete.city }}</p>
            <p>{{ addressToDelete.country }}</p>
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="btn-outline" 
              @click="cancelDelete"
            >
              Annuler
            </button>
            <button 
              type="button" 
              class="btn-danger" 
              @click="deleteAddress"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/apiService';
import { useAuthStore } from '@/stores/auth';

interface Address {
  _id?: string;
  id?: number;
  user?: string;
  userId?: number;
  name: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  type: string;
  isDefault: boolean;
}

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const addresses = ref<Address[]>([]);
const currentAddress = ref<Address | null>(null);
const isAddressModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const addressToDelete = ref<Address | null>(null);
const isSaving = ref(false);
const isDeleting = ref(false);
const formError = ref('');

const validAddresses = computed(() => {
  return addresses.value.filter(address => {
    return (address._id || address.id) && 
           ((address.firstName && address.lastName) || 
            address.addressLine1);
  });
});

const loadAddresses = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    if (!authStore.isAuthenticated) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }
    
    const response = await api.get('/user/addresses');
    
    if (response.data && Array.isArray(response.data)) {
      addresses.value = response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      addresses.value = response.data.data;
    } else {
      addresses.value = [];
      console.error('Format de réponse inattendu:', response.data);
    }
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des adresses:', err);
    
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    } else {
      error.value = 'Une erreur est survenue lors du chargement de vos adresses. Veuillez réessayer.';
    }
  } finally {
    loading.value = false;
  }
};

const showAddressModal = (address: Address | null) => {
  if (address) {
    currentAddress.value = { ...address };
  } else {
    const addressNumber = addresses.value.length + 1;
    const defaultName = `Adresse ${addressNumber}`;
    
    currentAddress.value = {
      name: defaultName,
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: '',
      phone: '',
      type: 'shipping',
      isDefault: false
    };
  }
  
  isAddressModalOpen.value = true;
  formError.value = '';
};

const saveAddress = async () => {
  if (!currentAddress.value) return;
  
  isSaving.value = true;
  formError.value = '';
  
  try {
    const isNewAddress = !(currentAddress.value._id || currentAddress.value.id);
    
    if (isNewAddress) {
      await api.post('/user/addresses', currentAddress.value);
    } else {
      const addressId = currentAddress.value._id || currentAddress.value.id;
      await api.put(`/user/addresses/${addressId}`, currentAddress.value);
    }
    
    isAddressModalOpen.value = false;
    await loadAddresses();
    
    const redirectPath = router.currentRoute.value.query.redirect;
    if (redirectPath && typeof redirectPath === 'string') {
      router.push(redirectPath);
      return;
    }
    
  } catch (err: any) {
    console.error('Erreur lors de l\'enregistrement de l\'adresse:', err);
    
    if (err.response && err.response.data && err.response.data.message) {
      formError.value = err.response.data.message;
    } else {
      formError.value = 'Une erreur est survenue lors de l\'enregistrement de l\'adresse. Veuillez réessayer.';
    }
  } finally {
    isSaving.value = false;
  }
};

const setDefaultAddress = async (address: Address) => {
  try {
    const response = await api.put(`/user/addresses/${address._id || address.id}/set-default`, {});
    
    await loadAddresses();
    
    const redirectPath = router.currentRoute.value.query.redirect;
    if (redirectPath && typeof redirectPath === 'string') {
      router.push(redirectPath);
      return;
    }
    
  } catch (err: any) {
    console.error('Erreur lors de la définition de l\'adresse par défaut:', err);
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
  }
};

const confirmDeleteAddress = (address: Address) => {
  addressToDelete.value = address;
  isDeleteModalOpen.value = true;
};

const deleteAddress = async () => {
  if (!addressToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    await api.delete(`/user/addresses/${addressToDelete.value._id || addressToDelete.value.id}`);
    
    isDeleteModalOpen.value = false;
    addressToDelete.value = null;
    await loadAddresses();
    
  } catch (err: any) {
    console.error('Erreur lors de la suppression de l\'adresse:', err);
    error.value = 'Une erreur est survenue lors de la suppression de l\'adresse. Veuillez réessayer.';
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  isDeleteModalOpen.value = false;
  addressToDelete.value = null;
};

onMounted(() => {
  loadAddresses();
});
</script>

<style scoped>
.addresses-view {
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

.addresses-content {
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

.btn-outline {
  background-color: transparent;
  color: #3498db;
  border: 1px solid #3498db;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 0.5rem;
}

.btn-outline:hover {
  background-color: #3498db;
  color: white;
}

.btn-danger {
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger:hover {
  background-color: #e74c3c;
  color: white;
}

.addresses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.addresses-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.empty-addresses {
  text-align: center;
  padding: 3rem 0;
  color: #7f8c8d;
}

.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.address-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  overflow: hidden;
}

.address-card-content {
  padding: 1.5rem;
}

.address-type {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #ecf0f1;
  color: #2c3e50;
}

.badge-primary {
  background-color: #3498db;
  color: white;
}

.badge-success {
  background-color: #2ecc71;
  color: white;
}

.address-details {
  margin-bottom: 1.5rem;
}

.address-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.address-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.address-details p {
  margin: 0.25rem 0;
  color: #34495e;
}

.address-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-body {
  padding: 1.5rem;
}

.form-error {
  background-color: #fdedec;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox input {
  width: auto;
  margin-right: 0.5rem;
}

.form-group.checkbox label {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.address-preview {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.address-preview p {
  margin: 0.25rem 0;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}
</style>
