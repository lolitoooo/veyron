const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

const envPath = path.resolve(__dirname, '../.env.development');
console.log('Chargement du fichier .env depuis:', envPath);
dotenv.config({ path: envPath });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté pour l\'assignation des sous-catégories');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

const assignSubcategoriesToProducts = async () => {
  try {
    await connectDB();
    
    console.log('Récupération des catégories...');
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat.slug.toLowerCase();
    });
    
    console.log('Récupération des sous-catégories...');
    const subcategories = await Subcategory.find({}).populate('category');
    
    console.log('Récupération des produits...');
    const products = await Product.find({});
    
    console.log(`\n${products.length} produits trouvés`);
    console.log(`${subcategories.length} sous-catégories disponibles\n`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const productCategorySlug = categoryMap[product.category.toString()];
      
      if (!productCategorySlug) {
        console.log(`⚠️  Produit "${product.name}" : catégorie non trouvée`);
        continue;
      }
      
      const productName = product.name.toLowerCase();
      let assignedSubcategory = null;
      
      const categorySubcategories = subcategories.filter(sub => {
        const subCategorySlug = sub.category.slug.toLowerCase();
        return subCategorySlug === productCategorySlug;
      });
      
      const keywordMapping = {
        'chemise': ['Chemises', 'Chemisiers'],
        'polo': ['Polos'],
        't-shirt': ['T-shirts'],
        'tee-shirt': ['T-shirts'],
        'pull': ['Pulls'],
        'sweat': ['Sweats'],
        'pantalon': ['Pantalons'],
        'jean': ['Jeans'],
        'short': ['Shorts'],
        'veste': ['Vestes'],
        'manteau': ['Manteaux'],
        'costume': ['Costumes'],
        'blazer': ['Blazers'],
        'robe': ['Robes'],
        'jupe': ['Jupes'],
        'gilet': ['Gilets'],
        'top': ['Tops'],
        'sac': ['Sacs'],
        'portefeuille': ['Portefeuilles'],
        'ceinture': ['Ceintures'],
        'écharpe': ['Écharpes'],
        'bonnet': ['Chapeaux'],
        'casquette': ['Chapeaux'],
        'chapeau': ['Chapeaux'],
        'gant': ['Gants'],
        'lunette': ['Lunettes'],
        'montre': ['Bijoux'],
        'bijou': ['Bijoux'],
        'cravate': ['Écharpes'],
        'bandana': ['Écharpes'],
        'foulard': ['Écharpes'],
        'chaussure': ['Chaussures'],
        'basket': ['Chaussures'],
        'botte': ['Chaussures'],
        'bracelet': ['Bijoux']
      };
      
      for (const [keyword, possibleSubcategories] of Object.entries(keywordMapping)) {
        if (productName.includes(keyword)) {
          for (const subcatName of possibleSubcategories) {
            const foundSubcategory = categorySubcategories.find(sub => sub.name === subcatName);
            if (foundSubcategory) {
              assignedSubcategory = foundSubcategory;
              break;
            }
          }
          if (assignedSubcategory) break;
        }
      }
      
      if (!assignedSubcategory) {
        for (const subcategory of categorySubcategories) {
          const subcategoryName = subcategory.name.toLowerCase();
          const keywords = subcategoryName.split(' ');
          
          const matches = keywords.some(keyword => {
            const cleanKeyword = keyword.replace(/[^a-zàâäéèêëïîôùûüÿç]/g, '');
            if (cleanKeyword.length < 3) return false;
            return productName.includes(cleanKeyword);
          });
          
          if (matches) {
            assignedSubcategory = subcategory;
            break;
          }
        }
      }
      
      if (assignedSubcategory) {
        product.subcategory = assignedSubcategory._id;
        await product.save();
        updatedCount++;
        console.log(`✓ "${product.name}" → ${assignedSubcategory.name}`);
      } else {
        console.log(`⚠️  "${product.name}" : aucune sous-catégorie trouvée (catégorie: ${productCategorySlug})`);
      }
    }
    
    console.log(`\n✅ Assignation terminée ! ${updatedCount}/${products.length} produits mis à jour.`);
    
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'assignation:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

assignSubcategoriesToProducts();
