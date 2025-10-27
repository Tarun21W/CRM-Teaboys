import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useProductsStore } from '@/stores/productsStore'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Search, Trash2, Plus, Minus, Percent, User, Phone, Printer, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'credit'>('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuthStore()
  const { products, loading, fetchProducts, searchProducts } = useProductsStore()
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    clear,
    getSubtotal,
    getDiscountTotal,
    getTotal,
  } = useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    // Focus search input on mount
    searchInputRef.current?.focus()

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F9' && items.length > 0) {
        e.preventDefault()
        handleCheckout()
      } else if (e.key === 'Escape') {
        setSearch('')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [items])

  const handleAddToCart = (product: any) => {
    if (product.current_stock <= 0) {
      toast.error('Product out of stock')
      return
    }
    addItem(product)
    toast.success(`${product.name} added to cart`)
    setSearch('')
    searchInputRef.current?.focus()
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.id)
      if (!product || product.current_stock < item.quantity) {
        toast.error(`Insufficient stock for ${item.name}`)
        return
      }
    }

    setProcessing(true)
    try {
      let sale = null
      let billNum = null
      let retries = 3
      
      // Retry logic to handle race conditions with bill number generation
      while (retries > 0 && !sale) {
        try {
          // Generate bill number
          const { data: generatedBillNum, error: billError } = await supabase.rpc('generate_bill_number')
          if (billError) throw billError
          billNum = generatedBillNum

          // Insert sale
          const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
              bill_number: billNum,
              subtotal: getSubtotal(),
              discount_amount: getDiscountTotal(),
              total_amount: getTotal(),
              payment_mode: paymentMode,
              customer_name: customerName || null,
              customer_phone: customerPhone || null,
              created_by: user?.id,
            })
            .select()
            .single()

          if (saleError) {
            // If duplicate bill number, retry
            if (saleError.message.includes('duplicate key') || saleError.message.includes('sales_bill_number_key')) {
              retries--
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms before retry
                continue
              }
            }
            throw saleError
          }
          
          sale = saleData
          break
        } catch (err) {
          if (retries === 1) throw err
          retries--
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      if (!sale) throw new Error('Failed to create sale after retries')

      // Insert sale lines
      const saleLines = items.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price,
        discount_percent: item.discount,
        line_total: item.selling_price * item.quantity * (1 - item.discount / 100),
      }))

      const { error: linesError } = await supabase
        .from('sales_lines')
        .insert(saleLines)

      if (linesError) throw linesError

      toast.success(`Sale completed! Bill: ${billNum}`)
      
      // Clear cart and customer info
      clear()
      setCustomerName('')
      setCustomerPhone('')
      setPaymentMode('cash')
      
      // Refresh products
      await fetchProducts()
      
      // Focus search
      searchInputRef.current?.focus()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete sale')
    } finally {
      setProcessing(false)
    }
  }

  const filteredProducts = searchProducts(search).filter(
    p => p.is_finished_good && p.current_stock > 0
  )

  const subtotal = getSubtotal()
  const discountTotal = getDiscountTotal()
  const total = getTotal()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="lg:col-span-2 bg-white rounded-xl p-6 overflow-auto">
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name or SKU... (F2)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 text-sm text-gray-500">
            <span>F2: Search</span>
            <span>•</span>
            <span>F9: Checkout</span>
            <span>•</span>
            <span>ESC: Clear</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading products...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="p-4 border rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
              >
                <h3 className="font-medium line-clamp-2">{product.name}</h3>
                <p className="text-primary-600 font-bold mt-2">
                  {formatCurrency(product.selling_price)}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    Stock: {product.current_stock} {product.unit}
                  </span>
                  {product.current_stock <= product.reorder_level && (
                    <span className="text-xs text-orange-600 font-medium">Low</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="bg-white rounded-xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cart ({items.length})</h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X size={16} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto space-y-2 mb-4">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Cart is empty
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 border rounded hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 border rounded hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(item.selling_price * item.quantity)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Percent size={14} className="text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">% discount</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount</span>
              <span>-{formatCurrency(discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomerModal(true)}
            className="w-full"
          >
            <User size={16} className="mr-2" />
            {customerName || 'Add Customer Details'}
          </Button>

          <Button
            onClick={handleCheckout}
            disabled={items.length === 0 || processing}
            className="w-full"
            size="lg"
          >
            {processing ? 'Processing...' : `Complete Sale (F9)`}
          </Button>
        </div>
      </div>

      {/* Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Customer Details"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Optional"
            type="tel"
          />
          <Button onClick={() => setShowCustomerModal(false)} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}
