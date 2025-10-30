import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Store, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface StoreMetrics {
  store_id: string
  store_name: string
  store_code: string
  today_sales: number
  today_orders: number
  month_sales: number
  month_orders: number
  total_products: number
  low_stock_items: number
  active_batches: number
  expired_batches: number
  avg_order_value: number
  growth_rate: number
}

interface StoreSalesData {
  store_name: string
  sales: number
  orders: number
  profit: number
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export default function MultiStoreDashboard() {
  const [metrics, setMetrics] = useState<StoreMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchMultiStoreMetrics()
  }, [dateRange])

  const fetchMultiStoreMetrics = async () => {
    setLoading(true)
    
    // Fetch all stores
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (!stores) {
      setLoading(false)
      return
    }

    // Initialize selected stores if empty
    if (selectedStores.length === 0) {
      setSelectedStores(stores.map(s => s.id))
    }

    const metricsData: StoreMetrics[] = []

    for (const store of stores) {
      // Today's sales
      const { data: todaySales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('store_id', store.id)
        .gte('sale_date', new Date().toISOString().split('T')[0])

      // Month's sales
      const monthStart = new Date()
      monthStart.setDate(1)
      const { data: monthSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('store_id', store.id)
        .gte('sale_date', monthStart.toISOString().split('T')[0])

      // Products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true)

      // Low stock items
      const { data: products } = await supabase
        .from('products')
        .select('current_stock, reorder_level')
        .eq('store_id', store.id)
        .eq('is_active', true)

      const lowStockCount = products?.filter(p => p.current_stock <= p.reorder_level).length || 0

      // Batches
      const { count: activeBatches } = await supabase
        .from('finished_goods_batches')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'active')

      const { count: expiredBatches } = await supabase
        .from('finished_goods_batches')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'expired')

      // Calculate metrics
      const todayTotal = todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const todayCount = todaySales?.length || 0
      const monthTotal = monthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const monthCount = monthSales?.length || 0

      // Previous month for growth rate
      const prevMonthStart = new Date()
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
      prevMonthStart.setDate(1)
      const prevMonthEnd = new Date()
      prevMonthEnd.setDate(0)

      const { data: prevMonthSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('store_id', store.id)
        .gte('sale_date', prevMonthStart.toISOString().split('T')[0])
        .lte('sale_date', prevMonthEnd.toISOString().split('T')[0])

      const prevMonthTotal = prevMonthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const growthRate = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100) : 0

      metricsData.push({
        store_id: store.id,
        store_name: store.name,
        store_code: store.code,
        today_sales: todayTotal,
        today_orders: todayCount,
        month_sales: monthTotal,
        month_orders: monthCount,
        total_products: productsCount || 0,
        low_stock_items: lowStockCount,
        active_batches: activeBatches || 0,
        expired_batches: expiredBatches || 0,
        avg_order_value: monthCount > 0 ? monthTotal / monthCount : 0,
        growth_rate: growthRate
      })
    }

    setMetrics(metricsData)
    setLoading(false)
  }

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }

  const selectAllStores = () => {
    setSelectedStores(metrics.map(m => m.store_id))
  }

  const deselectAllStores = () => {
    setSelectedStores([])
  }

  const filteredMetrics = metrics.filter(m => selectedStores.includes(m.store_id))

  // Aggregate totals
  const totals = {
    today_sales: filteredMetrics.reduce((sum, m) => sum + m.today_sales, 0),
    today_orders: filteredMetrics.reduce((sum, m) => sum + m.today_orders, 0),
    month_sales: filteredMetrics.reduce((sum, m) => sum + m.month_sales, 0),
    month_orders: filteredMetrics.reduce((sum, m) => sum + m.month_orders, 0),
    total_products: filteredMetrics.reduce((sum, m) => sum + m.total_products, 0),
    low_stock_items: filteredMetrics.reduce((sum, m) => sum + m.low_stock_items, 0),
    active_batches: filteredMetrics.reduce((sum, m) => sum + m.active_batches, 0),
    expired_batches: filteredMetrics.reduce((sum, m) => sum + m.expired_batches, 0),
    avg_order_value: filteredMetrics.length > 0 
      ? filteredMetrics.reduce((sum, m) => sum + m.avg_order_value, 0) / filteredMetrics.length 
      : 0
  }

  // Chart data
  const salesComparisonData = filteredMetrics.map(m => ({
    store: m.store_code,
    'Today': m.today_sales,
    'This Month': m.month_sales
  }))

  const storePerformanceData = filteredMetrics.map(m => ({
    name: m.store_code,
    value: m.month_sales
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Multi-Store Dashboard</h1>
          <p className="text-gray-500 mt-1">Consolidated view across all stores</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Store Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Stores to Compare</h3>
          <div className="flex gap-2">
            <button
              onClick={selectAllStores}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              Select All
            </button>
            <button
              onClick={deselectAllStores}
              className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map(store => (
            <button
              key={store.store_id}
              onClick={() => toggleStore(store.store_id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedStores.includes(store.store_id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedStores.includes(store.store_id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Store size={24} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">{store.store_name}</h4>
                  <p className="text-sm text-gray-500">{store.store_code}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Today</p>
                  <p className="font-bold text-green-600">{formatCurrency(store.today_sales)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Month</p>
                  <p className="font-bold text-blue-600">{formatCurrency(store.month_sales)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl text-gray-500">Loading metrics...</div>
        </div>
      ) : filteredMetrics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">Select at least one store to view metrics</p>
        </div>
      ) : (
        <>
          {/* Aggregate Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-800">Today's Sales</h3>
                <DollarSign className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(totals.today_sales)}</p>
              <p className="text-sm text-green-700 mt-1">{totals.today_orders} orders</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800">Month's Sales</h3>
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(totals.month_sales)}</p>
              <p className="text-sm text-blue-700 mt-1">{totals.month_orders} orders</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-800">Avg Order Value</h3>
                <ShoppingCart className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-purple-900">{formatCurrency(totals.avg_order_value)}</p>
              <p className="text-sm text-purple-700 mt-1">Across {filteredMetrics.length} stores</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-orange-800">Low Stock Items</h3>
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-orange-900">{totals.low_stock_items}</p>
              <p className="text-sm text-orange-700 mt-1">Need reordering</p>
            </div>
          </div>

          {/* Store Comparison Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Store Performance Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMetrics.map((store, idx) => (
                    <tr key={store.store_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white`}
                               style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                            <Store size={16} />
                          </div>
                          <div>
                            <div className="font-medium">{store.store_name}</div>
                            <div className="text-xs text-gray-500">{store.store_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(store.today_sales)}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(store.month_sales)}</td>
                      <td className="px-6 py-4">{store.month_orders}</td>
                      <td className="px-6 py-4">{formatCurrency(store.avg_order_value)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {store.growth_rate >= 0 ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                          <span className={`font-semibold ${store.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {store.growth_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{store.total_products}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          store.low_stock_items > 5 ? 'bg-red-100 text-red-800' :
                          store.low_stock_items > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {store.low_stock_items}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="px-6 py-4">TOTAL</td>
                    <td className="px-6 py-4 text-green-600">{formatCurrency(totals.today_sales)}</td>
                    <td className="px-6 py-4 text-blue-600">{formatCurrency(totals.month_sales)}</td>
                    <td className="px-6 py-4">{totals.month_orders}</td>
                    <td className="px-6 py-4">{formatCurrency(totals.avg_order_value)}</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">{totals.total_products}</td>
                    <td className="px-6 py-4">{totals.low_stock_items}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Comparison Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Sales Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="store" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="Today" fill="#10b981" />
                  <Bar dataKey="This Month" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Market Share Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Market Share (Month Sales)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={storePerformanceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {storePerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Store Rankings */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Store Rankings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top by Sales */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">🏆 Top by Sales</h4>
                <div className="space-y-2">
                  {[...filteredMetrics]
                    .sort((a, b) => b.month_sales - a.month_sales)
                    .slice(0, 3)
                    .map((store, idx) => (
                      <div key={store.store_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{store.store_code}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(store.month_sales)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top by Growth */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">📈 Top by Growth</h4>
                <div className="space-y-2">
                  {[...filteredMetrics]
                    .sort((a, b) => b.growth_rate - a.growth_rate)
                    .slice(0, 3)
                    .map((store, idx) => (
                      <div key={store.store_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{store.store_code}</div>
                          <div className="text-xs text-green-600">+{store.growth_rate.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top by Orders */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">🛒 Top by Orders</h4>
                <div className="space-y-2">
                  {[...filteredMetrics]
                    .sort((a, b) => b.month_orders - a.month_orders)
                    .slice(0, 3)
                    .map((store, idx) => (
                      <div key={store.store_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{store.store_code}</div>
                          <div className="text-xs text-gray-500">{store.month_orders} orders</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
