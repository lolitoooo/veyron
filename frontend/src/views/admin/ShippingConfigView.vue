<template>
  <div class="shipping-config-view">
    <div class="header">
      <h1>Configuration de Livraison</h1>
      <p class="subtitle">Gérez les modes et tarifs de livraison</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <div v-else class="shipping-configs">
      <div 
        v-for="config in shippingConfigs" 
        :key="config._id"
        class="config-card"
      >
        <div class="card-header">
          <div class="title-section">
            <h2>{{ config.displayName }}</h2>
            <span :class="['status-badge', config.enabled ? 'active' : 'inactive']">
              {{ config.enabled ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <button 
            @click="toggleEdit(config._id)" 
            class="btn-edit"
            :class="{ active: editingId === config._id }"
          >
            <span class="material-icons">{{ editingId === config._id ? 'close' : 'edit' }}</span>
          </button>
        </div>

        <div v-if="editingId !== config._id" class="config-display">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Prix</span>
              <span class="value">{{ formatPrice(config.price) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Livraison gratuite dès</span>
              <span class="value">{{ formatPrice(config.freeShippingThreshold) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Délai estimé</span>
              <span class="value">{{ config.estimatedDays.min }}-{{ config.estimatedDays.max }} jours</span>
            </div>
          </div>
          <div v-if="config.description" class="description">
            <span class="label">Description</span>
            <p>{{ config.description }}</p>
          </div>
        </div>

        <form v-else @submit.prevent="saveConfig(config._id)" class="config-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom d'affichage</label>
              <input 
                v-model="editForm.displayName" 
                type="text" 
                required
                placeholder="Ex: Livraison à domicile"
              />
            </div>

            <div class="form-group">
              <label>Prix (€)</label>
              <input 
                v-model.number="editForm.price" 
                type="number" 
                step="0.01"
                min="0"
                required
                placeholder="4.95"
              />
            </div>

            <div class="form-group">
              <label>Seuil livraison gratuite (€)</label>
              <input 
                v-model.number="editForm.freeShippingThreshold" 
                type="number" 
                step="0.01"
                min="0"
                required
                placeholder="70"
              />
            </div>

            <div class="form-group">
              <label>
                <input 
                  v-model="editForm.enabled" 
                  type="checkbox"
                />
                Mode actif
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Délai minimum (jours)</label>
              <input 
                v-model.number="editForm.estimatedDays.min" 
                type="number" 
                min="1"
                required
              />
            </div>

            <div class="form-group half">
              <label>Délai maximum (jours)</label>
              <input 
                v-model.number="editForm.estimatedDays.max" 
                type="number" 
                min="1"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="editForm.description" 
              rows="3"
              placeholder="Description du mode de livraison..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="btn-cancel">
              Annuler
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/apiService';

interface ShippingConfig {
  _id: string;
  name: string;
  displayName: string;
  price: number;
  freeShippingThreshold: number;
  enabled: boolean;
  estimatedDays: {
    min: number;
    max: number;
  };
  description: string;
}

const shippingConfigs = ref<ShippingConfig[]>([]);
const loading = ref(true);
const saving = ref(false);
const editingId = ref<string | null>(null);
const editForm = ref({
  displayName: '',
  price: 0,
  freeShippingThreshold: 70,
  enabled: true,
  estimatedDays: {
    min: 2,
    max: 5
  },
  description: ''
});

const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'warning'
});

const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  };
  
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(price);
};

const loadShippingConfigs = async () => {
  try {
    loading.value = true;
    const response = await api.get('/shipping/admin/all');
    
    if (response.data && response.data.success) {
      shippingConfigs.value = response.data.data;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des configurations:', error);
    showNotification('Erreur lors du chargement des configurations', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleEdit = (configId: string) => {
  if (editingId.value === configId) {
    cancelEdit();
  } else {
    const config = shippingConfigs.value.find(c => c._id === configId);
    if (config) {
      editingId.value = configId;
      editForm.value = {
        displayName: config.displayName,
        price: config.price,
        freeShippingThreshold: config.freeShippingThreshold,
        enabled: config.enabled,
        estimatedDays: { ...config.estimatedDays },
        description: config.description || ''
      };
    }
  }
};

const cancelEdit = () => {
  editingId.value = null;
  editForm.value = {
    displayName: '',
    price: 0,
    freeShippingThreshold: 70,
    enabled: true,
    estimatedDays: {
      min: 2,
      max: 5
    },
    description: ''
  };
};

const saveConfig = async (configId: string) => {
  try {
    saving.value = true;
    
    const response = await api.put(`/shipping/admin/${configId}`, editForm.value);
    
    if (response.data && response.data.success) {
      showNotification('Configuration mise à jour avec succès', 'success');
      await loadShippingConfigs();
      cancelEdit();
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification('Erreur lors de la sauvegarde', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadShippingConfigs();
});
</script>

<style scoped>
.shipping-config-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1a1a1a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.shipping-configs {
  display: grid;
  gap: 2rem;
}

.config-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  transition: box-shadow 0.3s ease;
}

.config-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.btn-edit {
  background: none;
  border: 1px solid #e0e0e0;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background-color: #f5f5f5;
  border-color: #1a1a1a;
}

.btn-edit.active {
  background-color: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
}

.btn-edit .material-icons {
  font-size: 1.25rem;
}

.config-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.description {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.description p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.half {
  flex: 1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1a1a1a;
}

.form-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  cursor: pointer;
}

.form-group label:has(input[type="checkbox"]) {
  flex-direction: row;
  align-items: center;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: none;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn-cancel:hover {
  background-color: #f5f5f5;
  border-color: #1a1a1a;
  color: #1a1a1a;
}

.btn-save {
  background-color: #1a1a1a;
  border: 1px solid #1a1a1a;
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  background-color: #000;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-success {
  background-color: #2e7d32;
}

.notification-error {
  background-color: #c62828;
}

.notification-warning {
  background-color: #f57c00;
}

@media (max-width: 768px) {
  .shipping-config-view {
    padding: 1rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .config-card {
    padding: 1.5rem;
  }

  .form-grid,
  .form-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
