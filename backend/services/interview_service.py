import os
import json
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
NIVIDIA_API_KEY = os.environ.get("NIVIDIA_API_KEY")

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
INACTIVITY_TIMEOUT = 300
START_COOLDOWN = 300


class InterviewException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class InterviewService:
    def __init__(self):
        self._supabase = None
        self._nvidia_client = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise InterviewException("Supabase credentials not configured", 500)
            self._supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    @property
    def nvidia(self) -> OpenAI:
        if self._nvidia_client is None:
            if not NIVIDIA_API_KEY:
                raise InterviewException("NVIDIA API key not configured", 500)
            self._nvidia_client = OpenAI(
                api_key=NIVIDIA_API_KEY,
                base_url=NVIDIA_BASE_URL,
            )
        return self._nvidia_client

    def _parse_json_field(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return value

    def _build_system_prompt(self, resume_text: str | None, target_role: str, interview_type: str, max_questions: int = 10) -> str:
        lines = [
            f"You are an AI interviewer conducting a {interview_type} interview for the {target_role} position."
        ]
        if resume_text:
            lines.append(f"\nCANDIDATE'S RESUME:\n{resume_text}\n")
        lines.append(f"""
INSTRUCTIONS:
1. Conduct the interview one question at a time. Start with question 1.
2. Base your questions on the resume (if provided), the target role, and the interview type.
3. For a technical interview, ask about CS fundamentals, coding, system design.
4. For an HR interview, ask about behavioral scenarios, teamwork, career goals.
5. For a mixed interview, alternate between technical and HR questions.
6. After each candidate answer, you may ask ONE follow-up question to probe deeper.
   Then move to the next main question. Follow-ups do not count as main questions.
7. Ask exactly {max_questions} main questions total.
8. Be professional, encouraging, and create a natural back-and-forth flow.
9. Always respond in valid JSON with no markdown, no code blocks.

RESPONSE FORMAT (always JSON):
{{
  "type": "question" | "follow_up" | "complete",
  "content": "your question or message here",
  "question_number": <int>
}}

- "question": a new main question (increment question_number by 1 from previous main question)
- "follow_up": a follow-up to the current main question (same question_number)
- "complete": only when the interview is fully done after all questions are asked
""")
        return "\n".join(lines)

    def _build_feedback_system_prompt(self) -> str:
        return """
You are an expert interview evaluator. Analyze the entire interview conversation and generate a
detailed feedback report. Return ONLY valid JSON with no markdown, no explanation.

The JSON must have this exact structure:
{
  "overall_score": <integer 0-100>,
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "topic_wise_feedback": {"topic": "feedback string", ...},
  "sample_better_answers": {"question summary": "model answer string", ...},
  "hiring_recommendation": "Strong Yes" | "Yes" | "No"
}

Scoring guide:
- overall_score reflects the candidate's performance across all dimensions.
- strengths should list 3-5 specific things the candidate did well.
- weaknesses should list 2-4 areas for improvement with constructive language.
- topic_wise_feedback maps interview topics to specific feedback.
- sample_better_answers should provide 2-3 improved answers for key questions.
- hiring_recommendation: "Strong Yes" (85+), "Yes" (60-84), "No" (below 60).
"""

    def _call_nvidia(self, system_prompt: str, user_messages: list[dict], temp: float = 0.7) -> str:
        messages = [{"role": "system", "content": system_prompt}] + user_messages
        for attempt in range(2):
            try:
                response = self.nvidia.chat.completions.create(
                    model=NVIDIA_MODEL,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=temp,
                )
                return response.choices[0].message.content
            except Exception as e:
                err_msg = str(e)
                if attempt == 0:
                    continue
                if "quota" in err_msg.lower() or "rate" in err_msg.lower() or "429" in err_msg:
                    raise InterviewException(
                        "NVIDIA API rate limit exceeded. Please wait a moment and try again.", 429,
                    )
                raise InterviewException(f"NVIDIA API error: {err_msg}", 500)

    def _format_history(self, messages: list[dict]) -> list[dict]:
        result = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "assistant"
            result.append({"role": role, "content": msg["content"]})
        return result

    def start_interview(
    self,
    user_id: str,
    resume_id: str | None,
    target_role: str,
    interview_type: str,
    max_questions: int = 10, 
    ) -> dict:
        try:
            last_resp = (
                self.supabase.table("interview_sessions")
                .select("created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if last_resp.data:
                last_created = last_resp.data[0]["created_at"]
                if isinstance(last_created, str):
                    last_created = datetime.fromisoformat(last_created)
                elapsed = (datetime.now(timezone.utc) - last_created).total_seconds()
                if elapsed < START_COOLDOWN:
                    remaining = int(START_COOLDOWN - elapsed)
                    mins = remaining // 60
                    secs = remaining % 60
                    raise InterviewException(
                        f"Please wait {mins}m {secs}s before starting a new interview", 429,
                    )
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(str(e), 400)

        if isinstance(resume_id, str) and resume_id.strip().lower() in ("null", "", "none"):
            resume_id = None
        resume_text = None
        if resume_id:
            try:
                resp = (
                    self.supabase.table("resumes")
                    .select("extracted_text, user_id")
                    .eq("id", resume_id)
                    .execute()
                )
                if not resp.data:
                    raise InterviewException("Resume not found", 404)
                row = resp.data[0]
                if str(row.get("user_id")) != user_id:
                    raise InterviewException("Resume not found", 404)
                resume_text = row.get("extracted_text", "")
            except InterviewException:
                raise
            except Exception as e:
                raise InterviewException(f"Failed to fetch resume: {str(e)}", 400)

        system_prompt = self._build_system_prompt(resume_text, target_role, interview_type, max_questions)

        try:
            raw = self._call_nvidia(
                system_prompt,
                [{"role": "user", "content": "Begin the interview by asking question 1."}],
            )
            ai_data = json.loads(raw)
            ai_type = ai_data.get("type", "question")
            ai_content = ai_data.get("content", raw)
            question_number = ai_data.get("question_number", 1)
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(f"Failed to generate first question: {str(e)}", 500)

        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        messages = [
            {
                "role": "ai",
                "content": ai_content,
                "type": ai_type,
                "question_number": question_number,
                "timestamp": now.isoformat(),
            }
        ]
        question_count = 1 if ai_type == "question" else 0

        session_data = {
            "id": session_id,
            "user_id": user_id,
            "resume_id": resume_id,
            "resume_text": resume_text or "",
            "target_role": target_role,
            "interview_type": interview_type.lower(),
            "messages": json.dumps(messages),
            "feedback": None,
            "status": "active",
            "question_count": question_count,
            "created_at": now.isoformat(),
            "completed_at": None,
            "max_questions": max_questions,
        }

        try:
            self.supabase.table("interview_sessions").insert(session_data).execute()
        except Exception as e:
            raise InterviewException(f"Failed to create interview session: {str(e)}", 500)

        return {
            "session_id": session_id,
            "question": ai_content,
            "question_type": ai_type,
            "question_number": question_number,
        }

    def send_message(self, user_id: str, session_id: str, answer: str) -> dict:
        try:
            resp = (
                self.supabase.table("interview_sessions")
                .select("*")
                .eq("id", session_id)
                .execute()
            )
            if not resp.data:
                raise InterviewException("Session not found", 404)
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(str(e), 400)

        session = resp.data[0]

        if str(session.get("user_id")) != user_id:
            raise InterviewException("Session not found", 404)

        if session.get("status") != "active":
            raise InterviewException("This interview has already ended", 400)

        now = datetime.now(timezone.utc)
        messages = self._parse_json_field(session.get("messages", []))
        if messages:
            last_ts_str = messages[-1].get("timestamp") or session.get("created_at")
            if last_ts_str:
                if isinstance(last_ts_str, str):
                    last_ts = datetime.fromisoformat(last_ts_str)
                elapsed = (now - last_ts).total_seconds()
                if elapsed > INACTIVITY_TIMEOUT:
                    update_data = {
                        "status": "expired",
                        "completed_at": now.isoformat(),
                    }
                    self.supabase.table("interview_sessions").update(update_data).eq("id", session_id).execute()
                    raise InterviewException(
                        "Interview session expired due to inactivity. Please start a new interview.", 400,
                    )
        question_count = session.get("question_count", 0)

        last_q_num = messages[-1].get("question_number", question_count) if messages else question_count

        messages.append({
            "role": "user",
            "content": answer,
            "type": "answer",
            "question_number": last_q_num,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        max_q = session.get("max_questions", 10)
        if question_count >= max_q:
            feedback = self._generate_feedback(session, messages)

            update_data = {
                "messages": json.dumps(messages),
                "feedback": json.dumps(feedback),
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                self.supabase.table("interview_sessions").update(update_data).eq("id", session_id).execute()
            except Exception as e:
                raise InterviewException(f"Failed to save interview results: {str(e)}", 500)

            return {
                "question": None,
                "question_type": None,
                "question_number": None,
                "interview_complete": True,
                "feedback": feedback,
            }

        system_prompt = self._build_system_prompt(
            session.get("resume_text") or None,
            session.get("target_role"),
            session.get("interview_type"),
            session.get("max_questions", 10),
        )

        try:
            history = self._format_history(messages)
            raw = self._call_nvidia(system_prompt, history)
            ai_data = json.loads(raw)
            ai_type = ai_data.get("type")
            if ai_type not in ("question", "follow_up", "complete"):
                raise ValueError(f"Unknown type: {ai_type}")
            ai_content = ai_data.get("content", raw)
            question_number = ai_data.get("question_number", question_count + 1)
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(f"Failed to get AI response: {str(e)}", 500)

        if ai_type == "complete":
            feedback = self._generate_feedback(session, messages)

            update_data = {
                "messages": json.dumps(messages),
                "feedback": json.dumps(feedback),
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                self.supabase.table("interview_sessions").update(update_data).eq("id", session_id).execute()
            except Exception as e:
                raise InterviewException(f"Failed to save interview results: {str(e)}", 500)

            return {
                "question": None,
                "question_type": None,
                "question_number": None,
                "interview_complete": True,
                "feedback": feedback,
            }

        is_new_question = ai_type == "question"
        if is_new_question:
            question_count += 1

        messages.append({
            "role": "ai",
            "content": ai_content,
            "type": ai_type,
            "question_number": question_number,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        update_data = {
            "messages": json.dumps(messages),
            "question_count": question_count,
        }
        try:
            self.supabase.table("interview_sessions").update(update_data).eq("id", session_id).execute()
        except Exception as e:
            raise InterviewException(f"Failed to save message: {str(e)}", 500)

        return {
            "question": ai_content,
            "question_type": ai_type,
            "question_number": question_number,
            "interview_complete": False,
            "feedback": None,
        }

    def _generate_feedback(self, session: dict, messages: list[dict]) -> dict:
        target_role = session.get("target_role")
        interview_type = session.get("interview_type")

        conversation_text = ""
        for msg in messages:
            speaker = "Interviewer" if msg["role"] == "ai" else "Candidate"
            conversation_text += f"{speaker}: {msg['content']}\n\n"

        user_prompt = f"""Interview Type: {interview_type}
Target Role: {target_role}

CONVERSATION:
{conversation_text}

Generate the feedback report now."""

        try:
            raw = self._call_nvidia(
                self._build_feedback_system_prompt(),
                [{"role": "user", "content": user_prompt}],
                temp=0.5,
            )
            result = json.loads(raw)
            required = [
                "overall_score",
                "strengths",
                "weaknesses",
                "topic_wise_feedback",
                "sample_better_answers",
                "hiring_recommendation",
            ]
            for key in required:
                if key not in result:
                    raise ValueError(f"Missing key: {key}")
            if result["hiring_recommendation"] not in ("Strong Yes", "Yes", "No"):
                raise ValueError(f"Invalid recommendation: {result['hiring_recommendation']}")
            if not isinstance(result["overall_score"], (int, float)):
                raise ValueError("overall_score must be numeric")
            result["overall_score"] = max(0, min(100, int(result["overall_score"])))
            return result
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(f"Failed to generate feedback report: {str(e)}", 500)

    def get_sessions(self, user_id: str) -> list[dict]:
        try:
            resp = (
                self.supabase.table("interview_sessions")
                .select("id, target_role, interview_type, status, question_count, max_questions, created_at, completed_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return resp.data or []
        except Exception as e:
            raise InterviewException(str(e), 400)

    def get_session(self, user_id: str, session_id: str) -> dict:
        try:
            resp = (
                self.supabase.table("interview_sessions")
                .select("*")
                .eq("id", session_id)
                .execute()
            )
            if not resp.data:
                raise InterviewException("Session not found", 404)
        except InterviewException:
            raise
        except Exception as e:
            raise InterviewException(str(e), 400)

        session = resp.data[0]
        if str(session.get("user_id")) != user_id:
            raise InterviewException("Session not found", 404)

        session["messages"] = self._parse_json_field(session.get("messages", []))
        session["feedback"] = self._parse_json_field(session.get("feedback"))

        return session
