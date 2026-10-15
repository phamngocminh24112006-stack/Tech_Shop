const pool = require('../config/db');

const checkout = async (req, res) => {
    const { account_id, receiver_address, receiver_phone, payment_method, shipper_id } = req.body;

    try {
        await pool.query('BEGIN'); // Bắt đầu Transaction

        // 1. Lấy thông tin giỏ hàng hiện tại
        const cartRes = await pool.query('SELECT cart_id FROM cart WHERE account_id = $1', [account_id]);
        if (cartRes.rows.length === 0) throw new Error('Không tìm thấy giỏ hàng');
        const cart_id = cartRes.rows[0].cart_id;

        // Lấy danh sách item trong giỏ kèm giá hiện tại của sản phẩm
        const itemsRes = await pool.query(`
            SELECT ci.product_id, ci.quantity, p.price 
            FROM cart_item ci
            JOIN product p ON ci.product_id = p.product_id
            WHERE ci.cart_id = $1
        `, [cart_id]);

        if (itemsRes.rows.length === 0) {
            throw new Error('Giỏ hàng trống!');
        }

        // 2. Tạo Đơn hàng (orders)
        // Truyền total_amount = 0 trước, Trigger 'trg_update_total_amount' sẽ tự động tính lại sau
        const orderQuery = `
            INSERT INTO orders (account_id, total_amount, receiver_address, receiver_phone, delivery_status, shipper_id) 
            VALUES ($1, 0, $2, $3, 'Pending', $4) RETURNING order_id
        `;
        const orderRes = await pool.query(orderQuery, [account_id, receiver_address, receiver_phone, shipper_id || null]);
        const order_id = orderRes.rows[0].order_id;

        // 3. Chuyển items từ cart_item sang order_item
        for (const item of itemsRes.rows) {
            await pool.query(`
                INSERT INTO order_item (order_id, product_id, quantity, unit_price) 
                VALUES ($1, $2, $3, $4)
            `, [order_id, item.product_id, item.quantity, item.price]);
            // Lưu ý: Trigger trg_decrease_stock sẽ tự động chạy tại bước này để trừ stock_quantity
        }

        // 4. Khởi tạo trạng thái thanh toán
        await pool.query(`
            INSERT INTO payments (order_id, payment_amount, payment_method, payment_status) 
            VALUES ($1, (SELECT total_amount FROM orders WHERE order_id = $1), $2, 'Pending')
        `, [order_id, payment_method]);

        // 5. Làm sạch giỏ hàng
        await pool.query('DELETE FROM cart_item WHERE cart_id = $1', [cart_id]);

        await pool.query('COMMIT'); // Hoàn tất Transaction
        res.status(200).json({ message: 'Đặt hàng thành công!', order_id });

    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
};

// Lấy lịch sử mua hàng của user
const getUserOrders = async (req, res) => {
    const { account_id } = req.params;
    try {
        const query = `
            SELECT order_id, order_date, total_amount, delivery_status 
            FROM orders 
            WHERE account_id = $1 
            ORDER BY order_date DESC
        `;
        const { rows } = await pool.query(query, [account_id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const query = `
            SELECT o.order_id as id, o.order_date as date, o.total_amount as amount, o.delivery_status as status, o.receiver_address, o.receiver_phone,
                   u.full_name as user, s.shipper_name as shipper, p.payment_status as payment
            FROM orders o
            LEFT JOIN accounts a ON o.account_id = a.account_id
            LEFT JOIN users u ON a.user_id = u.user_id
            LEFT JOIN shippers s ON o.shipper_id = s.shipper_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            ORDER BY o.order_date DESC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getOrderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const itemsQuery = `
            SELECT oi.product_id, oi.quantity, oi.unit_price as price, p.name, p.image_url
            FROM order_item oi
            JOIN product p ON oi.product_id = p.product_id
            WHERE oi.order_id = $1
        `;
        const itemsRes = await pool.query(itemsQuery, [id]);

        const orderQuery = `
            SELECT o.order_id as id, o.account_id as account_id, o.order_date as date, o.total_amount as amount, o.delivery_status as status, o.receiver_address, o.receiver_phone,
                   u.full_name as user, s.shipper_name as shipper, p.payment_status as payment
            FROM orders o
            LEFT JOIN accounts a ON o.account_id = a.account_id
            LEFT JOIN users u ON a.user_id = u.user_id
            LEFT JOIN shippers s ON o.shipper_id = s.shipper_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.order_id = $1
        `;
        const orderRes = await pool.query(orderQuery, [id]);

        if (orderRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orderRes.rows[0];

        // Authorization check: User must be admin or the owner of the order
        if (req.user.role !== 'admin' && req.user.account_id !== order.account_id) {
            return res.status(403).json({ message: 'Bạn không có quyền xem chi tiết đơn hàng này' });
        }

        order.items = itemsRes.rows;

        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let shipper_id = null;
        if (status === 'Shipping') {
            const shipperCheck = await client.query('SELECT shipper_id FROM orders WHERE order_id = $1', [id]);
            if (shipperCheck.rows.length > 0 && !shipperCheck.rows[0].shipper_id) {
                const shipperRes = await client.query("SELECT shipper_id FROM shippers WHERE status = 'ACTIVE' LIMIT 1");
                if (shipperRes.rows.length > 0) {
                    shipper_id = shipperRes.rows[0].shipper_id;
                }
            }
        }

        if (shipper_id) {
            await client.query(`
                UPDATE orders 
                SET delivery_status = $1, shipper_id = $2 
                WHERE order_id = $3
            `, [status, shipper_id, id]);
        } else {
            await client.query(`
                UPDATE orders 
                SET delivery_status = $1 
                WHERE order_id = $2
            `, [status, id]);
        }

        if (status === 'Delivered') {
            await client.query(`
                UPDATE payments 
                SET payment_status = 'Completed' 
                WHERE order_id = $1
            `, [id]);
        }
        
        if (status === 'Cancelled') {
            await client.query(`
                UPDATE payments 
                SET payment_status = 'Refunded' 
                WHERE order_id = $1
            `, [id]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Đã cập nhật trạng thái đơn hàng thành ${status}` });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

const getAllPayments = async (req, res) => {
    try {
        const query = `
            SELECT p.payment_id as id, p.order_id as orderid, p.payment_date as date, p.payment_amount as amount, p.payment_method as method, p.payment_status as status
            FROM payments p
            ORDER BY p.payment_date DESC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { checkout, getUserOrders, getAllOrders, getOrderDetails, updateOrderStatus, getAllPayments };