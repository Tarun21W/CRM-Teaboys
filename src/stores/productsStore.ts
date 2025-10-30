import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useStoreStore } from '@/stores/storeStore'

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
      // Get current store from storeStore
      const currentStore = useStoreStore.getState().currentStore
      
      if (!currentStore) {
        // If no store selected, fetch from user's default store
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          set({ products: [], loading: false })
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single()

        if (!profile || !(profile as any).store_id) {
          set({ products: [], loading: false, error: 'No store assigned' })
          return
        }

        // Fetch products for user's store
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_active', true)
          .eq('store_id', (profile as any).store_id)
          .order('name')

        if (error) throw error
        set({ products: data || [], loading: false })
      } else {
        // Fetch products for current store
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_active', true)
          .eq('store_id', currentStore.id)
          .order('name')

        if (error) throw error
        set({ products: data || [], loading: false })
      }
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
