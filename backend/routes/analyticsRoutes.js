const express = require('express');
const router = express.Router();
const { getPriceSegments, getShipperPerformance, getCustomerTiers, getDashboardStats } = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth.admin, getDashboardStats);
router.get('/price-segments', auth.admin, getPriceSegments);
router.get('/shipper-performance', auth.admin, getShipperPerformance);
router.get('/customer-tiers', auth.admin, getCustomerTiers);

module.exports = router;