"use client"

import { Briefcase, Search } from "lucide-react"

export default function JobsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">Job Board</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Discover opportunities matching your skills
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            className="w-full border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-3 text-sm text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors"
          />
        </div>

        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#F9FAFB] rounded-full p-6">
            <Briefcase className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-center max-w-sm">
            Job listings are coming soon! We&apos;re working on integrating with top companies to bring you the best opportunities.
          </p>
        </div>
      </div>
    </div>
  )
}
