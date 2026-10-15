const pool = require('../config/db');

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    const { account_id, product_id, quantity } = req.body;

    try {
        // 1. Lấy hoặc tự động tạo cart_id của user
        let cartRes = await pool.query('SELECT cart_id FROM cart WHERE account_id = $1', [account_id]);
        if (cartRes.rows.length === 0) {
            await pool.query('INSERT INTO cart (account_id) VALUES ($1)', [account_id]);
            cartRes = await pool.query('SELECT cart_id FROM cart WHERE account_id = $1', [account_id]);
        }
        const cart_id = cartRes.rows[0].cart_id;

        // 2. Kiểm tra xem sản phẩm đã có trong giỏ chưa
        const checkItem = await pool.query(
            'SELECT quantity FROM cart_item WHERE cart_id = $1 AND product_id = $2', 
            [cart_id, product_id]
        );

        if (checkItem.rows.length > 0) {
            // Cập nhật số lượng (Trigger sẽ tự động chặn nếu vượt tồn kho)
            const newQty = checkItem.rows[0].quantity + quantity;
            if (newQty <= 0) {
                await pool.query(
                    'DELETE FROM cart_item WHERE cart_id = $1 AND product_id = $2',
                    [cart_id, product_id]
                );
            } else {
                await pool.query(
                    'UPDATE cart_item SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
                    [newQty, cart_id, product_id]
                );
            }
        } else if (quantity > 0) {
            // Thêm mới
            await pool.query(
                'INSERT INTO cart_item (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
                [cart_id, product_id, quantity]
            );
        }

        res.status(200).json({ message: 'Đã cập nhật giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: err.message }); // Bắt lỗi từ Trigger PostgreSQL trả về
    }
};

// Lấy chi tiết giỏ hàng của user
const getCart = async (req, res) => {
    const { account_id } = req.params;
    try {
        const query = `
            SELECT ci.product_id, p.name, p.price, p.image_url, ci.quantity, (p.price * ci.quantity) as subtotal
            FROM cart c
            JOIN cart_item ci ON c.cart_id = ci.cart_id
            JOIN product p ON ci.product_id = p.product_id
            WHERE c.account_id = $1
            ORDER BY p.name
        `;
        const { rows } = await pool.query(query, [account_id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const deleteCartItem = async (req, res) => {
    const { account_id, product_id } = req.params;
    try {
        const cartRes = await pool.query('SELECT cart_id FROM cart WHERE account_id = $1', [account_id]);
        if (cartRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
        }
        const cart_id = cartRes.rows[0].cart_id;
        await pool.query('DELETE FROM cart_item WHERE cart_id = $1 AND product_id = $2', [cart_id, product_id]);
        res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { addToCart, getCart, deleteCartItem };