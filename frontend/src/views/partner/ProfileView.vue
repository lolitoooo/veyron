<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartnerStore } from '@/stores/partner';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';
import { getImageUrl } from '@/utils/imageUrl';

const store = usePartnerStore();
const authStore = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const uploadingLogo = ref(false);
const uploadingBanner = ref(false);

const changingPwd = ref(false);
const pwdError = ref('');
const pwdSuccess = ref('');
const pwdForm = ref({ current: '', newPwd: '', confirm: '' });

const form = ref({
  shopName: '',
  description: '',
  logo: '',
  phone: '',
  email: '',
  address: { street: '', city: '', postalCode: '', country: 'France' },
  socialLinks: { instagram: '', facebook: '', website: '' },
  design: { primaryColor: '#111111', secondaryColor: '#ece6d4', backgroundColor: '#ffffff', bannerImage: '' }
});

onMounted(async () => {
  await store.fetchMyPartner();
  if (store.myPartner) {
    const p = JSON.parse(JSON.stringify(store.myPartner));
    form.value = {
      shopName: p.shopName || '',
      description: p.description || '',
      logo: p.logo || '',
      phone: p.phone || '',
      email: p.email || authStore.user?.email || '',
      address: {
        street: p.address?.street || '',
        city: p.address?.city || '',
        postalCode: p.address?.postalCode || '',
        country: p.address?.country || 'France'
      },
      socialLinks: {
        instagram: p.socialLinks?.instagram || '',
        facebook: p.socialLinks?.facebook || '',
        website: p.socialLinks?.website || ''
      },
      design: {
        primaryColor: p.design?.primaryColor || '#111111',
        secondaryColor: p.design?.secondaryColor || '#ece6d4',
        backgroundColor: p.design?.backgroundColor || '#ffffff',
        bannerImage: p.design?.bannerImage || ''
      }
    };
  }
  loading.value = false;
});

async function uploadImage(event: Event, target: 'logo' | 'banner') {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const fd = new FormData();
  fd.append('image', input.files[0]);

  if (target === 'logo') uploadingLogo.value = true;
  else uploadingBanner.value = true;

  try {
    const res = await api.post('/upload/single', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success) {
      if (target === 'logo') form.value.logo = res.data.data.url;
      else form.value.design.bannerImage = res.data.data.url;
    }
  } catch (err) {
    console.error('Erreur upload:', err);
  } finally {
    if (target === 'logo') uploadingLogo.value = false;
    else uploadingBanner.value = false;
  }
}

async function save() {
  saving.value = true;
  saved.value = false;
  const success = await store.updateMyPartner(form.value);
  saving.value = false;
  if (success) saved.value = true;
}

async function changePassword() {
  pwdError.value = '';
  pwdSuccess.value = '';

  if (pwdForm.value.newPwd.length < 6) {
    pwdError.value = 'Le mot de passe doit faire au moins 6 caractères';
    return;
  }
  if (pwdForm.value.newPwd !== pwdForm.value.confirm) {
    pwdError.value = 'Les mots de passe ne correspondent pas';
    return;
  }

  changingPwd.value = true;
  try {
    await api.put('/user/change-password', {
      currentPassword: pwdForm.value.current,
      newPassword: pwdForm.value.newPwd
    });
    pwdSuccess.value = 'Mot de passe modifié avec succès';
    pwdForm.value = { current: '', newPwd: '', confirm: '' };
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    pwdError.value = e.response?.data?.message || 'Erreur lors du changement de mot de passe';
  } finally {
    changingPwd.value = false;
  }
}
</script>

<template>
  <div class="partner-profile">
    <h1>Ma Boutique</h1>

    <div v-if="loading" class="loading">Chargement...</div>

    <form v-else @submit.prevent="save" class="profile-form">
      <div class="form-group">
        <label>Nom de la boutique</label>
        <input v-model="form.shopName" type="text" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="form.description" rows="4"></textarea>
      </div>

      <h2>Logo & Bannière</h2>

      <div class="form-group">
        <label>Logo (affiché dans la page Collection)</label>
        <div class="upload-zone">
          <img v-if="form.logo" :src="getImageUrl(form.logo)" alt="Logo" class="preview-img preview-logo" />
          <div class="upload-btn-wrap">
            <label class="upload-btn" :class="{ disabled: uploadingLogo }">
              {{ uploadingLogo ? 'Upload...' : form.logo ? 'Changer le logo' : 'Choisir un logo' }}
              <input type="file" accept="image/*" hidden @change="uploadImage($event, 'logo')" :disabled="uploadingLogo" />
            </label>
            <button v-if="form.logo" type="button" class="btn-remove" @click="form.logo = ''">Supprimer</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Bannière (affichée sur la page boutique)</label>
        <div class="upload-zone">
          <img v-if="form.design.bannerImage" :src="getImageUrl(form.design.bannerImage)" alt="Bannière" class="preview-img preview-banner" />
          <div class="upload-btn-wrap">
            <label class="upload-btn" :class="{ disabled: uploadingBanner }">
              {{ uploadingBanner ? 'Upload...' : form.design.bannerImage ? 'Changer la bannière' : 'Choisir une bannière' }}
              <input type="file" accept="image/*" hidden @change="uploadImage($event, 'banner')" :disabled="uploadingBanner" />
            </label>
            <button v-if="form.design.bannerImage" type="button" class="btn-remove" @click="form.design.bannerImage = ''">Supprimer</button>
          </div>
        </div>
      </div>

      <h2>Contact</h2>
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input v-model="form.phone" type="text" />
        </div>
      </div>

      <h2>Adresse</h2>
      <div class="form-group"><label>Rue</label><input v-model="form.address.street" type="text" /></div>
      <div class="form-row">
        <div class="form-group"><label>Code postal</label><input v-model="form.address.postalCode" type="text" /></div>
        <div class="form-group"><label>Ville</label><input v-model="form.address.city" type="text" /></div>
        <div class="form-group"><label>Pays</label><input v-model="form.address.country" type="text" /></div>
      </div>

      <h2>Réseaux sociaux</h2>
      <div class="form-group"><label>Instagram</label><input v-model="form.socialLinks.instagram" type="text" placeholder="https://instagram.com/..." /></div>
      <div class="form-group"><label>Facebook</label><input v-model="form.socialLinks.facebook" type="text" placeholder="https://facebook.com/..." /></div>
      <div class="form-group"><label>Site web</label><input v-model="form.socialLinks.website" type="text" placeholder="https://..." /></div>

      <h2>Design</h2>
      <div class="form-row">
        <div class="form-group">
          <label>Couleur principale</label>
          <input v-model="form.design.primaryColor" type="color" />
        </div>
        <div class="form-group">
          <label>Couleur secondaire</label>
          <input v-model="form.design.secondaryColor" type="color" />
        </div>
        <div class="form-group">
          <label>Couleur de fond</label>
          <input v-model="form.design.backgroundColor" type="color" />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn-save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </button>
        <span v-if="saved" class="success-msg">Modifications enregistrées</span>
      </div>
    </form>

    <div class="password-section">
      <h2>Changer mon mot de passe</h2>
      <form @submit.prevent="changePassword" class="pwd-form">
        <div class="form-group">
          <label>Mot de passe actuel</label>
          <input v-model="pwdForm.current" type="password" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input v-model="pwdForm.newPwd" type="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label>Confirmer</label>
            <input v-model="pwdForm.confirm" type="password" required minlength="6" />
          </div>
        </div>
        <div v-if="pwdError" class="pwd-error">{{ pwdError }}</div>
        <div v-if="pwdSuccess" class="pwd-success">{{ pwdSuccess }}</div>
        <button type="submit" :disabled="changingPwd" class="btn-pwd">
          {{ changingPwd ? 'Modification...' : 'Modifier le mot de passe' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.partner-profile { max-width: 800px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
h2 { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; letter-spacing: 0.04em; margin: 2rem 0 1rem; padding-top: 1rem; border-top: 1px solid rgba(17,17,17,0.08); }
.loading { text-align: center; padding: 3rem; color: #888; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.75rem; letter-spacing: 0.08em; color: #888; text-transform: uppercase; margin-bottom: 0.3rem; }
.form-group input, .form-group textarea { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; font-size: 0.88rem; font-family: inherit; transition: border-color 0.2s; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #111; }
.form-group input[type="color"] { width: 50px; height: 35px; padding: 2px; cursor: pointer; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }

.form-actions { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
.btn-save { padding: 0.7rem 2rem; background: #111; color: #fff; border: none; font-size: 0.82rem; letter-spacing: 0.08em; cursor: pointer; transition: opacity 0.2s; }
.btn-save:disabled { opacity: 0.5; }
.btn-save:hover:not(:disabled) { opacity: 0.85; }
.success-msg { font-size: 0.82rem; color: #27ae60; }

.upload-zone { display: flex; align-items: flex-start; gap: 1.2rem; padding: 1rem; border: 1px dashed #ddd; background: #fafafa; }
.preview-img { object-fit: contain; border: 1px solid #eee; background: #fff; }
.preview-logo { width: 80px; height: 80px; }
.preview-banner { width: 200px; height: 80px; }
.upload-btn-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
.upload-btn { padding: 0.5rem 1.2rem; background: #111; color: #fff; font-size: 0.78rem; letter-spacing: 0.06em; cursor: pointer; text-align: center; transition: opacity 0.2s; }
.upload-btn:hover { opacity: 0.85; }
.upload-btn.disabled { opacity: 0.5; pointer-events: none; }
.btn-remove { padding: 0.3rem 0.8rem; font-size: 0.75rem; border: 1px solid #e74c3c; background: #fff; color: #e74c3c; cursor: pointer; }
.btn-remove:hover { background: #e74c3c; color: #fff; }

.password-section { margin-top: 1rem; }
.pwd-form { max-width: 500px; }
.btn-pwd { padding: 0.6rem 1.5rem; border: 1px solid #111; background: #fff; color: #111; font-size: 0.82rem; letter-spacing: 0.04em; cursor: pointer; margin-top: 0.5rem; transition: all 0.2s; }
.btn-pwd:hover { background: #111; color: #fff; }
.btn-pwd:disabled { opacity: 0.5; }
.pwd-error { font-size: 0.82rem; color: #e74c3c; margin-bottom: 0.5rem; }
.pwd-success { font-size: 0.82rem; color: #27ae60; margin-bottom: 0.5rem; }
</style>
