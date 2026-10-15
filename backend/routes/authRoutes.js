const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

router.post("/register", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      address,
      username,
      password
    } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    const userResult = await db.query(
      `
      INSERT INTO users(
        full_name,
        phone,
        email,
        address
      )
      VALUES($1,$2,$3,$4)
      RETURNING user_id
      `,
      [full_name, phone, email, address]
    );

    const user_id = userResult.rows[0].user_id;

    const accResult = await db.query(
      `
      INSERT INTO accounts(
        user_id,
        username,
        password,
        role,
        status
      )
      VALUES($1,$2,$3,'customer','active')
      RETURNING account_id
      `,
      [user_id, username, hashPassword]
    );

    const account_id = accResult.rows[0].account_id;
    await db.query(`INSERT INTO cart(account_id) VALUES($1)`, [account_id]);

    res.json({
      message: "Đăng ký thành công"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/login", async (req, res) => {
  try {

    const { username, password } = req.body;

    const result = await db.query(
      `
      SELECT *
      FROM accounts
      WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Sai tài khoản"
      });
    }

    const account = result.rows[0];

    const match = await bcrypt.compare(
      password,
      account.password
    );

    if (!match) {
      return res.status(401).json({
        message: "Sai mật khẩu"
      });
    }

    const token = jwt.sign(
      {
        account_id: account.account_id,
        role: account.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      token,
      account_id: account.account_id,
      username: account.username,
      role: account.role
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;