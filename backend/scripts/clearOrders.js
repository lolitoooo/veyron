const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../models/Order');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

const clearOrders = async () => {
  try {
    const orderCount = await Order.countDocuments();
    
    const result = await Order.deleteMany({});
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la suppression des commandes:', error);
    process.exit(1);
  }
};

clearOrders();
