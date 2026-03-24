import { create } from 'zustand'
import type { Account, Role } from '@/types'

interface AuthState {
  account: Account | null
  isAuthenticated: boolean
  setAccount: (account: Account | null) => void
  logout: () => void
  hasRole: (role: Role) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  account: null,
  isAuthenticated: false,

  setAccount: (account) =>
    set({
      account,
      isAuthenticated: !!account,
    }),

  logout: () =>
    set({
      account: null,
      isAuthenticated: false,
    }),

  hasRole: (role) => get().account?.role === role,
}))
