<template>
  <div class="image-upload">
    <div class="upload-header">
      <label>{{ label }}</label>
      <span class="image-count">{{ images.length }}/{{ maxImages }}</span>
    </div>

    <div class="images-preview" v-if="images.length > 0">
      <div v-for="(image, index) in images" :key="index" class="image-item">
        <img :src="image.preview" :alt="`Image ${index + 1}`" />
        <button 
          type="button"
          @click="removeImage(index)" 
          class="remove-btn"
          title="Supprimer"
        >
          <i class="material-icons">close</i>
        </button>
      </div>
    </div>

    <div v-if="images.length < maxImages" class="upload-zone">
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        @change="handleFileSelect"
        class="file-input"
      />
      <button 
        type="button"
        @click="triggerFileInput" 
        class="upload-btn"
      >
        <i class="material-icons">add_photo_alternate</i>
        <span>Ajouter des images</span>
      </button>
      <p class="upload-info">
        {{ maxImages - images.length }} image(s) restante(s) • Max {{ maxFileSize }}MB par image
      </p>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface ImageFile {
  file: File;
  preview: string;
}

interface Props {
  modelValue?: string[];
  maxImages?: number;
  maxFileSize?: number; // en MB
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxImages: 3,
  maxFileSize: 5,
  label: 'Images (optionnel)'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const images = ref<ImageFile[]>([]);
const error = ref('');

// Initialiser avec les images existantes si présentes
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0 && images.value.length === 0) {
    images.value = newVal.map(url => ({
      file: null as any,
      preview: url
    }));
  }
}, { immediate: true });

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  
  error.value = '';

  // Vérifier le nombre total d'images
  const remainingSlots = props.maxImages - images.value.length;
  if (files.length > remainingSlots) {
    error.value = `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`;
    return;
  }

  // Valider et traiter chaque fichier
  for (const file of files) {
    // Vérifier le type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      error.value = 'Format non supporté. Utilisez JPG, PNG ou WebP';
      continue;
    }

    // Vérifier la taille
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > props.maxFileSize) {
      error.value = `L'image ${file.name} dépasse ${props.maxFileSize}MB`;
      continue;
    }

    // Créer la preview
    const preview = await createPreview(file);
    images.value.push({ file, preview });
  }

  // Émettre les URLs (pour l'instant les previews, à remplacer par les URLs après upload)
  emitImages();

  // Reset input
  if (target) target.value = '';
};

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
  emitImages();
  error.value = '';
};

const emitImages = () => {
  // Pour l'instant on émet les previews base64
  // Dans une vraie implémentation, il faudrait uploader les images et émettre les URLs
  const urls = images.value.map(img => img.preview);
  emit('update:modelValue', urls);
};

// Exposer une méthode pour obtenir les fichiers
defineExpose({
  getFiles: () => images.value.map(img => img.file).filter(Boolean)
});
</script>

<style scoped>
.image-upload {
  margin-bottom: 1.5rem;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.upload-header label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.image-count {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.remove-btn i {
  font-size: 18px;
}

.upload-zone {
  text-align: center;
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  background: #f9fafb;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-btn i {
  font-size: 1.25rem;
}

.upload-info {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.error-message {
  margin-top: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 640px) {
  .images-preview {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .upload-zone {
    padding: 1.5rem 1rem;
  }
}
</style>
