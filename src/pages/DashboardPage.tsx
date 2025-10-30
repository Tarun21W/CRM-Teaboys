import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStoreStore } from '@/stores/storeStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Package, ShoppingCart, AlertTriangle, DollarSign, Users } from 'lucide-react'

interface DashboardStats {
  todaySales: number
  todayOrders: number
  lowStock: number
  totalProducts: number
  avgBillValue: number
  totalCustomers: number
}

interface RecentSale {
  id: string
  bill_number: string
  total_amount: number
  payment_mode: string
  sale_date: string
  customer_name: string | null
}

interface TopProduct {
  name: string
  total_quantity: number
  total_revenue: number
}

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { currentStore } = useStoreStore()
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    lowStock: 0,
    totalProducts: 0,
    avgBillValue: 0,
    totalCustomers: 0,
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentStore) {
      fetchDashboardData()
    }
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (currentStore) {
        fetchDashboardData()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [currentStore])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentSales(),
        fetchTopProducts(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!currentStore) return

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Today's sales - filtered by store
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, customer_name, customer_phone')
      .eq('store_id', currentStore.id)
      .gte('sale_date', today)
      .lt('sale_date', tomorrow)

    const todaySales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
    const todayOrders = sales?.length || 0
    const avgBillValue = todayOrders > 0 ? todaySales / todayOrders : 0
    
    // Count unique customers (by name or phone, or count walk-ins)
    const uniqueCustomers = new Set()
    let walkInCount = 0
    
    sales?.forEach(sale => {
      if (sale.customer_name || sale.customer_phone) {
        // Use phone as primary identifier, fallback to name
        const identifier = sale.customer_phone || sale.customer_name
        uniqueCustomers.add(identifier)
      } else {
        // Count each walk-in sale as a separate customer
        walkInCount++
      }
    })
    
    const totalCustomers = uniqueCustomers.size + walkInCount

    // Low stock products - using store_inventory filtered by store
    const { data: storeInventory } = await supabase
      .from('store_inventory')
      .select('id, current_stock, reorder_level, product_id')
      .eq('store_id', currentStore.id)

    const lowStockProducts = storeInventory?.filter(
      p => p.current_stock <= p.reorder_level
    ) || []

    // Total products - count from store_inventory for this store
    const { count: totalProducts } = await supabase
      .from('store_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', currentStore.id)

    setStats({
      todaySales,
      todayOrders,
      lowStock: lowStockProducts.length,
      totalProducts: totalProducts || 0,
      avgBillValue,
      totalCustomers,
    })
  }

  const fetchRecentSales = async () => {
    if (!currentStore) return

    const { data } = await supabase
      .from('sales')
      .select('id, bill_number, total_amount, payment_mode, sale_date, customer_name')
      .eq('store_id', currentStore.id)
      .order('sale_date', { ascending: false })
      .limit(5)

    if (data) setRecentSales(data)
  }

  const fetchTopProducts = async () => {
    if (!currentStore) return

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get sales lines for this store's sales only
    const { data: salesData } = await supabase
      .from('sales')
      .select('id')
      .eq('store_id', currentStore.id)
      .gte('sale_date', weekAgo.toISOString())

    if (!salesData || salesData.length === 0) {
      setTopProducts([])
      return
    }

    const saleIds = salesData.map(s => s.id)

    const { data } = await supabase
      .from('sales_lines')
      .select(`
        quantity,
        line_total,
        products (name)
      `)
      .in('sale_id', saleIds)
      .gte('created_at', weekAgo.toISOString())

    if (data) {
      const productMap = new Map<string, { quantity: number; revenue: number }>()

      data.forEach((item: any) => {
        const name = item.products?.name || 'Unknown'
        const existing = productMap.get(name) || { quantity: 0, revenue: 0 }
        productMap.set(name, {
          quantity: existing.quantity + Number(item.quantity),
          revenue: existing.revenue + Number(item.line_total),
        })
      })

      const products = Array.from(productMap.entries())
        .map(([name, data]) => ({
          name,
          total_quantity: data.quantity,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5)

      setTopProducts(products)
    }
  }

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      change: '+12%',
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      change: '+8%',
    },
    {
      title: 'Avg Bill Value',
      value: formatCurrency(stats.avgBillValue),
      icon: DollarSign,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
      change: '+5%',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-600',
      alert: stats.lowStock > 0,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-yellow-600" size={32} />
            <h3 className="text-lg font-semibold text-yellow-900">No Store Access</h3>
          </div>
          <p className="text-yellow-800 mb-4">
            You don't have access to any stores. Please contact your administrator to assign you to a store.
          </p>
          <p className="text-sm text-yellow-700">
            Admin users can manage store assignments from the User-Store Management page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">☕</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-500 text-sm">
                {currentStore ? `${currentStore.name} • ` : ''}Brewing success, one cup at a time
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Live</span>
          <span className="text-gray-300">•</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 text-white/10 text-9xl">🍵</div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.full_name}! ☕</h2>
          <p className="text-white/90">Here's your tea shop performance for today</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className={`relative bg-gradient-to-br ${card.bgGradient} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/50 overflow-hidden group`}
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.iconBg} p-3 rounded-xl shadow-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  {card.change && (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <TrendingUp size={14} />
                      {card.change}
                    </span>
                  )}
                  {card.alert && (
                    <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Needs attention
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales yet today</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{sale.bill_number}</p>
                    <p className="text-sm text-gray-500">
                      {sale.customer_name || 'Walk-in'} • {sale.payment_mode.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.sale_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Top Products (Last 7 Days)</h2>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.total_quantity} units sold
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatCurrency(product.total_revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <Package className="text-blue-500" size={32} />
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <Users className="text-purple-500" size={32} />
            <div>
              <p className="text-gray-500 text-sm">Today's Customers</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={32} />
            <div>
              <p className="text-gray-500 text-sm">Low Stock Alerts</p>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
