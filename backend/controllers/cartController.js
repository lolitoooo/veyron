const Cart = require('../models/Cart');
const User = require('../models/User');

exports.getCart = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(200).json({ 
        items: [],
        total: 0
      });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du panier' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { userId, items, total } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let cart = await Cart.findOne({ userId });
    
    if (cart) {
      cart.items = items;
      cart.calculateTotal();
      await cart.save();
    } else {
      cart = new Cart({
        userId,
        items,
        total
      });
      cart.calculateTotal();
      await cart.save();
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du panier:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du panier' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const cart = await Cart.findOne({ userId });
    
    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
    }

    res.status(200).json({ message: 'Panier vidé avec succès' });
  } catch (error) {
    console.error('Erreur lors du vidage du panier:', error);
    res.status(500).json({ message: 'Erreur serveur lors du vidage du panier' });
  }
};