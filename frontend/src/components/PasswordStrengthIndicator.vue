<template>
  <div class="password-strength-indicator">
    <div class="strength-bar-container">
      <div 
        class="strength-bar" 
        :style="{ width: strength.percentage + '%', backgroundColor: strength.color }"
      ></div>
    </div>
    
    <div v-if="strength.label" class="strength-info">
      <span class="strength-label" :style="{ color: strength.color }">
        {{ strength.label }}
      </span>
      
      <div v-if="strength.feedback.length > 0" class="strength-feedback">
        <ul>
          <li v-for="(item, index) in strength.feedback" :key="index">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PasswordStrength } from '@/composables/usePasswordStrength';

defineProps<{
  strength: PasswordStrength;
}>();
</script>

<style scoped>
.password-strength-indicator {
  margin-top: 0.5rem;
}

.strength-bar-container {
  width: 100%;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 3px;
}

.strength-info {
  margin-top: 0.5rem;
}

.strength-label {
  font-size: 0.85rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.strength-feedback {
  margin-top: 0.5rem;
}

.strength-feedback ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.8rem;
  color: #666;
}

.strength-feedback li {
  margin-bottom: 0.2rem;
}
</style>
