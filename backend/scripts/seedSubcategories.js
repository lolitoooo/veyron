const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

const envPath = path.resolve(__dirname, '../.env.development');
console.log('Chargement du fichier .env depuis:', envPath);
dotenv.config({ path: envPath });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté pour le seeding');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

const subcategoriesData = {
  'femme': [
    { name: 'Robes', category: 'femme', description: 'Robes pour toutes occasions', order: 1, type: 'Haut' },
    { name: 'Chemisiers', category: 'femme', description: 'Chemisiers élégants et décontractés', order: 2, type: 'Haut' },
    { name: 'Tops', category: 'femme', description: 'Tops variés pour toutes occasions', order: 3, type: 'Haut' },
    { name: 'T-shirts', category: 'femme', description: 'T-shirts basiques et tendance', order: 4, type: 'Haut' },
    { name: 'Pulls', category: 'femme', description: 'Pulls chauds et confortables', order: 5, type: 'Haut' },
    { name: 'Gilets', category: 'femme', description: 'Gilets pour toutes saisons', order: 6, type: 'Haut' },
    { name: 'Vestes', category: 'femme', description: 'Vestes légères et mi-saison', order: 7, type: 'Haut' },
    { name: 'Manteaux', category: 'femme', description: 'Manteaux d\'hiver et imperméables', order: 8, type: 'Haut' },
    { name: 'Blazers', category: 'femme', description: 'Blazers professionnels et décontractés', order: 9, type: 'Haut' },
    { name: 'Jupes', category: 'femme', description: 'Jupes courtes, longues, midi', order: 10, type: 'Bas' },
    { name: 'Pantalons', category: 'femme', description: 'Pantalons classiques et modernes', order: 11, type: 'Bas' },
    { name: 'Jeans', category: 'femme', description: 'Jeans de toutes coupes', order: 12, type: 'Bas' },
    { name: 'Shorts', category: 'femme', description: 'Shorts d\'été et sport', order: 13, type: 'Bas' },
    { name: 'Chaussures', category: 'femme', description: 'Escarpins, ballerines, sandales', order: 14, type: 'Bas' },
    { name: 'Baskets', category: 'femme', description: 'Baskets sport et lifestyle', order: 15, type: 'Bas' },
    { name: 'Bottes', category: 'femme', description: 'Bottes hautes, bottines, boots', order: 16, type: 'Bas' }
  ],
  'homme': [
    { name: 'Chemises', category: 'homme', description: 'Chemises habillées et casual', order: 1, type: 'Haut' },
    { name: 'Polos', category: 'homme', description: 'Polos classiques et sportifs', order: 2, type: 'Haut' },
    { name: 'T-shirts', category: 'homme', description: 'T-shirts basiques et graphiques', order: 3, type: 'Haut' },
    { name: 'Pulls', category: 'homme', description: 'Pulls en laine, coton, cachemire', order: 4, type: 'Haut' },
    { name: 'Sweats', category: 'homme', description: 'Sweats à capuche et col rond', order: 5, type: 'Haut' },
    { name: 'Vestes', category: 'homme', description: 'Vestes en cuir, jean, bomber', order: 6, type: 'Haut' },
    { name: 'Manteaux', category: 'homme', description: 'Manteaux longs et parkas', order: 7, type: 'Haut' },
    { name: 'Costumes', category: 'homme', description: 'Ensembles veste et pantalon', order: 8, type: 'Haut' },
    { name: 'Blazers', category: 'homme', description: 'Vestes de costume séparées', order: 9, type: 'Haut' },
    { name: 'Pantalons', category: 'homme', description: 'Pantalons chino, costume, cargo', order: 10, type: 'Bas' },
    { name: 'Jeans', category: 'homme', description: 'Jeans slim, regular, loose', order: 11, type: 'Bas' },
    { name: 'Shorts', category: 'homme', description: 'Shorts d\'été et bermudas', order: 12, type: 'Bas' },
    { name: 'Chaussures', category: 'homme', description: 'Derbies, mocassins, richelieus', order: 13, type: 'Bas' },
    { name: 'Baskets', category: 'homme', description: 'Baskets sport et lifestyle', order: 14, type: 'Bas' }
  ],
  'accessoires': [
    { name: 'Sacs à Main', category: 'accessoires', description: 'Sacs à main de toutes tailles', order: 1 },
    { name: 'Sacs à Dos', category: 'accessoires', description: 'Sacs à dos urbains et sport', order: 2 },
    { name: 'Portefeuilles', category: 'accessoires', description: 'Portefeuilles en cuir et textile', order: 3 },
    { name: 'Ceintures', category: 'accessoires', description: 'Ceintures en cuir et tissu', order: 4 },
    { name: 'Écharpes', category: 'accessoires', description: 'Écharpes légères et chaudes', order: 5 },
    { name: 'Bonnets', category: 'accessoires', description: 'Bonnets d\'hiver', order: 6 },
    { name: 'Casquettes', category: 'accessoires', description: 'Casquettes sport et mode', order: 7 },
    { name: 'Chapeaux', category: 'accessoires', description: 'Chapeaux élégants et décontractés', order: 8 },
    { name: 'Gants', category: 'accessoires', description: 'Gants d\'hiver et mi-saison', order: 9 },
    { name: 'Lunettes de Soleil', category: 'accessoires', description: 'Lunettes de soleil tendance', order: 10 },
    { name: 'Montres', category: 'accessoires', description: 'Montres classiques et modernes', order: 11 },
    { name: 'Bijoux', category: 'accessoires', description: 'Colliers, bracelets, boucles d\'oreilles', order: 12 }
  ]
};

const seedSubcategories = async () => {
  try {
    await connectDB();
    
    console.log('Suppression des anciennes sous-catégories...');
    await Subcategory.deleteMany({});
    
    console.log('Récupération des catégories...');
    const categories = await Category.find({});
    
    if (categories.length === 0) {
      console.error('Aucune catégorie trouvée. Veuillez d\'abord créer les catégories.');
      process.exit(1);
    }
    
    console.log(`${categories.length} catégories trouvées`);
    
    for (const category of categories) {
      const categorySlug = category.slug.toLowerCase();
      const subcategoriesForCategory = subcategoriesData[categorySlug];
      
      if (!subcategoriesForCategory) {
        console.log(`Aucune sous-catégorie définie pour la catégorie: ${category.name} (${categorySlug})`);
        continue;
      }
      
      console.log(`\nCréation des sous-catégories pour: ${category.name}`);
      
      for (const subcatData of subcategoriesForCategory) {
        const subcategory = await Subcategory.create({
          name: subcatData.name,
          description: subcatData.description,
          order: subcatData.order,
          type: subcatData.type || null,
          category: category._id,
          isActive: true
        });
        
        console.log(`  ✓ ${subcategory.name} (${subcategory.slug}) créée`);
      }
    }
    
    const totalSubcategories = await Subcategory.countDocuments();
    console.log(`\n✅ Seeding terminé ! ${totalSubcategories} sous-catégories créées avec succès.`);
    
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seeding:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedSubcategories();
