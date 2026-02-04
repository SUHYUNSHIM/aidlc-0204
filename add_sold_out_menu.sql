-- 매진 메뉴 추가 (테스트용)
-- 관리자 PowerShell에서 실행:
-- docker exec -it tableorder-postgres psql -U tableorder -d tableorder_db -f /path/to/this/file.sql

-- 또는 직접 실행:
-- docker exec -it tableorder-postgres psql -U tableorder -d tableorder_db

-- 매진 메뉴 추가 (커피 카테고리에 품절 메뉴 추가)
INSERT INTO menus (store_id, category_id, menu_name, price, description, display_order) 
VALUES 
(1, 1, '시그니처 블렌드 (품절)', 6000, '한정 수량으로 제공되는 특별한 블렌드 커피', 99);

-- 확인
SELECT menu_id, menu_name, price, category_id FROM menus WHERE menu_name LIKE '%품절%';
