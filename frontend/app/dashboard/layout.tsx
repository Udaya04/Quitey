"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { useAuthStore } from "@/store/authStore"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { initializeFromStorage, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFFE9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0D1F0D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#FAFFE9]">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-60">
        <Topbar />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
