"""Add indexes and triggers for performance optimization"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '002_add_indexes'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    # Create indexes for performance
    op.create_index('idx_categories_store_id', 'categories', ['store_id'])
    op.create_index('idx_menus_store_id', 'menus', ['store_id'])
    op.create_index('idx_menus_category_id', 'menus', ['category_id'])
    op.create_index('idx_tables_store_id', 'tables', ['store_id'])
    op.create_index('idx_table_sessions_table_id', 'table_sessions', ['table_id'])
    op.create_index('idx_table_sessions_active', 'table_sessions', ['is_active'], 
                   postgresql_where=sa.text('is_active = TRUE'))
    op.create_index('idx_orders_session_id', 'orders', ['session_id'])
    op.create_index('idx_orders_table_id', 'orders', ['table_id'])
    op.create_index('idx_orders_store_id', 'orders', ['store_id'])
    op.create_index('idx_orders_time', 'orders', ['order_time'])
    op.create_index('idx_order_items_order_id', 'order_items', ['order_id'])
    op.create_index('idx_order_history_store_id', 'order_history', ['store_id'])
    op.create_index('idx_order_history_table_id', 'order_history', ['table_id'])
    op.create_index('idx_order_history_time', 'order_history', ['completed_time'])

    # Create trigger functions
    op.execute("""
        CREATE OR REPLACE FUNCTION update_table_current_session()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_active = TRUE THEN
                UPDATE tables SET current_session_id = NEW.session_id WHERE table_id = NEW.table_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION clear_table_current_session()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
                UPDATE tables SET current_session_id = NULL WHERE table_id = NEW.table_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create triggers
    op.execute("""
        CREATE TRIGGER trigger_update_table_current_session
            AFTER INSERT ON table_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_table_current_session();
    """)

    op.execute("""
        CREATE TRIGGER trigger_clear_table_current_session
            AFTER UPDATE ON table_sessions
            FOR EACH ROW
            EXECUTE FUNCTION clear_table_current_session();
    """)

def downgrade():
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS trigger_clear_table_current_session ON table_sessions;")
    op.execute("DROP TRIGGER IF EXISTS trigger_update_table_current_session ON table_sessions;")
    
    # Drop trigger functions
    op.execute("DROP FUNCTION IF EXISTS clear_table_current_session();")
    op.execute("DROP FUNCTION IF EXISTS update_table_current_session();")
    
    # Drop indexes
    op.drop_index('idx_order_history_time')
    op.drop_index('idx_order_history_table_id')
    op.drop_index('idx_order_history_store_id')
    op.drop_index('idx_order_items_order_id')
    op.drop_index('idx_orders_time')
    op.drop_index('idx_orders_store_id')
    op.drop_index('idx_orders_table_id')
    op.drop_index('idx_orders_session_id')
    op.drop_index('idx_table_sessions_active')
    op.drop_index('idx_table_sessions_table_id')
    op.drop_index('idx_tables_store_id')
    op.drop_index('idx_menus_category_id')
    op.drop_index('idx_menus_store_id')
    op.drop_index('idx_categories_store_id')
