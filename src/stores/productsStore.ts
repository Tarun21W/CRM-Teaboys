import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  category_id: string | null
  sku: string | null
  barcode: string | null
  unit: string
  selling_price: number
  current_stock: number
  weighted_avg_cost: number
  reorder_level: number
  is_raw_material: boolean
  is_finished_good: boolean
  is_active: boolean
  categories?: {
    name: string
  }
}

interface ProductsState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  searchProducts: (query: string) => Product[]
  getLowStockProducts: () => Product[]
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      set({ products: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  searchProducts: (query: string) => {
    const products = get().products
    if (!query) return products

    const lowerQuery = query.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery)
    )
  },

  getLowStockProducts: () => {
    return get().products.filter(
      (p) => p.current_stock <= p.reorder_level && p.is_finished_good
    )
  },
}))
