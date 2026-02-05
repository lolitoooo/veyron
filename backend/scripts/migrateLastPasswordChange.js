const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`) });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

const migrateLastPasswordChange = async () => {
  await connectDB();
  
  try {
    const result = await mongoose.connection.db.collection('users').updateMany(
      { 
        $or: [
          { lastPasswordChange: { $exists: false } },
          { lastPasswordChange: null }
        ]
      },
      { 
        $set: { lastPasswordChange: new Date() }
      }
    );
    
    console.log(`Migration terminée: ${result.modifiedCount} utilisateur(s) mis à jour`);
    
    const users = await mongoose.connection.db.collection('users').find({}, { 
      projection: { email: 1, lastPasswordChange: 1, createdAt: 1 } 
    }).toArray();
    
    console.log('\nUtilisateurs après migration:');
    users.forEach(user => {
      console.log(`- ${user.email}: lastPasswordChange=${user.lastPasswordChange ? user.lastPasswordChange.toISOString() : 'null'}`);
    });
    
  } catch (err) {
    console.error('Erreur lors de la migration:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnexion MongoDB fermée');
    process.exit(0);
  }
};

migrateLastPasswordChange();
