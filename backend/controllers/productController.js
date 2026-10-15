const pool = require('../config/db');

// Lấy danh sách sản phẩm mới về (Câu 33 trong SQL)
const getNewProducts = async (req, res) => {
    try {
        const query = 'SELECT * FROM product ORDER BY product_id DESC LIMIT 10';
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy sản phẩm Flash Sale - Sắp hết hàng (Câu 38 trong SQL)
const getFlashSaleProducts = async (req, res) => {
    try {
        const query = `
            SELECT product_id, name, price, stock_quantity 
            FROM product 
            WHERE stock_quantity BETWEEN 1 AND 10 
            ORDER BY stock_quantity ASC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Tìm kiếm nâng cao (Câu 37 trong SQL)
const searchProducts = async (req, res) => {
    const { keyword = '', category, minPrice = 0, maxPrice = 999999999 } = req.query;
    try {
        let query = `
            SELECT p.*, COALESCE(ROUND(AVG(r.rating), 1), 0.0) as rating, COUNT(r.rating)::int as reviews
            FROM product p
            LEFT JOIN review r ON p.product_id = r.product_id
            WHERE p.name ILIKE $1 AND p.price BETWEEN $2 AND $3
        `;
        const values = [`%${keyword}%`, minPrice, maxPrice];
        
        if (category) {
            query += ' AND p.category = $4';
            values.push(category);
        }

        query += ' GROUP BY p.product_id ORDER BY p.price ASC';

        const { rows } = await pool.query(query, values);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM product WHERE product_id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createProduct = async (req, res) => {
    const { name, brand, category, price, stock_quantity, warranty_period, image_url, description } = req.body;
    try {
        const query = `
            INSERT INTO product (name, brand, category, price, stock_quantity, warranty_period, image_url, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [name, brand, category, price, stock_quantity || 0, warranty_period || 12, image_url || null, description || '']);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, brand, category, price, stock_quantity, warranty_period, image_url, description } = req.body;
    try {
        const query = `
            UPDATE product
            SET name = $1, brand = $2, category = $3, price = $4, stock_quantity = $5, warranty_period = $6, image_url = $7, description = $8
            WHERE product_id = $9
            RETURNING *
        `;
        const { rows } = await pool.query(query, [name, brand, category, price, stock_quantity, warranty_period, image_url, description, id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('DELETE FROM product WHERE product_id = $1 RETURNING *', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công', product: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getNewProducts,
    getFlashSaleProducts,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};