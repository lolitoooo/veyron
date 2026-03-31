const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

const envPath = path.resolve(__dirname, '../.env.development');
dotenv.config({ path: envPath });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

const checkSubcategories = async () => {
  try {
    await connectDB();
    
    console.log('Vérification des sous-catégories T-shirts...\n');
    const tshirts = await Subcategory.find({ name: 'T-shirts' }).populate('category', 'name slug');
    
    tshirts.forEach(sub => {
      console.log(`Nom: ${sub.name}`);
      console.log(`Slug: ${sub.slug}`);
      console.log(`Catégorie: ${sub.category.name} (${sub.category.slug})`);
      console.log(`CategorySlug virtuel: ${sub.categorySlug}`);
      console.log(`Type: ${sub.type}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkSubcategories();
