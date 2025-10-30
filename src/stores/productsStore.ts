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
        set({ products: [], loading: false, error: 'No store selected' })
        return
      }

      // Fetch all active products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('name')

      if (productsError) throw productsError

      // Fetch store-specific inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('store_inventory')
        .select('*')
        .eq('store_id', currentStore.id)

      if (inventoryError) throw inventoryError

      // Merge products with their store-specific inventory
      const inventoryMap = new Map(inventoryData?.map(inv => [inv.product_id, inv]) || [])
      
      const mergedProducts = productsData?.map(product => {
        const inventory = inventoryMap.get(product.id)
        return {
          ...product,
          current_stock: inventory?.current_stock || 0,
          weighted_avg_cost: inventory?.weighted_avg_cost || 0,
          reorder_level: inventory?.reorder_level || 0,
        }
      }) || []

      set({ products: mergedProducts, loading: false })
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
