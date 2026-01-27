<template>
  <div class="loyalty-config-view">
    <div class="page-header">
      <h1>Configuration du Programme de Fidélité</h1>
      <p class="subtitle">Gérez les paramètres du cashback, XP et rangs</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement de la configuration...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="material-icons">error</i>
      <p>{{ error }}</p>
      <button @click="loadConfig" class="btn-retry">Réessayer</button>
    </div>

    <form v-else @submit.prevent="saveConfig" class="config-form">
      <div class="form-section">
        <h2>Activation</h2>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.enabled" />
            <span>Activer le programme de fidélité</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h2>Cashback</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Taux de cashback (%)</label>
            <input type="number" v-model.number="config.cashbackRatePercent" step="0.1" min="0" max="100" required />
            <small>Pourcentage du montant produits reversé en cashback</small>
          </div>
          <div class="form-group">
            <label>Durée de validité (jours)</label>
            <input type="number" v-model.number="config.cashbackExpiryDays" min="1" required />
            <small>Nombre de jours avant expiration du cashback</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Gain maximum par commande (€)</label>
            <input type="number" v-model.number="config.cashbackMaxEarnPerOrder" step="0.01" min="0" required />
            <small>Plafond de cashback gagné par commande</small>
          </div>
          <div class="form-group">
            <label>Utilisation maximum (%)</label>
            <input type="number" v-model.number="config.cashbackMaxUsePercent" min="0" max="100" required />
            <small>% maximum du panier payable en cashback</small>
          </div>
        </div>

        <div class="form-group">
          <label>Montant minimum payable (€)</label>
          <input type="number" v-model.number="config.cashbackMinPayableAmount" step="0.01" min="0" required />
          <small>Montant minimum à payer en argent réel (évite commandes à 0€)</small>
        </div>
      </div>

      <div class="form-section">
        <h2>Expérience (XP)</h2>
        <div class="form-group">
          <label>XP par euro dépensé</label>
          <input type="number" v-model.number="config.xpPerEuro" step="0.1" min="0" required />
          <small>Nombre de points XP gagnés pour 1€ dépensé</small>
        </div>
      </div>

      <div class="form-section">
        <h2>Rangs</h2>
        <p class="section-description">Définissez les seuils XP et bonus cashback pour chaque rang</p>
        
        <div v-for="(rank, index) in config.ranks" :key="index" class="rank-item">
          <div class="rank-header">
            <h3>{{ rank.name }}</h3>
            <button v-if="config.ranks.length > 1" type="button" @click="removeRank(index)" class="btn-remove">
              <i class="material-icons">delete</i>
            </button>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nom du rang</label>
              <input type="text" v-model="rank.name" required />
            </div>
            <div class="form-group">
              <label>XP minimum</label>
              <input type="number" v-model.number="rank.minXp" min="0" required />
            </div>
            <div class="form-group">
              <label>Bonus cashback (%)</label>
              <input type="number" v-model.number="rank.cashbackBonus" step="0.1" min="0" />
              <small>Bonus ajouté au taux de base</small>
            </div>
          </div>
        </div>

        <button type="button" @click="addRank" class="btn-add-rank">
          <i class="material-icons">add</i>
          Ajouter un rang
        </button>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save" :disabled="saving">
          <span v-if="saving">Enregistrement...</span>
          <span v-else>Enregistrer la configuration</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/apiService';

const loading = ref(true);
const saving = ref(false);
const error = ref('');

const config = ref({
  enabled: true,
  cashbackRatePercent: 1.0,
  cashbackExpiryDays: 365,
  cashbackMaxEarnPerOrder: 20,
  cashbackMaxUsePercent: 30,
  cashbackMinPayableAmount: 1,
  xpPerEuro: 1,
  ranks: [
    { name: 'Bronze', minXp: 0, cashbackBonus: 0 },
    { name: 'Argent', minXp: 500, cashbackBonus: 0.1 },
    { name: 'Or', minXp: 1500, cashbackBonus: 0.25 },
    { name: 'Platine', minXp: 3000, cashbackBonus: 0.5 }
  ]
});

const loadConfig = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get('/loyalty/config');
    if (response.data && response.data.success) {
      config.value = response.data.data;
    }
  } catch (err: any) {
    console.error('Erreur chargement config loyalty:', err);
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  saving.value = true;
  error.value = '';

  try {
    const response = await api.put('/loyalty/config', config.value);
    if (response.data && response.data.success) {
      alert('Configuration enregistrée avec succès');
    }
  } catch (err: any) {
    console.error('Erreur sauvegarde config loyalty:', err);
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde';
    alert('Erreur : ' + error.value);
  } finally {
    saving.value = false;
  }
};

const addRank = () => {
  const lastRank = config.value.ranks[config.value.ranks.length - 1];
  config.value.ranks.push({
    name: 'Nouveau Rang',
    minXp: lastRank ? lastRank.minXp + 1000 : 0,
    cashbackBonus: 0
  });
};

const removeRank = (index: number) => {
  if (confirm('Supprimer ce rang ?')) {
    config.value.ranks.splice(index, 1);
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.loyalty-config-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #111;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #111;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-message i {
  font-size: 3rem;
  color: #e53935;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background-color: #111;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.config-form {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #111;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #111;
}

.form-group small {
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-label span {
  font-size: 1rem;
  color: #333;
}

.rank-item {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rank-header h3 {
  font-size: 1.2rem;
  color: #111;
}

.btn-remove {
  background-color: #e53935;
  color: #fff;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-remove:hover {
  background-color: #c62828;
}

.btn-add-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
}

.btn-add-rank:hover {
  background-color: #eee;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  padding: 1rem 2rem;
  background-color: #111;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-save:hover {
  background-color: #333;
}

.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
