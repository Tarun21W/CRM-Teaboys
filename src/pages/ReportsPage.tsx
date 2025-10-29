import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Calendar, TrendingUp, Package, DollarSign, Users, BarChart3 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface SalesReport {
  date: string
  total_sales: number
  total_orders: number
  avg_order_value: number
}

interface ProductReport {
  product_name: string
  quantity_sold: number
  revenue: number
  cost: number
  profit: number
}

interface StockReport {
  product_name: string
  current_stock: number
  stock_value: number
  reorder_level: number
  status: 'ok' | 'low' | 'out'
}

interface DailyProfitLoss {
  date: string
  revenue: number
  cogs: number
  gross_profit: number
  wastage_cost: number
  net_profit: number
  total_orders: number
  wastage_count: number
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'sales' | 'products' | 'stock' | 'profit' | 'trends'>('sales')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [productData, setProductData] = useState<ProductReport[]>([])
  const [stockData, setStockData] = useState<StockReport[]>([])
  const [profitLossData, setProfitLossData] = useState<DailyProfitLoss[]>([])
  const [loading, setLoading] = useState(false)

  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProfit: 0,
    avgOrderValue: 0,
    topProduct: '',
    lowStockItems: 0
  })

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setLoading(true)
    await Promise.all([
      fetchSalesReport(),
      fetchProductReport(),
      fetchStockReport(),
      fetchProfitLossReport(),
      fetchSummary()
    ])
    setLoading(false)
  }

  const fetchSalesReport = async () => {
    const { data } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to + 'T23:59:59')
      .order('sale_date')

    if (data) {
      const grouped = data.reduce((acc: any, sale) => {
        const date = sale.sale_date.split('T')[0]
        if (!acc[date]) {
          acc[date] = { total_sales: 0, total_orders: 0 }
        }
        acc[date].total_sales += Number(sale.total_amount)
        acc[date].total_orders += 1
        return acc
      }, {})

      const salesReport = Object.entries(grouped).map(([date, data]: [string, any]) => ({
        date,
        total_sales: data.total_sales,
        total_orders: data.total_orders,
        avg_order_value: data.total_sales / data.total_orders
      }))

      setSalesData(salesReport)
    }
  }

  const fetchProductReport = async () => {
    const { data } = await supabase
      .from('sales_lines')
      .select(`
        quantity,
        line_total,
        cost_price,
        products(name)
      `)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to + 'T23:59:59')

    if (data) {
      const grouped = data.reduce((acc: any, line: any) => {
        const name = line.products?.name || 'Unknown'
        if (!acc[name]) {
          acc[name] = { quantity_sold: 0, revenue: 0, cost: 0 }
        }
        acc[name].quantity_sold += Number(line.quantity)
        acc[name].revenue += Number(line.line_total)
        acc[name].cost += Number(line.cost_price || 0) * Number(line.quantity)
        return acc
      }, {})

      const productReport = Object.entries(grouped).map(([name, data]: [string, any]) => ({
        product_name: name,
        quantity_sold: data.quantity_sold,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost
      })).sort((a, b) => b.revenue - a.revenue)

      setProductData(productReport)
    }
  }

  const fetchStockReport = async () => {
    const { data } = await supabase
      .from('products')
      .select('name, current_stock, weighted_avg_cost, reorder_level')
      .eq('is_active', true)
      .order('name')

    if (data) {
      const stockReport = data.map(product => ({
        product_name: product.name,
        current_stock: product.current_stock,
        stock_value: product.current_stock * product.weighted_avg_cost,
        reorder_level: product.reorder_level,
        status: product.current_stock <= 0 ? 'out' as const :
                product.current_stock <= product.reorder_level ? 'low' as const : 'ok' as const
      }))

      setStockData(stockReport)
    }
  }

  const fetchProfitLossReport = async () => {
    const { data } = await supabase
      .from('daily_net_profit')
      .select('*')
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .order('date', { ascending: false })

    if (data) {
      setProfitLossData(data.map(row => ({
        date: row.date,
        revenue: Number(row.revenue || 0),
        cogs: Number(row.cogs || 0),
        gross_profit: Number(row.gross_profit || 0),
        wastage_cost: Number(row.wastage_cost || 0),
        net_profit: Number(row.net_profit || 0),
        total_orders: Number(row.total_orders || 0),
        wastage_count: Number(row.wastage_count || 0)
      })))
    }
  }

  const fetchSummary = async () => {
    // Total sales and orders
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to + 'T23:59:59')

    const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
    const totalOrders = sales?.length || 0
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Calculate total profit from product data
    const { data: salesLines } = await supabase
      .from('sales_lines')
      .select('line_total, cost_price, quantity')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to + 'T23:59:59')

    const totalProfit = salesLines?.reduce((sum, line) => {
      const revenue = Number(line.line_total)
      const cost = Number(line.cost_price || 0) * Number(line.quantity)
      return sum + (revenue - cost)
    }, 0) || 0

    // Low stock items
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, current_stock, reorder_level')
      .eq('is_active', true)

    const lowStock = allProducts?.filter(p => p.current_stock <= p.reorder_level) || []

    setSummary({
      totalSales,
      totalOrders,
      totalProfit,
      avgOrderValue,
      topProduct: productData[0]?.product_name || 'N/A',
      lowStockItems: lowStock.length
    })
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      return
    }

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${dateRange.from}_to_${dateRange.to}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const reportTabs = [
    { id: 'sales', name: 'Sales Report', icon: TrendingUp },
    { id: 'products', name: 'Product Analysis', icon: Package },
    { id: 'stock', name: 'Stock Report', icon: Package },
    { id: 'profit', name: 'Profit & Loss', icon: DollarSign },
    { id: 'trends', name: 'Trends & Charts', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Calendar className="text-gray-400" size={20} />
          <Input
            label="From"
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <Input
            label="To"
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
          <Button onClick={fetchReports} disabled={loading}>
            {loading ? 'Loading...' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSales)}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{summary.totalOrders}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalProfit)}</p>
            </div>
            <DollarSign className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{summary.lowStockItems}</p>
            </div>
            <Package className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {reportTabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReport(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap ${
                    activeReport === tab.id
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeReport === 'sales' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Daily Sales Report</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportToCSV(salesData, 'sales_report')}
                  disabled={salesData.length === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salesData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No sales data for selected period
                        </td>
                      </tr>
                    ) : (
                      salesData.map(row => (
                        <tr key={row.date}>
                          <td className="px-4 py-3">{formatDate(row.date)}</td>
                          <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(row.total_sales)}</td>
                          <td className="px-4 py-3">{row.total_orders}</td>
                          <td className="px-4 py-3">{formatCurrency(row.avg_order_value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Product Performance</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportToCSV(productData, 'product_report')}
                  disabled={productData.length === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No product data for selected period
                        </td>
                      </tr>
                    ) : (
                      productData.map((row, idx) => {
                        const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100) : 0
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium">{row.product_name}</td>
                            <td className="px-4 py-3">{row.quantity_sold}</td>
                            <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(row.revenue)}</td>
                            <td className="px-4 py-3 text-orange-600">{formatCurrency(row.cost)}</td>
                            <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(row.profit)}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'stock' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Stock Valuation Report</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportToCSV(stockData, 'stock_report')}
                  disabled={stockData.length === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stockData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No stock data available
                        </td>
                      </tr>
                    ) : (
                      stockData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium">{row.product_name}</td>
                          <td className="px-4 py-3">{row.current_stock}</td>
                          <td className="px-4 py-3 font-bold">{formatCurrency(row.stock_value)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              row.status === 'ok' ? 'bg-green-100 text-green-600' :
                              row.status === 'low' ? 'bg-orange-100 text-orange-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {row.status === 'ok' ? 'Good' : row.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'profit' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Daily Profit & Loss</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportToCSV(profitLossData, 'profit_loss_report')}
                  disabled={profitLossData.length === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COGS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wastage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {profitLossData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No profit & loss data for selected period
                        </td>
                      </tr>
                    ) : (
                      profitLossData.map((row, idx) => {
                        const margin = row.revenue > 0 ? ((row.net_profit / row.revenue) * 100) : 0
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{formatDate(row.date)}</td>
                            <td className="px-4 py-3">{row.total_orders}</td>
                            <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(row.revenue)}</td>
                            <td className="px-4 py-3 text-orange-600">{formatCurrency(row.cogs)}</td>
                            <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(row.gross_profit)}</td>
                            <td className="px-4 py-3 text-red-600">{formatCurrency(row.wastage_cost)}</td>
                            <td className="px-4 py-3 font-bold text-purple-600">{formatCurrency(row.net_profit)}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                  {profitLossData.length > 0 && (
                    <tfoot className="bg-gray-100 font-bold">
                      <tr>
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-4 py-3">{profitLossData.reduce((sum, row) => sum + row.total_orders, 0)}</td>
                        <td className="px-4 py-3 text-green-600">{formatCurrency(profitLossData.reduce((sum, row) => sum + row.revenue, 0))}</td>
                        <td className="px-4 py-3 text-orange-600">{formatCurrency(profitLossData.reduce((sum, row) => sum + row.cogs, 0))}</td>
                        <td className="px-4 py-3 text-blue-600">{formatCurrency(profitLossData.reduce((sum, row) => sum + row.gross_profit, 0))}</td>
                        <td className="px-4 py-3 text-red-600">{formatCurrency(profitLossData.reduce((sum, row) => sum + row.wastage_cost, 0))}</td>
                        <td className="px-4 py-3 text-purple-600">{formatCurrency(profitLossData.reduce((sum, row) => sum + row.net_profit, 0))}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const totalRevenue = profitLossData.reduce((sum, row) => sum + row.revenue, 0)
                            const totalNetProfit = profitLossData.reduce((sum, row) => sum + row.net_profit, 0)
                            const avgMargin = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100) : 0
                            return <span className={`${avgMargin >= 30 ? 'text-green-600' : avgMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {avgMargin.toFixed(1)}%
                            </span>
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeReport === 'trends' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold mb-4">Trends & Analytics</h3>
              
              {/* Product Performance Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Top & Bottom Products by Revenue</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    <Bar dataKey="profit" fill="#8b5cf6" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Revenue Trend */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Daily Revenue & Profit Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profitLossData.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(date) => formatDate(date)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="net_profit" stroke="#8b5cf6" strokeWidth={2} name="Net Profit" />
                    <Line type="monotone" dataKey="cogs" stroke="#f59e0b" strokeWidth={2} name="COGS" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Product Sales Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Product Sales Distribution (Top 5)</h4>
                <div className="grid grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={productData.slice(0, 5)}
                        dataKey="revenue"
                        nameKey="product_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => entry.product_name}
                      >
                        {productData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-600 mb-3">Top 5 Products</h5>
                    {productData.slice(0, 5).map((product, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][idx % 5] }}></div>
                          <span className="text-sm font-medium">{product.product_name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(product.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Best Seller</h5>
                  <p className="text-2xl font-bold text-green-900">{productData[0]?.product_name || 'N/A'}</p>
                  <p className="text-sm text-green-700 mt-1">{formatCurrency(productData[0]?.revenue || 0)} revenue</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-purple-800 mb-2">Most Profitable</h5>
                  <p className="text-2xl font-bold text-purple-900">
                    {[...productData].sort((a, b) => b.profit - a.profit)[0]?.product_name || 'N/A'}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    {formatCurrency([...productData].sort((a, b) => b.profit - a.profit)[0]?.profit || 0)} profit
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-orange-800 mb-2">Least Sold</h5>
                  <p className="text-2xl font-bold text-orange-900">
                    {productData[productData.length - 1]?.product_name || 'N/A'}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {formatCurrency(productData[productData.length - 1]?.revenue || 0)} revenue
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
