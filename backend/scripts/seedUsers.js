const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const { faker } = require('@faker-js/faker/locale/fr');

dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/veyron_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateRandomUser = async (createdAt) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();
  
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);
  
  return {
    firstName,
    lastName,
    email,
    password,
    role: Math.random() > 0.9 ? 'admin' : 'user',
    profilePhotoUrl: faker.image.avatar(),
    phone: faker.phone.number(),
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
    newsletterSubscribed: Math.random() > 0.5,
    smsNotifications: Math.random() > 0.7,
    isActive: Math.random() > 0.05,
    lastLogin: Math.random() > 0.2 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
    createdAt
  };
};

const seedUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('Utilisateurs existants supprimés');
    
    const startDate = new Date(2024, 0, 1); 
    const endDate = new Date(2025, 6, 3); 
    
    const users = [];
    
    for (let i = 0; i < 10; i++) {
      const createdAt = randomDate(new Date(2024, 0, 1), new Date(2024, 2, 31));
      users.push(await generateRandomUser(createdAt));
    }
    
    for (let i = 0; i < 15; i++) {
      const createdAt = randomDate(new Date(2024, 3, 1), new Date(2024, 5, 30));
      users.push(await generateRandomUser(createdAt));
    }
    
    for (let i = 0; i < 20; i++) {
      const createdAt = randomDate(new Date(2024, 6, 1), new Date(2024, 8, 30));
      users.push(await generateRandomUser(createdAt));
    }
    
    for (let i = 0; i < 25; i++) {
      const createdAt = randomDate(new Date(2024, 9, 1), new Date(2024, 11, 31));
      users.push(await generateRandomUser(createdAt));
    }
    
    for (let i = 0; i < 30; i++) {
      const createdAt = randomDate(new Date(2025, 0, 1), new Date(2025, 6, 3));
      users.push(await generateRandomUser(createdAt));
    }
    
    await User.insertMany(users);
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs:', error);
    process.exit(1);
  }
};

seedUsers();
