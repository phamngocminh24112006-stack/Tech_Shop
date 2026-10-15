/*===================================================================
II. NHÓM TRUY VẤN PHÂN TÍCH & BÁO CÁO (BI)
===================================================================*/

-- 1. INSERT: Thêm sản phẩm mới (...)
INSERT INTO Product (name, brand, category, price, stock_quantity) 
VALUES ('Laptop Gaming X1', 'TechCorp', 'Electronics', 25000000, 50);

-- 2. UPDATE: Tăng giá 10% danh mục Electronics (....)
UPDATE Product 
SET price = price * 1.1 
WHERE category = 'Electronics';

-- 3. DELETE: Xóa đơn hủy quá 48 giờ (...)
DELETE FROM orders 
WHERE delivery_status = 'Cancelled' 
AND order_date < CURRENT_TIMESTAMP - INTERVAL '48 hours';

-- 4. Function: Lấy danh sách sản phẩm theo từ khóa (M)
CREATE OR REPLACE FUNCTION search_products(p_keyword VARCHAR) 
RETURNS TABLE(name VARCHAR, price DECIMAL) 
AS $$
BEGIN
    RETURN QUERY 
    SELECT p.name, p.price 
    FROM product p 
    WHERE p.name ILIKE '%' || p_keyword || '%';
END;
$$ LANGUAGE plpgsql;

-- 5. Xếp hạng khách hàng theo số tiền đã chi tiêu (Th)
WITH CustomerStats AS (
    SELECT u.user_id, u.full_name, COUNT(o.order_id) AS total_orders, SUM(o.total_amount) AS lifetime_value
    FROM users u
    JOIN accounts a ON u.user_id = a.user_id
    JOIN orders o ON a.account_id = o.account_id
    WHERE o.delivery_status = 'delivered'
    GROUP BY u.user_id, u.full_name
)
SELECT user_id, full_name, total_orders, lifetime_value,
    CASE
        WHEN lifetime_value >= 50000000 THEN 'S-VIP'
        WHEN lifetime_value >= 20000000 THEN 'S-Member'
        ELSE 'S-New'
    END AS membership_tier
FROM CustomerStats 
ORDER BY lifetime_value DESC;

-- 6. Tìm khách hàng có giỏ hàng chờ quá 24h (Th)
SELECT u.full_name, u.email, c.create_at AS cart_created_date
FROM users u
JOIN accounts a ON u.user_id = a.user_id
JOIN cart c ON a.account_id = c.account_id
LEFT JOIN orders o ON a.account_id = o.account_id AND o.order_date >= c.create_at
WHERE o.order_id IS NULL AND c.create_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY u.full_name, u.email, c.create_at
ORDER BY cart_created_date ASC;

-- 7. Phân tích khoảng giá (L)
SELECT 
    CASE 
        WHEN p.price < 5000000 THEN 'Dưới 5 Triệu (Giá rẻ)'
        WHEN p.price BETWEEN 5000000 AND 15000000 THEN '5 - 15 Triệu (Tầm trung)'
        WHEN p.price BETWEEN 15000000 AND 25000000 THEN '15 - 25 Triệu (Cận cao cấp)'
        ELSE 'Trên 25 Triệu (Cao cấp)'
    END AS price_segment,
    COUNT(oi.product_id) AS total_units_sold,
    SUM(oi.quantity * oi.unit_price) AS total_segment_revenue
FROM order_item oi
JOIN product p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.delivery_status = 'delivered'
GROUP BY price_segment
ORDER BY total_segment_revenue DESC;

-- 8. Tìm cặp sản phẩm thường xuyên được mua cùng nhau (Th)
SELECT p1.name AS product_a, p2.name AS product_b, COUNT(*) AS times_appeared_together
FROM cart_item ci1
JOIN cart_item ci2 ON ci1.cart_id = ci2.cart_id AND ci1.product_id < ci2.product_id
JOIN product p1 ON ci1.product_id = p1.product_id
JOIN product p2 ON ci2.product_id = p2.product_id
GROUP BY p1.name, p2.name 
ORDER BY times_appeared_together DESC LIMIT 5;

-- 9. Danh sách thiết bị sắp hết hạn bảo hành trong 30 ngày tới (Th)
SELECT o.order_id, u.full_name, p.name AS product_name, 
       (o.order_date + (p.warranty_period || ' months')::INTERVAL) AS expiration_date
FROM orders o
JOIN accounts a ON o.account_id = a.account_id
JOIN users u ON a.user_id = u.user_id
JOIN order_item oi ON o.order_id = oi.order_id
JOIN product p ON oi.product_id = p.product_id
WHERE o.delivery_status = 'delivered'
  AND (o.order_date + (p.warranty_period || ' months')::INTERVAL) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- 10. Truy vấn: Tìm các tài khoản đã đăng ký nhưng chưa bao giờ đăng nhập hoặc tương tác (Tr)
SELECT * FROM users u 
LEFT JOIN accounts a ON u.user_id = a.user_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM orders o 
    WHERE o.account_id = a.account_id);

-- 11. Sản phẩm có đánh giá trung bình cao (L)
SELECT p.product_id, p.name, ROUND(AVG(r.rating), 2) AS avg_rating
FROM product p 
JOIN review r ON p.product_id = r.product_id
GROUP BY p.product_id, p.name 
HAVING COUNT(*) >= 5 
ORDER BY avg_rating DESC LIMIT 3;

-- 12. Hiệu suất giao hàng của Shipper (Tr)
SELECT s.shipper_name, COUNT(o.order_id) AS total_orders,
       ROUND(SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(o.order_id), 0), 2) AS success_rate
FROM shippers s 
LEFT JOIN orders o ON s.shipper_id = o.shipper_id
GROUP BY s.shipper_name 
ORDER BY success_rate DESC;

-- 13. Thống kê số lượng đơn hàng theo từng trạng thái (M)
SELECT delivery_status, COUNT(*) AS count 
FROM orders 
GROUP BY delivery_status;

-- 14. Function: Lấy tổng chi tiêu của một tài khoản (M)
CREATE OR REPLACE FUNCTION get_account_total_spend(p_account_id INT) 
RETURNS DECIMAL AS $$
DECLARE total DECIMAL;
BEGIN
    SELECT SUM(total_amount) 
    INTO total 
    FROM orders 
    WHERE account_id = p_account_id AND delivery_status = 'delivered';
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- 15. Function: Báo cáo sản phẩm theo hãng (Tr)
CREATE OR REPLACE FUNCTION get_sales_by_brand(p_brand_name VARCHAR)
RETURNS TABLE (product_name VARCHAR, total_quantity_sold BIGINT) AS $$
BEGIN
    RETURN QUERY 
    SELECT p.name, SUM(oi.quantity) 
    FROM product p
    JOIN order_item oi ON p.product_id = oi.product_id
    WHERE p.brand = p_brand_name 
    GROUP BY p.product_id, p.name 
    ORDER BY SUM(oi.quantity) DESC;
END;
$$ LANGUAGE plpgsql;

-- 16. Function: Doanh số các tháng trong năm (M)
CREATE OR REPLACE FUNCTION get_annual_revenue_report(p_year INT)
RETURNS TABLE (month INT, revenue DECIMAL) 
AS $$
BEGIN
    RETURN QUERY 
    SELECT EXTRACT(MONTH FROM order_date)::INT, SUM(total_amount)
    FROM orders 
    WHERE EXTRACT(YEAR FROM order_date) = p_year AND delivery_status = 'Delivered'
    GROUP BY EXTRACT(MONTH FROM order_date) 
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- 17. Function: Dọn dẹp giỏ hàng cũ quá 7 ngày (M)
CREATE OR REPLACE FUNCTION cleanup_old_carts() RETURNS VOID AS $$
BEGIN
    DELETE FROM cart_item WHERE cart_id IN (SELECT cart_id FROM cart WHERE create_at < CURRENT_DATE - INTERVAL '7 days');
    DELETE FROM cart WHERE create_at < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

/*==================================================================
III. NHÓM TRIGGER KIỂM SOÁT DỮ LIỆU
===================================================================*/
-- 18. Trigger: Đảm bảo Email không bị trùng lặp (M)
CREATE OR REPLACE FUNCTION check_email_unique() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE email = NEW.email AND user_id <> COALESCE(NEW.user_id,0)) THEN
        RAISE EXCEPTION 'Email da ton tai';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_email BEFORE INSERT OR UPDATE ON Users FOR EACH ROW EXECUTE FUNCTION check_email_unique();

-- 19. Trigger: Đánh giá phải trong khoảng 1-5 sao (M)
CREATE OR REPLACE FUNCTION check_rating() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN RAISE EXCEPTION 'Rating phai trong khoang 1-5'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_rating BEFORE INSERT OR UPDATE ON Review FOR EACH ROW EXECUTE FUNCTION check_rating();

-- 20. Trigger: Chặn xóa sản phẩm đã có lịch sử giao dịch (M)
CREATE OR REPLACE FUNCTION prevent_delete_product() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM Order_Item WHERE product_id = OLD.product_id) THEN
        RAISE EXCEPTION 'San pham da phat sinh giao dich';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_prevent_delete_product BEFORE DELETE ON Product FOR EACH ROW EXECUTE FUNCTION prevent_delete_product();

-- 21. Trigger: Kiểm tra tồn kho trước khi thêm vào giỏ (L)
CREATE OR REPLACE FUNCTION check_cart_quantity() RETURNS TRIGGER AS $$
DECLARE current_stock INT;
BEGIN
    SELECT stock_quantity INTO current_stock FROM Product WHERE product_id = NEW.product_id;
    IF NEW.quantity > current_stock THEN RAISE EXCEPTION 'Khong du hang, ton kho: %', current_stock; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_cart_quantity BEFORE INSERT OR UPDATE ON Cart_Item FOR EACH ROW EXECUTE FUNCTION check_cart_quantity();

-- 22. Trigger: Chỉ cho phép đánh giá sản phẩm đã mua (Tr)
CREATE OR REPLACE FUNCTION check_review_permission() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Orders o JOIN Order_Item oi ON o.order_id = oi.order_id 
                   WHERE o.account_id = NEW.account_id AND oi.product_id = NEW.product_id) THEN
        RAISE EXCEPTION 'Chi duoc danh gia san pham da mua';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_review_permission BEFORE INSERT ON Review FOR EACH ROW EXECUTE FUNCTION check_review_permission();

-- 23. Trigger: Không cho phép sửa địa chỉ đơn hàng đã giao (L)
CREATE OR REPLACE FUNCTION prevent_edit_address() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.delivery_status = 'Delivered' THEN RAISE EXCEPTION 'Da giao hang, khong the sua dia chi'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_lock_address BEFORE UPDATE OF receiver_address ON Orders FOR EACH ROW EXECUTE FUNCTION prevent_edit_address();

-- 24. Trigger: Thông báo nếu tồn kho thấp (Tr)
CREATE OR REPLACE FUNCTION notify_low_stock() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity < 2 THEN RAISE NOTICE 'Canh bao: San pham % sap het hang!', NEW.name; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_notify_stock AFTER UPDATE ON Product FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- 25. Trigger: Ngăn chặn xóa tài khoản có đơn hàng đang xử lý (M)
CREATE OR REPLACE FUNCTION prevent_delete_account() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM orders WHERE account_id = OLD.account_id AND delivery_status IN ('Pending', 'Shipping')) THEN
        RAISE EXCEPTION 'Tai khoan dang co don hang chua hoan tat';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_prevent_del_acc BEFORE DELETE ON Accounts FOR EACH ROW EXECUTE FUNCTION prevent_delete_account();

-- 26. Chặn cập nhật order_item khi đơn hàng đang vận chuyển (Tr)
CREATE OR REPLACE FUNCTION prevent_order_item_modification()
RETURNS TRIGGER AS $$
DECLARE
    v_order_status VARCHAR;
BEGIN
    SELECT delivery_status 
    INTO v_order_status
    FROM orders
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    IF v_order_status IN ('Shipping', 'Delivered') THEN
        RAISE EXCEPTION 'Khong the thay doi chi tiet don hang khi dang giao hoac da giao (Trang thai: %)', v_order_status;
    END IF;
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_lock_order_item
BEFORE INSERT OR UPDATE OR DELETE ON order_item
FOR EACH ROW EXECUTE FUNCTION prevent_order_item_modification();
/*===================================================================
IV. NHÓM TRIGGER TỰ ĐỘNG HÓA (AUTOMATION)
===================================================================*/

-- 27. Trigger: Tự động trừ tồn kho khi mua hàng (Th)
CREATE OR REPLACE FUNCTION decrease_stock_after_order() RETURNS TRIGGER AS $$
BEGIN
    UPDATE Product SET stock_quantity = stock_quantity - NEW.quantity WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_decrease_stock AFTER INSERT ON Order_Item FOR EACH ROW EXECUTE FUNCTION decrease_stock_after_order();

-- 28. Trigger: Tự động chuyển trạng thái đơn hàng khi thanh toán (L)
CREATE OR REPLACE FUNCTION auto_update_order_status() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'Completed' THEN
        UPDATE orders SET delivery_status = 'Shipping' WHERE order_id = NEW.order_id AND delivery_status = 'Pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_auto_ship AFTER UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION auto_update_order_status();

-- 29. Trigger: Hàm tính tổng tiền cho order (L)
CREATE OR REPLACE FUNCTION recalc_order_total() RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM order_item
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_total_amount
AFTER INSERT OR UPDATE OR DELETE ON order_item
FOR EACH ROW EXECUTE FUNCTION recalc_order_total();

-- 30. Trigger: Tự động ghi nhận thời gian hoàn tất đơn hàng (Tr)
CREATE OR REPLACE FUNCTION set_delivery_completion_time() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'Delivered' AND OLD.delivery_status <> 'Delivered' THEN
        NEW.delivered_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_delivery_time 
BEFORE UPDATE OF delivery_status ON orders 
FOR EACH ROW 
WHEN (NEW.delivery_status = 'Delivered')
EXECUTE FUNCTION set_delivery_completion_time();

-- 30b. Trigger: Tự động cộng lại tồn kho khi hủy đơn hàng (Th)
CREATE OR REPLACE FUNCTION restore_stock_after_cancel() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'Cancelled' AND OLD.delivery_status <> 'Cancelled' THEN
        UPDATE Product p
        SET stock_quantity = p.stock_quantity + oi.quantity
        FROM order_item oi
        WHERE oi.order_id = NEW.order_id AND p.product_id = oi.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE OF delivery_status ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_stock_after_cancel();

/*===================================================================
V. NHÓM TRUY VẤN WEBSITE BÁN HÀNG (E-COMMERCE)
===================================================================*/

-- 31. Danh mục sản phẩm và thống kê
SELECT category, COUNT(*) AS product_count, MIN(price) AS min_price, MAX(price) AS max_price
FROM product
WHERE category IS NOT NULL
GROUP BY category
ORDER BY product_count DESC;

-- 32. Sản phẩm bán chạy nhất
SELECT p.product_id, p.name, p.brand, p.category, p.price,
       COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM product p
LEFT JOIN order_item oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.delivery_status = 'Delivered'
GROUP BY p.product_id, p.name, p.brand, p.category, p.price
ORDER BY total_sold DESC
LIMIT 10;

-- 33. Sản phẩm mới về
SELECT * FROM product ORDER BY product_id DESC LIMIT 10;

-- 34. Sản phẩm liên quan (cùng danh mục)
SELECT p.* FROM product p
WHERE p.category = (SELECT category FROM product WHERE product_id = 1)
  AND p.product_id <> 1
LIMIT 6;

-- 35. Danh sách thương hiệu
SELECT brand, COUNT(*) AS product_count FROM product
WHERE brand IS NOT NULL GROUP BY brand ORDER BY product_count DESC;

-- 36. Sản phẩm giá tốt (5-20 triệu)
SELECT * FROM product
WHERE price BETWEEN 5000000 AND 20000000 AND stock_quantity > 0
ORDER BY price ASC LIMIT 10;

-- 37. Tìm kiếm nâng cao (tên + danh mục + khoảng giá)
SELECT * FROM product
WHERE name ILIKE '%iPhone%'
  AND category = 'Phone'
  AND price BETWEEN 10000000 AND 35000000
ORDER BY price ASC;

-- 38. Flash sale - sản phẩm sắp hết hàng
SELECT product_id, name, price, stock_quantity FROM product
WHERE stock_quantity BETWEEN 1 AND 10
ORDER BY stock_quantity ASC;

-- 39. Sản phẩm thường mua kèm
SELECT p.name, COUNT(*) AS bought_together
FROM order_item oi1
JOIN order_item oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
JOIN product p ON oi2.product_id = p.product_id
WHERE oi1.product_id = 1
GROUP BY p.name ORDER BY bought_together DESC LIMIT 5;

-- 40. Hạng thành viên S-Member của tài khoản
WITH spend AS (
  SELECT COALESCE(SUM(total_amount), 0) AS lifetime_value
  FROM orders WHERE account_id = 1 AND delivery_status = 'Delivered'
)
SELECT lifetime_value,
  CASE
    WHEN lifetime_value >= 50000000 THEN 'S-VIP'
    WHEN lifetime_value >= 20000000 THEN 'S-Member'
    ELSE 'S-New'
  END AS membership_tier
FROM spend;