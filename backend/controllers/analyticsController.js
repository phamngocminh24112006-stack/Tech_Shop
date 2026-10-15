const pool = require('../config/db');

// Phân tích khoảng giá và doanh thu (Câu 7 trong SQL)
const getPriceSegments = async (req, res) => {
    try {
        const query = `
            SELECT 
                CASE 
                    WHEN p.price < 5000000 THEN 'Dưới 5 Triệu'
                    WHEN p.price BETWEEN 5000000 AND 15000000 THEN '5 - 15 Triệu'
                    WHEN p.price BETWEEN 15000000 AND 25000000 THEN '15 - 25 Triệu'
                    ELSE 'Trên 25 Triệu'
                END AS price_segment,
                COUNT(oi.product_id) AS total_units_sold,
                SUM(oi.quantity * oi.unit_price) AS total_segment_revenue
            FROM order_item oi
            JOIN product p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.delivery_status = 'Delivered'
            GROUP BY price_segment
            ORDER BY total_segment_revenue DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Hiệu suất giao hàng của Shipper (Câu 12 trong SQL)
const getShipperPerformance = async (req, res) => {
    try {
        const query = `
            SELECT s.shipper_name, COUNT(o.order_id) AS total_orders,
                   ROUND(SUM(CASE WHEN o.delivery_status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(o.order_id), 0), 2) AS success_rate
            FROM shippers s 
            LEFT JOIN orders o ON s.shipper_id = o.shipper_id
            GROUP BY s.shipper_name 
            ORDER BY success_rate DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Thống kê hạng thành viên khách hàng (Câu 5 trong SQL)
const getCustomerTiers = async (req, res) => {
    try {
        const query = `
            WITH CustomerStats AS (
                SELECT u.user_id, u.full_name, COUNT(o.order_id) AS total_orders, SUM(o.total_amount) AS lifetime_value
                FROM users u
                JOIN accounts a ON u.user_id = a.user_id
                JOIN orders o ON a.account_id = o.account_id
                WHERE o.delivery_status = 'Delivered'
                GROUP BY u.user_id, u.full_name
            )
            SELECT user_id, full_name, total_orders, lifetime_value,
                CASE
                    WHEN lifetime_value >= 50000000 THEN 'S-VIP'
                    WHEN lifetime_value >= 20000000 THEN 'S-Member'
                    ELSE 'S-New'
                END AS membership_tier
            FROM CustomerStats 
            ORDER BY lifetime_value DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const revenueRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as monthly_revenue 
            FROM orders 
            WHERE delivery_status = 'Delivered' 
              AND order_date >= DATE_TRUNC('month', CURRENT_DATE)
        `);
        const monthlyRevenue = Number(revenueRes.rows[0].monthly_revenue);

        const ordersCountRes = await pool.query("SELECT COUNT(*) as count FROM orders");
        const totalOrders = Number(ordersCountRes.rows[0].count);

        const usersCountRes = await pool.query(`
            SELECT COUNT(*) as count 
            FROM accounts 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        `);
        const newUsers = Number(usersCountRes.rows[0].count);

        const lowStockRes = await pool.query("SELECT COUNT(*) as count FROM product WHERE stock_quantity <= 5");
        const lowStockCount = Number(lowStockRes.rows[0].count);

        const currentYear = new Date().getFullYear();
        const annualReportQuery = `
            SELECT m.month, COALESCE(SUM(o.total_amount), 0) as revenue
            FROM generate_series(1, 12) m(month)
            LEFT JOIN orders o ON EXTRACT(MONTH FROM o.order_date) = m.month 
                              AND EXTRACT(YEAR FROM o.order_date) = $1 
                              AND o.delivery_status = 'Delivered'
            GROUP BY m.month
            ORDER BY m.month;
        `;
        const annualRes = await pool.query(annualReportQuery, [currentYear]);
        const monthlyRevenueChart = annualRes.rows.map(r => ({
            month: `T${r.month}`,
            revenue: Number(r.revenue)
        }));

        const recentOrdersRes = await pool.query(`
            SELECT o.order_id as id, u.full_name as user, o.total_amount as amount, o.delivery_status as status
            FROM orders o
            LEFT JOIN accounts a ON o.account_id = a.account_id
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY o.order_date DESC
            LIMIT 5
        `);

        const topProductsRes = await pool.query(`
            SELECT p.product_id as id, p.name, p.price, p.brand, p.category, 
                   COUNT(r.rating) as reviews, COALESCE(AVG(r.rating), 0) as rating
            FROM product p
            LEFT JOIN review r ON p.product_id = r.product_id
            GROUP BY p.product_id, p.name, p.price, p.brand, p.category
            ORDER BY reviews DESC, rating DESC
            LIMIT 5
        `);

        const categoryRes = await pool.query(`
            SELECT category, COUNT(*) as count, SUM(stock_quantity) as stock
            FROM product
            GROUP BY category
        `);

        res.status(200).json({
            stats: {
                monthlyRevenue,
                totalOrders,
                newUsers,
                lowStockCount
            },
            monthlyRevenueChart,
            recentOrders: recentOrdersRes.rows,
            topProducts: topProductsRes.rows,
            categoryStats: categoryRes.rows
        });
    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getPriceSegments, getShipperPerformance, getCustomerTiers, getDashboardStats };