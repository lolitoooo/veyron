const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

app.use(express.static('public'));

const ensureDirectoriesExist = require('./utils/ensureDirs');
ensureDirectoriesExist();

app.use(cors({
  origin: [
    // Domaines de production
    'https://veyron-paris.fr',
    'https://www.veyron-paris.fr',
    'https://api.veyron-paris.fr',
    // Domaines de préproduction
    'https://preprod.veyron-paris.fr',
    'https://api-preprod.veyron-paris.fr',
    // Domaines de développement
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use((req, res, next) => {
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/search', require('./routes/search'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/wishlist', require('./routes/wishlist'));

app.use('/uploads', express.static('public/uploads'));
app.use('/images', express.static('public/images'));

app.get('/', (req, res) => {
  res.send('API VEYRON en ligne');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});