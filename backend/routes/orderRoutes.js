const express = require('express');
const router = express.Router();
const { checkout, getUserOrders, getAllOrders, getOrderDetails, updateOrderStatus, getAllPayments } = require('../controllers/orderController');
const auth = require('../middleware/authMiddleware');

router.post('/checkout', checkout);
router.get('/history/:account_id', getUserOrders);

// Admin / Detail routes
router.get('/', auth.admin, getAllOrders);
router.get('/payments/all', auth.admin, getAllPayments);
router.get('/:id', auth, getOrderDetails);
router.put('/:id/status', auth.admin, updateOrderStatus);

module.exports = router;