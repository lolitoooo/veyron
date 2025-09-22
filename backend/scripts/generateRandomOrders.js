const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Order = require('../models/Order');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

const paymentMethods = ['card', 'paypal'];

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const carriers = ['Chronopost', 'DHL', 'UPS', 'La Poste', 'Mondial Relay'];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  return new Date(sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime()));
};

const generateTrackingNumber = () => {
  const prefix = ['FR', 'EU', 'INT'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  let number = randomPrefix;
  for (let i = 0; i < 10; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
};

const generateRandomOrder = async (user, products, addresses) => {
  try {
    if (addresses.length === 0) {
      return null;
    }
    
    if (!user._id) {
      return null;
    }

    const shippingAddressData = addresses[Math.floor(Math.random() * addresses.length)];
    
    const shippingAddress = {
      firstName: shippingAddressData.firstName,
      lastName: shippingAddressData.lastName,
      addressLine1: shippingAddressData.addressLine1,
      addressLine2: shippingAddressData.addressLine2 || '',
      city: shippingAddressData.city,
      postalCode: shippingAddressData.postalCode,
      country: shippingAddressData.country,
      phone: shippingAddressData.phone
    };

    let billingAddress;
    if (addresses.length > 1 && Math.random() > 0.7) {
      const billingAddressData = addresses.filter(addr => addr._id.toString() !== shippingAddressData._id.toString())[0];
      billingAddress = {
        firstName: billingAddressData.firstName,
        lastName: billingAddressData.lastName,
        addressLine1: billingAddressData.addressLine1,
        addressLine2: billingAddressData.addressLine2 || '',
        city: billingAddressData.city,
        postalCode: billingAddressData.postalCode,
        country: billingAddressData.country,
        phone: billingAddressData.phone
      };
    } else {
      billingAddress = { ...shippingAddress };
    }

    const numProducts = getRandomNumber(1, 5);
    
    const selectedProducts = [];
    const usedProductIds = new Set();
    
    const maxProductsToSelect = Math.min(numProducts, products.length);
    
    for (let i = 0; i < maxProductsToSelect; i++) {
      let randomProduct;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        randomProduct = products[Math.floor(Math.random() * products.length)];
        attempts++;
        if (attempts > maxAttempts) break;
      } while (usedProductIds.has(randomProduct._id.toString()));
      
      if (attempts > maxAttempts) continue;
      
      usedProductIds.add(randomProduct._id.toString());
      
      if (randomProduct.variants && randomProduct.variants.length > 0) {
        const variant = randomProduct.variants[Math.floor(Math.random() * randomProduct.variants.length)];
        
        const qty = getRandomNumber(1, 3);
        
        const priceHT = variant.price || randomProduct.price;
        const price = priceHT * 1.2;
        
        let image = '';
        if (randomProduct.images && randomProduct.images.length > 0) {
          const mainImage = randomProduct.images.find(img => img.isMain) || randomProduct.images[0];
          image = mainImage.url;
        }
        
        selectedProducts.push({
          name: randomProduct.name,
          qty,
          image,
          price,
          priceHT,
          variant: {
            size: variant.size,
            color: variant.color,
            colorCode: variant.colorCode || '#000000'
          },
          variantId: variant._id.toString(),
          product: randomProduct._id
        });
      } else {
        const qty = getRandomNumber(1, 3);
        
        const priceHT = randomProduct.price;
        const price = priceHT * 1.2;
        
        let image = '';
        if (randomProduct.images && randomProduct.images.length > 0) {
          const mainImage = randomProduct.images.find(img => img.isMain) || randomProduct.images[0];
          image = mainImage.url;
        }
        
        selectedProducts.push({
          name: randomProduct.name,
          qty,
          image,
          price,
          priceHT,
          variant: {
            size: 'Unique',
            color: 'Default',
            colorCode: '#000000'
          },
          variantId: 'default',
          product: randomProduct._id
        });
      }
    }
    
    const itemsPrice = selectedProducts.reduce((acc, item) => acc + item.price * item.qty, 0);
    const itemsPriceHT = selectedProducts.reduce((acc, item) => acc + item.priceHT * item.qty, 0);
    const taxPrice = itemsPrice - itemsPriceHT;
    
    const shippingPrice = Math.random() > 0.3 ? getRandomNumber(5, 15) : 0;
    
    const totalPrice = itemsPrice + shippingPrice;
    
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    
    const createdAt = getRandomDate();
    
    const isPaid = Math.random() > 0.2;
    const paidAt = isPaid ? new Date(createdAt.getTime() + getRandomNumber(1, 60) * 60000) : undefined; // Payé entre 1 et 60 minutes après création
    
    const deliveredAt = status === 'delivered' ? new Date(createdAt.getTime() + getRandomNumber(2, 10) * 86400000) : undefined; // Livré entre 2 et 10 jours après création
    
    const trackingNumber = (status === 'shipped' || status === 'delivered') ? generateTrackingNumber() : undefined;
    const carrier = (status === 'shipped' || status === 'delivered') ? carriers[Math.floor(Math.random() * carriers.length)] : undefined;
    
    if (selectedProducts.length === 0) {
      return null;
    }
    
    const orderData = {
      user: user._id,
      orderItems: selectedProducts,
      shippingAddress,
      billingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid,
      paidAt,
      status,
      deliveredAt,
      trackingNumber,
      carrier,
      createdAt
    };
    
    if (isPaid) {
      orderData.paymentResult = {
        id: `payment_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        status: 'completed',
        update_time: paidAt.toISOString(),
        email_address: user.email
      };
      
      orderData.invoiceNumber = `FACT-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      orderData.invoiceDate = paidAt;
    }
    
    const order = await Order.create(orderData);
    
    
    return order;
  } catch (error) {
    console.error(`Erreur lors de la création d'une commande pour l'utilisateur ${user._id}:`, error);
    return null;
  }
};

const generateRandomOrders = async () => {
  try {
    console.log('Début de la génération des commandes aléatoires...');
    
    const users = await User.find({}).lean();
    console.log(`Trouvé ${users.length} utilisateurs`);
    
    if (users.length === 0) {
      console.error('Aucun utilisateur trouvé, impossible de créer des commandes');
      process.exit(1);
    }
    
    const products = await Product.find({ stock: { $gt: 0 } }).populate('variants').lean();
    console.log(`Trouvé ${products.length} produits en stock`);
    
    if (products.length === 0) {
      console.error('Aucun produit trouvé en stock, impossible de créer des commandes');
      process.exit(1);
    }
    
    let ordersCreated = 0;
    let usersWithOrders = 0;
    
    for (const user of users) {
      const addresses = await Address.find({ user: user._id });
      
      if (addresses.length === 0) {
        console.log(`L'utilisateur ${user.firstName} ${user.lastName} (${user._id}) n'a pas d'adresses, aucune commande ne sera créée`);
        continue;
      }
      
      const orderCount = getRandomNumber(1, 5);
      
      let userOrdersCreated = 0;
      for (let i = 0; i < orderCount; i++) {
        const order = await generateRandomOrder(user, products, addresses);
        if (order) {
          ordersCreated++;
          userOrdersCreated++;
        }
      }
      
      if (userOrdersCreated > 0) {
        usersWithOrders++;
        console.log(`Créé ${userOrdersCreated} commandes pour l'utilisateur ${user.firstName} ${user.lastName} (${user._id})`);
      }
    }
    
    console.log(`Terminé! ${ordersCreated} commandes ont été créées pour ${usersWithOrders} utilisateurs.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la génération des commandes:', error);
    process.exit(1);
  }
};

generateRandomOrders();
