import api from "./axios"

export interface QuizGenerateRequest {
  topics: string[]
  difficulty: string
  total_questions: number
}

export interface QuestionResponse {
  question: string
  options: string[]
  topic: string
  difficulty: string
}

export interface QuizGenerateResponse {
  attempt_id: string
  time_limit_minutes: number
  questions: QuestionResponse[]
}

export interface QuizSubmitRequest {
  attempt_id: string
  answers: number[]
}

export interface TopicScore {
  correct: number
  total: number
  percentage: number
}

export interface QuestionResult {
  question: string
  options: string[]
  correct_option: number
  selected_option: number
  is_correct: boolean
  explanation: string
  topic: string
  difficulty: string
}

export interface QuizResultResponse {
  attempt_id: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  topic_scores: Record<string, TopicScore>
  skill_scores_updated: Record<string, number>
  questions: QuestionResult[]
  created_at?: string
}

export interface AttemptSummary {
  id: string
  topics: string[]
  difficulty: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  created_at?: string
}

export interface QuizStatsResponse {
  skill_scores: Record<string, number>
}

export async function generateQuiz(
  data: QuizGenerateRequest
): Promise<QuizGenerateResponse> {
  const res = await api.post<QuizGenerateResponse>("/quiz/generate", data)
  return res.data
}

export async function submitQuiz(
  attempt_id: string,
  answers: number[]
): Promise<QuizResultResponse> {
  const res = await api.post<QuizResultResponse>("/quiz/submit", {
    attempt_id,
    answers,
  })
  return res.data
}

export async function listAttempts(): Promise<AttemptSummary[]> {
  const res = await api.get<AttemptSummary[]>("/quiz/attempts")
  return res.data
}

export async function getAttempt(
  id: string
): Promise<QuizResultResponse> {
  const res = await api.get<QuizResultResponse>(`/quiz/attempts/${id}`)
  return res.data
}

export async function getStats(): Promise<QuizStatsResponse> {
  const res = await api.get<QuizStatsResponse>("/quiz/stats")
  return res.data
}
