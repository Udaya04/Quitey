"use client"

import { useRouter } from "next/navigation"
import {
  FileText,
  Target,
  Bot,
  Briefcase,
  Inbox,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { StatCard } from "@/components/ui/StatCard"

const skillTopics = ["OS", "DBMS", "CN", "OOP"] as const

const quickActions = [
  {
    icon: FileText,
    iconBg: "bg-[#C8FF00]",
    iconColor: "text-[#0D1F0D]",
    title: "Check ATS Score",
    href: "/dashboard/ats",
  },
  {
    icon: Target,
    iconBg: "bg-[#C8FF00]",
    iconColor: "text-[#0D1F0D]",
    title: "Practice CS Topics",
    href: "/dashboard/quiz",
  },
  {
    icon: Bot,
    iconBg: "bg-[#C8FF00]",
    iconColor: "text-[#0D1F0D]",
    title: "Start AI Interview",
    href: "/dashboard/interview",
  },
  {
    icon: Briefcase,
    iconBg: "bg-[#C8FF00]",
    iconColor: "text-[#0D1F0D]",
    title: "Find Internships",
    href: "/dashboard/jobs",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const scores = user?.skill_scores || {}

  return (
    <div className="space-y-8">
      {/* Section 1 — Welcome Banner */}
      <div className="bg-[#0D1F0D] rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#A3E635]/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white">
            Welcome back, {user?.full_name || "there"}! 👋
          </h2>
          {user?.target_role && (
            <p className="text-white/60 mt-2">Target Role: {user.target_role}</p>
          )}
        </div>
      </div>

      {/* Section 2 — Skill Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {skillTopics.map((topic) => (
          <StatCard key={topic} topic={topic} score={scores[topic] ?? 0} />
        ))}
      </div>

      {/* Section 3 — Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-[#0D1F0D] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <div
                key={action.href}
                onClick={() => router.push(action.href)}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#0D1F0D]/20 cursor-pointer transition-all duration-200"
              >
                <div
                  className={`w-11 h-11 rounded-lg ${action.iconBg} flex items-center justify-center shadow-sm`}
                >
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <h4 className="text-[#0D1F0D] font-bold text-sm mt-4">
                  {action.title}
                </h4>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 4 — Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-[#0D1F0D] mb-4">Recent Activity</h3>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm py-12 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#F9FAFB] rounded-full p-4">
            <Inbox className="w-8 h-8 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-center max-w-xs">
            No activity yet. Start practicing to see your progress here!
          </p>
          <button
            onClick={() => router.push("/dashboard/quiz")}
            className="mt-2 bg-[#0D1F0D] text-white rounded-full px-6 py-2.5 text-sm font-bold hover:bg-[#1A2B1A] transition"
          >
            Take a Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
