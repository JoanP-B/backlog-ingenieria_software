"""Esquema inicial: users, candidates, jobs, audit_logs

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-25

Refleja el esquema base de la aplicación (equivalente a db_init/init.sql y a los
modelos SQLAlchemy en app/domain/models.py).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("candidate_key", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_candidates_user_id", "candidates", ["user_id"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=255), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("salary", sa.String(length=100), nullable=True),
        sa.Column("min_experience_years", sa.Integer(), nullable=True),
        sa.Column("required_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("functions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("offerings", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("closing", sa.String(), nullable=True),
        sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=255), nullable=True),
        sa.Column("score", sa.DECIMAL(precision=5, scale=2), nullable=True),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_candidate_id", "audit_logs", ["candidate_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("jobs")
    op.drop_table("candidates")
    op.drop_table("users")
