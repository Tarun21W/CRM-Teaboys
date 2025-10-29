# 📊 Daily Profit & Loss, Wastage, and Trend Analysis

## ✅ New Analytics Views Created:

### 1. **Daily Profit & Loss**
```sql
SELECT * FROM daily_profit_loss;
```

Shows for each day:
- Total orders
- Revenue
- Cost of goods sold (COGS)
- Gross profit
- Profit margin %
- Total discounts
- Average order value

### 2. **Daily Wastage Summary**
```sql
SELECT * FROM daily_wastage_summary;
```

Shows for each day:
- Wastage count
- Total wastage cost
- Breakdown by reason:
  - Expired
  - Damaged
  - Spoiled
  - Other

### 3. **Daily Net Profit** ⭐
```sql
SELECT * FROM daily_net_profit;
```

Shows for each day:
- Revenue
- COGS
- Gross profit
- Wastage cost
- **Net profit** (Gross profit - Wastage)
- Total orders
- Wastage count

### 4. **Product Sales Trend**
```sql
SELECT * FROM product_sales_trend;
```

Shows last 30 days:
- Date
- Product name
- Quantity sold
- Revenue
- Cost
- Profit

### 5. **Weekly Summary**
```sql
SELECT * FROM weekly_summary;
```

Aggregated by week:
- Total revenue
- Total COGS
- Total gross profit
- Total wastage
- Total net profit
- Average daily profit
- Total orders

### 6. **Monthly Summary**
```sql
SELECT * FROM monthly_summary;
```

Aggregated by month:
- Month name
- Total revenue
- Total COGS
- Total gross profit
- Total wastage
- Total net profit
- Average daily profit
- Total orders
- Days active

### 7. **Top Products by Profit**
```sql
SELECT * FROM top_products_by_profit;
```

Last 30 days:
- Product name
- Times sold
- Total quantity sold
- Total revenue
- Total cost
- Total profit
- Average selling price
- Average cost price
- Profit margin %

### 8. **Wastage by Product**
```sql
SELECT * FROM wastage_by_product;
```

Last 30 days:
- Product name
- Wastage count
- Total quantity wasted
- Total cost
- Reason
- Last wastage date

### 9. **Hourly Sales Pattern**
```sql
SELECT * FROM hourly_sales_pattern;
```

Shows:
- Hour of day (0-23)
- Order count
- Revenue
- Average order value

### 10. **Payment Mode Analysis**
```sql
SELECT * FROM payment_mode_analysis;
```

Last 30 days:
- Payment mode (cash, card, UPI, credit)
- Transaction count
- Total revenue
- Average transaction value
- Percentage of transactions

## 📈 Example Queries:

### Today's Profit & Loss:
```sql
SELECT 
  revenue,
  cogs as cost,
  gross_profit,
  wastage_cost,
  net_profit,
  total_orders
FROM daily_net_profit
WHERE date = CURRENT_DATE;
```

### This Week's Performance:
```sql
SELECT 
  week_start,
  total_revenue,
  total_net_profit,
  total_orders,
  avg_daily_profit
FROM weekly_summary
WHERE week_start = DATE_TRUNC('week', CURRENT_DATE);
```

### This Month's Performance:
```sql
SELECT 
  month_name,
  total_revenue,
  total_cogs,
  total_gross_profit,
  total_wastage,
  total_net_profit,
  days_active
FROM monthly_summary
WHERE month_start = DATE_TRUNC('month', CURRENT_DATE);
```

### Top 5 Most Profitable Products:
```sql
SELECT 
  product_name,
  total_revenue,
  total_profit,
  profit_margin_percent
FROM top_products_by_profit
LIMIT 5;
```

### Biggest Wastage Items:
```sql
SELECT 
  product_name,
  total_quantity_wasted,
  unit,
  total_cost,
  reason
FROM wastage_by_product
ORDER BY total_cost DESC
LIMIT 10;
```

### Peak Sales Hours:
```sql
SELECT 
  hour_of_day,
  order_count,
  revenue
FROM hourly_sales_pattern
ORDER BY revenue DESC
LIMIT 5;
```

### Last 7 Days Trend:
```sql
SELECT 
  date,
  revenue,
  net_profit,
  total_orders,
  ROUND((net_profit / revenue * 100)::NUMERIC, 2) as margin_percent
FROM daily_net_profit
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

## 📊 Sample Report Output:

### Daily P&L Example:
```
Date       | Revenue | COGS   | Gross Profit | Wastage | Net Profit | Orders
-----------|---------|--------|--------------|---------|------------|-------
2025-10-29 | ₹15.00  | ₹9.72  | ₹5.28        | ₹0.00   | ₹5.28      | 1
2025-10-28 | ₹60.00  | ₹44.00 | ₹16.00       | ₹0.00   | ₹16.00     | 2
```

### Weekly Summary Example:
```
Week Start | Revenue  | Net Profit | Orders | Avg Daily Profit
-----------|----------|------------|--------|------------------
2025-10-27 | ₹450.00  | ₹135.00    | 30     | ₹19.29
2025-10-20 | ₹520.00  | ₹156.00    | 35     | ₹22.29
```

### Top Products Example:
```
Product    | Revenue | Profit | Margin %
-----------|---------|--------|----------
Dum Tea    | ₹300.00 | ₹80.00 | 26.67%
Coffee     | ₹240.00 | ₹96.00 | 40.00%
Samosa     | ₹180.00 | ₹84.00 | 46.67%
```

### Wastage Analysis Example:
```
Product     | Qty Wasted | Cost   | Reason
------------|------------|--------|--------
Milk        | 0.5 L      | ₹50.00 | Expired
Sugar       | 0.2 kg     | ₹40.00 | Damaged
Tea Powder  | 0.1 kg     | ₹40.00 | Spoiled
```

## 🎯 Key Metrics to Track:

### Daily:
- ✅ Net profit
- ✅ Profit margin %
- ✅ Number of orders
- ✅ Average order value
- ✅ Wastage cost

### Weekly:
- ✅ Total revenue
- ✅ Total net profit
- ✅ Average daily profit
- ✅ Total orders
- ✅ Wastage trend

### Monthly:
- ✅ Total revenue
- ✅ Total net profit
- ✅ Days active
- ✅ Average daily profit
- ✅ Total wastage

### Product Performance:
- ✅ Best sellers by revenue
- ✅ Most profitable products
- ✅ Profit margin by product
- ✅ Sales trend

### Wastage:
- ✅ Total wastage cost
- ✅ Wastage by reason
- ✅ Wastage by product
- ✅ Wastage trend

## 📈 Trend Analysis:

### Revenue Trend (Last 7 Days):
```sql
SELECT 
  date,
  revenue,
  LAG(revenue) OVER (ORDER BY date) as prev_day_revenue,
  revenue - LAG(revenue) OVER (ORDER BY date) as change,
  ROUND(((revenue - LAG(revenue) OVER (ORDER BY date)) / 
    NULLIF(LAG(revenue) OVER (ORDER BY date), 0) * 100)::NUMERIC, 2) as change_percent
FROM daily_net_profit
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Profit Trend (Last 30 Days):
```sql
SELECT 
  date,
  net_profit,
  AVG(net_profit) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7day
FROM daily_net_profit
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Product Performance Trend:
```sql
SELECT 
  product_name,
  date,
  quantity_sold,
  revenue,
  profit
FROM product_sales_trend
WHERE product_name = 'Dum Tea'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

## 🎨 Visualization Ideas:

### 1. Line Chart - Daily Revenue & Profit
- X-axis: Date
- Y-axis: Amount (₹)
- Lines: Revenue, Gross Profit, Net Profit

### 2. Bar Chart - Top Products
- X-axis: Product Name
- Y-axis: Profit (₹)
- Color: Profit Margin %

### 3. Pie Chart - Wastage by Reason
- Slices: Expired, Damaged, Spoiled, Other
- Values: Cost (₹)

### 4. Line Chart - Hourly Sales Pattern
- X-axis: Hour (0-23)
- Y-axis: Revenue (₹)
- Shows peak hours

### 5. Stacked Bar - Weekly P&L
- X-axis: Week
- Y-axis: Amount (₹)
- Stacks: Revenue, COGS, Wastage, Net Profit

## 🎉 Benefits:

1. ✅ **Daily P&L Tracking** - Know your profit every day
2. ✅ **Wastage Monitoring** - Track and reduce wastage
3. ✅ **Trend Analysis** - Identify patterns and opportunities
4. ✅ **Product Performance** - Focus on profitable items
5. ✅ **Peak Hours** - Optimize staffing and inventory
6. ✅ **Payment Insights** - Understand customer preferences
7. ✅ **Real-time Data** - Always up-to-date
8. ✅ **Historical Comparison** - Track improvement over time

All views are ready to use! Query them directly or integrate into your Reports page! 📊
