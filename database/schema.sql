/* Schema TechShop - dùng với PostgreSQL local (không dùng tech_shop.sql) */
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    address VARCHAR(225)
);

CREATE TABLE IF NOT EXISTS shippers (
    shipper_id SERIAL PRIMARY KEY,
    shipper_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS supplier (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    brand VARCHAR(50),
    category VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    warranty_period INT,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
    account_id SERIAL PRIMARY KEY,
    user_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart (
    cart_id SERIAL PRIMARY KEY,
    account_id INT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    account_id INT,
    shipper_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10,2) NOT NULL,
    receiver_address VARCHAR(255),
    receiver_phone VARCHAR(15),
    delivery_status VARCHAR(50) DEFAULT 'Pending',
    delivered_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_item (
    cart_id INT,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS order_item (
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS review (
    account_id INT,
    product_id INT,
    rating NUMERIC(2,1),
    comment TEXT,
    PRIMARY KEY (account_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory (
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    supplier_id INT,
    product_id INT,
    quantity INT NOT NULL,
    PRIMARY KEY (supplier_id, product_id, create_at)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_accounts_user') THEN
    ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_account') THEN
    ALTER TABLE cart ADD CONSTRAINT fk_cart_account FOREIGN KEY (account_id) REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_item_cart') THEN
    ALTER TABLE cart_item ADD CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES cart(cart_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_item_product') THEN
    ALTER TABLE cart_item ADD CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES product(product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_account') THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_account FOREIGN KEY (account_id) REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_shipper') THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_shipper FOREIGN KEY (shipper_id) REFERENCES shippers(shipper_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_item_order') THEN
    ALTER TABLE order_item ADD CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(order_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_item_product') THEN
    ALTER TABLE order_item ADD CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_order') THEN
    ALTER TABLE payments ADD CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_review_account') THEN
    ALTER TABLE review ADD CONSTRAINT fk_review_account FOREIGN KEY (account_id) REFERENCES accounts(account_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_review_product') THEN
    ALTER TABLE review ADD CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES product(product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_product') THEN
    ALTER TABLE inventory ADD CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_supplier') THEN
    ALTER TABLE inventory ADD CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE CASCADE;
  END IF;
END $$;
