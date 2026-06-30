"use client"

import { useState, useEffect } from "react"

export function scoreColor(score: number): string {
  if (score >= 80) return "#22C55E"
  if (score >= 60) return "#F59E0B"
  return "#EF4444"
}

export function scoreTextColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

export function CircularProgress({
  score,
  size = 140,
  strokeWidth = 10,
}: {
  score: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)
  const color = scoreColor(score)
  const clamped = Math.min(Math.max(score, 0), 100)

  useEffect(() => {
    const target = circumference - (clamped / 100) * circumference
    const timer = setTimeout(() => setOffset(target), 100)
    return () => clearTimeout(timer)
  }, [clamped, circumference])

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${scoreTextColor(score)}`}>
          {Math.round(clamped)}
        </span>
        <span className="text-[#9CA3AF] text-sm">/ 100</span>
      </div>
    </div>
  )
}

export function ScoreBar({
  label,
  score,
}: {
  label: string
  score: number
}) {
  const clamped = Math.min(Math.max(score, 0), 100)
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#6B7280] capitalize">
          {label.replace(/_/g, " ")}
        </span>
        <span className={`text-sm font-bold ${scoreTextColor(score)}`}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="bg-[#F3F4F6] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </div>
    </div>
  )
}
