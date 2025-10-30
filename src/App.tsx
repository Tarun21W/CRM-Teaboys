import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import POSPage from '@/pages/POSPage'
import ProductsPage from '@/pages/ProductsPage'
import PurchasesPage from '@/pages/PurchasesPage'
import ProductionPage from '@/pages/ProductionPage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'
import ExpirationTrackingPage from '@/pages/ExpirationTrackingPage'
import MultiStoreAnalyticsPage from '@/pages/MultiStoreAnalyticsPage'
import Layout from '@/components/Layout'

function App() {
  const { user, loading, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Initial profile fetch
    fetchProfile()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="production" element={<ProductionPage />} />
          <Route path="expiration" element={<ExpirationTrackingPage />} />
          <Route path="multi-store" element={<MultiStoreAnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
