const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('ID du produit requis');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Produit non trouvé');
  }

  const existingItem = await Wishlist.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingItem) {
    res.status(400);
    throw new Error('Ce produit est déjà dans vos favoris');
  }

  const wishlistItem = await Wishlist.create({
    user: req.user._id,
    product: productId
  });

  if (wishlistItem) {
    res.status(201).json({
      success: true,
      data: wishlistItem
    });
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlistItem = await Wishlist.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!wishlistItem) {
    res.status(404);
    throw new Error('Article non trouvé dans vos favoris');
  }

  await wishlistItem.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Article retiré des favoris'
  });
});

const removeProductFromWishlist = asyncHandler(async (req, res) => {
  const wishlistItem = await Wishlist.findOne({
    product: req.params.productId,
    user: req.user._id
  });

  if (!wishlistItem) {
    res.status(404);
    throw new Error('Article non trouvé dans vos favoris');
  }

  await wishlistItem.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Article retiré des favoris'
  });
});

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ user: req.user._id })
    .populate('product', 'name price images description slug category')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: wishlist.length,
    data: wishlist
  });
});

const checkWishlistItem = asyncHandler(async (req, res) => {
  const wishlistItem = await Wishlist.findOne({
    user: req.user._id,
    product: req.params.productId
  });

  res.status(200).json({
    success: true,
    inWishlist: !!wishlistItem,
    data: wishlistItem
  });
});

module.exports = {
  addToWishlist,
  removeFromWishlist,
  removeProductFromWishlist,
  getWishlist,
  checkWishlistItem
};
