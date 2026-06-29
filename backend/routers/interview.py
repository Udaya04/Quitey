from fastapi import APIRouter, Depends
from backend.models.user_model import UserProfile
from backend.models.interview_model import (
    InterviewStartRequest,
    InterviewMessageRequest,
    InterviewStartResponse,
    InterviewMessageResponse,
    InterviewSessionSummary,
    InterviewSessionDetail,
    InterviewMessage,
)
from backend.services.interview_service import InterviewService, InterviewException
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/interview", tags=["interview"])
interview_service = InterviewService()


@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(
    body: InterviewStartRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    result = interview_service.start_interview(
        user_id=current_user.id,
        resume_id=body.resume_id,
        target_role=body.target_role,
        interview_type=body.interview_type,
        max_questions=body.max_questions,  # ← add karo
    )
    return result


@router.post("/message", response_model=InterviewMessageResponse)
async def send_message(
    body: InterviewMessageRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    result = interview_service.send_message(
        user_id=current_user.id,
        session_id=body.session_id,
        answer=body.answer,
    )
    return result


@router.get("/sessions", response_model=list[InterviewSessionSummary])
async def list_sessions(current_user: UserProfile = Depends(get_current_user)):
    return interview_service.get_sessions(current_user.id)


@router.get("/sessions/{session_id}", response_model=InterviewSessionDetail)
async def get_session(
    session_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    session = interview_service.get_session(current_user.id, session_id)
    session["messages"] = [InterviewMessage(**m) for m in session["messages"]]
    return session
