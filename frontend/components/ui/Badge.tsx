"use client"

import { ReactNode } from "react"

interface BadgeProps {
  children: ReactNode
  variant?: "default" | "accent" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-[#0D1F0D] text-white",
    accent: "bg-[#C8FF00] text-[#0D1F0D]",
    outline: "border border-[#E5E7EB] text-[#6B7280]",
  }

  return (
    <span
      className={`inline-block rounded-full text-xs px-3 py-1 font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
