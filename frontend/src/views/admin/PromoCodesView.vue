<template>
  <div class="admin-promo-codes">
    <div class="admin-header">
      <h1>Gestion des codes promo</h1>
      
      <div class="admin-actions">
        <button @click="showAddModal = true" class="btn btn-primary">
          <i class="material-icons">add</i>
          <span>Créer un code promo</span>
        </button>
      </div>
    </div>
    
    <div class="admin-description">
      <p>Gérez les codes promotionnels pour offrir des réductions à vos clients.</p>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Chargement des codes promo...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchPromoCodes" class="btn btn-secondary">Réessayer</button>
    </div>
    
    <div v-else-if="!promoCodes.length" class="empty-state">
      <div class="empty-state-content">
        <div class="icon-container">
          <i class="material-icons">local_offer</i>
        </div>
        <h2>Aucun code promo</h2>
        <p>Vous n'avez pas encore créé de codes promo pour votre boutique.</p>
        <button @click="showAddModal = true" class="btn btn-primary">
          <i class="material-icons">add</i>
          <span>Créer un code promo</span>
        </button>
      </div>
    </div>
    
    <div v-else class="promo-codes-list">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Valeur</th>
              <th>Utilisations</th>
              <th>Validité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="promo in promoCodes" :key="promo._id" :class="{ 'inactive': !promo.isActive }">
              <td><strong>{{ promo.code }}</strong></td>
              <td>{{ promo.title }}</td>
              <td>{{ formatDiscountType(promo.discountType) }}</td>
              <td>{{ formatDiscountValue(promo.discountValue, promo.discountType) }}</td>
              <td>
                {{ promo.currentUses }} 
                <span v-if="promo.maxUses">/ {{ promo.maxUses }}</span>
                <span v-else>/ ∞</span>
              </td>
              <td>{{ formatValidity(promo.startDate, promo.endDate) }}</td>
              <td>
                <span :class="['status-badge', promo.isActive ? 'active' : 'inactive']">
                  {{ promo.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editPromoCode(promo)" class="btn btn-icon" title="Modifier">
                  <i class="material-icons">edit</i>
                </button>
                <button @click="confirmDelete(promo)" class="btn btn-icon btn-danger" title="Supprimer">
                  <i class="material-icons">delete</i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal d'ajout/modification -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Modifier le code promo' : 'Créer un code promo' }}</h2>
          <button @click="closeModal" class="btn-close">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="showEditModal ? updatePromoCode() : createPromoCode()">
            <div class="form-group">
              <label for="code">Code*</label>
              <input 
                type="text" 
                id="code" 
                v-model="formData.code" 
                required 
                :disabled="showEditModal"
                placeholder="ex: SUMMER2025"
                class="form-control"
              />
              <small>Le code sera automatiquement converti en majuscules</small>
            </div>
            
            <div class="form-group">
              <label for="title">Titre*</label>
              <input 
                type="text" 
                id="title" 
                v-model="formData.title" 
                required 
                placeholder="ex: Offre d'été 2025"
                class="form-control"
              />
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="formData.description" 
                placeholder="Description du code promo"
                class="form-control"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="discountType">Type de réduction*</label>
                <select id="discountType" v-model="formData.discountType" required class="form-control">
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (€)</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="discountValue">Valeur de la réduction*</label>
                <div class="input-group">
                  <input 
                    type="number" 
                    id="discountValue" 
                    v-model.number="formData.discountValue" 
                    required 
                    min="0"
                    :max="formData.discountType === 'percentage' ? 100 : null"
                    step="0.01"
                    class="form-control"
                  />
                  <span class="input-group-text">{{ formData.discountType === 'percentage' ? '%' : '€' }}</span>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="minOrderValue">Montant minimum de commande (€)</label>
              <input 
                type="number" 
                id="minOrderValue" 
                v-model.number="formData.minOrderValue" 
                min="0"
                step="0.01"
                class="form-control"
              />
            </div>
            
            <div class="form-group" v-if="formData.discountType === 'percentage'">
              <label for="maxDiscountAmount">Montant maximum de réduction (€)</label>
              <input 
                type="number" 
                id="maxDiscountAmount" 
                v-model.number="formData.maxDiscountAmount" 
                min="0"
                step="0.01"
                class="form-control"
              />
              <small>Laissez vide pour ne pas définir de plafond</small>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="startDate">Date de début</label>
                <input 
                  type="datetime-local" 
                  id="startDate" 
                  v-model="formData.startDate"
                  class="form-control"
                />
              </div>
              
              <div class="form-group">
                <label for="endDate">Date de fin</label>
                <input 
                  type="datetime-local" 
                  id="endDate" 
                  v-model="formData.endDate"
                  class="form-control"
                />
                <small>Laissez vide pour ne pas définir de date de fin</small>
              </div>
            </div>
            
            <div class="form-group">
              <label for="maxUses">Nombre maximum d'utilisations</label>
              <input 
                type="number" 
                id="maxUses" 
                v-model.number="formData.maxUses" 
                min="1"
                class="form-control"
              />
              <small>Laissez vide pour un nombre illimité d'utilisations</small>
            </div>
            
            <div class="form-check">
              <input 
                type="checkbox" 
                id="firstTimeCustomersOnly" 
                v-model="formData.firstTimeCustomersOnly"
                class="form-check-input"
              />
              <label for="firstTimeCustomersOnly" class="form-check-label">
                Réservé aux nouveaux clients uniquement
              </label>
            </div>
            
            <div class="form-check">
              <input 
                type="checkbox" 
                id="isActive" 
                v-model="formData.isActive"
                class="form-check-input"
              />
              <label for="isActive" class="form-check-label">Actif</label>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting">
                  <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                </span>
                <span v-else>{{ showEditModal ? 'Mettre à jour' : 'Créer' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button @click="showDeleteModal = false" class="btn-close">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer le code promo <strong>{{ selectedPromoCode?.code }}</strong> ?</p>
          <p class="text-danger">Cette action est irréversible.</p>
          
          <div class="form-actions">
            <button type="button" @click="showDeleteModal = false" class="btn btn-secondary">Annuler</button>
            <button type="button" @click="deletePromoCode" class="btn btn-danger" :disabled="submitting">
              <span v-if="submitting">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </span>
              <span v-else>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/apiService';
import { useNotification } from '@/composables/useNotification';

export default {
  name: 'PromoCodesView',
  setup() {
    const promoCodes = ref([]);
    const loading = ref(true);
    const error = ref('');
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const submitting = ref(false);
    const selectedPromoCode = ref(null);
    const { success, error: showError } = useNotification();
    
    const formData = reactive({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 0,
      maxDiscountAmount: null,
      maxUses: null,
      startDate: '',
      endDate: '',
      isActive: true,
      firstTimeCustomersOnly: false
    });
    
    const fetchPromoCodes = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.get('/promo-codes');
        if (response.data && response.data.success) {
          promoCodes.value = response.data.data;
        } else {
          throw new Error('Format de réponse inattendu');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des codes promo:', err);
        error.value = 'Impossible de récupérer les codes promo. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };
    
    const resetForm = () => {
      formData.code = '';
      formData.title = '';
      formData.description = '';
      formData.discountType = 'percentage';
      formData.discountValue = 10;
      formData.minOrderValue = 0;
      formData.maxDiscountAmount = null;
      formData.maxUses = null;
      formData.startDate = '';
      formData.endDate = '';
      formData.isActive = true;
      formData.firstTimeCustomersOnly = false;
    };
    
    const closeModal = () => {
      showAddModal.value = false;
      showEditModal.value = false;
      showDeleteModal.value = false;
      selectedPromoCode.value = null;
      resetForm();
    };
    
    const createPromoCode = async () => {
      submitting.value = true;
      
      try {
        const response = await api.post('/promo-codes', formData);
        
        if (response.data && response.data.success) {
          success('Code promo créé avec succès');
          await fetchPromoCodes();
          closeModal();
        } else {
          throw new Error(response.data?.message || 'Erreur lors de la création du code promo');
        }
      } catch (err) {
        console.error('Erreur lors de la création du code promo:', err);
        showError(err.response?.data?.message || 'Erreur lors de la création du code promo');
      } finally {
        submitting.value = false;
      }
    };
    
    const editPromoCode = (promo) => {
      selectedPromoCode.value = promo;
      
      formData.code = promo.code;
      formData.title = promo.title;
      formData.description = promo.description || '';
      formData.discountType = promo.discountType;
      formData.discountValue = promo.discountValue;
      formData.minOrderValue = promo.minOrderValue || 0;
      formData.maxDiscountAmount = promo.maxDiscountAmount;
      formData.maxUses = promo.maxUses;
      formData.startDate = promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : '';
      formData.endDate = promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : '';
      formData.isActive = promo.isActive;
      formData.firstTimeCustomersOnly = promo.firstTimeCustomersOnly || false;
      
      showEditModal.value = true;
    };
    
    const updatePromoCode = async () => {
      if (!selectedPromoCode.value) return;
      
      submitting.value = true;
      
      try {
        const response = await api.put(`/promo-codes/${selectedPromoCode.value._id}`, formData);
        
        if (response.data && response.data.success) {
          success('Code promo mis à jour avec succès');
          await fetchPromoCodes();
          closeModal();
        } else {
          throw new Error(response.data?.message || 'Erreur lors de la mise à jour du code promo');
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour du code promo:', err);
        showError(err.response?.data?.message || 'Erreur lors de la mise à jour du code promo');
      } finally {
        submitting.value = false;
      }
    };
    
    const confirmDelete = (promo) => {
      selectedPromoCode.value = promo;
      showDeleteModal.value = true;
    };
    
    const deletePromoCode = async () => {
      if (!selectedPromoCode.value) return;
      
      submitting.value = true;
      
      try {
        const response = await api.delete(`/promo-codes/${selectedPromoCode.value._id}`);
        
        if (response.data && response.data.success) {
          success('Code promo supprimé avec succès');
          await fetchPromoCodes();
          closeModal();
        } else {
          throw new Error(response.data?.message || 'Erreur lors de la suppression du code promo');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression du code promo:', err);
        showError(err.response?.data?.message || 'Erreur lors de la suppression du code promo');
      } finally {
        submitting.value = false;
      }
    };
    
    const formatDiscountType = (type) => {
      return type === 'percentage' ? 'Pourcentage' : 'Montant fixe';
    };
    
    const formatDiscountValue = (value, type) => {
      return type === 'percentage' ? `${value}%` : `${value.toFixed(2)}€`;
    };
    
    const formatValidity = (startDate, endDate) => {
      const now = new Date();
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && start > now) {
        return `Débute le ${new Date(startDate).toLocaleDateString()}`;
      } else if (end && end < now) {
        return `Expiré le ${new Date(endDate).toLocaleDateString()}`;
      } else if (start && end) {
        return `Du ${new Date(startDate).toLocaleDateString()} au ${new Date(endDate).toLocaleDateString()}`;
      } else if (start) {
        return `Depuis le ${new Date(startDate).toLocaleDateString()}`;
      } else if (end) {
        return `Jusqu'au ${new Date(endDate).toLocaleDateString()}`;
      } else {
        return 'Permanent';
      }
    };
    
    onMounted(() => {
      fetchPromoCodes();
    });
    
    return {
      promoCodes,
      loading,
      error,
      showAddModal,
      showEditModal,
      showDeleteModal,
      submitting,
      selectedPromoCode,
      formData,
      fetchPromoCodes,
      createPromoCode,
      editPromoCode,
      updatePromoCode,
      confirmDelete,
      deletePromoCode,
      closeModal,
      formatDiscountType,
      formatDiscountValue,
      formatValidity,
      success,
      showError
    };
  }
};
</script>

<style scoped>
.admin-promo-codes {
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1.5rem;
}

h1 {
  font-weight: 400;
  font-size: 2rem;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: 0.5px;
}

.admin-description {
  margin-bottom: 2.5rem;
  color: #666;
  font-size: 1.1rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #333;
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

.error-message {
  text-align: center;
  padding: 2rem;
  background-color: #fff3f3;
  border-radius: 4px;
  color: #d32f2f;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 0;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.icon-container {
  width: 80px;
  height: 80px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-state i {
  font-size: 2.5rem;
  color: #FFF;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #1a1a1a;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.5;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 2rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.table th, .table td {
  padding: 1.25rem 1rem;
  text-align: left;
}

.table th {
  background-color: #f9f9f9;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #eee;
}

.table td {
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background-color: #fafafa;
}

.table tr.inactive {
  opacity: 0.7;
  background-color: #f9f9f9;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.status-badge.inactive {
  background-color: #f5f5f5;
  color: #757575;
  border: 1px solid rgba(117, 117, 117, 0.2);
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #555;
}

.btn-icon i {
  font-size: 1.1rem;
}

.btn-icon:hover {
  background-color: #f5f5f5;
  border-color: #ddd;
  color: #333;
}

.btn-icon.btn-danger:hover {
  background-color: #ffebee;
  border-color: #ffcdd2;
  color: #c62828;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: #1a1a1a;
  letter-spacing: 0.3px;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: #f5f5f5;
  color: #333;
}

.btn-close i {
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #fafafa;
  color: #333;
}

.form-control:focus {
  outline: none;
  border-color: #1a1a1a;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.1);
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

small {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.input-group {
  display: flex;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group-text {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-left: none;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.form-check {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background-color: #1a1a1a;
  color: white;
}

.btn-primary:hover {
  background-color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn i {
  font-size: 1.2rem;
}

.btn-secondary {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}

.btn-danger {
  background-color: white;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.btn-danger:hover {
  background-color: #ffebee;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

small {
  display: block;
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.text-danger {
  color: #d32f2f;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
}
</style>
