# How to Set Expiration Dates for Products

## For Finished Goods (Tea, Coffee, Snacks, etc.)

### Step 1: Set Shelf Life (One-time setup)
1. Go to **Products** page
2. Click **Edit** on a finished good product
3. Scroll down to the **"⏱️ Shelf Life (Days)"** section (blue box)
4. Enter the number of days the product stays fresh after production:
   - **Tea/Coffee**: 1 day
   - **Fresh Juice**: 1 day
   - **Snacks**: 7 days
   - **Biscuits**: 30 days
5. Click **Update Product**

### Step 2: Automatic Expiration (No action needed!)
When you create a production run:
- The system automatically creates a batch
- Production date = today
- **Expiration date = Production date + Shelf life days**

**Example:**
- Product: "Dum Tea" with shelf life = 1 day
- You produce 20 pieces on Oct 30, 2025
- System automatically sets expiration = Oct 31, 2025

### Step 3: Monitor Expiration
1. Go to **Expiration** page (in sidebar)
2. See all batches with their expiration status:
   - 🔴 **Expired**: Already expired
   - 🔴 **Critical**: ≤3 days left
   - 🟡 **Warning**: ≤7 days left
   - 🟢 **Good**: >7 days left

### Step 4: Handle Expired Items
1. On the **Expiration** page, find expired/critical items
2. Click **"Mark as Wastage"** button
3. System automatically:
   - Creates wastage record
   - Calculates cost
   - Reduces stock
   - Marks batch as expired

---

## For Raw Materials (Milk, Sugar, Tea Powder, etc.)

### When Purchasing:
1. Go to **Purchases** page
2. Create a new purchase
3. For each raw material, set:
   - **Purchase Date**: When you bought it
   - **Expiration Date**: Date printed on package
4. Save the purchase

### Monitoring:
- Raw material expiration is tracked in the products table
- You can see expiration dates when viewing/editing products
- Consider adding raw materials to the expiration tracking page in future updates

---

## Quick Reference: Recommended Shelf Life

| Product Type | Shelf Life | Notes |
|-------------|-----------|-------|
| Fresh Tea/Coffee | 1 day | Best consumed same day |
| Fresh Juice | 1 day | Refrigerated |
| Sandwiches | 1 day | Refrigerated |
| Cakes/Pastries | 2-3 days | Room temperature |
| Cookies/Biscuits | 30 days | Sealed packaging |
| Snacks (packaged) | 7-30 days | Check package |
| Bread/Buns | 3-5 days | Room temperature |

---

## FIFO System (Automatic!)

The system automatically uses **First In, First Out**:
- When selling, oldest batch is used first
- If oldest batch doesn't have enough, moves to next oldest
- No manual intervention needed!

**Example:**
You have 3 batches of tea:
- Batch A: Produced Oct 28, 10 pieces left
- Batch B: Produced Oct 29, 15 pieces left
- Batch C: Produced Oct 30, 20 pieces left

Customer orders 12 pieces:
- System takes 10 from Batch A (depletes it)
- System takes 2 from Batch B
- Batch C remains untouched

---

## Tips for Reducing Wastage

1. **Check Expiration Page Daily**: Review items expiring soon
2. **Adjust Production**: Produce less if items are expiring frequently
3. **Promote Near-Expiry Items**: Offer discounts on items expiring in 1-2 days
4. **Track Patterns**: Use Reports → Predictions to see demand trends
5. **Set Realistic Shelf Life**: Don't overestimate how long items stay fresh

---

## Troubleshooting

### "I don't see shelf life field"
- Make sure the product is marked as **"Finished Good"** (checkbox in product form)
- Shelf life only appears for finished goods, not raw materials

### "Expiration date is wrong"
- Check the shelf life days setting for that product
- Edit the product and update shelf life
- Future production runs will use the new shelf life

### "Batch not created after production"
- Check if the product has shelf life set
- If no shelf life, system defaults to 7 days
- Batches are created automatically via database trigger

### "FIFO not working"
- FIFO is automatic via database triggers
- Check the finished_goods_batches table to verify batch quantities
- Contact admin if issues persist

---

## Need Help?

- Check the **Expiration** page for real-time batch status
- Review **Reports → Predictions** for demand forecasting
- Contact system administrator for technical issues
