"use client"

import { Map, BookOpen } from "lucide-react"

export default function RoadmapPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">Roadmap Generator</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Personalized learning paths for your career goals
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#F9FAFB] rounded-full p-6">
            <Map className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-center max-w-sm">
            AI-generated roadmaps are coming soon! You&apos;ll be able to get a personalized learning path tailored to your target role.
          </p>
        </div>
      </div>
    </div>
  )
}
