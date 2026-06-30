"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"
import { SignupForm } from "@/components/auth/SignupForm"
import { LampContainer } from "@/components/ui/lamp"
import { useAuthStore } from "@/store/authStore"

export default function SignupPage() {
  const router = useRouter()
  const { initializeFromStorage, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFFE9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0D1F0D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative bg-[#FAFFE9] min-h-screen">
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="bg-gradient-to-br from-white to-gray-300 bg-clip-text text-center text-3xl font-bold tracking-tight text-transparent md:text-5xl"
        >
          Create Your Account
        </motion.h1>
      </LampContainer>

      <div className="relative z-10 -mt-[1px] flex justify-center px-4 pb-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 -translate-y-16 lg:-translate-y-20">
          <div className="flex flex-col items-center">
            <GraduationCap className="w-8 h-8 text-[#0D1F0D]" />
            <span className="text-[#0D1F0D] font-bold text-lg mt-2">
              CareerOS
            </span>
          </div>

          <p className="text-[#6B7280] text-sm text-center mt-4">
            Start your journey to your dream internship
          </p>

          <div className="mt-6">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
