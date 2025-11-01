import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useStoreStore } from '@/stores/storeStore'

interface Product {
  id: string
  name: string
  category_id: string | null
  sku: string | null
  barcode: string | null
  unit: string
  selling_price: number
  current_stock: number
  weighted_avg_cost: number
  reorder_level: number
  is_raw_material: boolean
  is_finished_good: boolean
  is_active: boolean
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const { currentStore } = useStoreStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    barcode: null,
    unit: 'pcs',
    selling_price: '',
    current_stock: '',
    weighted_avg_cost: '',
    reorder_level: '',
    purchase_date: '',
    expiration_date: '',
    shelf_life_days: '',
    is_raw_material: false,
    is_finished_good: true,
  })

  useEffect(() => {
    fetchData()
  }, [currentStore])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchProducts(), fetchCategories()])
    setLoading(false)
  }

  const fetchProducts = async () => {
    if (!currentStore) return

    // Fetch all products with their store-specific inventory
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('name')

    if (productsError) {
      toast.error('Failed to fetch products')
      return
    }

    // Fetch store inventory for current store
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('store_inventory')
      .select('*')
      .eq('store_id', currentStore.id)

    if (inventoryError) {
      toast.error('Failed to fetch inventory')
      return
    }

    // Merge products with their store-specific inventory
    const inventoryMap = new Map(inventoryData?.map(inv => [inv.product_id, inv]) || [])
    
    const mergedProducts = productsData?.map(product => {
      const inventory = inventoryMap.get(product.id)
      return {
        ...product,
        current_stock: inventory?.current_stock || 0,
        weighted_avg_cost: inventory?.weighted_avg_cost || 0,
        reorder_level: inventory?.reorder_level || 0,
      }
    }) || []

    setProducts(mergedProducts)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (data) setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Separate product data from inventory data
    const productData = {
      name: formData.name,
      category_id: formData.category_id || null,
      sku: formData.sku,
      barcode: formData.barcode,
      unit: formData.unit,
      selling_price: formData.is_finished_good ? parseFloat(formData.selling_price) : 0,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      is_raw_material: formData.is_raw_material,
      is_finished_good: formData.is_finished_good,
      purchase_date: formData.purchase_date || null,
      expiration_date: formData.expiration_date || null,
    }

    const inventoryData = {
      current_stock: parseFloat(formData.current_stock),
      weighted_avg_cost: parseFloat(formData.weighted_avg_cost || '0'),
      reorder_level: parseFloat(formData.reorder_level || '0'),
    }

    try {
      if (editingProduct) {
        // Update product
        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (productError) throw productError

        // Update store inventory
        if (currentStore) {
          const { error: inventoryError } = await supabase
            .from('store_inventory')
            .upsert({
              store_id: currentStore.id,
              product_id: editingProduct.id,
              ...inventoryData,
            })

          if (inventoryError) throw inventoryError
        }

        toast.success('Product updated successfully')
      } else {
        // Create product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()

        if (productError) throw productError

        // Create store inventory entry
        if (currentStore && newProduct) {
          const { error: inventoryError } = await supabase
            .from('store_inventory')
            .insert({
              store_id: currentStore.id,
              product_id: newProduct.id,
              ...inventoryData,
            })

          if (inventoryError) throw inventoryError
        }

        toast.success('Product created successfully')
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEdit = async (product: Product) => {
    setEditingProduct(product)
    
    // Fetch full product data including shelf_life_days
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single()
    
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      unit: product.unit,
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      weighted_avg_cost: product.weighted_avg_cost.toString(),
      reorder_level: product.reorder_level.toString(),
      shelf_life_days: data?.shelf_life_days?.toString() || '',
      purchase_date: data?.purchase_date || '',
      expiration_date: data?.expiration_date || '',
      is_raw_material: product.is_raw_material,
      is_finished_good: product.is_finished_good,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      barcode: null,
      unit: 'pcs',
      selling_price: '',
      current_stock: '',
      weighted_avg_cost: '',
      reorder_level: '',
      purchase_date: '',
      expiration_date: '',
      shelf_life_days: '',
      is_raw_material: false,
      is_finished_good: true,
    })
    setEditingProduct(null)
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || p.category_id === filterCategory
    return matchesSearch && matchesCategory && p.is_active
  })

  const lowStockProducts = filteredProducts.filter(p => p.current_stock <= p.reorder_level)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-500 mt-1">
            {filteredProducts.length} products • {lowStockProducts.length} low stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button variant="secondary" size="sm">
            <Upload size={18} className="mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={20} className="mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Filter size={18} className="mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{product.categories?.name || '-'}</td>
                    <td className="px-6 py-4">{product.sku || '-'}</td>
                    <td className="px-6 py-4">{formatCurrency(product.selling_price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{product.current_stock} {product.unit}</span>
                        {product.current_stock <= product.reorder_level && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {product.is_finished_good && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                            Finished
                          </span>
                        )}
                        {product.is_raw_material && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                            Raw
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {formData.is_finished_good && (
              <Input
                label="Selling Price *"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                required={formData.is_finished_good}
              />
            )}
            <Input
              label="Current Stock *"
              type="number"
              step="0.001"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="cup">Cup</option>
                <option value="loaf">Loaf</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={formData.is_raw_material ? "Cost Price *" : "Cost Price"}
              type="number"
              step="0.01"
              value={formData.weighted_avg_cost}
              onChange={(e) => setFormData({ ...formData, weighted_avg_cost: e.target.value })}
              required={formData.is_raw_material}
            />
            <Input
              label="Reorder Level"
              type="number"
              step="0.001"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
            />
          </div>

          {formData.is_finished_good && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                ⏱️ Shelf Life (Days)
              </label>
              <Input
                type="number"
                value={formData.shelf_life_days}
                onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                placeholder="e.g., 1 for tea, 7 for snacks"
              />
              <p className="text-xs text-blue-700 mt-2">
                How many days this product stays fresh after production. Used to automatically calculate expiration dates.
              </p>
            </div>
          )}

          {formData.is_raw_material && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Purchase Date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
              <Input
                label="Expiration Date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_finished_good}
                onChange={(e) => setFormData({ ...formData, is_finished_good: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Finished Good</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_raw_material}
                onChange={(e) => setFormData({ ...formData, is_raw_material: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Raw Material</span>
            </label>
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
            <Button type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
