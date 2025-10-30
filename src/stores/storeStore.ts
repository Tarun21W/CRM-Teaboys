import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Store {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  is_active: boolean
}

interface StoreState {
  stores: Store[]
  currentStore: Store | null
  canAccessAllStores: boolean
  loading: boolean
  setCurrentStore: (store: Store) => void
  fetchStores: () => Promise<void>
  fetchUserStoreAccess: () => Promise<void>
}

export const useStoreStore = create<StoreState>((set, get) => ({
  stores: [],
  currentStore: null,
  canAccessAllStores: false,
  loading: false,

  setCurrentStore: (store: Store) => {
    set({ currentStore: store })
    localStorage.setItem('currentStoreId', store.id)
  },

  fetchStores: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data && !error) {
      set({ stores: data })
      
      // Set current store from localStorage or first store
      const savedStoreId = localStorage.getItem('currentStoreId')
      const currentStore = savedStoreId 
        ? data.find(s => s.id === savedStoreId) || data[0]
        : data[0]
      
      if (currentStore) {
        set({ currentStore })
      }
    }
    set({ loading: false })
  },

  fetchUserStoreAccess: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('store_id, can_access_all_stores')
      .eq('id', user.id)
      .single()

    if (data) {
      set({ canAccessAllStores: data.can_access_all_stores || false })
      
      // If user has a default store and no current store is set, use it
      if (data.store_id && !get().currentStore) {
        const store = get().stores.find(s => s.id === data.store_id)
        if (store) {
          set({ currentStore: store })
        }
      }
    }
  },
}))
