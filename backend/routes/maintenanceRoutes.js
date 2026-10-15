const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");
const source = require("../queries/sourceTechshop");

// POST /api/maintenance/products - Query 1: Thêm sản phẩm
router.post("/products", auth.admin, async (req, res) => {
  try {
    const { name, brand, category, price, stock_quantity, description, warranty_period, image_url } = req.body;
    const result = await db.query(source.INSERT_PRODUCT, [
      name, brand, category, price, stock_quantity || 0,
      description || null, warranty_period || 12, image_url || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/maintenance/category-price - Query 2: Tăng giá theo danh mục
router.put("/category-price", auth.admin, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: "Thiếu category" });
    const result = await db.query(source.UPDATE_CATEGORY_PRICE, [category]);
    res.json({ updated: result.rows.length, products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/maintenance/cancelled-orders - Query 3: Xóa đơn hủy cũ
router.delete("/cancelled-orders", auth.admin, async (req, res) => {
  try {
    const result = await db.query(source.DELETE_OLD_CANCELLED_ORDERS);
    res.json({ deleted: result.rows.length, order_ids: result.rows.map((r) => r.order_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance/cleanup-carts - Query 17
router.post("/cleanup-carts", auth.admin, async (req, res) => {
  try {
    await db.query(source.CLEANUP_OLD_CARTS_FN);
    res.json({ message: "Đã dọn dẹp giỏ hàng cũ hơn 7 ngày" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
