# Table Order Service - Database Unit

## Overview
Unit 4 implements the database schema for the table order service, providing data persistence for all system entities.

## Database Schema

### Tables
- **stores**: 매장 정보
- **categories**: 메뉴 카테고리
- **menus**: 메뉴 정보
- **tables**: 테이블 정보
- **table_sessions**: 테이블 세션 관리
- **orders**: 주문 정보
- **order_items**: 주문 항목
- **order_history**: 주문 이력

### Key Features
- Multi-tenant data isolation by store_id
- UUID-based session tracking
- Automatic session management with triggers
- Optimized indexes for performance
- JSONB storage for order history

## Files Structure
```
database/
├── schema/
│   └── schema.sql              # Complete database schema
├── migrations/
│   ├── env.py                  # Alembic configuration
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_add_indexes.py
└── seeds/
    ├── sample_store.sql        # Sample store and basic data
    ├── sample_menus.sql        # Additional menu samples
    └── sample_tables.sql       # Sample sessions and orders
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install alembic psycopg2-binary
```

### 2. Configure Database
Set environment variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost/tableorder"
```

### 3. Run Migrations
```bash
cd database
alembic upgrade head
```

### 4. Load Sample Data
```bash
psql $DATABASE_URL -f seeds/sample_store.sql
psql $DATABASE_URL -f seeds/sample_menus.sql  
psql $DATABASE_URL -f seeds/sample_tables.sql
```

## Database Relationships
- Store 1:N Categories, Menus, Tables
- Table 1:N TableSessions
- TableSession 1:N Orders
- Order 1:N OrderItems
- Menu 1:N OrderItems

## Performance Features
- Indexes on all foreign keys
- Partial index on active sessions
- Time-based indexes for queries
- Triggers for session management
