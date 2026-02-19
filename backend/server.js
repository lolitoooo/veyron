const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const { startPasswordExpiryJob } = require('./jobs/passwordExpiryJob');

dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });
connectDB();
startPasswordExpiryJob();

const app = express();

// Initialiser Passport pour OAuth
app.use(passport.initialize());

// Charger la configuration OAuth (doit être après l'initialisation de passport)
require('./controllers/oauthController');

// IMPORTANT: Stripe webhook a besoin du body brut pour vérifier la signature.
// Ce middleware doit être défini AVANT express.json().
app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

app.use(express.json());

const cacheOptions = {
  maxAge: '365d',
  etag: true,
  lastModified: true,
  immutable: true
};

app.use(express.static('public', cacheOptions));

const ensureDirectoriesExist = require('./utils/ensureDirs');
ensureDirectoriesExist();

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://veyron-paris.fr',
      'https://www.veyron-paris.fr',
      'https://api.veyron-paris.fr',
      'https://preprod.veyron-paris.fr',
      'https://api-preprod.veyron-paris.fr',
      'http://localhost',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:3000',
      'capacitor://localhost',
      'ionic://localhost',
      'https://localhost'
    ];

// Ajouter les regex pour les IPs locales
const regexOrigins = [
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    const isAllowedRegex = regexOrigins.some(regex => regex.test(origin));
    
    if (isAllowedOrigin || isAllowedRegex) {
      callback(null, true);
    } else {
      console.log(`CORS: Origine non autorisée: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/2fa', require('./routes/twoFactor'));
app.use('/api/auth/magic-link', require('./routes/magicLink'));
app.use('/api/auth', require('./routes/oauth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/search', require('./routes/search'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/shipping-labels', require('./routes/shipping-labels'));
app.use('/api/promo-codes', require('./routes/promoCode'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/loyalty', require('./routes/loyalty'));

app.use('/uploads', express.static('public/uploads', cacheOptions));
app.use('/images', express.static('public/images', cacheOptions));

app.get('/', (req, res) => {
  res.send('API VEYRON en ligne');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});