<template>
  <div class="faq-view">
    <div class="container">
      <h1>Foire Aux Questions</h1>
      
      <div class="legal-content">
        <div class="faq-search">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Rechercher une question..." 
            @input="filterQuestions"
          />
        </div>
        
        <div class="faq-categories">
          <button 
            v-for="(category, index) in categories" 
            :key="index"
            :class="['category-btn', { active: activeCategory === category.id }]"
            @click="setActiveCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
        
        <div class="faq-list">
          <div v-if="filteredQuestions.length === 0" class="no-results">
            <p>Aucune question ne correspond à votre recherche.</p>
            <button @click="resetSearch" class="reset-btn">Réinitialiser la recherche</button>
          </div>
          
          <div 
            v-for="(question, index) in filteredQuestions" 
            :key="index"
            class="faq-item"
          >
            <div 
              class="faq-question" 
              @click="toggleQuestion(question.id)"
              :class="{ 'active': openQuestions.includes(question.id) }"
            >
              <h3>{{ question.question }}</h3>
              <span class="toggle-icon">
                {{ openQuestions.includes(question.id) ? '−' : '+' }}
              </span>
            </div>
            <div 
              class="faq-answer"
              :class="{ 'open': openQuestions.includes(question.id) }"
            >
              <p v-html="question.answer"></p>
            </div>
          </div>
        </div>
        
        <div class="contact-section">
          <h2>Vous n'avez pas trouvé votre réponse ?</h2>
          <p>Notre équipe du service client est à votre disposition pour répondre à toutes vos questions.</p>
          <div class="contact-options">
            <div class="contact-option">
              <h3>Par Email</h3>
              <p>contact@veyron.com</p>
              <p>Réponse sous 24h ouvrées</p>
            </div>
            <div class="contact-option">
              <h3>Par Téléphone</h3>
              <p>+33 (0)1 23 45 67 89</p>
              <p>Du lundi au vendredi, 9h-18h</p>
            </div>
            <div class="contact-option">
              <h3>Chat en ligne</h3>
              <p>Sur notre site</p>
              <p>Du lundi au samedi, 10h-19h</p>
            </div>
          </div>
          <router-link to="/contact" class="contact-btn">Nous contacter</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const searchQuery = ref('');
const activeCategory = ref('all');
const openQuestions = ref<number[]>([]);

const categories = [
  { id: 'all', name: 'Toutes les questions' },
  { id: 'orders', name: 'Commandes' },
  { id: 'shipping', name: 'Livraison' },
  { id: 'returns', name: 'Retours' },
  { id: 'products', name: 'Produits' },
  { id: 'account', name: 'Compte' },
  { id: 'payment', name: 'Paiement' }
];

const questions = [
  {
    id: 1,
    category: 'orders',
    question: 'Comment suivre ma commande ?',
    answer: 'Vous pouvez suivre votre commande en vous connectant à votre compte VEYRON et en accédant à la section "Mes commandes". Vous y trouverez le statut actuel de votre commande ainsi qu\'un lien de suivi une fois que celle-ci a été expédiée. Vous recevrez également des emails automatiques vous informant de l\'avancement de votre commande.'
  },
  {
    id: 2,
    category: 'orders',
    question: 'Puis-je modifier ma commande après l\'avoir passée ?',
    answer: 'Vous pouvez modifier votre commande uniquement si elle n\'a pas encore été préparée pour expédition. Pour ce faire, contactez notre service client dès que possible par téléphone au +33 (0)1 23 45 67 89 ou par email à contact@veyron.com en précisant votre numéro de commande et les modifications souhaitées.'
  },
  {
    id: 3,
    category: 'orders',
    question: 'Comment annuler ma commande ?',
    answer: 'Pour annuler votre commande, contactez immédiatement notre service client par téléphone au +33 (0)1 23 45 67 89. Si votre commande n\'a pas encore été préparée, nous pourrons procéder à l\'annulation et au remboursement intégral. Si la commande a déjà été expédiée, vous devrez suivre la procédure de retour standard.'
  },
  {
    id: 4,
    category: 'shipping',
    question: 'Quels sont les délais de livraison ?',
    answer: 'Les délais de livraison varient selon votre localisation :<br><br>• <strong>France métropolitaine</strong> : 2-3 jours ouvrés<br>• <strong>Europe</strong> : 3-5 jours ouvrés<br>• <strong>International</strong> : 5-10 jours ouvrés<br><br>Ces délais sont indicatifs à compter de la validation de votre commande et peuvent varier en période de forte activité ou de soldes.'
  },
  {
    id: 5,
    category: 'shipping',
    question: 'La livraison est-elle gratuite ?',
    answer: 'La livraison est gratuite en France métropolitaine pour toute commande supérieure à 150€. En dessous de ce montant, les frais de livraison s\'élèvent à 9,99€. Pour l\'Europe, la livraison est gratuite à partir de 200€, et pour l\'international à partir de 300€. Les frais exacts sont calculés lors de la finalisation de votre commande.'
  },
  {
    id: 6,
    category: 'returns',
    question: 'Comment retourner un article ?',
    answer: 'Pour retourner un article, connectez-vous à votre compte VEYRON et accédez à la section "Mes commandes". Sélectionnez la commande concernée et cliquez sur "Retourner un article". Suivez ensuite les instructions pour imprimer l\'étiquette de retour prépayée. Emballez soigneusement l\'article dans son emballage d\'origine avec toutes les étiquettes attachées et déposez le colis au point de collecte indiqué.'
  },
  {
    id: 7,
    category: 'returns',
    question: 'Quel est le délai pour retourner un article ?',
    answer: 'Vous disposez de 30 jours à compter de la date de réception de votre commande pour retourner un article. Les articles retournés doivent être dans leur état d\'origine, non portés, non lavés, avec toutes les étiquettes attachées et dans leur emballage d\'origine.'
  },
  {
    id: 8,
    category: 'returns',
    question: 'Comment serai-je remboursé ?',
    answer: 'Le remboursement sera effectué sur le mode de paiement utilisé lors de votre achat initial. Une fois votre retour reçu et validé par notre équipe, le remboursement est traité sous 3 à 5 jours ouvrés. Selon votre banque, le crédit peut prendre jusqu\'à 10 jours supplémentaires pour apparaître sur votre compte.'
  },
  {
    id: 9,
    category: 'products',
    question: 'Comment connaître ma taille ?',
    answer: 'Vous trouverez un guide des tailles détaillé sur chaque page produit. Pour des conseils personnalisés, n\'hésitez pas à contacter notre service client qui pourra vous guider dans le choix de la taille la plus adaptée à votre morphologie. Nous recommandons de prendre vos mesures et de les comparer à notre guide pour un ajustement optimal.'
  },
  {
    id: 10,
    category: 'products',
    question: 'Comment entretenir mes vêtements VEYRON ?',
    answer: 'Chaque article VEYRON est accompagné d\'instructions d\'entretien spécifiques sur son étiquette. De manière générale, nous recommandons un lavage délicat à basse température, un séchage à l\'air libre et un repassage à température modérée. Pour les articles en laine ou en soie, le nettoyage à sec est conseillé. Pour plus de détails, consultez notre <a href="/care-guide">guide d\'entretien</a>.'
  },
  {
    id: 11,
    category: 'account',
    question: 'Comment créer un compte ?',
    answer: 'Pour créer un compte VEYRON, cliquez sur "Mon compte" en haut à droite de notre site, puis sélectionnez "Créer un compte". Remplissez le formulaire avec vos informations personnelles et créez un mot de passe sécurisé. Vous recevrez un email de confirmation pour activer votre compte. La création d\'un compte vous permet de suivre vos commandes, gérer vos adresses et accéder à des offres exclusives.'
  },
  {
    id: 12,
    category: 'account',
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer: 'Si vous avez oublié votre mot de passe, cliquez sur "Mon compte", puis sur "Mot de passe oublié". Saisissez l\'adresse email associée à votre compte et vous recevrez un lien pour réinitialiser votre mot de passe. Ce lien est valable pendant 24 heures. Si vous ne recevez pas l\'email, vérifiez votre dossier de spam ou contactez notre service client.'
  },
  {
    id: 13,
    category: 'payment',
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les moyens de paiement suivants :<br><br>• Cartes bancaires (Visa, Mastercard, American Express)<br>• PayPal<br>• Apple Pay<br>• Google Pay<br>• Virement bancaire (pour les commandes supérieures à 500€)<br><br>Toutes les transactions sont sécurisées avec un cryptage SSL.'
  },
  {
    id: 14,
    category: 'payment',
    question: 'Proposez-vous le paiement en plusieurs fois ?',
    answer: 'Oui, nous proposons le paiement en 3 ou 4 fois sans frais pour les commandes supérieures à 100€, en partenariat avec Klarna. Cette option est disponible lors du processus de paiement. Vous devrez fournir vos informations bancaires et une vérification d\'identité pourra être demandée. Le premier paiement est débité immédiatement, les suivants à 30 jours d\'intervalle.'
  }
];

const filteredQuestions = computed(() => {
  let result = questions;
  
  if (activeCategory !== 'all') {
    result = result.filter(q => q.category === activeCategory.value);
  }
  
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(q => 
      q.question.toLowerCase().includes(query) || 
      q.answer.toLowerCase().includes(query)
    );
  }
  
  return result;
});

const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
};

const toggleQuestion = (id) => {
  const index = openQuestions.value.indexOf(id);
  if (index === -1) {
    openQuestions.value.push(id);
  } else {
    openQuestions.value.splice(index, 1);
  }
};

const filterQuestions = () => {
  // La fonction est automatiquement appelée grâce au computed
};

const resetSearch = () => {
  searchQuery.value = '';
  activeCategory.value = 'all';
};

// Ouvrir la première question au chargement
onMounted(() => {
  if (questions.length > 0) {
    openQuestions.value.push(questions[0].id);
  }
});
</script>

<style scoped>
.faq-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
  text-align: center;
}

.legal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.faq-search {
  margin-bottom: 2rem;
}

.faq-search input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: var(--font-body);
}

.faq-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.category-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.3s ease;
}

.category-btn.active {
  background-color: #000;
  color: #fff;
  border-color: #000;
}

.faq-item {
  margin-bottom: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: background-color 0.3s ease;
}

.faq-question:hover {
  background-color: #f0f0f0;
}

.faq-question.active {
  background-color: #f0f0f0;
}

.faq-question h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 500;
}

.toggle-icon {
  font-size: 1.5rem;
  font-weight: 300;
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 1.5rem;
}

.faq-answer.open {
  max-height: 1000px;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.faq-answer p {
  margin: 0;
  line-height: 1.6;
}

.no-results {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.reset-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-body);
}

.contact-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.contact-section h2 {
  margin-bottom: 1rem;
  font-family: var(--font-heading);
}

.contact-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.contact-option {
  flex: 1;
  min-width: 200px;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.contact-option h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-family: var(--font-heading);
}

.contact-option p {
  margin: 0.5rem 0;
}

.contact-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: #000;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-family: var(--font-body);
  transition: background-color 0.3s ease;
}

.contact-btn:hover {
  background-color: #333;
}

@media (max-width: 768px) {
  .contact-options {
    flex-direction: column;
  }
  
  .faq-categories {
    justify-content: center;
  }
}
</style>
