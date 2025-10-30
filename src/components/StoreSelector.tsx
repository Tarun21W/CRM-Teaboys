import { useEffect } from 'react'
import { useStoreStore } from '@/stores/storeStore'
import { Store } from 'lucide-react'

export default function StoreSelector() {
  const { stores, currentStore, canAccessAllStores, loading, setCurrentStore, fetchStores, fetchUserStoreAccess } = useStoreStore()

  useEffect(() => {
    const loadStores = async () => {
      await fetchStores()
      await fetchUserStoreAccess()
    }
    loadStores()
  }, [fetchStores, fetchUserStoreAccess])

  // If loading or no stores, don't show
  if (loading || stores.length === 0) {
    return null
  }

  // If user can only access one store, don't show selector
  if (!canAccessAllStores && stores.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
      <Store size={18} className="text-gray-500" />
      <select
        value={currentStore?.id || ''}
        onChange={(e) => {
          const store = stores.find(s => s.id === e.target.value)
          if (store) setCurrentStore(store)
        }}
        className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
      >
        {stores.map(store => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  )
}
