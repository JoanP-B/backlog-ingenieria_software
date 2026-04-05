from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB
from app.infrastructure.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    action = Column(String(255), nullable=False, index=True)
    candidate_id = Column(String(255))
    job_id = Column(String(255))
    score = Column(DECIMAL(5, 2))
    details = Column(JSONB)
