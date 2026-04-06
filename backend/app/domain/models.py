from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.infrastructure.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    action = Column(String(255), nullable=False, index=True)
    candidate_id = Column(String(255))
    job_id = Column(String(255))
    score = Column(DECIMAL(5, 2))
    details = Column(JSONB)
