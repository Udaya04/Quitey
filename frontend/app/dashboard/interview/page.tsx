"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bot,
  Send,
  Loader2,
  ChevronLeft,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Briefcase,
} from "lucide-react"
import {
  startInterview,
  sendMessage,
  listSessions,
  getSession,
} from "@/lib/interview"
import type {
  InterviewStartResponse,
  InterviewMessageResponse,
  InterviewSessionSummary,
  InterviewSessionDetail,
  InterviewMessage,
  InterviewFeedback,
} from "@/lib/interview"
import { CircularProgress, scoreColor } from "@/components/ui/ScoreDisplay"

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function InterviewPage() {
  const [tab, setTab] = useState<"new" | "history">("new")
  const [pageState, setPageState] = useState<"setup" | "interview" | "feedback">("setup")

  const [targetRole, setTargetRole] = useState("")
  const [interviewType, setInterviewType] = useState("technical")
  const [maxQuestions, setMaxQuestions] = useState(10)

  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)

  const [answer, setAnswer] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [history, setHistory] = useState<InterviewSessionSummary[]>([])
  const [viewingSession, setViewingSession] = useState<InterviewSessionDetail | null>(null)

  useEffect(() => {
    listSessions().then(setHistory).catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentQuestion])

  const handleStart = async () => {
    if (!targetRole.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await startInterview({
        target_role: targetRole.trim(),
        interview_type: interviewType,
        max_questions: maxQuestions,
      })
      setSessionId(data.session_id)
      setMessages([
        {
          role: "ai",
          content: data.question,
          type: data.question_type,
          question_number: data.question_number,
        },
      ])
      setCurrentQuestion(data.question)
      setQuestionNumber(data.question_number)
      setPageState("interview")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to start interview. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!answer.trim() || !sessionId || sending) return
    const userAnswer = answer.trim()
    setAnswer("")
    setSending(true)
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userAnswer,
        type: "answer",
        question_number: questionNumber,
      },
    ])
    try {
      const data = await sendMessage(sessionId, userAnswer)
      if (data.interview_complete && data.feedback) {
        setFeedback(data.feedback)
        setPageState("feedback")
      } else if (data.question) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.question!,
            type: data.question_type || "question",
            question_number: data.question_number || questionNumber + 1,
          },
        ])
        setCurrentQuestion(data.question)
        setQuestionNumber(data.question_number || questionNumber + 1)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send message. Please try again."
      setError(msg)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleViewHistory = async (id: string) => {
    try {
      const data = await getSession(id)
      setViewingSession(data)
    } catch {
      setError("Failed to load session")
    }
  }

  const handleBackFromView = () => {
    setViewingSession(null)
  }

  const handleReset = () => {
    setPageState("setup")
    setSessionId(null)
    setMessages([])
    setCurrentQuestion(null)
    setQuestionNumber(0)
    setFeedback(null)
    setAnswer("")
    setError(null)
  }

  if (viewingSession) {
    const s = viewingSession
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={handleBackFromView}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to History
        </button>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0D1F0D]">{s.target_role}</h2>
            <span className="text-xs text-[#9CA3AF]">{formatDate(s.created_at)}</span>
          </div>
          <div className="flex gap-2">
            <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-3 py-1">
              {capitalize(s.interview_type)}
            </span>
            <span className="inline-block bg-[#F3F4F6] text-[#6B7280] rounded-full text-xs px-3 py-1">
              {s.question_count}/{s.max_questions} questions
            </span>
            <span className={`inline-block rounded-full text-xs px-3 py-1 ${
              s.status === "completed" ? "bg-green-50 text-green-700" :
              s.status === "active" ? "bg-blue-50 text-blue-700" :
              "bg-gray-50 text-gray-500"
            }`}>
              {capitalize(s.status)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-[#0D1F0D]">Conversation</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {s.messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-[#0D1F0D] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-[#0D1F0D] text-white"
                    : "bg-[#F3F4F6] text-[#4B5563]"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {s.feedback && (
          <FeedbackView feedback={s.feedback} />
        )}
      </div>
    )
  }

  if (pageState === "feedback" && feedback) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          New Interview
        </button>

        <FeedbackView feedback={feedback} />

        <button
          onClick={handleReset}
          className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Interview
        </button>
      </div>
    )
  }

  if (pageState === "interview") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0D1F0D]">Mock Interview</h2>
            <button
              onClick={handleReset}
              className="text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
            >
              End & Start Over
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Briefcase className="w-4 h-4" />
            {targetRole}
            <span className="mx-2">·</span>
            <Bot className="w-4 h-4" />
            {capitalize(interviewType)}
            <span className="mx-2">·</span>
            {messages.filter(m => m.type === "question").length} / {maxQuestions} questions
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-[#0D1F0D] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-[#0D1F0D] text-white"
                    : "bg-[#F3F4F6] text-[#4B5563]"
                }`}>
                  {m.type === "question" && (
                    <p className="text-xs text-[#6B7280] mb-1 font-medium">
                      Question {m.question_number}
                    </p>
                  )}
                  {m.type === "follow_up" && (
                    <p className="text-xs text-[#6B7280] mb-1 font-medium">
                      Follow-up
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0D1F0D] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#F3F4F6] rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#6B7280]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            disabled={sending}
            rows={2}
            className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors resize-none disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!answer.trim() || sending}
            className="bg-[#0D1F0D] text-white rounded-xl px-5 py-3 hover:bg-[#1A2B1A] transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => { setTab("new"); setError(null) }}
          className={`text-sm font-bold px-4 py-2 rounded-full transition ${
            tab === "new"
              ? "bg-[#0D1F0D] text-white"
              : "text-[#6B7280] hover:text-[#0D1F0D]"
          }`}
        >
          New Interview
        </button>
        <button
          onClick={() => { setTab("history"); setError(null) }}
          className={`text-sm font-bold px-4 py-2 rounded-full transition ${
            tab === "history"
              ? "bg-[#0D1F0D] text-white"
              : "text-[#6B7280] hover:text-[#0D1F0D]"
          }`}
        >
          History
        </button>
      </div>

      {tab === "new" && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0D1F0D]">
              Mock Interview
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Practice with AI-powered interview simulations
            </p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#4B5563]">
                Target Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SDE Intern, ML Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={loading}
                className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B5563] mb-2">
                Interview Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["technical", "hr", "mixed"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setInterviewType(type)}
                    disabled={loading}
                    className={`py-3 rounded-xl text-sm font-medium border transition ${
                      interviewType === type
                        ? "bg-[#0D1F0D] text-white border-[#0D1F0D]"
                        : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#0D1F0D]"
                    } disabled:opacity-60`}
                  >
                    {capitalize(type)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B5563] mb-2">
                Number of Questions: {maxQuestions}
              </label>
              <input
                type="range"
                min={5}
                max={15}
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-[#0D1F0D]"
              />
              <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                <span>5</span>
                <span>10</span>
                <span>15</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!targetRole.trim() || loading}
              className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting interview...
                </>
              ) : (
                "Start Interview →"
              )}
            </button>
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#0D1F0D] mb-4">Interview History</h2>
          {history.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Bot className="w-12 h-12 text-[#9CA3AF]" />
              <p className="text-[#9CA3AF] text-sm">No interviews yet. Start one to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Briefcase className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0D1F0D] truncate">{h.target_role}</p>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span>{capitalize(h.interview_type)}</span>
                        <span>·</span>
                        <span>{h.question_count}/{h.max_questions} Q</span>
                        <span>·</span>
                        <span className={h.status === "completed" ? "text-green-600" : h.status === "active" ? "text-blue-600" : "text-gray-400"}>
                          {capitalize(h.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[#9CA3AF] hidden sm:block">{formatDate(h.created_at)}</span>
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
          )}
        </div>
      )}
    </div>
  )
}

function FeedbackView({ feedback }: { feedback: InterviewFeedback }) {
  const f = feedback
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10">
          <CircularProgress score={f.overall_score} />
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-xl font-bold text-[#0D1F0D]">Interview Feedback</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Overall performance score
            </p>
            <div className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
              f.hiring_recommendation === "Strong Yes" ? "bg-green-50 text-green-700" :
              f.hiring_recommendation === "Yes" ? "bg-blue-50 text-blue-700" :
              "bg-red-50 text-red-700"
            }`}>
              {f.hiring_recommendation}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-[#0D1F0D]">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {f.strengths.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No strengths identified</p>
            ) : (
              f.strengths.map((s, i) => (
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
            <h3 className="font-bold text-[#0D1F0D]">Weaknesses</h3>
          </div>
          <ul className="space-y-2">
            {f.weaknesses.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No weaknesses identified</p>
            ) : (
              f.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  {w}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {Object.keys(f.topic_wise_feedback).length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-bold text-[#0D1F0D] mb-4">Topic-wise Feedback</h3>
          <div className="space-y-3">
            {Object.entries(f.topic_wise_feedback).map(([topic, fb]) => (
              <div key={topic} className="flex items-start gap-3 p-3 rounded-lg bg-[#F9FAFB]">
                <div className="w-8 h-8 rounded-lg bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#0D1F0D]">{topic.slice(0, 2)}</span>
                </div>
                <p className="text-sm text-[#4B5563]">{fb}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(f.sample_better_answers).length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-bold text-[#0D1F0D] mb-4">Sample Better Answers</h3>
          <div className="space-y-4">
            {Object.entries(f.sample_better_answers).map(([question, answer]) => (
              <div key={question} className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-sm font-medium text-[#0D1F0D] mb-2">{question}</p>
                <p className="text-sm text-[#4B5563] whitespace-pre-wrap">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
