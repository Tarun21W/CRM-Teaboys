import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStoreStore } from '@/stores/storeStore'
import { formatDate, formatCurrency } from '@/lib/utils'
import { AlertTriangle, Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ExpiringBatch {
  batch_id: string
  batch_number: string
  product_id: string
  product_name: string
  production_date: string
  expiration_date: string
  quantity_remaining: number
  unit: string
  days_until_expiry: number
  expiry_status: 'expired' | 'critical' | 'warning' | 'good'
  batch_status: string
}

export default function ExpirationTrackingPage() {
  const { currentStore } = useStoreStore()
  const [batches, setBatches] = useState<ExpiringBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'expired' | 'critical' | 'warning' | 'good'>('all')

  useEffect(() => {
    if (currentStore) {
      fetchExpiringBatches()
    }
  }, [currentStore])

  const fetchExpiringBatches = async () => {
    if (!currentStore) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('expiring_finished_goods')
      .select('*')
      .eq('store_id', currentStore.id)
      .order('expiration_date', { ascending: true })

    if (data) {
      setBatches(data.map(row => ({
        batch_id: row.batch_id,
        batch_number: row.batch_number,
        product_id: row.product_id,
        product_name: row.product_name,
        production_date: row.production_date,
        expiration_date: row.expiration_date,
        quantity_remaining: Number(row.quantity_remaining || 0),
        unit: row.unit,
        days_until_expiry: Number(row.days_until_expiry || 0),
        expiry_status: row.expiry_status,
        batch_status: row.batch_status
      })))
    }
    setLoading(false)
  }

  const markAsWastage = async (batch: ExpiringBatch) => {
    if (!confirm(`Mark ${batch.quantity_remaining} ${batch.unit} of ${batch.product_name} as wastage?`)) {
      return
    }

    // Get product cost
    const { data: product } = await supabase
      .from('products')
      .select('weighted_avg_cost')
      .eq('id', batch.product_id)
      .single()

    const costValue = product ? Number(product.weighted_avg_cost) * batch.quantity_remaining : 0

    // Create wastage record
    const { error: wastageError } = await supabase
      .from('wastage')
      .insert({
        product_id: batch.product_id,
        store_id: currentStore?.id,
        quantity: batch.quantity_remaining,
        reason: 'Expired',
        cost_value: costValue,
        wastage_date: new Date().toISOString().split('T')[0],
        notes: `Batch ${batch.batch_number} expired on ${batch.expiration_date}`
      })

    if (wastageError) {
      alert('Error creating wastage record: ' + wastageError.message)
      return
    }

    // Update batch status
    const { error: batchError } = await supabase
      .from('finished_goods_batches')
      .update({ 
        status: 'expired',
        quantity_remaining: 0
      })
      .eq('id', batch.batch_id)

    if (batchError) {
      alert('Error updating batch: ' + batchError.message)
      return
    }

    // Deduct from store inventory
    const { error: stockError } = await supabase
      .from('store_inventory')
      .update({
        current_stock: supabase.raw(`current_stock - ${batch.quantity_remaining}`)
      })
      .eq('product_id', batch.product_id)
      .eq('store_id', currentStore?.id)

    if (stockError) {
      alert('Error updating stock: ' + stockError.message)
      return
    }

    alert('Batch marked as wastage successfully')
    fetchExpiringBatches()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <XCircle className="text-red-500" size={20} />
      case 'critical':
        return <AlertTriangle className="text-red-500" size={20} />
      case 'warning':
        return <Clock className="text-yellow-500" size={20} />
      case 'good':
        return <CheckCircle className="text-green-500" size={20} />
      default:
        return <Package className="text-gray-500" size={20} />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      expired: 'bg-red-100 text-red-800',
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      good: 'bg-green-100 text-green-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const filteredBatches = filter === 'all' 
    ? batches 
    : batches.filter(b => b.expiry_status === filter)

  const stats = {
    expired: batches.filter(b => b.expiry_status === 'expired').length,
    critical: batches.filter(b => b.expiry_status === 'critical').length,
    warning: batches.filter(b => b.expiry_status === 'warning').length,
    good: batches.filter(b => b.expiry_status === 'good').length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finished Goods Expiration Tracking</h1>
        <Button onClick={fetchExpiringBatches} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${filter === 'expired' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter(filter === 'expired' ? 'all' : 'expired')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Expired</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <XCircle className="text-red-500" size={32} />
          </div>
        </div>

        <div 
          className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${filter === 'critical' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Critical (≤3 days)</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        <div 
          className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${filter === 'warning' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Warning (≤7 days)</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>

        <div 
          className={`bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all ${filter === 'good' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter(filter === 'good' ? 'all' : 'good')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Good (&gt;7 days)</p>
              <p className="text-2xl font-bold text-green-600">{stats.good}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {filter === 'all' ? 'All Batches' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Batches`}
            </h3>
            {filter !== 'all' && (
              <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                Show All
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No batches found
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.batch_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(batch.expiry_status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(batch.expiry_status)}`}>
                            {batch.expiry_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{batch.batch_number}</td>
                      <td className="px-4 py-3 font-medium">{batch.product_name}</td>
                      <td className="px-4 py-3">{formatDate(batch.production_date)}</td>
                      <td className="px-4 py-3">
                        <span className={batch.expiry_status === 'expired' ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(batch.expiration_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          batch.days_until_expiry < 0 ? 'text-red-600' :
                          batch.days_until_expiry <= 3 ? 'text-red-600' :
                          batch.days_until_expiry <= 7 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {batch.days_until_expiry < 0 
                            ? `${Math.abs(batch.days_until_expiry)} days ago` 
                            : `${batch.days_until_expiry} days`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {batch.quantity_remaining.toFixed(1)} {batch.unit}
                      </td>
                      <td className="px-4 py-3">
                        {(batch.expiry_status === 'expired' || batch.expiry_status === 'critical') && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => markAsWastage(batch)}
                          >
                            Mark as Wastage
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📋 How Expiration Tracking Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Automatic Batch Creation:</strong> When you produce finished goods, a batch is automatically created with expiration date</li>
          <li>• <strong>FIFO System:</strong> When selling, the system automatically uses the oldest batch first (First In, First Out)</li>
          <li>• <strong>Expiration Alerts:</strong> Get notified when batches are expiring soon or have expired</li>
          <li>• <strong>Wastage Tracking:</strong> Mark expired batches as wastage to maintain accurate inventory and cost tracking</li>
          <li>• <strong>Shelf Life:</strong> Each product has a defined shelf life (e.g., tea = 1 day, snacks = 7 days)</li>
        </ul>
      </div>
    </div>
  )
}
