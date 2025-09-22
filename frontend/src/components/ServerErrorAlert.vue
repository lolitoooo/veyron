<template>
  <div v-if="visible" class="server-error-alert">
    <div class="alert-content">
      <div class="alert-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="alert-message">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="alert-actions">
          <button @click="retry" class="btn-retry">
            <i class="fas fa-sync-alt"></i> Réessayer
          </button>
          <button v-if="showDismiss" @click="dismiss" class="btn-dismiss">
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Erreur de connexion au serveur'
  },
  message: {
    type: String,
    default: 'Le serveur backend n\'est pas accessible. Veuillez vérifier que le serveur est en cours d\'exécution.'
  },
  showDismiss: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['retry', 'dismiss']);

const retry = () => {
  emit('retry');
};

const dismiss = () => {
  emit('dismiss');
};
</script>

<style scoped>
.server-error-alert {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 5px solid #dc3545;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.alert-content {
  display: flex;
  padding: 1.5rem;
}

.alert-icon {
  flex: 0 0 50px;
  font-size: 1.8rem;
  color: #dc3545;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.alert-message {
  flex: 1;
}

.alert-message h3 {
  margin: 0 0 0.5rem;
  font-family: var(--font-heading);
  font-size: 1.2rem;
}

.alert-message p {
  margin: 0 0 1rem;
  color: #666;
}

.alert-actions {
  display: flex;
  gap: 1rem;
}

.btn-retry, .btn-dismiss {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-retry {
  background-color: #dc3545;
  color: white;
}

.btn-retry:hover {
  background-color: #c82333;
}

.btn-dismiss {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}

.btn-dismiss:hover {
  background-color: #e2e6ea;
}
</style>
