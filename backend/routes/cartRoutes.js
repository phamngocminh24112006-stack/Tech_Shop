const express = require('express');
const router = express.Router();
const { addToCart, getCart, deleteCartItem } = require('../controllers/cartController');

router.post('/add', addToCart);
router.get('/:account_id', getCart);
router.delete('/items/:account_id/:product_id', deleteCartItem);

module.exports = router;