import api from "./axios"

export interface CategoryScores {
  formatting: number
  keyword_optimization: number
  skills_match: number
  experience_quality: number
  education: number
}

export interface ResumeAnalysisResponse {
  id: string
  ats_score?: number
  category_scores?: CategoryScores
  strengths?: string[]
  weaknesses?: string[]
  missing_keywords?: string[]
  feedback?: string
  target_role: string
  original_filename: string
  file_size: number
  created_at?: string
}

export interface ResumeSummaryResponse {
  id: string
  original_filename: string
  ats_score?: number
  target_role: string
  created_at?: string
}

export async function uploadResume(
  file: File,
  targetRole: string
): Promise<ResumeAnalysisResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("target_role", targetRole)
  const res = await api.post<ResumeAnalysisResponse>("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export async function listResumes(): Promise<ResumeSummaryResponse[]> {
  const res = await api.get<ResumeSummaryResponse[]>("/resumes/")
  return res.data
}

export async function getResumeAnalysis(
  id: string
): Promise<ResumeAnalysisResponse> {
  const res = await api.get<ResumeAnalysisResponse>(`/resumes/${id}`)
  return res.data
}
