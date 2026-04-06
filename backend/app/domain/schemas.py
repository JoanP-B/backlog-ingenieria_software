from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateSchema(BaseModel):
    id: str
    name: str
    skills: List[str]
    experience_years: int

class JobSchema(BaseModel):
    id: str
    title: str
    required_skills: List[str]
    min_experience_years: int

class ScoringRequest(BaseModel):
    candidate: CandidateSchema
    job: JobSchema

class ScoringResponse(BaseModel):
    candidate_id: str
    job_id: str
    score: float
    details: Dict[str, Any]

class AuditLogSchema(BaseModel):
    id: int
    timestamp: datetime
    action: str
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)
