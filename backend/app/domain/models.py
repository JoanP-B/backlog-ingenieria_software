from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, text, Boolean, ForeignKey
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


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    skills = Column(JSONB, nullable=False)
    experience_years = Column(Integer)
    candidate_key = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    action = Column(String(255), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(255))
    score = Column(DECIMAL(5, 2))
    details = Column(JSONB)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(255), primary_key=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    salary = Column(String(100))
    min_experience_years = Column(Integer)
    required_skills = Column(JSONB, nullable=False)
    description = Column(String)
    functions = Column(JSONB)
    offerings = Column(JSONB)
    closing = Column(String)
    keywords = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
