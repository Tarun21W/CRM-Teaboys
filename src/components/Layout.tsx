import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { 
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, 
  Factory, BarChart3, LogOut, Menu, X, Users, Coffee, 
  User, Settings, HelpCircle, ChevronDown 
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Layout() {
  const { profile, signOut } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'baker'] },
    { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'manager'] },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag, roles: ['admin', 'manager'] },
    { name: 'Production', href: '/production', icon: Factory, roles: ['admin', 'manager', 'baker'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ]

  // Don't filter navigation if profile isn't loaded yet
  const filteredNav = profile 
    ? navigation.filter(item => item.roles.includes(profile.role))
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-orange-100 z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
            <Coffee className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Tea Boys</h1>
            <p className="text-xs text-gray-500">☕ Management</p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-orange-50 rounded-xl transition-colors"
        >
          {sidebarOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 z-40 transform transition-transform shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo & User Info */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg relative">
              <Coffee className="text-white" size={24} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Tea Boys</h1>
              <p className="text-xs text-gray-500 font-medium">☕ Bakery & Tea Shop</p>
            </div>
          </div>
          
          {/* Interactive Profile Card */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-600 capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    {profile?.role || 'loading...'}
                  </p>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 hover:text-orange-600"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 hover:text-orange-600"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 hover:text-orange-600"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      // Add help action here
                    }}
                  >
                    <HelpCircle size={18} />
                    <span className="text-sm font-medium">Help & Support</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {filteredNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
