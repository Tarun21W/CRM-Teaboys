# 💰 Recipe-Based Profit Calculation - IMPLEMENTED!

## ✅ What Was Added:

### Accurate Profit Calculation Based on Raw Material Costs
The system now calculates profit based on the **actual cost of raw materials** used in recipes, not the finished product's stored cost!

## 🎯 How It Works:

### Example: Masala Tea

**Recipe (makes 10 cups):**
- Tea Powder: 50g @ ₹4/g = ₹200
- Milk: 500ml @ ₹0.05/ml = ₹25
- Sugar: 100g @ ₹0.45/g = ₹45
- Masala Spices: 20g @ ₹8/g = ₹160

**Total Recipe Cost:** ₹430 for 10 cups
**Cost Per Cup:** ₹43

**Selling Price:** ₹60 per cup

**Profit Calculation:**
- Revenue: ₹60
- Cost: ₹43 (calculated from recipe)
- **Profit: ₹17 per cup**
- **Profit Margin: 28.3%**

## 📊 New Features Added:

### 1. Automatic Cost Calculation Function
```sql
calculate_recipe_cost(product_id)
```
- Calculates actual cost based on recipe ingredients
- Uses weighted average cost of each raw material
- Divides by batch size to get cost per unit
- Falls back to product's weighted_avg_cost if no recipe exists

### 2. Auto-Set Cost Price on Sale
- When a sale is made, the system automatically calculates the actual cost
- Stores it in `sales_lines.cost_price` field
- Uses recipe-based cost for finished goods
- Uses weighted average cost for raw materials

### 3. Sales Profit Analysis View
```sql
SELECT * FROM sales_profit_analysis;
```
Shows for each sale:
- Revenue (total_amount)
- Total Cost (sum of actual costs)
- Gross Profit (revenue - cost)
- Profit Margin % ((profit / revenue) × 100)

### 4. Product Profitability View
```sql
SELECT * FROM product_profitability;
```
Shows for each product:
- Selling Price
- Actual Cost (from recipe or weighted avg)
- Profit Per Unit
- Profit Margin %
- Category

## 🔄 Complete Flow:

### When You Sell a Product:

1. **Customer buys 3 cups of Masala Tea @ ₹60 each**

2. **System Calculates:**
   - Revenue: ₹180 (3 × ₹60)
   - Cost per cup: ₹43 (from recipe calculation)
   - Total cost: ₹129 (3 × ₹43)
   - Profit: ₹51 (₹180 - ₹129)
   - Profit margin: 28.3%

3. **Inventory Updates:**
   - Masala Tea: -3 cups
   - Tea Powder: -15g (proportional)
   - Milk: -150ml (proportional)
   - Sugar: -30g (proportional)
   - Masala Spices: -6g (proportional)

4. **Sales Record Stores:**
   - Sale amount: ₹180
   - Cost price: ₹43 per cup (in sales_lines)
   - Profit can be calculated anytime

## 📈 Reports You Can Generate:

### 1. Daily Profit Report
```sql
SELECT 
  sale_date,
  SUM(revenue) as total_revenue,
  SUM(total_cost) as total_cost,
  SUM(gross_profit) as total_profit,
  AVG(profit_margin_percent) as avg_margin
FROM sales_profit_analysis
WHERE sale_date = CURRENT_DATE
GROUP BY sale_date;
```

### 2. Product Profitability Report
```sql
SELECT 
  product_name,
  selling_price,
  actual_cost,
  profit_per_unit,
  profit_margin_percent
FROM product_profitability
ORDER BY profit_per_unit DESC;
```

### 3. Best Selling Products by Profit
```sql
SELECT 
  p.name,
  COUNT(sl.id) as units_sold,
  SUM(sl.line_total) as revenue,
  SUM(sl.quantity * sl.cost_price) as cost,
  SUM(sl.line_total - (sl.quantity * sl.cost_price)) as profit
FROM sales_lines sl
JOIN products p ON p.id = sl.product_id
GROUP BY p.name
ORDER BY profit DESC;
```

## ⚙️ Database Triggers:

### 1. `trigger_set_cost_price_on_sale` (BEFORE INSERT)
- Runs BEFORE inserting into sales_lines
- Calculates actual cost from recipe
- Sets the cost_price field automatically

### 2. `trigger_update_inventory_on_sale` (AFTER INSERT)
- Deducts finished product from inventory

### 3. `trigger_deduct_recipe_ingredients` (AFTER INSERT)
- Deducts raw materials based on recipe

## 🎯 Key Benefits:

1. ✅ **Accurate Profit Tracking** - Based on actual raw material costs
2. ✅ **Real-Time Calculations** - Cost calculated at time of sale
3. ✅ **Historical Accuracy** - Past sales retain their cost at time of sale
4. ✅ **Recipe Changes Don't Affect Past Sales** - Each sale stores its own cost
5. ✅ **Easy Reporting** - Built-in views for profit analysis
6. ✅ **Product Profitability** - See which products are most profitable
7. ✅ **Margin Analysis** - Track profit margins over time

## 📊 Example Profit Analysis:

### Coffee Shop Daily Report:
```
Product          | Units Sold | Revenue | Cost   | Profit | Margin
-----------------|------------|---------|--------|--------|--------
Masala Tea       | 50         | ₹3,000  | ₹2,150 | ₹850   | 28.3%
Coffee           | 30         | ₹900    | ₹540   | ₹360   | 40.0%
Samosa           | 40         | ₹600    | ₹320   | ₹280   | 46.7%
-----------------|------------|---------|--------|--------|--------
TOTAL            | 120        | ₹4,500  | ₹3,010 | ₹1,490 | 33.1%
```

## ⚠️ Important Notes:

### 1. Unit Consistency
- Make sure ingredient costs are in the same unit as recipe quantities
- Example: If recipe uses grams, cost should be per gram
- If recipe uses liters, cost should be per liter

### 2. Cost Updates
- When you purchase raw materials, weighted_avg_cost updates automatically
- Future sales will use the new cost
- Past sales retain their original cost

### 3. Products Without Recipes
- Raw materials use their weighted_avg_cost
- Finished goods without recipes use their weighted_avg_cost
- Create recipes for accurate profit tracking!

### 4. Recipe Changes
- If you change a recipe, future sales use the new cost
- Past sales are not affected
- This gives accurate historical profit tracking

## 🧪 Test It:

### Step 1: Check Product Profitability
```sql
SELECT * FROM product_profitability 
WHERE product_name = 'Masala Tea';
```

### Step 2: Make a Sale
- Go to POS
- Sell some Masala Tea
- Complete the sale

### Step 3: Check Profit
```sql
SELECT * FROM sales_profit_analysis 
ORDER BY created_at DESC 
LIMIT 1;
```

You should see:
- Revenue (what customer paid)
- Total Cost (calculated from recipe)
- Gross Profit (revenue - cost)
- Profit Margin %

## 🎉 Result:

Now you have **accurate, recipe-based profit tracking** that shows your true margins based on actual raw material costs! 

No more guessing - you know exactly how much profit each product makes! 💰
