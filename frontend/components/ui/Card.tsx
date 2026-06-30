"use client"

import { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 ${
        hover
          ? "hover:border-[#0D1F0D] hover:shadow-md cursor-pointer transition-all duration-200"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}
