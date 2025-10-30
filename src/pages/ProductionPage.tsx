import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStoreStore } from '@/stores/storeStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Factory, Beaker } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface Recipe {
  id: string
  product_id: string
  batch_size: number
  batch_unit: string
  notes: string | null
  products?: { name: string }
  recipe_lines?: RecipeLine[]
}

interface RecipeLine {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  products?: { name: string }
}

interface ProductionRun {
  id: string
  batch_number: string
  recipe_id: string
  product_id: string
  quantity_produced: number
  production_date: string
  production_cost: number | null
  products?: { name: string }
  recipes?: { batch_size: number; batch_unit: string }
}

export default function ProductionPage() {
  const { user } = useAuthStore()
  const { currentStore } = useStoreStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showProductionModal, setShowProductionModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'recipes' | 'production'>('recipes')

  const [recipeForm, setRecipeForm] = useState({
    product_id: '',
    batch_size: '',
    batch_unit: 'l',
    notes: '',
  })

  const [recipeLines, setRecipeLines] = useState<Array<{
    ingredient_id: string
    quantity: string
    unit: string
  }>>([{ ingredient_id: '', quantity: '', unit: 'g' }])

  const [productionForm, setProductionForm] = useState({
    recipe_id: '',
    quantity_produced: '',
    production_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (currentStore) {
      fetchData()
    }
  }, [currentStore])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([
      fetchRecipes(),
      fetchProductionRuns(),
      fetchProducts(),
      fetchRawMaterials(),
    ])
    setLoading(false)
  }

  const fetchRecipes = async () => {
    const { data } = await supabase
      .from('recipes')
      .select(`
        *,
        products(name),
        recipe_lines(
          *,
          products:ingredient_id(name)
        )
      `)
      .order('created_at', { ascending: false })

    if (data) setRecipes(data)
  }

  const fetchProductionRuns = async () => {
    if (!currentStore) return

    const { data } = await supabase
      .from('production_runs')
      .select(`
        *,
        products(name),
        recipes(batch_size, batch_unit)
      `)
      .eq('store_id', currentStore.id)
      .order('production_date', { ascending: false })
      .limit(20)

    if (data) setProductionRuns(data)
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data) setProducts(data)
  }

  const fetchRawMaterials = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_raw_material', true)
      .eq('is_active', true)

    if (data) setRawMaterials(data)
  }

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()

    const validLines = recipeLines.filter(
      line => line.ingredient_id && line.quantity
    )

    if (validLines.length === 0) {
      toast.error('Please add at least one ingredient')
      return
    }

    try {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          product_id: recipeForm.product_id,
          batch_size: parseFloat(recipeForm.batch_size),
          batch_unit: recipeForm.batch_unit,
          notes: recipeForm.notes || null,
        }])
        .select()
        .single()

      if (recipeError) throw recipeError

      const lines = validLines.map(line => ({
        recipe_id: recipe.id,
        ingredient_id: line.ingredient_id,
        quantity: parseFloat(line.quantity),
        unit: line.unit,
      }))

      const { error: linesError } = await supabase
        .from('recipe_lines')
        .insert(lines)

      if (linesError) throw linesError

      toast.success('Recipe created successfully')
      setShowRecipeModal(false)
      resetRecipeForm()
      fetchRecipes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create recipe')
    }
  }

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Generate batch number
      const date = new Date()
      const batchNum = `BATCH${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`

      const recipe = recipes.find(r => r.id === productionForm.recipe_id)
      if (!recipe) throw new Error('Recipe not found')

      // Calculate production cost using the database function (with unit conversion)
      const { data: costData } = await supabase
        .rpc('calculate_recipe_cost', { p_product_id: recipe.product_id })
      
      const costPerUnit = costData || 0
      const productionCost = costPerUnit * parseFloat(productionForm.quantity_produced)

      // Insert production run
      const { data: productionRun, error: prodError } = await supabase
        .from('production_runs')
        .insert([{
          batch_number: batchNum,
          recipe_id: productionForm.recipe_id,
          product_id: recipe.product_id,
          quantity_produced: parseFloat(productionForm.quantity_produced),
          production_date: productionForm.production_date,
          production_cost: productionCost,
          store_id: currentStore?.id,
          created_by: user?.id,
        }])
        .select()
        .single()

      if (prodError) throw prodError

      // Inventory is automatically updated by database trigger
      // No need to manually update stock here

      toast.success(`Production batch ${batchNum} created successfully`)
      setShowProductionModal(false)
      resetProductionForm()
      fetchProductionRuns()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create production run')
    }
  }

  const addRecipeLine = () => {
    setRecipeLines([...recipeLines, { ingredient_id: '', quantity: '', unit: 'g' }])
  }

  const removeRecipeLine = (index: number) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== index))
  }

  const updateRecipeLine = (index: number, field: string, value: string) => {
    const updated = [...recipeLines]
    updated[index] = { ...updated[index], [field]: value }
    setRecipeLines(updated)
  }

  const resetRecipeForm = () => {
    setRecipeForm({
      product_id: '',
      batch_size: '',
      batch_unit: 'l',
      notes: '',
    })
    setRecipeLines([{ ingredient_id: '', quantity: '', unit: 'g' }])
  }

  const resetProductionForm = () => {
    setProductionForm({
      recipe_id: '',
      quantity_produced: '',
      production_date: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Production Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowRecipeModal(true)}>
            <Beaker size={20} className="mr-2" />
            New Recipe
          </Button>
          <Button onClick={() => setShowProductionModal(true)}>
            <Factory size={20} className="mr-2" />
            New Production
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'recipes'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              Recipes ({recipes.length})
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'production'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              Production Runs ({productionRuns.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'recipes' ? (
            <div className="space-y-4">
              {recipes.map(recipe => (
                <div key={recipe.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{recipe.products?.name}</h3>
                      <p className="text-sm text-gray-500">
                        Batch Size: {recipe.batch_size} {recipe.batch_unit}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Ingredients:</p>
                    <div className="space-y-1">
                      {recipe.recipe_lines?.map((line, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>• {line.products?.name}</span>
                          <span>{line.quantity} {line.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productionRuns.map(run => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{run.batch_number}</td>
                      <td className="px-4 py-3">{run.products?.name}</td>
                      <td className="px-4 py-3">
                        {run.quantity_produced} {run.recipes?.batch_unit}
                      </td>
                      <td className="px-4 py-3">{formatDate(run.production_date)}</td>
                      <td className="px-4 py-3">
                        {run.production_cost ? formatCurrency(run.production_cost) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => {
          setShowRecipeModal(false)
          resetRecipeForm()
        }}
        title="Create New Recipe"
        size="lg"
      >
        <form onSubmit={handleCreateRecipe} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                value={recipeForm.product_id}
                onChange={(e) => setRecipeForm({ ...recipeForm, product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Product</option>
                <optgroup label="Finished Goods">
                  {products.filter(p => p.is_finished_good).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.selling_price}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Raw Materials">
                  {products.filter(p => p.is_raw_material && !p.is_finished_good).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.weighted_avg_cost}/unit
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Batch Size *"
                type="number"
                step="0.001"
                value={recipeForm.batch_size}
                onChange={(e) => setRecipeForm({ ...recipeForm, batch_size: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={recipeForm.batch_unit}
                  onChange={(e) => setRecipeForm({ ...recipeForm, batch_unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="l">Liters</option>
                  <option value="kg">Kilograms</option>
                  <option value="pcs">Pieces</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
              <Button type="button" size="sm" onClick={addRecipeLine}>
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {recipeLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <select
                      value={line.ingredient_id}
                      onChange={(e) => updateRecipeLine(index, 'ingredient_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select Ingredient</option>
                      <optgroup label="Raw Materials">
                        {products.filter(p => p.is_raw_material).map(material => (
                          <option key={material.id} value={material.id}>
                            {material.name} (Stock: {material.current_stock})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Finished Goods">
                        {products.filter(p => p.is_finished_good && !p.is_raw_material).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} (Stock: {product.current_stock})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Quantity"
                      value={line.quantity}
                      onChange={(e) => updateRecipeLine(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={line.unit}
                      onChange={(e) => updateRecipeLine(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    {recipeLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipeLine(index)}
                        className="text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Notes"
            value={recipeForm.notes}
            onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowRecipeModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Recipe</Button>
          </div>
        </form>
      </Modal>

      {/* Production Modal */}
      <Modal
        isOpen={showProductionModal}
        onClose={() => {
          setShowProductionModal(false)
          resetProductionForm()
        }}
        title="New Production Run"
        size="md"
      >
        <form onSubmit={handleCreateProduction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe *
            </label>
            <select
              value={productionForm.recipe_id}
              onChange={(e) => setProductionForm({ ...productionForm, recipe_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select Recipe</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.products?.name} ({recipe.batch_size} {recipe.batch_unit})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Quantity Produced *"
            type="number"
            step="0.001"
            value={productionForm.quantity_produced}
            onChange={(e) => setProductionForm({ ...productionForm, quantity_produced: e.target.value })}
            required
          />

          <Input
            label="Production Date *"
            type="date"
            value={productionForm.production_date}
            onChange={(e) => setProductionForm({ ...productionForm, production_date: e.target.value })}
            required
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowProductionModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Production Run</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
