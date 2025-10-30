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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ loading: false })
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Admins can access all stores
    if (isAdmin) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (data && !error) {
        set({ stores: data, canAccessAllStores: true })
        
        const savedStoreId = localStorage.getItem('currentStoreId')
        const currentStore = savedStoreId 
          ? data.find(s => s.id === savedStoreId) || data[0]
          : data[0]
        
        if (currentStore) {
          set({ currentStore })
        }
      }
      set({ loading: false })
      return
    }

    // Non-admin users: fetch only assigned stores
    const { data: userStores, error: userStoresError } = await supabase
      .from('user_stores')
      .select('store_id, is_default')
      .eq('user_id', user.id)

    if (userStoresError || !userStores || userStores.length === 0) {
      // No stores assigned - user has no access
      set({ stores: [], currentStore: null, canAccessAllStores: false, loading: false })
      return
    }

    // Fetch the actual store details for assigned stores only
    const storeIds = userStores.map(us => us.store_id)
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .in('id', storeIds)
      .eq('is_active', true)
      .order('name')

    if (data && !error) {
      set({ stores: data, canAccessAllStores: false })
      
      // Set current store from localStorage, default store, or first store
      const savedStoreId = localStorage.getItem('currentStoreId')
      const defaultStore = userStores.find(us => us.is_default)
      
      const currentStore = savedStoreId 
        ? data.find(s => s.id === savedStoreId) 
        : defaultStore 
          ? data.find(s => s.id === defaultStore.store_id)
          : data[0]
      
      if (currentStore) {
        set({ currentStore })
      }
    }
    set({ loading: false })
  },

  fetchUserStoreAccess: async () => {
    // This is now handled in fetchStores, but keeping for compatibility
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data) {
      set({ canAccessAllStores: data.role === 'admin' })
    }
  },
}))
