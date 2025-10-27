import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Calendar, TrendingUp, Package, DollarSign, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
  profit: number
}

interface StockReport {
  product_name: string
  current_stock: number
  stock_value: number
  reorder_level: number
  status: 'ok' | 'low' | 'out'
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'sales' | 'products' | 'stock' | 'profit'>('sales')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [productData, setProductData] = useState<ProductReport[]>([])
  const [stockData, setStockData] = useState<StockReport[]>([])
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No product data for selected period
                        </td>
                      </tr>
                    ) : (
                      productData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium">{row.product_name}</td>
                          <td className="px-4 py-3">{row.quantity_sold}</td>
                          <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(row.revenue)}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(row.profit)}</td>
                        </tr>
                      ))
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
              <h3 className="text-lg font-semibold mb-4">Profit & Loss Statement</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Sales</span>
                        <span className="font-bold">{formatCurrency(summary.totalSales)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">Costs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cost of Goods Sold</span>
                        <span className="font-bold">{formatCurrency(summary.totalSales - summary.totalProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t mt-6 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Net Profit</span>
                    <span className="text-green-600">{formatCurrency(summary.totalProfit)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Profit Margin</span>
                    <span>{summary.totalSales > 0 ? ((summary.totalProfit / summary.totalSales) * 100).toFixed(2) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
