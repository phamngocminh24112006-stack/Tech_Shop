const express = require('express');
const router = express.Router();
const { getNewProducts, getFlashSaleProducts, searchProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');

router.get('/new', getNewProducts);
router.get('/flash-sale', getFlashSaleProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// Admin operations
router.post('/', auth.admin, createProduct);
router.put('/:id', auth.admin, updateProduct);
router.delete('/:id', auth.admin, deleteProduct);

module.exports = router;