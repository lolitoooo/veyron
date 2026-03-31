const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.development');
console.log('Chargement du fichier .env depuis:', envPath);
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

const fixIndexes = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('subcategories');
    
    console.log('Récupération des index existants...');
    const indexes = await collection.indexes();
    console.log('Index actuels:', indexes.map(i => i.name));
    
    console.log('\nSuppression de l\'index unique sur name...');
    try {
      await collection.dropIndex('name_1');
      console.log('✓ Index name_1 supprimé');
    } catch (err) {
      if (err.code === 27) {
        console.log('⚠️  Index name_1 n\'existe pas');
      } else {
        throw err;
      }
    }
    
    console.log('\nCréation d\'un index composé unique sur (name + category)...');
    await collection.createIndex({ name: 1, category: 1 }, { unique: true });
    console.log('✓ Index composé créé');
    
    console.log('\nIndex finaux:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Correction des index terminée');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixIndexes();
