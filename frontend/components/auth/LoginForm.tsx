"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { login } from "@/lib/auth"
import { useAuthStore } from "@/store/authStore"

interface LoginFormData {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [error, setError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    try {
      const res = await login(data.email, data.password)
      setUser(res.user, res.token)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed. Please check your credentials."
      setError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Password
        </label>
        <input
          type="password"
          placeholder="••••••••"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login →"
        )}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[#0D1F0D] font-bold underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
