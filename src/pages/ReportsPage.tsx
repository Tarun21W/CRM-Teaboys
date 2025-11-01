import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStoreStore } from '@/stores/storeStore'
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

interface SalesTrend {
  date: string
  revenue: number
  moving_avg_7day: number
  moving_avg_14day: number
  growth_rate_percent: number
  wow_growth_percent: number
  trend_direction: 'up' | 'down' | 'stable'
}

interface ReorderRecommendation {
  product_id: string
  product_name: string
  current_stock: number
  unit: string
  avg_daily_demand: number
  days_until_stockout: number
  recommended_order_qty: number
  demand_trend: 'increasing' | 'decreasing' | 'stable'
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

interface DayPattern {
  day_name: string
  day_number: number
  avg_daily_revenue: number
  total_orders: number
  avg_order_value: number
}

export default function ReportsPage() {
  const { currentStore } = useStoreStore()
  const [activeReport, setActiveReport] = useState<'sales' | 'products' | 'stock' | 'profit' | 'trends' | 'predictions'>('sales')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [productData, setProductData] = useState<ProductReport[]>([])
  const [stockData, setStockData] = useState<StockReport[]>([])
  const [profitLossData, setProfitLossData] = useState<DailyProfitLoss[]>([])
  const [salesTrendData, setSalesTrendData] = useState<SalesTrend[]>([])
  const [reorderData, setReorderData] = useState<ReorderRecommendation[]>([])
  const [dayPatternData, setDayPatternData] = useState<DayPattern[]>([])
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
    if (currentStore) {
      fetchReports()
    }
  }, [dateRange, currentStore])

  const fetchReports = async () => {
    setLoading(true)
    await Promise.all([
      fetchSalesReport(),
      fetchProductReport(),
      fetchStockReport(),
      fetchProfitLossReport(),
      fetchPredictiveData(),
      fetchSummary()
    ])
    setLoading(false)
  }

  const fetchSalesReport = async () => {
    if (!currentStore) return

    const { data } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('store_id', currentStore.id)
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
    if (!currentStore) return

    // Get sales for this store first
    const { data: salesData } = await supabase
      .from('sales')
      .select('id')
      .eq('store_id', currentStore.id)
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to + 'T23:59:59')

    if (!salesData || salesData.length === 0) {
      setProductData([])
      return
    }

    const saleIds = salesData.map(s => s.id)

    const { data } = await supabase
      .from('sales_lines')
      .select(`
        quantity,
        line_total,
        cost_price,
        products(name)
      `)
      .in('sale_id', saleIds)
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
    if (!currentStore) return

    const { data } = await supabase
      .from('store_inventory')
      .select(`
        current_stock,
        weighted_avg_cost,
        reorder_level,
        products(name)
      `)
      .eq('store_id', currentStore.id)
      .order('products(name)')

    if (data) {
      const stockReport = data.map((item: any) => ({
        product_name: item.products?.name || 'Unknown',
        current_stock: item.current_stock,
        stock_value: item.current_stock * item.weighted_avg_cost,
        reorder_level: item.reorder_level,
        status: item.current_stock <= 0 ? 'out' as const :
          item.current_stock <= item.reorder_level ? 'low' as const : 'ok' as const
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

  const fetchPredictiveData = async () => {
    // Fetch sales trend analysis
    const { data: trendData } = await supabase
      .from('sales_trend_analysis')
      .select('*')
      .gte('date', dateRange.from)
      .lte('date', dateRange.to)
      .order('date', { ascending: false })
      .limit(30)

    if (trendData) {
      setSalesTrendData(trendData.map(row => ({
        date: row.date,
        revenue: Number(row.revenue || 0),
        moving_avg_7day: Number(row.moving_avg_7day || 0),
        moving_avg_14day: Number(row.moving_avg_14day || 0),
        growth_rate_percent: Number(row.growth_rate_percent || 0),
        wow_growth_percent: Number(row.wow_growth_percent || 0),
        trend_direction: row.trend_direction || 'stable'
      })))
    }

    // Fetch reorder recommendations
    const { data: reorderData } = await supabase
      .from('reorder_recommendations')
      .select('*')
      .order('priority', { ascending: true })
      .limit(20)

    if (reorderData) {
      setReorderData(reorderData.map(row => ({
        product_id: row.product_id,
        product_name: row.product_name,
        current_stock: Number(row.current_stock || 0),
        unit: row.unit,
        avg_daily_demand: Number(row.avg_daily_demand || 0),
        days_until_stockout: Number(row.days_until_stockout || 999),
        recommended_order_qty: Number(row.recommended_order_qty || 0),
        demand_trend: row.demand_trend || 'stable',
        priority: row.priority || 'low'
      })))
    }

    // Fetch day of week patterns
    const { data: dayData } = await supabase
      .from('day_of_week_pattern')
      .select('*')
      .order('day_number', { ascending: true })

    if (dayData) {
      setDayPatternData(dayData.map(row => ({
        day_name: row.day_name?.trim() || '',
        day_number: Number(row.day_number || 0),
        avg_daily_revenue: Number(row.avg_daily_revenue || 0),
        total_orders: Number(row.total_orders || 0),
        avg_order_value: Number(row.avg_order_value || 0)
      })))
    }
  }

  const fetchSummary = async () => {
    if (!currentStore) return

    // Total sales and orders - filtered by store
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('store_id', currentStore.id)
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to + 'T23:59:59')

    const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
    const totalOrders = sales?.length || 0
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Calculate total profit from product data - filtered by store's sales
    const { data: storeSales } = await supabase
      .from('sales')
      .select('id')
      .eq('store_id', currentStore.id)
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to + 'T23:59:59')

    if (!storeSales || storeSales.length === 0) {
      setSummary({
        totalSales: 0,
        totalOrders: 0,
        totalProfit: 0,
        avgOrderValue: 0,
        topProduct: 'N/A',
        lowStockItems: 0
      })
      return
    }

    const saleIds = storeSales.map(s => s.id)

    const { data: salesLines } = await supabase
      .from('sales_lines')
      .select('line_total, cost_price, quantity')
      .in('sale_id', saleIds)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to + 'T23:59:59')

    const totalProfit = salesLines?.reduce((sum, line) => {
      const revenue = Number(line.line_total)
      const cost = Number(line.cost_price || 0) * Number(line.quantity)
      return sum + (revenue - cost)
    }, 0) || 0

    // Low stock items - from store_inventory
    const { data: storeInventory } = await supabase
      .from('store_inventory')
      .select('current_stock, reorder_level')
      .eq('store_id', currentStore.id)

    const lowStock = storeInventory?.filter(inv => inv.current_stock <= inv.reorder_level) || []

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
    { id: 'predictions', name: 'Predictions & AI', icon: TrendingUp },
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
                  className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap ${activeReport === tab.id
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
                            <span className={`px-2 py-1 text-xs rounded-full ${row.status === 'ok' ? 'bg-green-100 text-green-600' :
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

          {activeReport === 'predictions' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold mb-4">Predictive Analytics & AI Insights</h3>

              {/* Sales Trend with Moving Averages */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Sales Trend with Moving Averages</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrendData.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(date) => formatDate(date)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Actual Revenue" />
                    <Line type="monotone" dataKey="moving_avg_7day" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="7-Day Average" />
                    <Line type="monotone" dataKey="moving_avg_14day" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="10 5" name="14-Day Average" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Growth Rate Analysis */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Growth Rate Analysis</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesTrendData.slice(0, 14).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      labelFormatter={(date) => formatDate(date)}
                    />
                    <Legend />
                    <Bar dataKey="growth_rate_percent" fill="#10b981" name="Daily Growth %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Day of Week Performance */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Best Performing Days</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dayPatternData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="avg_daily_revenue" fill="#10b981" name="Avg Daily Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reorder Recommendations */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-4">Smart Reorder Recommendations</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Demand</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reorderData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No reorder recommendations available
                          </td>
                        </tr>
                      ) : (
                        reorderData.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{item.product_name}</td>
                            <td className="px-4 py-3">{item.current_stock.toFixed(1)} {item.unit}</td>
                            <td className="px-4 py-3">{item.avg_daily_demand.toFixed(1)} {item.unit}/day</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${item.days_until_stockout <= 3 ? 'text-red-600' :
                                item.days_until_stockout <= 7 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                {item.days_until_stockout > 999 ? '∞' : Math.floor(item.days_until_stockout)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-blue-600">
                              {item.recommended_order_qty.toFixed(1)} {item.unit}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.demand_trend === 'increasing' ? 'bg-green-100 text-green-800' :
                                item.demand_trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {item.demand_trend}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                {item.priority}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Revenue Trend</h5>
                  <p className="text-2xl font-bold text-blue-900">
                    {salesTrendData[0]?.trend_direction === 'up' ? '📈 Growing' :
                      salesTrendData[0]?.trend_direction === 'down' ? '📉 Declining' : '➡️ Stable'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {salesTrendData[0]?.growth_rate_percent ?
                      `${salesTrendData[0].growth_rate_percent.toFixed(1)}% vs yesterday` : 'No data'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Best Day</h5>
                  <p className="text-2xl font-bold text-green-900">
                    {dayPatternData.sort((a, b) => b.avg_daily_revenue - a.avg_daily_revenue)[0]?.day_name?.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {formatCurrency(dayPatternData.sort((a, b) => b.avg_daily_revenue - a.avg_daily_revenue)[0]?.avg_daily_revenue || 0)} avg
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-red-800 mb-2">Urgent Reorders</h5>
                  <p className="text-2xl font-bold text-red-900">
                    {reorderData.filter(item => item.priority === 'urgent' || item.priority === 'high').length}
                  </p>
                  <p className="text-sm text-red-700 mt-1">Items need restocking</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
