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
    id: int
    user_id: int
    name: str
    skills: List[str]
    experience_years: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateCreate(BaseModel):
    skills: List[str]
    experience_years: int

class ApplicationRequest(BaseModel):
    candidate_id: int
    job_id: str
    job_title: str
    company: str

class JobSchema(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    salary: Optional[str] = None
    min_experience_years: int
    required_skills: List[str]
    description: Optional[str] = None
    functions: Optional[List[str]] = None
    offerings: Optional[List[str]] = None
    closing: Optional[str] = None
    keywords: Optional[List[str]] = None
    
    model_config = ConfigDict(from_attributes=True)

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
    user_id: Optional[int] = None
    candidate_id: Optional[int] = None
    job_id: Optional[str] = None
    score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)
