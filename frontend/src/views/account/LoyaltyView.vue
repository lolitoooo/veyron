<template>
  <div class="loyalty-view">
    <div class="container">
      <h1>Mon Programme de Fidélité</h1>
      <p class="subtitle">Gagnez du cashback et des XP sur vos achats</p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="material-icons">error</i>
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Réessayer</button>
    </div>

    <div v-else class="loyalty-content">
      <div class="stats-grid">
        <div class="stat-card cashback-card">
          <div class="stat-icon">
            <i class="material-icons">account_balance_wallet</i>
          </div>
          <div class="stat-content">
            <h3>Ma Cagnotte</h3>
            <p class="stat-value">{{ formatPrice(balance.cashbackBalance) }} €</p>
            <p class="stat-label">Disponible</p>
          </div>
        </div>

        <div class="stat-card xp-card">
          <div class="stat-icon">
            <i class="material-icons">stars</i>
          </div>
          <div class="stat-content">
            <h3>Mes XP</h3>
            <p class="stat-value">{{ balance.xpTotal }} XP</p>
            <p class="stat-label">Points d'expérience</p>
          </div>
        </div>

        <div class="stat-card rank-card">
          <div class="stat-icon rank-icon">
            <img :src="getBadgeImage(balance.rank)" :alt="`Badge ${balance.rank}`" class="badge-image" />
          </div>
          <div class="stat-content">
            <h3>Mon Rang</h3>
            <p class="stat-value">{{ balance.rank }}</p>
            <p class="stat-label">{{ getRankBonus() }}</p>
          </div>
        </div>
      </div>

      <div v-if="balance.expiring && balance.expiring.amount > 0" class="expiring-alert">
        <i class="material-icons">warning</i>
        <div>
          <strong>{{ formatPrice(balance.expiring.amount) }} € expirent bientôt</strong>
          <p>Expire le {{ formatDate(balance.expiring.expiresAt) }}</p>
        </div>
      </div>

      <div class="rank-progress">
        <h2>Progression vers le prochain rang</h2>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: getProgressPercent() + '%' }"></div>
        </div>
        <p class="progress-text">{{ balance.xpTotal }} / {{ getNextRankXp() }} XP</p>
        <div class="ranks-list">
          <div 
            v-for="rank in balance.config?.ranks || []" 
            :key="rank.name"
            class="rank-badge"
            :class="{ active: rank.name === balance.rank, achieved: balance.xpTotal >= rank.minXp }"
          >
            <img :src="getBadgeImage(rank.name)" :alt="`Badge ${rank.name}`" class="rank-badge-image" />
            <span class="rank-name">{{ rank.name }}</span>
            <span class="rank-xp">{{ rank.minXp }} XP</span>
          </div>
        </div>
      </div>

      <div class="how-it-works">
        <h2>Comment ça marche ?</h2>
        <div class="info-grid">
          <div class="info-card">
            <i class="material-icons">shopping_cart</i>
            <h3>Gagnez du cashback</h3>
            <p>{{ balance.config?.cashbackRatePercent || 1 }}% de vos achats reversés en cashback</p>
          </div>
          <div class="info-card">
            <i class="material-icons">schedule</i>
            <h3>Validité</h3>
            <p>Votre cashback expire après {{ balance.config?.cashbackExpiryDays || 365 }} jours</p>
          </div>
          <div class="info-card">
            <i class="material-icons">payment</i>
            <h3>Utilisez-le</h3>
            <p>Jusqu'à {{ balance.config?.cashbackMaxUsePercent || 30 }}% de votre panier</p>
          </div>
          <div class="info-card">
            <i class="material-icons">trending_up</i>
            <h3>Montez en rang</h3>
            <p>Plus de XP = plus de cashback</p>
          </div>
        </div>
      </div>

      <div class="history-section">
        <h2>Historique</h2>
        <div v-if="loadingHistory" class="loading-small">
          <div class="spinner-small"></div>
        </div>
        <div v-else-if="history.length === 0" class="empty-history">
          <i class="material-icons">history</i>
          <p>Aucun mouvement pour le moment</p>
        </div>
        <div v-else class="history-list">
          <div v-for="entry in history" :key="entry._id" class="history-item">
            <div class="history-icon" :class="getHistoryClass(entry.type)">
              <i class="material-icons">{{ getHistoryIcon(entry.type) }}</i>
            </div>
            <div class="history-content">
              <p class="history-description">{{ entry.description }}</p>
              <p class="history-date">{{ formatDate(entry.createdAt) }}</p>
            </div>
            <div class="history-amount" :class="getHistoryClass(entry.type)">
              <span v-if="entry.amount">{{ entry.type === 'CASHBACK_SPEND' ? '-' : '+' }}{{ formatPrice(entry.amount) }} €</span>
              <span v-if="entry.xpAmount">+{{ entry.xpAmount }} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/apiService';

const loading = ref(true);
const loadingHistory = ref(false);
const error = ref('');

const balance = ref<any>({
  cashbackBalance: 0,
  xpTotal: 0,
  rank: 'Bronze',
  badges: [],
  expiring: null,
  config: null
});

const history = ref<any[]>([]);

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get('/loyalty/balance');
    if (response.data && response.data.success) {
      balance.value = response.data.data;
    }
    await loadHistory();
  } catch (err: any) {
    console.error('Erreur chargement loyalty:', err);
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    const response = await api.get('/loyalty/history?limit=20');
    if (response.data && response.data.success) {
      history.value = response.data.data;
    }
  } catch (err) {
    console.error('Erreur chargement historique:', err);
  } finally {
    loadingHistory.value = false;
  }
};

const formatPrice = (price: number): string => {
  return price.toFixed(2).replace('.', ',');
};

const formatDate = (date: string | Date): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
};

const getRankBonus = (): string => {
  const ranks = balance.value.config?.ranks || [];
  const currentRank = ranks.find((r: any) => r.name === balance.value.rank);
  if (currentRank && currentRank.cashbackBonus > 0) {
    return `+${currentRank.cashbackBonus}% de bonus`;
  }
  return 'Rang de base';
};

const getNextRankXp = (): number => {
  const ranks = balance.value.config?.ranks || [];
  const sortedRanks = [...ranks].sort((a: any, b: any) => a.minXp - b.minXp);
  const currentIndex = sortedRanks.findIndex((r: any) => r.name === balance.value.rank);
  
  if (currentIndex < sortedRanks.length - 1) {
    return sortedRanks[currentIndex + 1].minXp;
  }
  return balance.value.xpTotal;
};

const getProgressPercent = (): number => {
  const nextXp = getNextRankXp();
  const ranks = balance.value.config?.ranks || [];
  const sortedRanks = [...ranks].sort((a: any, b: any) => a.minXp - b.minXp);
  const currentIndex = sortedRanks.findIndex((r: any) => r.name === balance.value.rank);
  
  if (currentIndex < 0 || currentIndex >= sortedRanks.length - 1) {
    return 100;
  }
  
  const currentXp = sortedRanks[currentIndex].minXp;
  const progress = ((balance.value.xpTotal - currentXp) / (nextXp - currentXp)) * 100;
  return Math.min(100, Math.max(0, progress));
};

const getHistoryIcon = (type: string): string => {
  switch (type) {
    case 'CASHBACK_EARN': return 'add_circle';
    case 'CASHBACK_SPEND': return 'remove_circle';
    case 'XP_EARN': return 'stars';
    default: return 'info';
  }
};

const getHistoryClass = (type: string): string => {
  switch (type) {
    case 'CASHBACK_EARN': return 'earn';
    case 'CASHBACK_SPEND': return 'spend';
    case 'XP_EARN': return 'xp';
    default: return '';
  }
};

const getBadgeImage = (rank: string): string => {
  const rankLower = rank.toLowerCase();
  return `/images/badges/${rankLower}.png`;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.loyalty-view {
  width: 100%;
}

.container {
  padding: 0;
}

.container h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #111;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
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

.btn-retry {
  padding: 0.75rem 1.5rem;
  background-color: #111;
  color: #fff;
  border: none;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.cashback-card .stat-icon {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.xp-card .stat-icon {
  background-color: #fff3e0;
  color: #ef6c00;
}

.rank-card .stat-icon {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.badge-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rank-icon {
  background: transparent !important;
  padding: 0;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #999;
}

.expiring-alert {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.expiring-alert i {
  font-size: 2rem;
  color: #ff6f00;
}

.rank-progress {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.rank-progress h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #111;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7b1fa2, #9c27b0);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #666;
  margin-bottom: 1.5rem;
}

.ranks-list {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.rank-badge {
  flex: 1;
  min-width: 100px;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  opacity: 0.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.rank-badge.achieved {
  opacity: 1;
  border-color: #9c27b0;
}

.rank-badge.active {
  background-color: #f3e5f5;
  border-color: #7b1fa2;
  font-weight: 600;
}

.rank-badge-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.rank-name {
  display: block;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.rank-xp {
  display: block;
  font-size: 0.85rem;
  color: #666;
}

.how-it-works {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.how-it-works h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #111;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-card {
  text-align: center;
}

.info-card i {
  font-size: 3rem;
  color: #7b1fa2;
  margin-bottom: 0.5rem;
}

.info-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #111;
}

.info-card p {
  color: #666;
  font-size: 0.9rem;
}

.history-section {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #111;
}

.empty-history {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-history i {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-icon.earn {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.history-icon.spend {
  background-color: #ffebee;
  color: #c62828;
}

.history-icon.xp {
  background-color: #fff3e0;
  color: #ef6c00;
}

.history-content {
  flex: 1;
}

.history-description {
  font-weight: 500;
  color: #111;
  margin-bottom: 0.25rem;
}

.history-date {
  font-size: 0.85rem;
  color: #999;
}

.history-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.history-amount.earn {
  color: #2e7d32;
}

.history-amount.spend {
  color: #c62828;
}

.history-amount.xp {
  color: #ef6c00;
}

@media (max-width: 768px) {
  .loyalty-view {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .ranks-list {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
