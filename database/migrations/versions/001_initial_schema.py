"""Initial schema migration for table order service"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create stores table
    op.create_table('stores',
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('store_name', sa.String(length=100), nullable=False),
        sa.Column('admin_username', sa.String(length=50), nullable=False),
        sa.Column('admin_password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('store_id'),
        sa.UniqueConstraint('admin_username')
    )

    # Create categories table
    op.create_table('categories',
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('category_name', sa.String(length=50), nullable=False),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['store_id'], ['stores.store_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('category_id'),
        sa.UniqueConstraint('store_id', 'category_name')
    )

    # Create menus table
    op.create_table('menus',
        sa.Column('menu_id', sa.Integer(), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('menu_name', sa.String(length=100), nullable=False),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_base64', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint('price > 0', name='check_menu_price_positive'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.category_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.store_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('menu_id')
    )

    # Create tables table
    op.create_table('tables',
        sa.Column('table_id', sa.Integer(), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('table_password_hash', sa.String(length=255), nullable=False),
        sa.Column('current_session_id', postgresql.UUID(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['store_id'], ['stores.store_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('table_id'),
        sa.UniqueConstraint('store_id', 'table_number')
    )

    # Create table_sessions table
    op.create_table('table_sessions',
        sa.Column('session_id', postgresql.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('table_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('end_time', sa.TIMESTAMP(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.ForeignKeyConstraint(['table_id'], ['tables.table_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('session_id')
    )

    # Create orders table
    op.create_table('orders',
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('session_id', postgresql.UUID(), nullable=False),
        sa.Column('table_id', sa.Integer(), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('order_time', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('total_amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='대기중', nullable=True),
        sa.CheckConstraint('total_amount > 0', name='check_order_total_positive'),
        sa.CheckConstraint("status IN ('대기중', '준비중', '완료')", name='check_order_status_valid'),
        sa.ForeignKeyConstraint(['session_id'], ['table_sessions.session_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.store_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['table_id'], ['tables.table_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('order_id')
    )

    # Create order_items table
    op.create_table('order_items',
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('menu_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Integer(), nullable=False),
        sa.CheckConstraint('quantity > 0', name='check_quantity_positive'),
        sa.CheckConstraint('unit_price > 0', name='check_unit_price_positive'),
        sa.ForeignKeyConstraint(['menu_id'], ['menus.menu_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.order_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('order_item_id')
    )

    # Create order_history table
    op.create_table('order_history',
        sa.Column('history_id', sa.Integer(), nullable=False),
        sa.Column('session_id', postgresql.UUID(), nullable=False),
        sa.Column('table_id', sa.Integer(), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('completed_time', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('archived_order_data', postgresql.JSONB(), nullable=False),
        sa.PrimaryKeyConstraint('history_id')
    )

def downgrade():
    op.drop_table('order_history')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('table_sessions')
    op.drop_table('tables')
    op.drop_table('menus')
    op.drop_table('categories')
    op.drop_table('stores')
