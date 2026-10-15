const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// GET / - Get all shippers (Public/Customer for checkout selection)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM shippers WHERE status = 'ACTIVE' ORDER BY shipper_id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi lấy danh sách đơn vị vận chuyển",
      error: err.message
    });
  }
});

// POST / - Create shipper (Admin only)
router.post("/", auth.admin, async (req, res) => {
  try {
    const { shipper_name, phone, status } = req.body;
    if (!shipper_name) {
      return res.status(400).json({ message: "Thiếu tên đơn vị vận chuyển" });
    }

    const result = await db.query(
      `
      INSERT INTO shippers (shipper_name, phone, status)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [shipper_name, phone, status || "ACTIVE"]
    );

    res.status(201).json({
      message: "Thêm đơn vị vận chuyển thành công",
      shipper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi thêm đơn vị vận chuyển",
      error: err.message
    });
  }
});

// PUT /:id - Update shipper (Admin only)
router.put("/:id", auth.admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { shipper_name, phone, status } = req.body;

    const result = await db.query(
      `
      UPDATE shippers
      SET shipper_name = $1, phone = $2, status = $3
      WHERE shipper_id = $4
      RETURNING *
      `,
      [shipper_name, phone, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn vị vận chuyển" });
    }

    res.json({
      message: "Cập nhật đơn vị vận chuyển thành công",
      shipper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi cập nhật đơn vị vận chuyển",
      error: err.message
    });
  }
});

// DELETE /:id - Delete shipper (Admin only)
router.delete("/:id", auth.admin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM shippers WHERE shipper_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn vị vận chuyển" });
    }

    res.json({
      message: "Xóa đơn vị vận chuyển thành công",
      shipper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi xóa đơn vị vận chuyển",
      error: err.message
    });
  }
});

module.exports = router;
