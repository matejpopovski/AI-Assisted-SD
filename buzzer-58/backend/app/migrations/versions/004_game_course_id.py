"""Add course_id column to games

Revision ID: 004
Revises: 003
Create Date: 2026-09-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "games",
        sa.Column("course_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_games_course_id",
        "games",
        "courses",
        ["course_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_games_course_id", "games", type_="foreignkey")
    op.drop_column("games", "course_id")
