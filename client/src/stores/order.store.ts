import { create } from 'zustand'
import type { GuestOrder, Dish } from '@/types'

interface CartItem extends GuestOrder {
  dish: Dish
}

interface OrderState {
  cart: CartItem[]
  tableNumber: number | null
  tableToken: string | null
  guestName: string | null
  setTable: (number: number, token: string) => void
  setGuestName: (name: string) => void
  addToCart: (dish: Dish, quantity?: number, note?: string) => void
  removeFromCart: (dishId: number) => void
  updateQuantity: (dishId: number, quantity: number) => void
  updateNote: (dishId: number, note: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  cart: [],
  tableNumber: null,
  tableToken: null,
  guestName: null,

  setTable: (number, token) => set({ tableNumber: number, tableToken: token }),
  setGuestName: (name) => set({ guestName: name }),

  addToCart: (dish, quantity = 1, note) => {
    const cart = get().cart
    const existingIndex = cart.findIndex((item) => item.dishId === dish.id)
    if (existingIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingIndex].quantity += quantity
      set({ cart: updatedCart })
    } else {
      set({ cart: [...cart, { dishId: dish.id, dish, quantity, note }] })
    }
  },

  removeFromCart: (dishId) =>
    set({ cart: get().cart.filter((item) => item.dishId !== dishId) }),

  updateQuantity: (dishId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(dishId)
      return
    }
    set({
      cart: get().cart.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item
      ),
    })
  },

  updateNote: (dishId, note) =>
    set({
      cart: get().cart.map((item) =>
        item.dishId === dishId ? { ...item, note } : item
      ),
    }),

  clearCart: () => set({ cart: [] }),

  getTotalPrice: () =>
    get().cart.reduce((total, item) => total + item.dish.price * item.quantity, 0),

  getTotalItems: () =>
    get().cart.reduce((total, item) => total + item.quantity, 0),
}))
