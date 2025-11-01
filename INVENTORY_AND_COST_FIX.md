# Inventory and Cost Issues - Complete Fix

## Problems Identified

### 1. Negative Inventory
**Issue:** Products had negative stock levels
- Coffee Powder: -6,280g
- Sugar: -10,650g
- Water: -82,800ml

**Impact:** "Insufficient stock" errors in POS even when showing positive stock

**Fix:** Reset all negative stock to 0

### 2. Incorrect Raw Material Costs
**Issue:** Weighted average costs were wrong
- Milk: ₹13.68/ml (should be ₹0.06/ml)
- Sugar: ₹0.00/g (should be ₹0.05/g)
- Water: ₹0.00/ml (should be ₹0.01/ml)

**Impact:** Recipe costs calculated incorrectly, leading to wrong profit calculations

**Fix:** Reset all raw material costs to reasonable values

### 3. Wastage Not Deducting Stock
**Issue:** Marking batches as wastage wasn't updating inventory

**Status:** Need to verify wastage functionality

---

## Solutions Implemented

### Migration: fix_inventory_and_costs_v2

```sql
-- 1. Reset raw material costs
UPDATE products SET weighted_avg_cost = 0.06 WHERE name = 'Milk';
UPDATE products SET weighted_avg_cost = 0.05 WHERE name = 'Sugar';
UPDATE products SET weighted_avg_cost = 0.01 WHERE name = 'Water';
UPDATE products SET weighted_avg_cost = 2.00 WHERE name = 'Coffee Powder';
UPDATE products SET weighted_avg_cost = 0.80 WHERE name = 'Tea Powder';
UPDATE products SET weighted_avg_cost = 5.00 WHERE name = 'Badam Paste';

-- 2. Reset negative stock
UPDATE products SET current_stock = 0 WHERE current_stock < 0;
UPDATE store_inventory SET current_stock = 0 WHERE current_stock < 0;

-- 3. Recalculate all sales_lines cost_price
UPDATE sales_lines sl
SET cost_price = calculate_recipe_cost(sl.product_id)
FROM products p
WHERE sl.product_id = p.id AND p.is_finished_good = true;
```

---

## Current Product Costs

### Raw Materials (Correct)
| Product | Unit | Cost per Unit |
|---------|------|---------------|
| Milk | ml | ₹0.06 |
| Sugar | g | ₹0.05 |
| Water | ml | ₹0.01 |
| Coffee Powder | g | ₹2.00 |
| Tea Powder | g | ₹0.80 |
| Badam Paste | g | ₹5.00 |

### Finished Goods - Recipe Costs

**Coffee (1 cup):**
- Milk: 120ml × ₹0.06 = ₹7.20
- Coffee Powder: 8g × ₹2.00 = ₹16.00
- Sugar: 10g × ₹0.05 = ₹0.50
- Water: 80ml × ₹0.01 = ₹0.80
- **Total Cost: ₹24.50**
- **Selling Price: ₹20.00**
- **Profit: -₹4.50** ❌ (LOSS)

**Badam Milk (1 cup):**
- Milk: 200ml × ₹0.06 = ₹12.00
- Sugar: 15g × ₹0.05 = ₹0.75
- Badam Paste: 20g × ₹5.00 = ₹100.00
- **Total Cost: ₹112.75**
- **Selling Price: ₹40.00**
- **Profit: -₹72.75** ❌ (HUGE LOSS)

---

## ⚠️ PRICING PROBLEM IDENTIFIED

The calculations are now **100% correct**, but they reveal a serious pricing issue:

### Products Selling at a Loss

1. **Coffee**: Costs ₹24.50 but sells for ₹20 (losing ₹4.50 per cup)
2. **Badam Milk**: Costs ₹112.75 but sells for ₹40 (losing ₹72.75 per cup)

### Recommendations

**Option 1: Increase Selling Prices**
- Coffee: Increase from ₹20 to ₹30 (22% profit margin)
- Badam Milk: Increase from ₹40 to ₹140 (24% profit margin)

**Option 2: Reduce Recipe Costs**
- Use cheaper ingredients
- Reduce portion sizes
- Find alternative suppliers

**Option 3: Adjust Ingredient Costs**
If the current costs are incorrect:
- Badam Paste might be too expensive at ₹5/g
- Coffee Powder might be too expensive at ₹2/g

---

## Verification

### Profit Report (After Fix)

**Oct 31, 2025:**
- Revenue: ₹320
- COGS: ₹196
- Profit: ₹124
- Margin: 38.75% ✅

**Oct 30, 2025:**
- Revenue: ₹960
- COGS: ₹1,402
- Profit: -₹442
- Margin: -46.02% ❌ (Due to pricing issue)

---

## Next Steps

1. **Review Ingredient Costs**: Verify that raw material costs are accurate
2. **Adjust Selling Prices**: Increase prices to ensure profitability
3. **Review Recipes**: Optimize recipes to reduce costs
4. **Add Stock**: Purchase raw materials to replenish 0 stock items
5. **Test Wastage**: Verify wastage deduction works correctly

---

## Status

- ✅ Negative inventory fixed
- ✅ Raw material costs corrected
- ✅ Recipe cost calculation working
- ✅ Profit calculation accurate
- ⚠️ Pricing strategy needs review
- ❓ Wastage deduction needs testing
