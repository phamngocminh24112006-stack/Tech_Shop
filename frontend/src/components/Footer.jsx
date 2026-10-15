

function Footer() {
  return (
    <footer className="glass-panel mt-auto py-5" style={{ borderRadius: "16px 16px 0 0", borderBottom: "none", borderLeft: "none", borderRight: "none" }}>
      <div className="container-main">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <h5 className="gradient-text fs-4 mb-3" style={{ fontFamily: "var(--heading)", fontWeight: "800" }}>TechShop</h5>
            <p className="text-white-50 mb-3" style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
              Nền tảng mua sắm linh kiện máy tính và thiết bị công nghệ chính hãng hàng đầu Việt Nam. Chất lượng và dịch vụ chuẩn mực.
            </p>
            <span className="text-white-50" style={{ fontSize: "0.85rem" }}>
              &copy; {new Date().getFullYear()} TechShop Inc. All rights reserved.
            </span>
          </div>
          
          <div className="col-6 col-md-4">
            <h6 className="text-white mb-3" style={{ fontFamily: "var(--heading)", fontWeight: "600" }}>Danh mục sản phẩm</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-white-50" style={{ fontSize: "0.9rem" }}>
              <li>Laptop & Gaming Gear</li>
              <li>Card đồ họa (VGA)</li>
              <li>Bộ vi xử lý (CPU)</li>
              <li>Bộ nhớ RAM & SSD</li>
            </ul>
          </div>
          
          <div className="col-6 col-md-4">
            <h6 className="text-white mb-3" style={{ fontFamily: "var(--heading)", fontWeight: "600" }}>Thông tin liên hệ</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-white-50" style={{ fontSize: "0.9rem" }}>
              <li className="d-flex align-items-center gap-2">
                <span>📍</span>
                <span>Hà Nội, Việt Nam</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <span>📞</span>
                <span>Hotline: 1800 1234</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <span>✉️</span>
                <span>support@techshop.vn</span>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="my-4" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
        
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center text-white-50" style={{ fontSize: "0.85rem" }}>
          <div>
            <span>Database Lab Project - Spring 2026</span>
          </div>
          <div className="d-flex gap-3 mt-2 mt-sm-0">
            <span>Chính sách bảo mật</span>
            <span>Điều khoản dịch vụ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
