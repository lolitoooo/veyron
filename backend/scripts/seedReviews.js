const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

// Charger l'env selon NODE_ENV (en prod, ne pas charger .env.development pour garder MONGO_URI du conteneur).
// En production : exécuter le script DANS le conteneur backend pour que "veyron-mongodb-prod" soit résolu :
//   docker exec veyron-backend-prod node scripts/seedReviews.js
const envName = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envPath = path.resolve(__dirname, `../.env.${envName}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const reviewComments = [
  "Excellent produit, très satisfait de mon achat !",
  "Qualité au rendez-vous, je recommande vivement.",
  "Produit conforme à la description, livraison rapide.",
  "Très bon rapport qualité-prix, je suis ravi.",
  "Déçu par la qualité, ne correspond pas à mes attentes.",
  "Produit correct mais rien d'exceptionnel.",
  "Superbe ! Exactement ce que je cherchais.",
  "Bonne qualité, mais un peu cher à mon goût.",
  "Je ne regrette pas cet achat, produit de qualité.",
  "Pas terrible, je m'attendais à mieux pour ce prix.",
  "Produit magnifique, finitions impeccables.",
  "Très satisfait, correspond parfaitement à mes besoins.",
  "Qualité moyenne, j'ai connu mieux.",
  "Excellent choix, je recommande sans hésiter !",
  "Produit de très bonne facture, bravo !",
  "Un peu déçu, la qualité n'est pas au rendez-vous.",
  "Parfait ! Rien à redire sur ce produit.",
  "Bon produit dans l'ensemble, quelques petits défauts.",
  "Je suis très content de mon achat, produit au top.",
  "Qualité exceptionnelle, je recommande à 100%.",
  "Produit moyen, je ne suis pas totalement convaincu.",
  "Très belle pièce, je suis conquis !",
  "Bon rapport qualité-prix, satisfait de mon achat.",
  "Déception totale, produit de mauvaise qualité.",
  "Produit conforme, livraison soignée.",
  "Excellente qualité, je ne regrette pas mon choix.",
  "Pas mal mais j'ai vu mieux ailleurs.",
  "Superbe produit, je suis aux anges !",
  "Qualité correcte pour le prix.",
  "Je recommande ce produit les yeux fermés !",
  "Produit décevant, ne vaut pas son prix.",
  "Très bon achat, je suis pleinement satisfait.",
  "Qualité premium, ça se voit et ça se sent.",
  "Moyen, je m'attendais à mieux.",
  "Parfait pour un cadeau, très élégant.",
  "Bon produit mais délai de livraison un peu long.",
  "Excellente qualité, je recommande vivement.",
  "Produit correct sans plus.",
  "Je suis ravi de cet achat, produit magnifique.",
  "Qualité médiocre, je suis déçu.",
  "Très beau produit, conforme à mes attentes.",
  "Bon achat, je ne regrette pas.",
  "Produit de qualité supérieure, bravo !",
  "Pas convaincu par la qualité.",
  "Superbe réalisation, je suis impressionné.",
  "Produit satisfaisant dans l'ensemble.",
  "Excellente acquisition, je recommande.",
  "Qualité discutable pour ce prix.",
  "Magnifique produit, je suis conquis !",
  "Bon produit, conforme à la description."
];

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomRating = () => {
  const weights = [2, 5, 15, 30, 48];
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return i + 1;
    }
  }
  return 5;
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seedReviews = async () => {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('🗑️  Suppression des avis existants...');
    await Review.deleteMany({});
    console.log('✅ Avis supprimés');

    console.log('📦 Récupération des produits...');
    const products = await Product.find({});
    console.log(`✅ ${products.length} produits trouvés`);

    console.log('👥 Récupération des utilisateurs...');
    const users = await User.find({ role: 'user' });
    console.log(`✅ ${users.length} utilisateurs trouvés`);

    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé. Créez des utilisateurs d\'abord.');
      process.exit(1);
    }

    console.log('📝 Génération des avis...');
    let totalReviews = 0;
    const startDate = new Date('2024-01-01');
    const endDate = new Date();

    for (const product of products) {
      const reviewCount = getRandomInt(5, 15);
      const usedUsers = new Set();
      
      for (let i = 0; i < reviewCount; i++) {
        let user;
        let attempts = 0;
        
        do {
          user = getRandomElement(users);
          attempts++;
          if (attempts > 50) break;
        } while (usedUsers.has(user._id.toString()) && attempts <= 50);
        
        if (usedUsers.has(user._id.toString())) continue;
        usedUsers.add(user._id.toString());

        const rating = getRandomRating();
        const comment = getRandomElement(reviewComments);
        const createdAt = getRandomDate(startDate, endDate);
        
        const shouldApprove = Math.random() > 0.1;

        const review = new Review({
          product: product._id,
          user: user._id,
          rating,
          comment,
          status: shouldApprove ? 'approved' : 'pending',
          isApproved: shouldApprove,
          createdAt,
          updatedAt: createdAt
        });

        if (shouldApprove) {
          review.approvedAt = createdAt;
        }

        await review.save();
        totalReviews++;
      }
      
      console.log(`  ✓ ${reviewCount} avis créés pour "${product.name}"`);
    }

    console.log(`\n🎉 ${totalReviews} avis créés avec succès !`);
    console.log('📊 Statistiques :');
    
    const approvedCount = await Review.countDocuments({ status: 'approved' });
    const pendingCount = await Review.countDocuments({ status: 'pending' });
    
    console.log(`  - Avis approuvés : ${approvedCount}`);
    console.log(`  - Avis en attente : ${pendingCount}`);
    
    const ratingStats = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('  - Répartition des notes :');
    ratingStats.forEach(stat => {
      console.log(`    ${stat._id} étoiles : ${stat.count} avis`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed des avis:', error);
    if (error.message && error.message.includes('ENOTFOUND') && process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb')) {
      console.error('\n💡 En production, le hostname MongoDB (ex: veyron-mongodb-prod) ne se résout que dans le réseau Docker.');
      console.error('   Exécutez le script depuis le conteneur backend :');
      console.error('   docker exec veyron-backend-prod node scripts/seedReviews.js\n');
    }
    process.exit(1);
  }
};

seedReviews();
