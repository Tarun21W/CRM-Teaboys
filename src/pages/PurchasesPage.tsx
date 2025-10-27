import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, FileText, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface Purchase {
  id: string
  purchase_number: string
  supplier_id: string
  purchase_date: string
  invoice_number: string | null
  total_amount: number
  notes: string | null
  suppliers?: { name: string }
  purchase_lines?: PurchaseLine[]
}

interface PurchaseLine {
  id: string
  product_id: string
  quantity: number
  unit_cost: number
  total_cost: number
  products?: { name: string; unit: string }
}

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  unit: string
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState<Array<{
    product_id: string
    quantity: string
    unit_cost: string
  }>>([{ product_id: '', quantity: '', unit_cost: '' }])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchPurchases(), fetchSuppliers(), fetchProducts()])
    setLoading(false)
  }

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers(name),
        purchase_lines(
          *,
          products(name, unit)
        )
      `)
      .order('purchase_date', { ascending: false })

    if (error) {
      toast.error('Failed to fetch purchases')
    } else {
      setPurchases(data || [])
    }
  }

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (data) setSuppliers(data)
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, unit')
      .eq('is_active', true)
      .order('name')

    if (data) setProducts(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate line items
    const validLines = lineItems.filter(
      line => line.product_id && line.quantity && line.unit_cost
    )

    if (validLines.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    try {
      // Generate purchase number
      const { data: purchaseNum, error: numError } = await supabase.rpc('generate_purchase_number')
      if (numError) throw numError

      // Calculate total
      const total = validLines.reduce(
        (sum, line) => sum + parseFloat(line.quantity) * parseFloat(line.unit_cost),
        0
      )

      // Insert purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          purchase_number: purchaseNum,
          supplier_id: formData.supplier_id,
          purchase_date: formData.purchase_date,
          invoice_number: formData.invoice_number || null,
          total_amount: total,
          notes: formData.notes || null,
          created_by: user?.id,
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Insert purchase lines
      const lines = validLines.map(line => ({
        purchase_id: purchase.id,
        product_id: line.product_id,
        quantity: parseFloat(line.quantity),
        unit_cost: parseFloat(line.unit_cost),
        total_cost: parseFloat(line.quantity) * parseFloat(line.unit_cost),
      }))

      const { error: linesError } = await supabase
        .from('purchase_lines')
        .insert(lines)

      if (linesError) throw linesError

      toast.success(`Purchase ${purchaseNum} created successfully`)
      setShowModal(false)
      resetForm()
      fetchPurchases()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create purchase')
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: '', quantity: '', unit_cost: '' }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      notes: '',
    })
    setLineItems([{ product_id: '', quantity: '', unit_cost: '' }])
  }

  const calculateLineTotal = (quantity: string, unitCost: string) => {
    const qty = parseFloat(quantity) || 0
    const cost = parseFloat(unitCost) || 0
    return qty * cost
  }

  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, line) => {
      return sum + calculateLineTotal(line.quantity, line.unit_cost)
    }, 0)
  }

  const filteredPurchases = purchases.filter(p =>
    p.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
    p.suppliers?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Management</h1>
          <p className="text-gray-500 mt-1">{purchases.length} total purchases</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search purchases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading purchases...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{purchase.purchase_number}</td>
                    <td className="px-6 py-4">{formatDate(purchase.purchase_date)}</td>
                    <td className="px-6 py-4">{purchase.suppliers?.name}</td>
                    <td className="px-6 py-4">{purchase.invoice_number || '-'}</td>
                    <td className="px-6 py-4">{purchase.purchase_lines?.length || 0} items</td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="New Purchase Order"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Purchase Date *"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            />
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Products</h3>
              <Button type="button" size="sm" onClick={addLineItem}>
                <Plus size={16} className="mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <select
                      value={line.product_id}
                      onChange={(e) => updateLineItem(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={line.unit_cost}
                      onChange={(e) => updateLineItem(index, 'unit_cost', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(calculateLineTotal(line.quantity, line.unit_cost))}
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Grand Total:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateGrandTotal())}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create Purchase</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
