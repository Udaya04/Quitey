import { create } from "zustand"
import { UserProfile, getCurrentUser } from "@/lib/auth"

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserProfile, token: string) => void
  logout: () => void
  initializeFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ user: null, token: null, isAuthenticated: false })
  },

  initializeFromStorage: async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        set({ isLoading: false })
        return
      }
      const user = await getCurrentUser()
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
