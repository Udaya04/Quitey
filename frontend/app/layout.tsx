import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CareerOS — AI-Powered Career Platform for CSE Students",
  description:
    "The all-in-one platform for CSE students to build skills, crack interviews, and land their dream internship.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
