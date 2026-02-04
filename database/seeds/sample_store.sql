-- Sample store data for testing
INSERT INTO stores (store_name, admin_username, admin_password_hash) VALUES 
('카페 모카', 'admin', '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'); -- password: 1234

-- Sample categories
INSERT INTO categories (store_id, category_name, display_order) VALUES 
(1, '커피', 1),
(1, '음료', 2),
(1, '디저트', 3),
(1, '샐러드', 4);

-- Sample menus
INSERT INTO menus (store_id, category_id, menu_name, price, description, display_order) VALUES 
-- 커피 카테고리
(1, 1, '아메리카노', 4500, '깔끔하고 진한 에스프레소의 맛', 1),
(1, 1, '카페라떼', 5000, '부드러운 우유와 에스프레소의 조화', 2),
(1, 1, '카푸치노', 5500, '풍성한 우유 거품이 올라간 커피', 3),
(1, 1, '바닐라라떼', 5500, '달콤한 바닐라 시럽이 들어간 라떼', 4),

-- 음료 카테고리
(1, 2, '레몬에이드', 4000, '상큼한 레몬의 맛', 1),
(1, 2, '자몽주스', 4500, '새콤달콤한 자몽 주스', 2),
(1, 2, '아이스티', 3500, '시원한 홍차', 3),

-- 디저트 카테고리
(1, 3, '치즈케이크', 6000, '진한 치즈의 맛이 일품인 케이크', 1),
(1, 3, '초콜릿케이크', 5500, '달콤한 초콜릿 케이크', 2),
(1, 3, '마카롱', 2500, '프랑스 전통 디저트', 3),

-- 샐러드 카테고리
(1, 4, '시저샐러드', 8500, '신선한 로메인과 파마산 치즈', 1),
(1, 4, '그린샐러드', 7000, '각종 신선한 채소', 2);

-- Sample tables (master password: 1234)
INSERT INTO tables (store_id, table_number, table_password_hash) VALUES
(1, 1, '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'), -- password: 1234
(1, 2, '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'), -- password: 1234
(1, 3, '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'), -- password: 1234
(1, 4, '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'), -- password: 1234
(1, 5, '$2b$12$vHPsQlx3Nj8k7q4P7y1IIuC0mwbhr12.8KPzPnGOey1IAx0ILHslG'); -- password: 1234
