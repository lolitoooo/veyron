<template>
  <div class="two-factor-container">
    <h1>Authentification à deux facteurs</h1>
    
    <div v-if="isLoading" class="loading">
      <i class="material-icons spin">sync</i>
      <p>Chargement...</p>
    </div>
    
    <div v-else>
      <!-- 2FA Désactivée -->
      <div v-if="!twoFactorEnabled" class="status-card disabled">
        <div class="status-header">
          <i class="material-icons">lock_open</i>
          <h2>2FA Désactivée</h2>
        </div>
        <p class="status-description">
          L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
          Nous vous recommandons fortement de l'activer.
        </p>
        <button @click="startSetup" class="btn-primary">
          <i class="material-icons">shield</i>
          Activer la 2FA
        </button>
      </div>
      
      <!-- 2FA Activée -->
      <div v-else class="status-card enabled">
        <div class="status-header">
          <i class="material-icons">verified_user</i>
          <h2>2FA Activée</h2>
        </div>
        <p class="status-description">
          Votre compte est protégé par l'authentification à deux facteurs.
        </p>
        <div class="actions">
          <button @click="showRegenerateModal = true" class="btn-secondary">
            <i class="material-icons">refresh</i>
            Régénérer codes de secours
          </button>
          <button @click="showDisableModal = true" class="btn-danger">
            <i class="material-icons">lock_open</i>
            Désactiver la 2FA
          </button>
        </div>
      </div>
      
      <!-- Modal Setup 2FA -->
      <div v-if="showSetupModal" class="modal-overlay" @click.self="closeSetupModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Configurer l'authentification à deux facteurs</h2>
            <button @click="closeSetupModal" class="btn-close">
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Étape 1: QR Code -->
            <div v-if="setupStep === 1">
              <p class="step-description">
                Scannez ce QR code avec votre application d'authentification (Google Authenticator, Microsoft Authenticator, etc.)
              </p>
              
              <div v-if="qrCode" class="qr-code-container">
                <img :src="qrCode" alt="QR Code 2FA" />
              </div>
              
              <div class="manual-entry">
                <p><strong>Ou entrez manuellement cette clé :</strong></p>
                <div class="secret-key">
                  <code>{{ secret }}</code>
                  <button @click="copySecret" class="btn-copy">
                    <i class="material-icons">content_copy</i>
                  </button>
                </div>
              </div>
              
              <button @click="setupStep = 2" class="btn-primary full-width">
                Suivant
              </button>
            </div>
            
            <!-- Étape 2: Vérification -->
            <div v-if="setupStep === 2">
              <p class="step-description">
                Entrez le code à 6 chiffres généré par votre application pour vérifier la configuration.
              </p>
              
              <div v-if="setupError" class="error-message">
                {{ setupError }}
              </div>
              
              <div class="form-group">
                <label for="verify-code">Code de vérification</label>
                <input 
                  type="text" 
                  id="verify-code"
                  v-model="verifyCode" 
                  placeholder="000000"
                  maxlength="6"
                  pattern="[0-9]{6}"
                  class="code-input"
                />
              </div>
              
              <div class="modal-actions">
                <button @click="setupStep = 1" class="btn-secondary">
                  Retour
                </button>
                <button 
                  @click="verifySetup" 
                  class="btn-primary"
                  :disabled="isVerifying || verifyCode.length !== 6"
                >
                  <span v-if="isVerifying">Vérification...</span>
                  <span v-else>Activer</span>
                </button>
              </div>
            </div>
            
            <!-- Étape 3: Codes de secours -->
            <div v-if="setupStep === 3">
              <p class="step-description success">
                <i class="material-icons">check_circle</i>
                2FA activée avec succès !
              </p>
              
              <div class="backup-codes-section">
                <h3>Codes de secours</h3>
                <p class="warning-text">
                  <i class="material-icons">warning</i>
                  Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.
                </p>
                
                <div class="backup-codes">
                  <div v-for="(code, index) in backupCodes" :key="index" class="backup-code">
                    {{ code }}
                  </div>
                </div>
                
                <button @click="downloadBackupCodes" class="btn-secondary full-width">
                  <i class="material-icons">download</i>
                  Télécharger les codes
                </button>
              </div>
              
              <button @click="finishSetup" class="btn-primary full-width">
                Terminer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Désactiver 2FA -->
      <div v-if="showDisableModal" class="modal-overlay" @click.self="showDisableModal = false">
        <div class="modal-content modal-sm">
          <div class="modal-header">
            <h2>Désactiver la 2FA</h2>
            <button @click="showDisableModal = false" class="btn-close">
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <div class="modal-body">
            <p class="warning-text">
              <i class="material-icons">warning</i>
              Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ? 
              Cela rendra votre compte moins sécurisé.
            </p>
            
            <div v-if="disableError" class="error-message">
              {{ disableError }}
            </div>
            
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input 
                type="password" 
                id="password"
                v-model="disablePassword" 
                placeholder="Votre mot de passe"
              />
            </div>
            
            <div class="modal-actions">
              <button @click="showDisableModal = false" class="btn-secondary">
                Annuler
              </button>
              <button 
                @click="disable2FA" 
                class="btn-danger"
                :disabled="isDisabling || !disablePassword"
              >
                <span v-if="isDisabling">Désactivation...</span>
                <span v-else>Désactiver</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Régénérer codes -->
      <div v-if="showRegenerateModal" class="modal-overlay" @click.self="showRegenerateModal = false">
        <div class="modal-content modal-sm">
          <div class="modal-header">
            <h2>Régénérer les codes de secours</h2>
            <button @click="showRegenerateModal = false" class="btn-close">
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <div class="modal-body">
            <p class="warning-text">
              <i class="material-icons">info</i>
              Les anciens codes de secours seront invalidés et remplacés par de nouveaux codes.
            </p>
            
            <div v-if="regenerateError" class="error-message">
              {{ regenerateError }}
            </div>
            
            <div v-if="!newBackupCodes.length" class="form-group">
              <label for="regen-password">Mot de passe</label>
              <input 
                type="password" 
                id="regen-password"
                v-model="regeneratePassword" 
                placeholder="Votre mot de passe"
              />
            </div>
            
            <div v-if="newBackupCodes.length" class="backup-codes-section">
              <p class="success-text">
                <i class="material-icons">check_circle</i>
                Nouveaux codes générés !
              </p>
              
              <div class="backup-codes">
                <div v-for="(code, index) in newBackupCodes" :key="index" class="backup-code">
                  {{ code }}
                </div>
              </div>
              
              <button @click="downloadNewBackupCodes" class="btn-secondary full-width">
                <i class="material-icons">download</i>
                Télécharger les codes
              </button>
            </div>
            
            <div class="modal-actions">
              <button @click="showRegenerateModal = false" class="btn-secondary">
                Fermer
              </button>
              <button 
                v-if="!newBackupCodes.length"
                @click="regenerateBackupCodes" 
                class="btn-primary"
                :disabled="isRegenerating || !regeneratePassword"
              >
                <span v-if="isRegenerating">Génération...</span>
                <span v-else>Régénérer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotification } from '@/composables/useNotification';
import api from '@/services/apiService';

const { success, error: notifyError } = useNotification();

const isLoading = ref(true);
const twoFactorEnabled = ref(false);
const showSetupModal = ref(false);
const showDisableModal = ref(false);
const showRegenerateModal = ref(false);

const setupStep = ref(1);
const qrCode = ref('');
const secret = ref('');
const verifyCode = ref('');
const isVerifying = ref(false);
const setupError = ref('');
const backupCodes = ref<string[]>([]);

const disablePassword = ref('');
const isDisabling = ref(false);
const disableError = ref('');

const regeneratePassword = ref('');
const isRegenerating = ref(false);
const regenerateError = ref('');
const newBackupCodes = ref<string[]>([]);

onMounted(async () => {
  await check2FAStatus();
});

const check2FAStatus = async () => {
  try {
    const response = await api.get('/auth/2fa/status');
    twoFactorEnabled.value = response.data.data.enabled;
  } catch (err) {
    notifyError('Erreur lors de la vérification du statut 2FA');
  } finally {
    isLoading.value = false;
  }
};

const startSetup = async () => {
  try {
    const response = await api.post('/auth/2fa/setup');
    qrCode.value = response.data.data.qrCode;
    secret.value = response.data.data.secret;
    showSetupModal.value = true;
    setupStep.value = 1;
  } catch (err: any) {
    notifyError(err.response?.data?.message || 'Erreur lors de la configuration');
  }
};

const copySecret = () => {
  navigator.clipboard.writeText(secret.value);
  success('Clé copiée dans le presse-papiers');
};

const verifySetup = async () => {
  if (verifyCode.value.length !== 6) {
    setupError.value = 'Le code doit contenir 6 chiffres';
    return;
  }

  isVerifying.value = true;
  setupError.value = '';

  try {
    const response = await api.post('/auth/2fa/verify', {
      token: verifyCode.value
    });

    backupCodes.value = response.data.data.backupCodes;
    setupStep.value = 3;
    success('2FA activée avec succès');
  } catch (err: any) {
    setupError.value = err.response?.data?.message || 'Code invalide';
  } finally {
    isVerifying.value = false;
  }
};

const downloadBackupCodes = () => {
  const text = backupCodes.value.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'veyron-2fa-backup-codes.txt';
  a.click();
  URL.revokeObjectURL(url);
};

const finishSetup = () => {
  closeSetupModal();
  twoFactorEnabled.value = true;
};

const closeSetupModal = () => {
  showSetupModal.value = false;
  setupStep.value = 1;
  verifyCode.value = '';
  setupError.value = '';
  backupCodes.value = [];
};

const disable2FA = async () => {
  if (!disablePassword.value) {
    disableError.value = 'Mot de passe requis';
    return;
  }

  isDisabling.value = true;
  disableError.value = '';

  try {
    await api.post('/auth/2fa/disable', {
      password: disablePassword.value
    });

    twoFactorEnabled.value = false;
    showDisableModal.value = false;
    disablePassword.value = '';
    success('2FA désactivée');
  } catch (err: any) {
    disableError.value = err.response?.data?.message || 'Erreur lors de la désactivation';
  } finally {
    isDisabling.value = false;
  }
};

const regenerateBackupCodes = async () => {
  if (!regeneratePassword.value) {
    regenerateError.value = 'Mot de passe requis';
    return;
  }

  isRegenerating.value = true;
  regenerateError.value = '';

  try {
    const response = await api.post('/auth/2fa/regenerate-backup-codes', {
      password: regeneratePassword.value
    });

    newBackupCodes.value = response.data.data.backupCodes;
    success('Codes de secours régénérés');
  } catch (err: any) {
    regenerateError.value = err.response?.data?.message || 'Erreur lors de la régénération';
  } finally {
    isRegenerating.value = false;
  }
};

const downloadNewBackupCodes = () => {
  const text = newBackupCodes.value.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'veyron-2fa-new-backup-codes.txt';
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.two-factor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: 300;
  margin-bottom: 2rem;
  color: #111;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.loading i {
  font-size: 3rem;
  color: #111;
  margin-bottom: 1rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-card {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-header i {
  font-size: 2.5rem;
}

.status-card.disabled .status-header i {
  color: #999;
}

.status-card.enabled .status-header i {
  color: #28a745;
}

.status-header h2 {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0;
}

.status-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-primary {
  background-color: #111;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #000;
}

.btn-secondary {
  background-color: #f8f8f8;
  color: #111;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.btn-danger {
  background-color: #dc3545;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.modal-overlay {
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

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.modal-sm {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.3rem;
  font-weight: 400;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #999;
}

.btn-close:hover {
  color: #111;
}

.modal-body {
  padding: 1.5rem;
}

.step-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.step-description.success {
  color: #28a745;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.qr-code-container {
  text-align: center;
  margin: 2rem 0;
}

.qr-code-container img {
  max-width: 250px;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
}

.manual-entry {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.secret-key {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.secret-key code {
  flex: 1;
  padding: 0.75rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}

.btn-copy {
  padding: 0.75rem;
  background-color: #111;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-copy:hover {
  background-color: #000;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.code-input {
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  font-weight: 600;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.warning-text {
  background-color: rgba(255, 193, 7, 0.1);
  color: #856404;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.warning-text i {
  flex-shrink: 0;
}

.success-text {
  color: #28a745;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.backup-codes-section {
  margin: 1.5rem 0;
}

.backup-codes-section h3 {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.backup-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.backup-code {
  padding: 0.75rem;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-family: monospace;
  font-weight: 600;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
