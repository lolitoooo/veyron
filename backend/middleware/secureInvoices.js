const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

const secureInvoices = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(400).json({ message: 'ID de commande manquant' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    if (order.user.toString() !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé à cette facture' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur dans le middleware secureInvoices:', error);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = secureInvoices;
