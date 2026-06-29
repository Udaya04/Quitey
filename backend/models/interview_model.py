from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class InterviewStartRequest(BaseModel):
    resume_id: Optional[str] = None
    target_role: str
    interview_type: str
    max_questions: int = 10

    @field_validator("max_questions")
    @classmethod
    def validate_max_questions(cls, v):
        if v < 5 or v > 15:
            raise ValueError("max_questions must be between 5 and 15")
        return v


class InterviewMessageRequest(BaseModel):
    session_id: str
    answer: str

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v):
        if not v or not v.strip():
            raise ValueError("Answer cannot be empty")
        return v.strip()


class InterviewMessage(BaseModel):
    role: str
    content: str
    type: str
    question_number: int


class InterviewStartResponse(BaseModel):
    session_id: str
    question: str
    question_type: str
    question_number: int


class InterviewMessageResponse(BaseModel):
    question: Optional[str] = None
    question_type: Optional[str] = None
    question_number: Optional[int] = None
    interview_complete: bool = False
    feedback: Optional[dict] = None


class InterviewSessionSummary(BaseModel):
    id: str
    target_role: str
    interview_type: str
    status: str
    question_count: int
    max_questions: int
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InterviewSessionDetail(BaseModel):
    id: str
    target_role: str
    interview_type: str
    max_questions: int
    status: str
    question_count: int
    messages: list[InterviewMessage]
    feedback: Optional[dict] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
