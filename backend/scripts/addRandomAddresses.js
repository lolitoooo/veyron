const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Address = require('../models/Address');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

// Données aléatoires pour les adresses
const streetNames = [
  'Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Haussmann',
  'Rue de Rivoli', 'Avenue Montaigne', 'Rue du Faubourg Saint-Honoré',
  'Boulevard Saint-Germain', 'Rue de Sèvres', 'Avenue Victor Hugo',
  'Rue Saint-Antoine', 'Rue de Rennes', 'Boulevard Raspail'
];

const cities = [
  { name: 'Paris', postalCodes: ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010'] },
  { name: 'Lyon', postalCodes: ['69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009'] },
  { name: 'Marseille', postalCodes: ['13001', '13002', '13003', '13004', '13005', '13006', '13007', '13008', '13009'] },
  { name: 'Bordeaux', postalCodes: ['33000', '33100', '33200', '33300', '33400', '33500'] },
  { name: 'Lille', postalCodes: ['59000', '59100', '59200', '59300', '59400'] },
  { name: 'Toulouse', postalCodes: ['31000', '31100', '31200', '31300', '31400', '31500'] },
  { name: 'Nice', postalCodes: ['06000', '06100', '06200', '06300'] },
  { name: 'Nantes', postalCodes: ['44000', '44100', '44200', '44300'] },
  { name: 'Strasbourg', postalCodes: ['67000', '67100', '67200'] },
  { name: 'Rennes', postalCodes: ['35000', '35100', '35200', '35700'] }
];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRandomPhoneNumber = () => {
  const prefixes = ['06', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
};

const generateRandomAddress = (userId) => {
  const streetNumber = getRandomNumber(1, 150);
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const cityInfo = cities[Math.floor(Math.random() * cities.length)];
  const city = cityInfo.name;
  const postalCode = cityInfo.postalCodes[Math.floor(Math.random() * cityInfo.postalCodes.length)];
  const phone = generateRandomPhoneNumber();
  
  return {
    user: userId,
    name: 'Adresse principale',
    firstName: '',
    lastName: '',
    addressLine1: `${streetNumber} ${streetName}`,
    addressLine2: Math.random() > 0.7 ? `Apt ${getRandomNumber(1, 100)}` : '',
    city,
    postalCode,
    country: 'France',
    phone,
    isDefault: true,
    type: 'both'
  };
};

const addRandomAddressesToUsers = async () => {
  try {
    const users = await User.find({});
    let addressesAdded = 0;
    
    for (const user of users) {
      const existingAddresses = await Address.find({ user: user._id });
      
      if (existingAddresses.length === 0) {
        const addressCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < addressCount; i++) {
          const addressData = generateRandomAddress(user._id);
          
          addressData.firstName = user.firstName;
          addressData.lastName = user.lastName;
          
          if (i > 0) {
            addressData.isDefault = false;
            addressData.name = `Adresse ${i + 1}`;
          }
          
          const address = await Address.create(addressData);
          addressesAdded++;
        }
      } 
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des adresses:', error);
    process.exit(1);
  }
};

addRandomAddressesToUsers();
