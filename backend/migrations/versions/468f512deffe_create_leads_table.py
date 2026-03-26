"""create leads table

Revision ID: 468f512deffe
Revises:
Create Date: 2026-03-26 23:04:29.972640

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '468f512deffe'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('leads',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('leads', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_leads_email'), ['email'], unique=True)


def downgrade():
    with op.batch_alter_table('leads', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_leads_email'))

    op.drop_table('leads')
