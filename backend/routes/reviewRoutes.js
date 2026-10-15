const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// GET / - Fetch all reviews (Admin only)
router.get("/", auth.admin, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT r.account_id, r.product_id, r.rating, r.comment, 
             p.name as product_name, u.full_name as reviewer_name, a.username
      FROM review r
      JOIN product p ON r.product_id = p.product_id
      JOIN accounts a ON r.account_id = a.account_id
      JOIN users u ON a.user_id = u.user_id
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi lấy danh sách đánh giá",
      error: err.message
    });
  }
});

// GET /product/:product_id - Fetch reviews for a specific product
router.get("/product/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    const result = await db.query(
      `
      SELECT r.account_id, r.product_id, r.rating, r.comment, 
             u.full_name as reviewer_name, a.username
      FROM review r
      JOIN accounts a ON r.account_id = a.account_id
      JOIN users u ON a.user_id = u.user_id
      WHERE r.product_id = $1
      `,
      [product_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi lấy danh sách đánh giá",
      error: err.message
    });
  }
});

// POST / - Write/Edit a review (Auth Customer only)
router.post("/", auth, async (req, res) => {
  try {
    const account_id = req.user.account_id;
    const { product_id, rating, comment } = req.body;

    if (!product_id || rating === undefined) {
      return res.status(400).json({ message: "Thiếu thông tin đánh giá" });
    }

    const ratingVal = parseFloat(rating);
    if (ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5 sao" });
    }

    // Check if customer has purchased the product
    // Note: For educational purposes, checking if they have purchased it is an excellent feature
    // Let's implement it! Or we can make it optional, or just let them review any product.
    // Let's make it so they can review any product, but we check if they ordered it to show a "Verified Buyer" badge!
    // That is a premium e-commerce feature! Let's do that!
    // To check if they bought it:
    const purchaseCheck = await db.query(
      `
      SELECT 1
      FROM orders o
      JOIN order_item oi ON o.order_id = oi.order_id
      WHERE o.account_id = $1 AND oi.product_id = $2 AND o.delivery_status = 'Delivered'
      LIMIT 1
      `,
      [account_id, product_id]
    );
    const verified = purchaseCheck.rows.length > 0;

    // Insert or update review (Upsert)
    const result = await db.query(
      `
      INSERT INTO review (account_id, product_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (account_id, product_id)
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
      RETURNING *
      `,
      [account_id, product_id, ratingVal, comment]
    );

    res.status(200).json({
      message: "Gửi đánh giá thành công",
      review: result.rows[0],
      verified
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi gửi đánh giá",
      error: err.message
    });
  }
});

module.exports = router;
