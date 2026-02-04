-- Sample table sessions and orders for testing
-- Create active sessions for tables 1 and 2
INSERT INTO table_sessions (table_id, start_time, is_active) VALUES 
(1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', TRUE),
(2, CURRENT_TIMESTAMP - INTERVAL '15 minutes', TRUE);

-- Get the session IDs (these would be generated automatically)
-- For demo purposes, we'll use the first two sessions created

-- Sample orders for table 1 session
INSERT INTO orders (session_id, table_id, store_id, order_time, total_amount, status) VALUES 
((SELECT session_id FROM table_sessions WHERE table_id = 1 AND is_active = TRUE), 1, 1, CURRENT_TIMESTAMP - INTERVAL '25 minutes', 9000, '완료'),
((SELECT session_id FROM table_sessions WHERE table_id = 1 AND is_active = TRUE), 1, 1, CURRENT_TIMESTAMP - INTERVAL '10 minutes', 11500, '준비중');

-- Sample orders for table 2 session  
INSERT INTO orders (session_id, table_id, store_id, order_time, total_amount, status) VALUES 
((SELECT session_id FROM table_sessions WHERE table_id = 2 AND is_active = TRUE), 2, 1, CURRENT_TIMESTAMP - INTERVAL '12 minutes', 7500, '대기중');

-- Sample order items for the orders above
-- Order 1 (table 1, first order): 아메리카노 x2
INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES 
(1, 1, 2, 4500);

-- Order 2 (table 1, second order): 카페라떼 x1, 치즈케이크 x1  
INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES 
(2, 2, 1, 5000),
(2, 8, 1, 6500);

-- Order 3 (table 2): 카푸치노 x1, 마카롱 x1
INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES 
(3, 3, 1, 5500),
(3, 10, 1, 2000);

-- Sample completed session and order history
INSERT INTO table_sessions (table_id, start_time, end_time, is_active) VALUES 
(3, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', FALSE);

-- Sample order history data
INSERT INTO order_history (session_id, table_id, store_id, completed_time, archived_order_data) VALUES 
((SELECT session_id FROM table_sessions WHERE table_id = 3 AND is_active = FALSE), 3, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 
'{"orders": [{"order_id": 100, "order_time": "2026-02-04T12:00:00", "total_amount": 13000, "status": "완료", "items": [{"menu_name": "아메리카노", "quantity": 2, "unit_price": 4500}, {"menu_name": "시저샐러드", "quantity": 1, "unit_price": 8500}]}], "session_total": 13000}');
