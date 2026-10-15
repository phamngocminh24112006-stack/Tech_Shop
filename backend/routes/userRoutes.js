const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// GET /api/users - Retrieve all users with order details, lifetime spend, membership tiers, and accounts status (Admin only)
router.get('/', auth.admin, async (req, res) => {
    try {
        const query = `
            WITH CustomerStats AS (
                SELECT u.user_id, u.full_name, u.email, u.phone, u.address, a.status,
                       COUNT(o.order_id) AS total_orders, COALESCE(SUM(o.total_amount), 0) AS lifetime_value
                FROM users u
                JOIN accounts a ON u.user_id = a.user_id
                LEFT JOIN orders o ON a.account_id = o.account_id AND o.delivery_status = 'Delivered'
                GROUP BY u.user_id, u.full_name, u.email, u.phone, u.address, a.status
            )
            SELECT user_id as id, full_name as name, email, phone, address, total_orders, lifetime_value as spend,
                CASE
                    WHEN lifetime_value >= 50000000 THEN 'S-VIP'
                    WHEN lifetime_value >= 20000000 THEN 'S-Member'
                    ELSE 'S-New'
                END AS tier,
                status
            FROM CustomerStats
            ORDER BY lifetime_value DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching users analysis:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
