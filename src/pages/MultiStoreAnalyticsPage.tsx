import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, DollarSign, Package, Users, Store as StoreIcon, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface StoreMetrics {
  store_id: string
  store_name: string
  total_sales: number
  total_orders: number
  total_profit: number
  avg_order_value: number
  low_stock_items: number
  total_products: number
}

interface StoreSalesData {
  date: string
  [key: string]: string | number
}

export default function MultiStoreAnalyticsPage() {
  const [storeMetrics, setStoreMetrics] = useState<StoreMetrics[]>([])
  const [salesTrend, setSalesTrend] = useState<StoreSalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    await Promise.all([
      fetchStoreMetrics(),
      fetchSalesTrend()
    ])
    setLoading(false)
  }

  const fetchStoreMetrics = async () => {
    // Get all stores
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (!stores) return

    const metrics: StoreMetrics[] = []

    for (const store of (stores as any[])) {
      // Get sales data
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('store_id', store.id)
        .gte('sale_date', dateRange.from)
        .lte('sale_date', dateRange.to + 'T23:59:59')

      const totalSales = sales?.reduce((sum, s: any) => sum + Number(s.total_amount), 0) || 0
      const totalOrders = sales?.length || 0

      // Get profit data
      const { data: salesLines } = await supabase
        .from('sales_lines')
        .select('line_total, cost_price, quantity, sales!inner(store_id, sale_date)')
        .eq('sales.store_id', store.id)
        .gte('sales.sale_date', dateRange.from)
        .lte('sales.sale_date', dateRange.to + 'T23:59:59')

      const totalProfit = salesLines?.reduce((sum, line: any) => {
        const revenue = Number(line.line_total)
        const cost = Number(line.cost_price || 0) * Number(line.quantity)
        return sum + (revenue - cost)
      }, 0) || 0

      // Get product counts
      const { data: products } = await supabase
        .from('products')
        .select('id, current_stock, reorder_level')
        .eq('store_id', store.id)
        .eq('is_active', true)

      const totalProducts = products?.length || 0
      const lowStockItems = products?.filter((p: any) => p.current_stock <= p.reorder_level).length || 0

      metrics.push({
        store_id: store.id,
        store_name: store.name,
        total_sales: totalSales,
        total_orders: totalOrders,
        total_profit: totalProfit,
        avg_order_value: totalOrders > 0 ? totalSales / totalOrders : 0,
        low_stock_items: lowStockItems,
        total_products: totalProducts
      })
    }

    setStoreMetrics(metrics)
  }

  const fetchSalesTrend = async () => {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true)

    if (!stores) return

    // Get daily sales for each store
    const dailySales: { [date: string]: any } = {}

    for (const store of (stores as any[])) {
      const { data: sales } = await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .eq('store_id', store.id)
        .gte('sale_date', dateRange.from)
        .lte('sale_date', dateRange.to + 'T23:59:59')
        .order('sale_date')

      sales?.forEach((sale: any) => {
        const date = sale.sale_date.split('T')[0]
        if (!dailySales[date]) {
          dailySales[date] = { date }
        }
        dailySales[date][store.name] = (dailySales[date][store.name] || 0) + Number(sale.total_amount)
      })
    }

    const trendData = Object.values(dailySales).sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    setSalesTrend(trendData)
  }

  const totalMetrics = {
    totalSales: storeMetrics.reduce((sum, m) => sum + m.total_sales, 0),
    totalOrders: storeMetrics.reduce((sum, m) => sum + m.total_orders, 0),
    totalProfit: storeMetrics.reduce((sum, m) => sum + m.total_profit, 0),
    totalLowStock: storeMetrics.reduce((sum, m) => sum + m.low_stock_items, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Multi-Store Analytics</h1>
          <p className="text-gray-500 mt-1">Consolidated view of all stores</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Update
          </button>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sales (All Stores)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMetrics.totalSales)}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{totalMetrics.totalOrders}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMetrics.totalProfit)}</p>
            </div>
            <DollarSign className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{totalMetrics.totalLowStock}</p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Daily Sales Trend by Store</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={salesTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tickFormatter={(value) => `₹${value}`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            {storeMetrics.map((store, index) => (
              <Line
                key={store.store_id}
                type="monotone"
                dataKey={store.store_name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Store Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Store */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales by Store</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storeMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="store_name" />
              <YAxis tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total_sales" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit by Store */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Profit by Store</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storeMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="store_name" />
              <YAxis tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total_profit" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Sales Distribution</h3>
        {totalMetrics.totalSales === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No sales data available for the selected period</p>
            <p className="text-sm">Start making sales in any store to see the distribution</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storeMetrics.filter(m => m.total_sales > 0)}
                  dataKey="total_sales"
                  nameKey="store_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={false}
                  labelLine={false}
                >
                  {storeMetrics.filter(m => m.total_sales > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatCurrency(Number(value)),
                    `${props.payload.store_name} (${((props.payload.total_sales / totalMetrics.totalSales) * 100).toFixed(1)}%)`
                  ]}
                />
                <Legend 
                  formatter={(value, entry: any) => {
                    const percentage = ((entry.payload.total_sales / totalMetrics.totalSales) * 100).toFixed(1)
                    return `${value}: ${percentage}%`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              {storeMetrics.map((store, index) => (
                <div key={store.store_id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <h4 className="font-semibold">{store.store_name}</h4>
                    {store.total_sales === 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">No Sales</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Sales</p>
                      <p className={`font-bold ${store.total_sales > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {formatCurrency(store.total_sales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Orders</p>
                      <p className="font-bold">{store.total_orders}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profit</p>
                      <p className={`font-bold ${store.total_profit > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                        {formatCurrency(store.total_profit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Order</p>
                      <p className="font-bold">{formatCurrency(store.avg_order_value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store Performance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Store Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {storeMetrics.map((store) => {
                  const margin = store.total_sales > 0 ? (store.total_profit / store.total_sales) * 100 : 0
                  return (
                    <tr key={store.store_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{store.store_name}</td>
                      <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(store.total_sales)}</td>
                      <td className="px-4 py-3">{store.total_orders}</td>
                      <td className="px-4 py-3">{formatCurrency(store.avg_order_value)}</td>
                      <td className="px-4 py-3 font-bold text-purple-600">{formatCurrency(store.total_profit)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${margin >= 30 ? 'text-green-600' :
                            margin >= 15 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">{store.total_products}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${store.low_stock_items > 5 ? 'bg-red-100 text-red-800' :
                            store.low_stock_items > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {store.low_stock_items}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-green-600">{formatCurrency(totalMetrics.totalSales)}</td>
                  <td className="px-4 py-3">{totalMetrics.totalOrders}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(totalMetrics.totalOrders > 0 ? totalMetrics.totalSales / totalMetrics.totalOrders : 0)}
                  </td>
                  <td className="px-4 py-3 text-purple-600">{formatCurrency(totalMetrics.totalProfit)}</td>
                  <td className="px-4 py-3">
                    {totalMetrics.totalSales > 0 ? ((totalMetrics.totalProfit / totalMetrics.totalSales) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-4 py-3">{storeMetrics.reduce((sum, m) => sum + m.total_products, 0)}</td>
                  <td className="px-4 py-3">{totalMetrics.totalLowStock}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
