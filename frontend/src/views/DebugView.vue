<template>
  <div class="debug-view">
    <h1>🔍 Debug Android</h1>
    
    <div class="info-section">
      <h2>Configuration</h2>
      <p><strong>Protocol:</strong> {{ protocol }}</p>
      <p><strong>VITE_API_URL:</strong> {{ apiUrl }}</p>
      <p><strong>VITE_BASE_URL:</strong> {{ baseUrl }}</p>
      <p><strong>Computed API URL:</strong> {{ computedApiUrl }}</p>
    </div>

    <div class="test-section">
      <h2>Test de connexion</h2>
      <button @click="testConnection" :disabled="loading">
        {{ loading ? 'Test en cours...' : 'Tester la connexion' }}
      </button>
      
      <div v-if="result" class="result" :class="result.success ? 'success' : 'error'">
        <h3>{{ result.success ? '✅ Succès' : '❌ Erreur' }}</h3>
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getApiUrl } from '@/utils/apiUrl';

const protocol = ref(window.location.protocol);
const apiUrl = ref(import.meta.env.VITE_API_URL);
const baseUrl = ref(import.meta.env.VITE_BASE_URL);
const computedApiUrl = ref(getApiUrl('/'));
const loading = ref(false);
const result = ref<any>(null);

const testConnection = async () => {
  loading.value = true;
  result.value = null;
  
  try {
    const url = getApiUrl('/products?page=1&limit=1');
    console.log('🔍 Testing connection to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    result.value = {
      success: true,
      status: response.status,
      url: url,
      data: data,
    };
  } catch (error: any) {
    console.error('❌ Connection error:', error);
    result.value = {
      success: false,
      error: error.message,
      stack: error.stack,
      url: getApiUrl('/products?page=1&limit=1'),
    };
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.debug-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.info-section,
.test-section {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

h2 {
  color: #666;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

p {
  margin: 0.5rem 0;
  font-family: monospace;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
}

.result.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.result.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}
</style>
