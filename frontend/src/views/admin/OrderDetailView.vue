<template>
  <div class="order-detail-container">
    <div class="admin-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          ← Retour aux commandes
        </button>
        <h1>Détails de la commande #{{ orderId.substring(0, 8) }}...</h1>
      </div>
      <div class="header-actions" v-if="order">
        <span :class="['status-badge', `status-${order.status}`]">
          {{ getStatusLabel(order.status) }}
        </span>
        <button class="btn btn-primary" @click="showUpdateStatusModal = true">
          Modifier le statut
        </button>
        <button 
          v-if="!order.invoiceNumber" 
          class="btn btn-secondary" 
          @click="generateInvoice(order._id)"
        >
          Générer une facture
        </button>
        <button 
          v-else 
          class="btn btn-secondary" 
          @click="downloadInvoice(order._id)"
        >
          Télécharger la facture
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="!order" class="not-found">
      <h2>Commande non trouvée</h2>
      <p>La commande demandée n'existe pas ou a été supprimée.</p>
      <button class="btn btn-primary" @click="goBack">Retour aux commandes</button>
    </div>
    
    <div v-else class="order-content">
      <div class="order-info-grid">
        <div class="info-card">
          <h3>Informations client</h3>
          <div class="info-content">
            <p><strong>Nom:</strong> {{ order.user?.firstName }} {{ order.user?.lastName }}</p>
            <p><strong>Email:</strong> {{ order.user?.email }}</p>
            <p v-if="order.user?.phone"><strong>Téléphone:</strong> {{ order.user?.phone }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Adresse de livraison</h3>
          <div class="info-content">
            <div v-if="order.shippingMethod === 'relay_point' && order.relayPoint">
              <p><strong>Point Relais - {{ order.relayPoint.carrier }}</strong></p>
              <p><strong>{{ order.relayPoint.name }}</strong></p>
              <p>{{ order.relayPoint.address }}</p>
              <p>{{ order.relayPoint.postalCode }} {{ order.relayPoint.city }}</p>
            </div>
            <div v-else>
              <p><strong>{{ order.shippingAddress?.firstName }} {{ order.shippingAddress?.lastName }}</strong></p>
              <p>{{ order.shippingAddress?.addressLine1 }}</p>
              <p v-if="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}</p>
              <p>{{ order.shippingAddress?.postalCode }} {{ order.shippingAddress?.city }}</p>
              <p>{{ order.shippingAddress?.country }}</p>
              <p v-if="order.shippingAddress?.phone">{{ order.shippingAddress?.phone }}</p>
            </div>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Adresse de facturation</h3>
          <div class="info-content">
            <p><strong>{{ order.billingAddress?.firstName }} {{ order.billingAddress?.lastName }}</strong></p>
            <p>{{ order.billingAddress?.addressLine1 }}</p>
            <p v-if="order.billingAddress?.addressLine2">{{ order.billingAddress?.addressLine2 }}</p>
            <p>{{ order.billingAddress?.postalCode }} {{ order.billingAddress?.city }}</p>
            <p>{{ order.billingAddress?.country }}</p>
            <p v-if="order.billingAddress?.phone">{{ order.billingAddress?.phone }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Paiement</h3>
          <div class="info-content">
            <p><strong>Méthode:</strong> {{ order.paymentMethod === 'card' ? 'Carte bancaire' : order.paymentMethod }}</p>
            <p v-if="order.paymentDetails?.last4"><strong>Carte:</strong> **** **** **** {{ order.paymentDetails?.last4 }}</p>
            <p v-if="order.paymentDetails?.transactionId"><strong>Transaction ID:</strong> {{ order.paymentDetails?.transactionId }}</p>
            <p><strong>Date:</strong> {{ formatDate(order.createdAt) }}</p>
            <p v-if="order.paidAt"><strong>Date de paiement:</strong> {{ formatDate(order.paidAt) }}</p>
            <p v-if="order.invoiceNumber"><strong>N° Facture:</strong> {{ order.invoiceNumber }}</p>
          </div>
        </div>
        
        <div class="info-card" v-if="order.promoCode && order.promoCode.code">
          <h3>Code promo appliqué</h3>
          <div class="info-content promo-code-info">
            <div class="promo-code-badge">
              {{ order.promoCode.code }}
            </div>
            <p><strong>{{ order.promoCode.title || 'Code promo' }}</strong></p>
            <p v-if="order.promoCode.discountType === 'percentage'">
              Réduction de {{ order.promoCode.discountValue }}%
            </p>
            <p v-else>
              Réduction de {{ formatPrice(order.promoCode.discountValue) }}
            </p>
            <p v-if="order.discountAmount">
              <strong>Montant économisé:</strong> {{ formatPrice(order.discountAmount) }}
            </p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Résumé</h3>
          <div class="info-content summary">
            <div class="summary-row">
              <span>Sous-total HT:</span>
              <span>{{ formatPrice(order.subtotalHT || order.itemsPrice) }}</span>
            </div>
            <div class="summary-row">
              <span>TVA (20%):</span>
              <span>{{ formatPrice(order.taxPrice) }}</span>
            </div>
            <div class="summary-row">
              <span>Sous-total TTC:</span>
              <span>{{ formatPrice(order.subtotalTTC || (order.itemsPrice + order.taxPrice)) }}</span>
            </div>
            <div v-if="order.promoCode && order.discountAmount > 0" class="summary-row discount">
              <span>Réduction ({{ order.promoCode.code }}):</span>
              <span>-{{ formatPrice(order.discountAmount) }}</span>
            </div>
            <div class="summary-row">
              <span>Frais de livraison:</span>
              <span>{{ formatPrice(order.shippingPrice) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total TTC:</span>
              <span>{{ formatPrice(order.totalPrice) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="shipping-section" v-if="order.isPaid">
        <h3>Gestion de la livraison</h3>
        <div class="shipping-cards">
          <div class="shipping-card">
            <h4>Étiquette d'envoi</h4>
            <div v-if="order.shippingLabelUrl">
              <p class="success-text">✓ Étiquette générée le {{ formatDate(order.shippingLabelGeneratedAt) }}</p>
              <p><strong>N° de suivi:</strong> {{ order.trackingNumber }}</p>
              <p><strong>Transporteur:</strong> {{ order.carrier }}</p>
              <button class="btn btn-secondary" @click="downloadLabel(order.shippingLabelUrl)">
                Télécharger l'étiquette
              </button>
            </div>
            <div v-else>
              <p>Aucune étiquette générée</p>
              <button 
                class="btn btn-primary" 
                @click="generateShippingLabel"
                :disabled="generatingLabel"
              >
                {{ generatingLabel ? 'Génération...' : 'Générer l\'étiquette d\'envoi' }}
              </button>
            </div>
          </div>

          <div class="shipping-card" v-if="order.returnStatus !== 'none'">
            <h4>Retour produit</h4>
            <p><strong>Statut:</strong> <span :class="['status-badge', `status-${order.returnStatus}`]">{{ getReturnStatusLabel(order.returnStatus) }}</span></p>
            <p v-if="order.returnReason"><strong>Raison:</strong> {{ order.returnReason }}</p>
            <p v-if="order.returnRequestedAt"><strong>Demandé le:</strong> {{ formatDate(order.returnRequestedAt) }}</p>
            
            <div v-if="order.returnLabelUrl">
              <p class="success-text">✓ Étiquette retour générée le {{ formatDate(order.returnLabelGeneratedAt) }}</p>
              <p v-if="order.returnTrackingNumber"><strong>N° de suivi retour:</strong> {{ order.returnTrackingNumber }}</p>
              <button class="btn btn-secondary" @click="downloadLabel(order.returnLabelUrl)">
                Télécharger l'étiquette retour
              </button>
            </div>
            <div v-else-if="order.returnStatus === 'requested'">
              <button 
                class="btn btn-primary" 
                @click="showReturnLabelModal = true"
                :disabled="generatingReturnLabel"
              >
                {{ generatingReturnLabel ? 'Génération...' : 'Générer l\'étiquette de retour' }}
              </button>
            </div>

            <div class="return-status-update" style="margin-top: 1rem;">
              <label>Mettre à jour le statut du retour:</label>
              <select v-model="newReturnStatus" class="form-select">
                <option value="requested">Demandé</option>
                <option value="label_generated">Étiquette générée</option>
                <option value="in_transit">En transit</option>
                <option value="received">Reçu</option>
                <option value="completed">Terminé</option>
              </select>
              <button class="btn btn-secondary" @click="updateReturnStatus" style="margin-top: 0.5rem;">
                Mettre à jour
              </button>
            </div>
          </div>

          <div class="shipping-card" v-if="order.isPaid && order.refundStatus !== 'full'">
            <h4>Remboursement</h4>
            <div v-if="order.refundStatus !== 'none'">
              <p><strong>Statut:</strong> <span :class="['status-badge', `status-${order.refundStatus}`]">{{ getRefundStatusLabel(order.refundStatus) }}</span></p>
              <p v-if="order.refundAmount"><strong>Montant remboursé:</strong> {{ formatPrice(order.refundAmount) }}</p>
              <p v-if="order.refundedAt"><strong>Date:</strong> {{ formatDate(order.refundedAt) }}</p>
              <p v-if="order.refundReason"><strong>Raison:</strong> {{ order.refundReason }}</p>
            </div>
            <div v-else>
              <p>Aucun remboursement effectué</p>
              <button class="btn btn-warning" @click="showRefundModal = true">
                Effectuer un remboursement
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="order-items">
        <h3>Articles commandés</h3>
        <div class="items-table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.orderItems" :key="item._id">
                <td>
                  <div class="product-cell">
                    <div class="product-image">
                      <img :src="item.image" :alt="item.name" />
                    </div>
                    <div class="product-info">
                      <div class="product-name">{{ item.name }}</div>
                      <div class="product-id" v-if="item.variant">
                        <span v-if="item.variant.size">Taille: {{ item.variant.size }}</span>
                        <span v-if="item.variant.color">, Couleur: {{ item.variant.color }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ formatPrice(item.price) }}</td>
                <td>{{ item.qty }}</td>
                <td>{{ formatPrice(item.price * item.qty) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="showUpdateStatusModal" class="modal">
    <div class="modal-content">
      <h3>Modifier le statut de la commande</h3>
      
      <p v-if="order">
        Commande <strong>#{{ order._id.substring(0, 8) }}...</strong> - Client: {{ order.user?.firstName }} {{ order.user?.lastName }}
      </p>
      
      <div class="form-group">
        <label for="orderStatus">Statut de la commande</label>
        <select id="orderStatus" v-model="newStatus" class="form-select">
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>
      
      <div class="form-group">
        <p><strong>Statut actuel :</strong> <span :class="['status-badge', `status-${order?.status}`]">{{ getStatusLabel(order?.status || '') }}</span></p>
        <p><strong>Date de commande :</strong> {{ order ? formatDate(order.createdAt) : '' }}</p>
        <p><strong>Total :</strong> {{ order ? formatPrice(order.totalPrice) : '' }}</p>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="showUpdateStatusModal = false">Annuler</button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="updateOrderStatus"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  </div>

  <div v-if="showReturnLabelModal" class="modal">
    <div class="modal-content">
      <h3>Générer une étiquette de retour</h3>
      
      <div class="form-group">
        <label for="returnReason">Raison du retour (optionnel)</label>
        <textarea 
          id="returnReason" 
          v-model="returnReason" 
          class="form-control"
          rows="3"
          placeholder="Ex: Produit défectueux, taille incorrecte..."
        ></textarea>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="showReturnLabelModal = false">Annuler</button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="generateReturnLabel"
          :disabled="generatingReturnLabel"
        >
          {{ generatingReturnLabel ? 'Génération...' : 'Générer l\'étiquette' }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="showRefundModal" class="modal">
    <div class="modal-content">
      <h3>Effectuer un remboursement</h3>
      
      <p v-if="order">
        Commande <strong>#{{ order._id.substring(0, 8) }}...</strong><br>
        Montant total: <strong>{{ formatPrice(order.totalPrice) }}</strong>
      </p>
      
      <div class="form-group">
        <label for="refundAmount">Montant du remboursement (€)</label>
        <input 
          type="number" 
          id="refundAmount" 
          v-model.number="refundAmount" 
          class="form-control"
          :max="order?.totalPrice"
          step="0.01"
          placeholder="Montant à rembourser"
        />
        <small>Laisser vide pour un remboursement total</small>
      </div>
      
      <div class="form-group">
        <label for="refundReason">Raison du remboursement</label>
        <textarea 
          id="refundReason" 
          v-model="refundReasonInput" 
          class="form-control"
          rows="3"
          placeholder="Ex: Retour produit, annulation..."
          required
        ></textarea>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="showRefundModal = false">Annuler</button>
        <button 
          type="button" 
          class="btn btn-warning" 
          @click="processRefund"
          :disabled="processingRefund || !refundReasonInput"
        >
          {{ processingRefund ? 'Traitement...' : 'Confirmer le remboursement' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminOrderStore } from '@/stores/adminOrder';
import type { Order } from '@/types/order';

const router = useRouter();
const route = useRoute();
const adminOrderStore = useAdminOrderStore();
const orderId = computed(() => route.params.id as string);
const loading = computed(() => adminOrderStore.isLoading);
const error = computed(() => adminOrderStore.error);
const order = ref<Order | null>(null);
const showUpdateStatusModal = ref(false);
const newStatus = ref('');

async function fetchOrderDetails() {
  if (!orderId.value) return;
  
  try {
    const orderDetails = await adminOrderStore.fetchOrderDetails(orderId.value);
    if (orderDetails) {
      order.value = orderDetails;
    }
  } catch (err) {
    console.error('Erreur lors du chargement des détails de la commande:', err);
  }
};

onMounted(() => {
  fetchOrderDetails();
});

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };
  return statusLabels[status] || status;
};

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(price);
};

async function updateOrderStatus() {
  if (!order.value || !newStatus.value) return;
  
  try {
    const success = await adminOrderStore.updateOrderStatus(orderId.value, newStatus.value);
    
    if (success) {
      await fetchOrderDetails();
      showUpdateStatusModal.value = false;
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err);
  }
}

async function generateInvoice(orderId: string) {
  try {
    await adminOrderStore.generateInvoice(orderId);
    await fetchOrderDetails();
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
  }
}

async function downloadInvoice(orderId: string) {
  try {
    const invoiceData = await adminOrderStore.getInvoice(orderId);
    if (invoiceData && invoiceData.invoiceUrl) {
      window.open(invoiceData.invoiceUrl, '_blank');
    }
  } catch (err) {
    console.error('Erreur lors du téléchargement de la facture:', err);
  }
}

const goBack = () => {
  router.push({ name: 'admin-orders' });
};

// Gestion des étiquettes et retours
const generatingLabel = ref(false);
const generatingReturnLabel = ref(false);
const showReturnLabelModal = ref(false);
const showRefundModal = ref(false);
const returnReason = ref('');
const newReturnStatus = ref('');
const refundAmount = ref<number | null>(null);
const refundReasonInput = ref('');
const processingRefund = ref(false);

async function generateShippingLabel() {
  if (!order.value) return;
  
  generatingLabel.value = true;
  try {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/shipping-labels/generate/${order.value._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();

    if (data.success) {
      alert(`Étiquette générée avec succès!\nNuméro de suivi: ${data.trackingNumber}`);
      
      const blob = await fetch(`data:application/pdf;base64,${data.pdfBase64}`).then(r => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquette_${order.value._id}.pdf`;
      a.click();
      
      await fetchOrderDetails();
    } else {
      throw new Error(data.message || 'Erreur lors de la génération');
    }
  } catch (error: any) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error.message}`);
  } finally {
    generatingLabel.value = false;
  }
}

async function generateReturnLabel() {
  if (!order.value) return;
  
  generatingReturnLabel.value = true;
  try {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/shipping-labels/return/${order.value._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ returnReason: returnReason.value })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Étiquette de retour générée!\nNuméro de suivi: ${data.returnTrackingNumber}`);
      
      const blob = await fetch(`data:application/pdf;base64,${data.pdfBase64}`).then(r => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquette_retour_${order.value._id}.pdf`;
      a.click();
      
      showReturnLabelModal.value = false;
      returnReason.value = '';
      await fetchOrderDetails();
    } else {
      throw new Error(data.message || 'Erreur lors de la génération');
    }
  } catch (error: any) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error.message}`);
  } finally {
    generatingReturnLabel.value = false;
  }
}

async function updateReturnStatus() {
  if (!order.value || !newReturnStatus.value) return;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/shipping-labels/update-return-status/${order.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ returnStatus: newReturnStatus.value })
    });

    const data = await response.json();

    if (data.success) {
      alert('Statut de retour mis à jour avec succès');
      await fetchOrderDetails();
    } else {
      throw new Error(data.message || 'Erreur lors de la mise à jour');
    }
  } catch (error: any) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error.message}`);
  }
}

async function processRefund() {
  if (!order.value || !refundReasonInput.value) return;
  
  const confirmMsg = refundAmount.value 
    ? `Confirmer le remboursement de ${refundAmount.value}€ ?`
    : `Confirmer le remboursement total de ${order.value.totalPrice}€ ?`;
  
  if (!confirm(confirmMsg)) return;
  
  processingRefund.value = true;
  try {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/shipping-labels/refund/${order.value._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        amount: refundAmount.value || order.value.totalPrice,
        reason: refundReasonInput.value 
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Remboursement effectué avec succès!\nMontant: ${data.refund.amount}€`);
      showRefundModal.value = false;
      refundAmount.value = null;
      refundReasonInput.value = '';
      await fetchOrderDetails();
    } else {
      throw new Error(data.message || 'Erreur lors du remboursement');
    }
  } catch (error: any) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error.message}`);
  } finally {
    processingRefund.value = false;
  }
}

function downloadLabel(labelUrl: string) {
  window.open(labelUrl, '_blank');
}

function getReturnStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    none: 'Aucun',
    requested: 'Demandé',
    label_generated: 'Étiquette générée',
    in_transit: 'En transit',
    received: 'Reçu',
    completed: 'Terminé'
  };
  return labels[status] || status;
}

function getRefundStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    none: 'Aucun',
    pending: 'En attente',
    processing: 'En cours',
    partial: 'Partiel',
    full: 'Complet',
    failed: 'Échoué'
  };
  return labels[status] || status;
}
</script>

<style scoped>
.order-detail-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.btn-back:hover {
  text-decoration: underline;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
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
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.not-found {
  text-align: center;
  padding: 3rem;
  color: #757575;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-card h3 {
  background-color: #f5f5f5;
  margin: 0;
  padding: 1rem;
  font-size: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.info-content {
  padding: 1rem;
}

.info-content p {
  margin: 0.5rem 0;
}

.summary {
  padding: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.discount {
  color: #e53935;
}

.promo-code-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.promo-code-badge {
  background-color: #f5f5f5;
  color: #333;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px dashed #ccc;
  letter-spacing: 1px;
}

.promo-code-info p {
  margin: 0.25rem 0;
}

.summary-row.total {
  font-weight: bold;
  background-color: #f9f9f9;
}

.shipping-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.shipping-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.shipping-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.shipping-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.shipping-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.shipping-card p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.shipping-card .btn {
  margin-top: 1rem;
  width: 100%;
}

.success-text {
  color: #4caf50;
  font-weight: 500;
}

.return-status-update {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.return-status-update label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.order-items {
  margin-top: 2rem;
}

.order-items h3 {
  margin-bottom: 1rem;
}

.items-table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
}

.items-table th,
.items-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.items-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e0e0e0;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: 100%;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
}

.product-id {
  font-size: 0.8rem;
  color: #757575;
  margin-top: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fff8e1;
  color: #f57c00;
}

.status-processing {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-shipped {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-delivered {
  background-color: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #424242;
}

.btn-secondary:hover {
  background-color: #d5d5d5;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .order-detail-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 0 1rem;
  }
}
</style>
