<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import ServerErrorAlert from './components/ServerErrorAlert.vue'
import api, { serverErrorEvent } from './services/apiService'

const authStore = useAuthStore()
const cartStore = useCartStore()
const serverError = ref(false)
const serverErrorMessage = ref('Le serveur backend n\'est pas accessible. Veuillez vérifier que le serveur est en cours d\'exécution.')
const cartInitialized = ref(false)

function handleServerError(event: Event) {
  const customEvent = event as CustomEvent
  serverError.value = true
  serverErrorMessage.value = customEvent.detail.message
}

onMounted(async () => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  document.head.appendChild(link)
  
  serverErrorEvent.addEventListener('server-error', handleServerError)
  
  await checkServerConnection()
  
  if (!cartInitialized.value) {
    try {
      await cartStore.initCart()
      cartInitialized.value = true
    } catch (err) {
      console.error('Erreur lors de l\'initialisation du panier au démarrage:', err)
    }
  }
})

onUnmounted(() => {
  serverErrorEvent.removeEventListener('server-error', handleServerError)
})

watch(() => authStore.error, (newError) => {
  if (newError && newError.includes('serveur n\'est pas accessible')) {
    serverError.value = true
    serverErrorMessage.value = newError
  }
})

async function checkServerConnection() {
  try {
    await api.request({
      method: 'OPTIONS',
      url: '/user',
      timeout: 5000
    })
    serverError.value = false
  } catch (error: any) {
    if (error.response) {
      serverError.value = false
    } else {
      console.error('Erreur de connexion au serveur:', error)
    }
  }
}

async function retryConnection() {
  await checkServerConnection()
  if (authStore.isAuthenticated) {
    await authStore.loadUser()
    
    try {
      await cartStore.initCart()
      cartInitialized.value = true
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du panier:', err)
    }
  }
}
</script>

<template>
  <ServerErrorAlert 
    :visible="serverError" 
    :message="serverErrorMessage"
    @retry="retryConnection"
    @dismiss="serverError = false"
  />
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&display=swap');

:root {
  --font-heading: 'Cormorant Garamond', serif;
  --font-body: 'Montserrat', sans-serif;
  --color-bg: #f8f8f8;
  --color-text: #111;
  --color-text-light: #666;
  --color-accent: #111;
  --color-border: #eaeaea;
  --black: #000;
  --white: #fff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-bg);
  line-height: 1.6;
  font-size: 16px;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 400;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: var(--font-body);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
