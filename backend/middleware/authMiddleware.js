const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({
      message: "Chưa đăng nhập"
    });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch(err) {
    res.status(401).json({
      message: "Token không hợp lệ"
    });
  }
};

auth.admin = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({
        message: "Không có quyền truy cập admin"
      });
    }
  });
};

module.exports = auth;