const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductsByCategory,
  getSaleProducts,
  updateProductStock,
  searchProducts
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/sale', getSaleProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

router.post('/:id/reviews', protect, createProductReview);

router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/stock', protect, authorize('admin'), updateProductStock);

module.exports = router;
