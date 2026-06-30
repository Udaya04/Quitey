"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Eye,
  ChevronLeft,
} from "lucide-react"
import { uploadResume, listResumes, getResumeAnalysis } from "@/lib/resume"
import type {
  ResumeAnalysisResponse,
  ResumeSummaryResponse,
} from "@/lib/resume"
import {
  CircularProgress,
  ScoreBar,
  scoreColor,
  scoreTextColor,
} from "@/components/ui/ScoreDisplay"

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function ATSCheckerPage() {
  const [pageState, setPageState] = useState<"upload" | "result">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeAnalysisResponse | null>(null)
  const [history, setHistory] = useState<ResumeSummaryResponse[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listResumes()
      .then(setHistory)
      .catch(() => {})
  }, [])

  const validateFile = useCallback((f: File): string | null => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are supported"
    }
    if (f.size > 5 * 1024 * 1024) {
      return "File must be under 5MB"
    }
    return null
  }, [])

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f)
      if (err) {
        setError(err)
        setFile(null)
      } else {
        setError(null)
        setFile(f)
      }
    },
    [validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleSubmit = async () => {
    if (!file || !targetRole.trim()) return
    setUploading(true)
    setError(null)
    try {
      const data = await uploadResume(file, targetRole.trim())
      setResult(data)
      setPageState("result")
      setHistory((prev) => [
        {
          id: data.id,
          original_filename: data.original_filename,
          ats_score: data.ats_score,
          target_role: data.target_role,
          created_at: data.created_at,
        },
        ...prev,
      ])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Upload failed. Please try again."
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleViewHistory = async (id: string) => {
    try {
      const data = await getResumeAnalysis(id)
      setResult(data)
      setPageState("result")
    } catch {
      setError("Failed to load analysis")
    }
  }

  const handleNewAnalysis = () => {
    setPageState("upload")
    setFile(null)
    setTargetRole("")
    setResult(null)
    setError(null)
  }

  if (pageState === "result" && result) {
    const cat = result.category_scores
    return (
      <div className="space-y-6">
        <button
          onClick={handleNewAnalysis}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          New Analysis
        </button>

        {/* Score Hero */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10">
            <CircularProgress score={result.ats_score ?? 0} />
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0D1F0D]">
                    {result.original_filename}
                  </h2>
                  <div className="flex items-center justify-center lg:justify-start gap-3 mt-2">
                    <span className="inline-block bg-[#0D1F0D] text-white rounded-full text-xs px-3 py-1">
                      {result.target_role}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      Analyzed on {formatDate(result.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleNewAnalysis}
                  className="bg-[#0D1F0D] text-white rounded-full px-5 py-2 text-sm font-bold hover:bg-[#1A2B1A] transition whitespace-nowrap"
                >
                  Analyze Another Resume
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        {cat && (
          <div>
            <h3 className="text-lg font-bold text-[#0D1F0D] mb-4">
              Category Scores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <ScoreBar label="formatting" score={cat.formatting} />
              <ScoreBar label="keyword_optimization" score={cat.keyword_optimization} />
              <ScoreBar label="skills_match" score={cat.skills_match} />
              <ScoreBar label="experience_quality" score={cat.experience_quality} />
              <ScoreBar label="education" score={cat.education} />
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-[#0D1F0D]">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {(result.strengths ?? []).length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No strengths identified</p>
              ) : (
                result.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-[#0D1F0D]">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {(result.weaknesses ?? []).length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No areas to improve</p>
              ) : (
                result.weaknesses?.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Missing Keywords */}
        {(result.missing_keywords ?? []).length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="font-bold text-[#0D1F0D] mb-4">Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {(result.missing_keywords ?? []).map((kw, i) => (
                <span
                  key={i}
                  className="inline-block bg-red-50 text-red-700 border border-red-200 rounded-full text-xs px-3 py-1"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {result.feedback && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 border-l-4 border-l-[#0D1F0D]">
            <h3 className="font-bold text-[#0D1F0D] mb-3">AI Feedback</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
              {result.feedback}
            </p>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="font-bold text-[#0D1F0D] mb-4">Analysis History</h3>
            <div className="space-y-2">
              {history.slice(result ? 1 : 0).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
                    <span className="text-sm text-[#4B5563] truncate">
                      {h.original_filename}
                    </span>
                    <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-2 py-0.5 flex-shrink-0">
                      {h.target_role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {h.ats_score !== undefined && (
                      <span
                        className={`text-sm font-bold ${scoreTextColor(h.ats_score)}`}
                      >
                        {Math.round(h.ats_score)}
                      </span>
                    )}
                    <button
                      onClick={() => handleViewHistory(h.id)}
                      className="text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">
          Check Your Resume&apos;s ATS Score
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Get instant AI-powered feedback on your resume
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#0D1F0D] bg-[#0D1F0D]/5"
              : file
              ? "border-green-400 bg-green-50"
              : "border-[#E5E7EB] hover:border-[#0D1F0D]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-[#0D1F0D]">
                  {file.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setError(null)
                }}
                className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm text-[#4B5563]">
                Drag & drop your resume PDF, or click to browse
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">PDF only, max 5MB</p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Target Role */}
        <div>
          <label className="block text-sm font-medium text-[#4B5563]">
            Target Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. SDE Intern, ML Intern"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            disabled={uploading}
            className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || !targetRole.trim() || uploading}
          className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing your resume...
            </>
          ) : (
            "Analyze Resume →"
          )}
        </button>

        {uploading && (
          <p className="text-xs text-[#9CA3AF] text-center">
            This usually takes 10-15 seconds
          </p>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mt-6">
          <h3 className="font-bold text-[#0D1F0D] mb-4">Previous Analyses</h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#4B5563] truncate">
                    {h.original_filename}
                  </span>
                  <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-2 py-0.5 flex-shrink-0">
                    {h.target_role}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {h.ats_score !== undefined && (
                    <span
                      className={`text-sm font-bold ${scoreTextColor(h.ats_score)}`}
                    >
                      {Math.round(h.ats_score)}
                    </span>
                  )}
                  <button
                    onClick={() => handleViewHistory(h.id)}
                    className="text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
