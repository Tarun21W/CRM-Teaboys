import { create } from 'zustand'

export interface CartItem {
  id: string
  name: string
  selling_price: number
  current_stock: number
  unit: string
  quantity: number
  discount: number
  barcode?: string | null
}

interface CartState {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity' | 'discount'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateDiscount: (id: string, discount: number) => void
  clear: () => void
  getSubtotal: () => number
  getDiscountTotal: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items
    const existing = items.find(item => item.id === product.id)
    
    if (existing) {
      set({
        items: items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      set({
        items: [...items, { ...product, quantity: 1, discount: 0 }]
      })
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter(item => item.id !== id) })
  },

  updateQuantity: (id, quantity) => {
    if (quantity < 1) return
    set({
      items: get().items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    })
  },

  updateDiscount: (id, discount) => {
    if (discount < 0 || discount > 100) return
    set({
      items: get().items.map(item =>
        item.id === id ? { ...item, discount } : item
      )
    })
  },

  clear: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity,
      0
    )
  },

  getDiscountTotal: () => {
    return get().items.reduce(
      (sum, item) =>
        sum + (item.selling_price * item.quantity * item.discount) / 100,
      0
    )
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscountTotal()
  },
}))
