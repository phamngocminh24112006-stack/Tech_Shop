const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// GET / - Get all suppliers (Admin only)
router.get("/", auth.admin, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM supplier ORDER BY supplier_id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi lấy danh sách nhà cung cấp",
      error: err.message
    });
  }
});

// GET /inventory - Get inventory supply history logs (Admin only)
router.get("/inventory", auth.admin, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT i.create_at, i.supplier_id, i.product_id, i.quantity,
             s.name as supplier_name, p.name as product_name
      FROM inventory i
      JOIN supplier s ON i.supplier_id = s.supplier_id
      JOIN product p ON i.product_id = p.product_id
      ORDER BY i.create_at DESC
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi lấy nhật ký nhập kho",
      error: err.message
    });
  }
});

// POST /inventory - Record a new inventory supply (Restock) (Admin only)
router.post("/inventory", auth.admin, async (req, res) => {
  const client = await db.connect();
  try {
    const { supplier_id, product_id, quantity } = req.body;

    if (!supplier_id || !product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Thông tin nhập kho không hợp lệ" });
    }

    // Begin Transaction
    await client.query("BEGIN");

    // 1. Insert into inventory log
    await client.query(
      `
      INSERT INTO inventory (supplier_id, product_id, quantity, create_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `,
      [supplier_id, product_id, quantity]
    );

    // 2. Increase stock_quantity in product table
    const productUpdate = await client.query(
      `
      UPDATE product
      SET stock_quantity = stock_quantity + $1
      WHERE product_id = $2
      RETURNING *
      `,
      [quantity, product_id]
    );

    if (productUpdate.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Commit Transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Nhập hàng vào kho thành công",
      product: productUpdate.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Inventory Restock Transaction Error:", err);
    res.status(500).json({
      message: "Lỗi hệ thống khi nhập hàng",
      error: err.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
