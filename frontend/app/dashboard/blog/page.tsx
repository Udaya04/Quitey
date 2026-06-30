"use client"

import { PenLine, BookOpen } from "lucide-react"

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">Blog</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Tips, guides, and insights for your career journey
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#F9FAFB] rounded-full p-6">
            <BookOpen className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-center max-w-sm">
            Blog articles are coming soon! We&apos;ll share tips on resume writing, interview prep, and career growth.
          </p>
        </div>
      </div>
    </div>
  )
}
