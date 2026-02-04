-- Table Order Service Database Schema
-- Unit 4: Database Schema Implementation

-- Store table - 매장 정보
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    admin_username VARCHAR(50) NOT NULL UNIQUE,
    admin_password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category table - 카테고리 정보
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    category_name VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, category_name)
);

-- Menu table - 메뉴 정보
CREATE TABLE menus (
    menu_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    menu_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    description TEXT,
    image_base64 TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table table - 테이블 정보
CREATE TABLE tables (
    table_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_password_hash VARCHAR(255) NOT NULL,
    current_session_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, table_number)
);

-- TableSession table - 테이블 세션
CREATE TABLE table_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id INTEGER NOT NULL REFERENCES tables(table_id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Order table - 주문 정보
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES table_sessions(session_id) ON DELETE CASCADE,
    table_id INTEGER NOT NULL REFERENCES tables(table_id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount INTEGER NOT NULL CHECK (total_amount > 0),
    status VARCHAR(20) DEFAULT '대기중' CHECK (status IN ('대기중', '준비중', '완료'))
);

-- OrderItem table - 주문 항목
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0)
);

-- OrderHistory table - 주문 이력
CREATE TABLE order_history (
    history_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    table_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    completed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_order_data JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_menus_store_id ON menus(store_id);
CREATE INDEX idx_menus_category_id ON menus(category_id);
CREATE INDEX idx_tables_store_id ON tables(store_id);
CREATE INDEX idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX idx_table_sessions_active ON table_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_time ON orders(order_time);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_history_store_id ON order_history(store_id);
CREATE INDEX idx_order_history_table_id ON order_history(table_id);
CREATE INDEX idx_order_history_time ON order_history(completed_time);

-- Update current_session_id when new session is created
CREATE OR REPLACE FUNCTION update_table_current_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NEW.session_id WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_table_current_session
    AFTER INSERT ON table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_table_current_session();

-- Clear current_session_id when session ends
CREATE OR REPLACE FUNCTION clear_table_current_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NULL WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clear_table_current_session
    AFTER UPDATE ON table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION clear_table_current_session();
