const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getMainCategories,
  getSubcategories,
  getFeaturedCategories,
  getCategoriesWithProductCount
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/with-product-count', getCategoriesWithProductCount);
router.get('/main', getMainCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:id', getCategoryById);
router.get('/:id/subcategories', getSubcategories);

router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
