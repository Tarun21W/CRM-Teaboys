# Design Document - Purchase Calculation Fix

## Overview

This design document outlines the solution for improving purchase calculation accuracy and clarity in the Tea Boys Management System. The fix addresses confusion around units of measurement and ensures transparent, accurate calculations for purchase line items and grand totals.

## Architecture

### Component Structure

```
PurchasesPage
├── PurchaseForm (Modal)
│   ├── PurchaseHeader (Supplier, Date, Invoice)
│   ├── PurchaseLineItems
│   │   ├── PurchaseLine (repeatable)
│   │   │   ├── ProductSelector (with unit display)
│   │   │   ├── QuantityInput (with unit label)
│   │   │   ├── UnitCostInput (with "per unit" label)
│   │   │   ├── LineTotalDisplay (with calculation tooltip)
│   │   │   └── RemoveButton
│   │   └── AddLineButton
│   └── GrandTotalDisplay (with breakdown)
└── PurchasesList (existing)
```

### Data Flow

```
User Input → Validation → Calculation → State Update → UI Refresh
     ↓           ↓            ↓            ↓            ↓
  onChange   validate()   calculate()  setState()  render()
```

## Components and Interfaces

### 1. Simplified Purchase Line Item Component

```typescript
interface PurchaseLineItemProps {
  index: number
  line: PurchaseLine
  products: Product[]
  onUpdate: (index: number, field: string, value: string) => void
  onRemove: (index: number) => void
  showRemove: boolean
}

interface PurchaseLine {
  product_id: string
  quantity: string
  total_cost: string  // Changed from unit_cost to total_cost
  product?: Product  // Populated after selection
}

interface Product {
  id: string
  name: string
  unit: string  // 'kg', 'g', 'L', 'ml', 'pcs'
  category: string
}
```

### 2. Calculation Utilities

```typescript
// lib/purchaseCalculations.ts

/**
 * Parse and validate numeric input
 */
export function parseNumericInput(value: string, decimals: number = 2): number {
  const parsed = parseFloat(value)
  if (isNaN(parsed) || parsed < 0) return 0
  return Math.round(parsed * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Calculate unit cost from total cost and quantity
 */
export function calculateUnitCost(totalCost: string, quantity: string): number {
  const total = parseNumericInput(totalCost, 2)
  const qty = parseNumericInput(quantity, 3)
  if (qty === 0) return 0
  const unitCost = total / qty
  return Math.round(unitCost * 100) / 100  // Round to 2 decimal places
}

/**
 * Calculate grand total from all lines
 */
export function calculateGrandTotal(lines: PurchaseLine[]): number {
  return lines.reduce((sum, line) => {
    if (!line.product_id || !line.quantity || !line.total_cost) return sum
    return sum + parseNumericInput(line.total_cost, 2)
  }, 0)
}

/**
 * Format line details for display
 */
export function formatLineDetails(quantity: string, totalCost: string, unit: string): string {
  const qty = parseNumericInput(quantity, 3)
  const total = parseNumericInput(totalCost, 2)
  const unitCost = calculateUnitCost(totalCost, quantity)
  return `${qty} ${unit} @ ₹${unitCost.toFixed(2)}/${unit} = ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Validate purchase line
 */
export function validatePurchaseLine(line: PurchaseLine): { valid: boolean; error?: string } {
  if (!line.product_id) {
    return { valid: false, error: 'Please select a product' }
  }
  
  const qty = parseNumericInput(line.quantity, 3)
  if (qty <= 0) {
    return { valid: false, error: 'Quantity must be greater than 0' }
  }
  
  if (qty > 999999) {
    return { valid: false, error: 'Quantity exceeds maximum limit' }
  }
  
  const totalCost = parseNumericInput(line.total_cost, 2)
  if (totalCost <= 0) {
    return { valid: false, error: 'Total cost must be greater than 0' }
  }
  
  if (totalCost > 9999999) {
    return { valid: false, error: 'Total cost exceeds maximum limit' }
  }
  
  return { valid: true }
}
```

### 3. Enhanced UI Components

#### Quantity Input with Unit Display

```typescript
interface QuantityInputProps {
  value: string
  unit: string
  onChange: (value: string) => void
  error?: string
}

function QuantityInput({ value, unit, onChange, error }: QuantityInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        step="0.001"
        min="0"
        max="999999"
        placeholder={`Qty in ${unit}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
        {unit}
      </span>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
```

#### Total Cost Input

```typescript
interface TotalCostInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

function TotalCostInput({ value, onChange, error }: TotalCostInputProps) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          ₹
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          max="9999999"
          placeholder="Total Cost"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
```

#### Line Total Display (Direct from Input)

```typescript
interface LineTotalDisplayProps {
  totalCost: string
}

function LineTotalDisplay({ totalCost }: LineTotalDisplayProps) {
  const total = parseNumericInput(totalCost, 2)
  
  return (
    <div className="text-right font-medium text-gray-900">
      {formatCurrency(total)}
    </div>
  )
}
```

#### Grand Total Display with Breakdown

```typescript
interface GrandTotalDisplayProps {
  lines: PurchaseLine[]
  products: Product[]
}

function GrandTotalDisplay({ lines, products }: GrandTotalDisplayProps) {
  const grandTotal = calculateGrandTotal(lines)
  const validLines = lines.filter(line => 
    line.product_id && line.quantity && line.unit_cost
  )
  
  return (
    <div className="mt-4 pt-4 border-t">
      {/* Breakdown */}
      {validLines.length > 0 && (
        <div className="mb-3 space-y-1">
          {validLines.map((line, index) => {
            const product = products.find(p => p.id === line.product_id)
            const lineTotal = calculateLineTotal(line.quantity, line.unit_cost)
            return (
              <div key={index} className="flex justify-between text-sm text-gray-600">
                <span>
                  {product?.name}: {parseNumericInput(line.quantity, 3)} {product?.unit} × ₹{parseNumericInput(line.unit_cost, 2).toFixed(2)}
                </span>
                <span>{formatCurrency(lineTotal)}</span>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Grand Total */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-700">Grand Total:</span>
        <span className="text-3xl font-bold text-green-600">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  )
}
```

## Data Models

### Updated Purchase Line State

```typescript
// Enhanced state management
const [lineItems, setLineItems] = useState<PurchaseLine[]>([
  { product_id: '', quantity: '', unit_cost: '' }
])

const [lineErrors, setLineErrors] = useState<Record<number, string>>({})

// Get product details for a line
const getLineProduct = (line: PurchaseLine): Product | undefined => {
  return products.find(p => p.id === line.product_id)
}

// Update line with validation
const updateLineItem = (index: number, field: string, value: string) => {
  const updated = [...lineItems]
  updated[index] = { ...updated[index], [field]: value }
  setLineItems(updated)
  
  // Clear error for this line
  const errors = { ...lineErrors }
  delete errors[index]
  setLineErrors(errors)
}

// Validate all lines before submission
const validateAllLines = (): boolean => {
  const errors: Record<number, string> = {}
  let hasErrors = false
  
  lineItems.forEach((line, index) => {
    const validation = validatePurchaseLine(line)
    if (!validation.valid) {
      errors[index] = validation.error || 'Invalid line'
      hasErrors = true
    }
  })
  
  setLineErrors(errors)
  return !hasErrors
}
```

## Error Handling

### Validation Errors

```typescript
// Display inline errors for each field
interface ValidationError {
  field: 'product' | 'quantity' | 'unit_cost'
  message: string
}

// Error messages
const ERROR_MESSAGES = {
  PRODUCT_REQUIRED: 'Please select a product',
  QUANTITY_REQUIRED: 'Quantity is required',
  QUANTITY_INVALID: 'Quantity must be greater than 0',
  QUANTITY_TOO_LARGE: 'Quantity exceeds maximum limit (999,999)',
  COST_REQUIRED: 'Unit cost is required',
  COST_INVALID: 'Unit cost must be greater than 0',
  COST_TOO_LARGE: 'Unit cost exceeds maximum limit (₹999,999)',
  NO_VALID_LINES: 'Please add at least one valid product line',
}
```

### Calculation Safeguards

```typescript
// Prevent calculation errors
try {
  const total = calculateLineTotal(quantity, unitCost)
  if (!isFinite(total)) {
    throw new Error('Invalid calculation result')
  }
  return total
} catch (error) {
  console.error('Calculation error:', error)
  return 0
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Purchase Calculations', () => {
  test('calculates line total correctly', () => {
    expect(calculateLineTotal('400', '400')).toBe(160000)
    expect(calculateLineTotal('0.4', '400')).toBe(160)
    expect(calculateLineTotal('1.5', '250.50')).toBe(375.75)
  })
  
  test('handles edge cases', () => {
    expect(calculateLineTotal('', '')).toBe(0)
    expect(calculateLineTotal('0', '100')).toBe(0)
    expect(calculateLineTotal('-5', '100')).toBe(0)
  })
  
  test('rounds to 2 decimal places', () => {
    expect(calculateLineTotal('1.333', '3')).toBe(4.00)
    expect(calculateLineTotal('0.1', '0.3')).toBe(0.03)
  })
  
  test('validates purchase lines', () => {
    expect(validatePurchaseLine({
      product_id: 'abc',
      quantity: '10',
      unit_cost: '100'
    })).toEqual({ valid: true })
    
    expect(validatePurchaseLine({
      product_id: '',
      quantity: '10',
      unit_cost: '100'
    })).toEqual({ valid: false, error: 'Please select a product' })
  })
})
```

### Integration Tests

```typescript
describe('Purchase Form', () => {
  test('updates line total when quantity changes', () => {
    // Render form
    // Enter quantity
    // Verify line total updates
  })
  
  test('updates grand total when line is added', () => {
    // Render form
    // Add new line
    // Enter values
    // Verify grand total includes new line
  })
  
  test('displays validation errors on submit', () => {
    // Render form
    // Submit with empty lines
    // Verify error messages displayed
  })
})
```

### Manual Test Cases

1. **Basic Calculation**
   - Enter: 400 kg Coffee Powder at ₹400/kg
   - Expected: Line Total = ₹160,000.00

2. **Decimal Quantity**
   - Enter: 0.4 kg Coffee Powder at ₹400/kg
   - Expected: Line Total = ₹160.00

3. **Multiple Lines**
   - Line 1: 10 kg Tea Powder at ₹300/kg = ₹3,000
   - Line 2: 5 L Milk at ₹60/L = ₹300
   - Expected: Grand Total = ₹3,300.00

4. **Validation**
   - Enter: -5 kg (should prevent or show error)
   - Enter: 0 kg (should show error on submit)
   - Enter: No product selected (should show error)

5. **Tooltip Display**
   - Hover over line total
   - Expected: Shows "400 kg × ₹400.00 = ₹160,000.00"

## UI/UX Improvements

### Before (Current)
```
Product: [Coffee Powder (g)     ▼]  Qty: [0.4]  Cost: [800]  Total: ₹320.00  ❌ Wrong!
```

### After (Improved)
```
Product: [Tea Powder            ▼]  Qty: [400 g]  Total Cost: [₹800]  Total: ₹800.00  ✓
                                                                        └─ Unit cost: ₹2.00/g (calculated)
```

### Visual Enhancements

1. **Unit Labels**: Display unit prominently next to quantity input
2. **Per Unit Label**: Show "per kg" below cost input
3. **Calculation Tooltip**: Hover over total to see calculation breakdown
4. **Color Coding**: Use green for valid totals, red for errors
5. **Grand Total Breakdown**: Show itemized list above grand total
6. **Responsive Layout**: Adjust for mobile/tablet screens

## Implementation Notes

### Performance Considerations

- Debounce calculation updates if needed (currently instant is fine)
- Memoize product lookups to avoid repeated array searches
- Use React.memo for line item components to prevent unnecessary re-renders

### Accessibility

- Add aria-labels for screen readers
- Ensure keyboard navigation works properly
- Provide clear error messages for validation
- Use semantic HTML for form structure

### Browser Compatibility

- Test number input behavior across browsers
- Ensure decimal input works on mobile keyboards
- Verify currency formatting in different locales
- Test tooltip display on touch devices

## Migration Plan

### Phase 1: Add Calculation Utilities
- Create `lib/purchaseCalculations.ts`
- Add unit tests for calculation functions
- No UI changes yet

### Phase 2: Update UI Components
- Enhance quantity input with unit display
- Add "per unit" label to cost input
- Implement calculation tooltip
- Add grand total breakdown

### Phase 3: Add Validation
- Implement inline validation
- Add error state handling
- Display validation messages
- Prevent invalid submissions

### Phase 4: Testing & Refinement
- Conduct user testing
- Gather feedback
- Refine UI based on feedback
- Document changes

## Rollback Plan

If issues arise:
1. Revert to previous PurchasesPage.tsx
2. Keep calculation utilities for future use
3. Document lessons learned
4. Plan alternative approach

## Success Criteria

- ✅ All calculations match manual verification
- ✅ Unit of measurement clearly displayed
- ✅ Validation prevents invalid entries
- ✅ Tooltip shows calculation breakdown
- ✅ Grand total updates in real-time
- ✅ No user confusion about units or calculations
- ✅ All existing purchases remain unaffected
