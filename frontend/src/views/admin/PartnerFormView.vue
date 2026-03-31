<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePartnerStore } from '@/stores/partner';
import api from '@/services/apiService';
import { getImageUrl } from '@/utils/imageUrl';

const route = useRoute();
const router = useRouter();
const store = usePartnerStore();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const uploadingLogo = ref(false);
const uploadingBanner = ref(false);
const resettingPassword = ref(false);
const generatedPassword = ref('');

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  shopName: '',
  logo: '',
  commission: 20,
  phone: '',
  description: '',
  address: { street: '', city: '', postalCode: '', country: 'France' },
  design: { primaryColor: '#111111', secondaryColor: '#ece6d4', backgroundColor: '#ffffff', bannerImage: '' },
  socialLinks: { instagram: '', facebook: '', website: '' },
  bankInfo: { iban: '', bic: '', bankName: '', accountHolder: '' },
  isActive: true
});

onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await api.get(`/partners/admin/${route.params.id}`);
      const p = res.data.partner;
      if (p) {
        form.value = {
          firstName: p.user?.firstName || '',
          lastName: p.user?.lastName || '',
          email: p.user?.email || p.email || '',
          shopName: p.shopName || '',
          logo: p.logo || '',
          commission: p.commission ?? 20,
          phone: p.phone || '',
          description: p.description || '',
          address: {
            street: p.address?.street || '',
            city: p.address?.city || '',
            postalCode: p.address?.postalCode || '',
            country: p.address?.country || 'France'
          },
          design: {
            primaryColor: p.design?.primaryColor || '#111111',
            secondaryColor: p.design?.secondaryColor || '#ece6d4',
            backgroundColor: p.design?.backgroundColor || '#ffffff',
            bannerImage: p.design?.bannerImage || ''
          },
          socialLinks: {
            instagram: p.socialLinks?.instagram || '',
            facebook: p.socialLinks?.facebook || '',
            website: p.socialLinks?.website || ''
          },
          bankInfo: {
            iban: p.bankInfo?.iban || '',
            bic: p.bankInfo?.bic || '',
            bankName: p.bankInfo?.bankName || '',
            accountHolder: p.bankInfo?.accountHolder || ''
          },
          isActive: p.isActive !== false
        };
      }
    } catch (err) {
      console.error('Erreur chargement partenaire:', err);
    }
  }
});

async function uploadImage(event: Event, target: 'logo' | 'banner') {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  if (target === 'logo') uploadingLogo.value = true;
  else uploadingBanner.value = true;

  try {
    const res = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success) {
      if (target === 'logo') {
        form.value.logo = res.data.data.url;
      } else {
        form.value.design.bannerImage = res.data.data.url;
      }
    }
  } catch (err) {
    console.error('Erreur upload:', err);
  } finally {
    if (target === 'logo') uploadingLogo.value = false;
    else uploadingBanner.value = false;
  }
}

function copyPassword() {
  if (generatedPassword.value) {
    window.navigator.clipboard.writeText(generatedPassword.value);
  }
}

async function resetPassword() {
  if (!confirm('Régénérer un mot de passe temporaire pour ce partenaire ?')) return;
  resettingPassword.value = true;
  generatedPassword.value = '';
  try {
    const res = await api.post(`/partners/admin/${route.params.id}/reset-password`);
    if (res.data.success) {
      generatedPassword.value = res.data.temporaryPassword;
    }
  } catch (err) {
    console.error('Erreur reset password:', err);
  } finally {
    resettingPassword.value = false;
  }
}

async function submit() {
  saving.value = true;
  if (isEdit.value) {
    const result = await store.adminUpdatePartner(route.params.id as string, form.value);
    if (result) router.push({ name: 'admin-partners' });
  } else {
    const result = await store.adminCreatePartner(form.value);
    if (result) router.push({ name: 'admin-partners' });
  }
  saving.value = false;
}
</script>

<template>
  <div class="partner-form-page">
    <h1>{{ isEdit ? 'Modifier le partenaire' : 'Nouveau partenaire' }}</h1>

    <form @submit.prevent="submit" class="form">
      <h2>Compte utilisateur</h2>
      <template v-if="!isEdit">
        <div class="form-row">
          <div class="form-group"><label>Prénom</label><input v-model="form.firstName" required /></div>
          <div class="form-group"><label>Nom</label><input v-model="form.lastName" required /></div>
        </div>
        <div class="form-group"><label>Email</label><input v-model="form.email" type="email" required /></div>
      </template>
      <template v-else>
        <div class="form-group">
          <label>Email de connexion</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="password-section">
          <button type="button" class="btn-reset-pwd" :disabled="resettingPassword" @click="resetPassword">
            {{ resettingPassword ? 'Génération...' : 'Régénérer un mot de passe temporaire' }}
          </button>
          <div v-if="generatedPassword" class="generated-password">
            <span class="pwd-label">Nouveau mot de passe :</span>
            <code class="pwd-value">{{ generatedPassword }}</code>
            <button type="button" class="btn-copy" @click="copyPassword">Copier</button>
          </div>
        </div>
      </template>

      <h2>Boutique</h2>
      <div class="form-group"><label>Nom de la boutique</label><input v-model="form.shopName" required /></div>
      <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="3"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Commission (%)</label><input v-model.number="form.commission" type="number" min="0" max="100" /></div>
        <div class="form-group"><label>Téléphone</label><input v-model="form.phone" maxlength="10" type="tel" /></div>
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

      <h2>Design</h2>
      <div class="form-row">
        <div class="form-group"><label>Couleur principale</label><input v-model="form.design.primaryColor" type="color" /></div>
        <div class="form-group"><label>Couleur secondaire</label><input v-model="form.design.secondaryColor" type="color" /></div>
        <div class="form-group"><label>Fond</label><input v-model="form.design.backgroundColor" type="color" value="#f8f8f8" /></div>
      </div>

      <h2>Adresse</h2>
      <div class="form-group"><label>Rue</label><input v-model="form.address.street" /></div>
      <div class="form-row">
        <div class="form-group"><label>Code postal</label><input v-model="form.address.postalCode" /></div>
        <div class="form-group"><label>Ville</label><input v-model="form.address.city" /></div>
        <div class="form-group"><label>Pays</label><input v-model="form.address.country" /></div>
      </div>

      <h2>Réseaux sociaux</h2>
      <div class="form-group"><label>Instagram</label><input v-model="form.socialLinks.instagram" /></div>
      <div class="form-group"><label>Facebook</label><input v-model="form.socialLinks.facebook" /></div>
      <div class="form-group"><label>Site web</label><input v-model="form.socialLinks.website" /></div>

      <template v-if="isEdit">
        <h2>Informations bancaires</h2>
        <div class="form-row">
          <div class="form-group"><label>IBAN</label><input v-model="form.bankInfo.iban" /></div>
          <div class="form-group"><label>BIC</label><input v-model="form.bankInfo.bic" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Nom de la banque</label><input v-model="form.bankInfo.bankName" /></div>
          <div class="form-group"><label>Titulaire</label><input v-model="form.bankInfo.accountHolder" /></div>
        </div>
      </template>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn-save">
          {{ saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer le partenaire' }}
        </button>
        <router-link to="/admin/partners" class="btn-cancel">Annuler</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.partner-form-page { max-width: 800px; margin: 0 auto; padding: 2rem 2rem 5rem; }
h1 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 300; letter-spacing: 0.06em; color: #111; margin-bottom: 1.5rem; }
h2 { font-family: var(--font-heading); font-size: 1.05rem; font-weight: 400; letter-spacing: 0.04em; margin: 2rem 0 1rem; padding-top: 1rem; border-top: 1px solid rgba(17,17,17,0.08); }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.75rem; letter-spacing: 0.08em; color: #888; text-transform: uppercase; margin-bottom: 0.3rem; }
.form-group input, .form-group textarea { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; font-size: 0.88rem; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #111; }
.form-group input[type="color"] { width: 50px; height: 35px; padding: 2px; cursor: pointer; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
.form-actions { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
.btn-save { padding: 0.7rem 2rem; background: #111; color: #fff; border: none; font-size: 0.82rem; letter-spacing: 0.08em; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; }
.btn-cancel { font-size: 0.82rem; color: #888; text-decoration: underline; }

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

.password-section { margin-bottom: 1.5rem; }
.btn-reset-pwd { padding: 0.55rem 1.4rem; border: 1px solid #111; background: #fff; color: #111; font-size: 0.82rem; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; }
.btn-reset-pwd:hover { background: #111; color: #fff; }
.btn-reset-pwd:disabled { opacity: 0.5; cursor: default; }
.generated-password { margin-top: 0.8rem; padding: 1rem 1.2rem; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
.pwd-label { font-size: 0.8rem; color: #666; }
.pwd-value { font-size: 1.05rem; font-weight: 600; color: #111; background: #fff; padding: 0.3rem 0.8rem; border: 1px solid #ddd; letter-spacing: 0.05em; user-select: all; }
.btn-copy { padding: 0.3rem 0.8rem; font-size: 0.75rem; border: 1px solid #111; background: #fff; color: #111; cursor: pointer; }
.btn-copy:hover { background: #111; color: #fff; }
</style>
