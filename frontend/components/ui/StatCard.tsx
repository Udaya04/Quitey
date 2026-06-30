"use client"

import { Cpu, Database, Network, Box } from "lucide-react"
import { scoreColor } from "@/components/ui/ScoreDisplay"

const topicIcons: Record<string, React.ReactNode> = {
  OS: <Cpu className="w-4 h-4" />,
  DBMS: <Database className="w-4 h-4" />,
  CN: <Network className="w-4 h-4" />,
  OOP: <Box className="w-4 h-4" />,
}

interface StatCardProps {
  topic: string
  score: number
}

export function StatCard({ topic, score }: StatCardProps) {
  const clampedScore = Math.min(Math.max(score, 0), 100)
  const barColor = scoreColor(clampedScore)

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
          <span className="text-[#0D1F0D]">{topicIcons[topic]}</span>
        </div>
        <p className="text-sm text-[#6B7280]">{topic}</p>
      </div>
      <p className="text-3xl font-bold text-[#0D1F0D]">{clampedScore}%</p>
      <div className="bg-[#F3F4F6] rounded-full h-2.5 mt-3 overflow-hidden">
        <div
          className="rounded-full h-2.5 transition-all duration-500"
          style={{ width: `${clampedScore}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
