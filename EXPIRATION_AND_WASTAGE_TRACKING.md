# 📅 Expiration & Wastage Tracking - IMPLEMENTED!

## ✅ What Was Added:

### 1. **Expiration Tracking for Raw Materials**
- Purchase Date field
- Expiration Date field
- Automatic calculation of days until expiry
- Alerts for items expiring soon

### 2. **Wastage Management System**
- Track wastage due to expiration, damage, spoilage
- Automatic wastage creation for expired items
- Cost tracking for wastage
- Wastage analysis and reporting

### 3. **Updated Product Management**
- Selling price only required for finished goods
- Cost price required for raw materials
- Date fields only shown for raw materials
- Better form validation

## 🎯 How It Works:

### For Raw Materials:

**When Adding/Editing:**
1. Mark as "Raw Material"
2. Enter **Cost Price** (required)
3. Enter **Purchase Date** (optional)
4. Enter **Expiration Date** (optional)
5. Selling price is NOT required

**Example: Tea Powder**
- Cost Price: ₹400/kg
- Purchase Date: 2025-10-20
- Expiration Date: 2025-12-20
- Days to Expiry: 55 days

### For Finished Goods:

**When Adding/Editing:**
1. Mark as "Finished Good"
2. Enter **Selling Price** (required)
3. Cost price calculated from recipe
4. No date fields needed

**Example: Masala Tea**
- Selling Price: ₹20/cup
- Cost: Calculated from recipe ingredients
- Profit: ₹20 - recipe cost

## 📊 New Database Tables & Views:

### 1. `wastage` Table
Tracks all wastage with:
- Product ID
- Quantity wasted
- Reason (expired, damaged, spoiled, other)
- Cost value
- Wastage date
- Notes
- Created by

### 2. `expiring_soon` View
Shows items expiring within 7 days:
```sql
SELECT * FROM expiring_soon;
```

Returns:
- Product name
- Current stock
- Days to expiry
- Potential loss (stock × cost)
- Category

### 3. `wastage_analysis` View
Detailed wastage analysis:
```sql
SELECT * FROM wastage_analysis;
```

Returns:
- Wastage date
- Product name
- Quantity wasted
- Cost value
- Reason
- Category
- Created by

## 🔄 Automatic Wastage Creation:

### Function: `check_and_create_wastage_for_expired()`

**What it does:**
1. Finds all expired raw materials
2. Creates wastage records automatically
3. Sets stock to 0 for expired items
4. Logs the cost value of wastage

**Run manually:**
```sql
SELECT check_and_create_wastage_for_expired();
```

**Or schedule it to run daily** (recommended)

## 📈 Profit Calculation (Updated):

### Revenue Calculation:
- Based on **selling price** of finished goods only
- Raw materials don't have selling price

### Cost Calculation:
- Finished goods: Cost from recipe ingredients
- Raw materials: Weighted average cost

### Profit Formula:
```
Profit = Revenue - Cost
Margin % = (Profit / Revenue) × 100
```

**Example Sale:**
- Sell 10 cups of Masala Tea @ ₹20 each
- Revenue: ₹200
- Cost: ₹150 (from recipe: tea powder, milk, sugar, spices)
- Profit: ₹50
- Margin: 25%

## 🚨 Expiration Alerts:

### Check Expiring Soon:
```sql
SELECT 
  name,
  current_stock,
  days_to_expiry,
  potential_loss
FROM expiring_soon
ORDER BY days_to_expiry;
```

### Example Output:
| Product | Stock | Days to Expiry | Potential Loss |
|---------|-------|----------------|----------------|
| Milk | 10 L | 2 days | ₹500 |
| Sugar | 5 kg | 5 days | ₹225 |
| Tea Powder | 2 kg | 7 days | ₹800 |

## 📊 Wastage Reports:

### Monthly Wastage Summary:
```sql
SELECT 
  DATE_TRUNC('month', wastage_date) as month,
  SUM(cost_value) as total_wastage_cost,
  COUNT(*) as wastage_count
FROM wastage
GROUP BY month
ORDER BY month DESC;
```

### Wastage by Reason:
```sql
SELECT 
  reason,
  COUNT(*) as count,
  SUM(cost_value) as total_cost
FROM wastage
GROUP BY reason
ORDER BY total_cost DESC;
```

### Wastage by Product:
```sql
SELECT 
  product_name,
  SUM(quantity) as total_quantity,
  SUM(cost_value) as total_cost
FROM wastage_analysis
GROUP BY product_name
ORDER BY total_cost DESC;
```

## 🎯 Best Practices:

### 1. Always Enter Expiration Dates
- For perishable raw materials
- Helps prevent wastage
- Enables automatic alerts

### 2. Regular Checks
- Check `expiring_soon` view daily
- Use items close to expiry first (FIFO)
- Plan production based on expiry dates

### 3. Track All Wastage
- Not just expired items
- Damaged goods
- Spoiled items
- Other reasons

### 4. Review Wastage Reports
- Monthly wastage analysis
- Identify patterns
- Reduce wastage over time

## 🔍 Example Workflow:

### Day 1: Purchase Raw Materials
```
Add Tea Powder:
- Cost: ₹400/kg
- Stock: 10 kg
- Purchase Date: 2025-10-20
- Expiration Date: 2025-12-20
```

### Day 50: Check Expiring Soon
```sql
SELECT * FROM expiring_soon;
-- Shows: Tea Powder expires in 11 days
```

### Day 55: Use Before Expiry
```
Make production runs using tea powder
Stock reduces from 10kg to 2kg
```

### Day 61: Expired
```
System automatically:
1. Creates wastage record (2kg expired)
2. Cost value: ₹800
3. Sets stock to 0
4. Reason: 'expired'
```

### Month End: Review
```sql
SELECT * FROM wastage_analysis
WHERE wastage_date >= '2025-10-01'
  AND wastage_date < '2025-11-01';

-- Total wastage: ₹800
-- Action: Order smaller quantities next time
```

## 🎉 Benefits:

1. ✅ **Accurate Cost Tracking** - Only cost price for raw materials
2. ✅ **Expiration Management** - Never miss expiry dates
3. ✅ **Wastage Tracking** - Know exactly what's wasted and why
4. ✅ **Cost Control** - Reduce wastage, increase profit
5. ✅ **Better Planning** - Use items before they expire
6. ✅ **Compliance** - Track expired items for food safety
7. ✅ **Reporting** - Detailed wastage analysis

The system now properly tracks raw material costs, expiration dates, and wastage! 🎯
