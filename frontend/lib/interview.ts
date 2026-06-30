import api from "./axios"

export interface InterviewStartRequest {
  target_role: string
  interview_type: string
  max_questions?: number
  resume_id?: string
}

export interface InterviewStartResponse {
  session_id: string
  question: string
  question_type: string
  question_number: number
}

export interface InterviewMessageRequest {
  session_id: string
  answer: string
}

export interface InterviewFeedback {
  overall_score: number
  strengths: string[]
  weaknesses: string[]
  topic_wise_feedback: Record<string, string>
  sample_better_answers: Record<string, string>
  hiring_recommendation: "Strong Yes" | "Yes" | "No"
}

export interface InterviewMessageResponse {
  question: string | null
  question_type: string | null
  question_number: number | null
  interview_complete: boolean
  feedback: InterviewFeedback | null
}

export interface InterviewSessionSummary {
  id: string
  target_role: string
  interview_type: string
  status: string
  question_count: number
  max_questions: number
  created_at?: string
  completed_at?: string
}

export interface InterviewMessage {
  role: string
  content: string
  type: string
  question_number: number
}

export interface InterviewSessionDetail {
  id: string
  target_role: string
  interview_type: string
  max_questions: number
  status: string
  question_count: number
  messages: InterviewMessage[]
  feedback: InterviewFeedback | null
  created_at?: string
  completed_at?: string
}

export async function startInterview(
  data: InterviewStartRequest
): Promise<InterviewStartResponse> {
  const res = await api.post<InterviewStartResponse>("/interview/start", data)
  return res.data
}

export async function sendMessage(
  session_id: string,
  answer: string
): Promise<InterviewMessageResponse> {
  const res = await api.post<InterviewMessageResponse>("/interview/message", {
    session_id,
    answer,
  })
  return res.data
}

export async function listSessions(): Promise<InterviewSessionSummary[]> {
  const res = await api.get<InterviewSessionSummary[]>("/interview/sessions")
  return res.data
}

export async function getSession(
  session_id: string
): Promise<InterviewSessionDetail> {
  const res = await api.get<InterviewSessionDetail>(
    `/interview/sessions/${session_id}`
  )
  return res.data
}
