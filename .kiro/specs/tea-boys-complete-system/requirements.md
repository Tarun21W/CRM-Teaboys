# Requirements Document - Tea Boys Management System

## Introduction

This document outlines the complete requirements for the Tea Boys Bakery & Tea Shop Management Software. The system will provide integrated billing, inventory management, batch-based production, costing, and profitability tracking for Tea Boys, Aminjikarai.

## Glossary

- **System**: Tea Boys Management Software
- **POS**: Point of Sale billing interface
- **SKU**: Stock Keeping Unit - unique product identifier
- **Made-in-house**: Products produced on-site (e.g., DUM Tea)
- **Bought-out**: Products purchased from suppliers for resale
- **Batch Production**: Creating products in predefined quantities (2L, 3L, 4L, 6L, 10L)
- **Recipe**: List of ingredients and quantities needed for batch production
- **Stock Ledger**: Complete audit trail of all inventory movements
- **Weighted Average Cost**: Inventory costing method that averages purchase costs
- **Thermal Printer**: Receipt printer using ESC/POS protocol
- **User Role**: Access level (Admin, Manager, Cashier, Baker)

---

## Requirements

### Requirement 1: Point of Sale (POS) Billing System

**User Story:** As a Cashier, I want to quickly process customer orders and generate bills, so that I can serve customers efficiently during peak hours.

#### Acceptance Criteria

1. WHEN a Cashier searches for a product by name or barcode, THE System SHALL display matching products within 1 second
2. WHEN a Cashier adds a product to cart, THE System SHALL display current stock availability and unit price
3. WHEN a Cashier modifies quantity in cart, THE System SHALL recalculate line total and cart total immediately
4. WHEN a Cashier applies a discount, THE System SHALL accept percentage or fixed amount and update total
5. WHEN a Cashier selects payment mode (Cash, Card, UPI, Credit), THE System SHALL record the payment method
6. WHEN a Cashier completes a sale, THE System SHALL generate a unique bill number in format TB[YY][NNNNNN]
7. WHEN a sale is completed, THE System SHALL automatically deduct sold quantities from current stock
8. WHEN a sale is completed, THE System SHALL send bill data to thermal printer for receipt printing
9. WHEN a Cashier views daily sales, THE System SHALL display total sales amount and transaction count for current day
10. WHEN a Cashier closes the day, THE System SHALL generate a daily close report with cash, card, and UPI totals

---

### Requirement 2: Product Master Management

**User Story:** As a Manager, I want to maintain a complete product catalog with pricing and categorization, so that I can manage all items sold in the shop.

#### Acceptance Criteria

1. WHEN a Manager creates a product, THE System SHALL require SKU code, name, category, unit, and selling price
2. WHEN a Manager creates a product, THE System SHALL allow selection of product type: Made-in-house or Bought-out
3. WHERE a product is Bought-out, THE System SHALL require cost price for profit calculation
4. WHEN a Manager assigns a barcode, THE System SHALL ensure barcode uniqueness across all products
5. WHEN a Manager sets reorder level, THE System SHALL alert when stock falls below this threshold
6. WHEN a Manager marks a product as inactive, THE System SHALL hide it from POS but retain historical data
7. WHEN a Manager views product list, THE System SHALL display current stock, selling price, and last updated date
8. WHEN a Manager searches products, THE System SHALL filter by name, SKU, category, or barcode
9. WHEN a Manager edits product details, THE System SHALL update the updated_at timestamp
10. WHEN a Manager views product history, THE System SHALL display all stock movements from stock ledger

---

### Requirement 3: Inventory Management for Raw Materials and Bought Items

**User Story:** As a Manager, I want to track inventory for both raw ingredients and bought-out items, so that I can maintain optimal stock levels and prevent stockouts.

#### Acceptance Criteria

1. WHEN a Manager enters a purchase, THE System SHALL generate a unique purchase number in format PO[YY][NNNNNN]
2. WHEN a Manager adds purchase lines, THE System SHALL require product, quantity, unit cost, and total cost
3. WHEN a purchase is saved, THE System SHALL increase current stock by purchased quantity
4. WHEN a purchase is saved, THE System SHALL update weighted average cost for the product
5. WHEN a purchase is saved, THE System SHALL create stock ledger entry with transaction type 'purchase'
6. WHEN stock falls below reorder level, THE System SHALL display low stock alert on dashboard
7. WHEN a Manager views stock valuation, THE System SHALL calculate total value as (current stock × weighted average cost)
8. WHEN a Manager records waste or damage, THE System SHALL create stock adjustment with reason
9. WHEN a stock adjustment is saved, THE System SHALL update current stock and create ledger entry
10. WHEN a Manager views stock ledger, THE System SHALL display all transactions with date, type, quantity, and balance

---

### Requirement 4: Recipe Management for Batch Production

**User Story:** As a Baker, I want to define recipes with ingredient measurements for different batch sizes, so that I can produce consistent quality products.

#### Acceptance Criteria

1. WHEN a Baker creates a recipe, THE System SHALL require finished product, batch size, and batch unit
2. WHEN a Baker adds recipe lines, THE System SHALL require ingredient product, quantity, and unit
3. WHEN a Baker defines recipe for DUM Tea, THE System SHALL support batch sizes: 2L, 3L, 4L, 6L, 10L
4. WHEN a Baker saves a recipe, THE System SHALL validate that all ingredients are marked as raw materials
5. WHEN a Baker views recipe, THE System SHALL display ingredient list with quantities per batch
6. WHEN a Baker calculates recipe cost, THE System SHALL sum (ingredient quantity × weighted average cost)
7. WHEN a Baker edits recipe, THE System SHALL update recipe lines without affecting historical production runs
8. WHEN a Baker copies recipe, THE System SHALL create new recipe with same ingredients for different product
9. WHEN a Baker deletes recipe, THE System SHALL prevent deletion if production runs exist
10. WHEN a Baker views recipe list, THE System SHALL display finished product name and batch size

---

### Requirement 5: Batch-Based Production with Auto Stock Deduction

**User Story:** As a Baker, I want to record production runs that automatically deduct ingredient stock, so that inventory remains accurate without manual calculations.

#### Acceptance Criteria

1. WHEN a Baker creates production run, THE System SHALL generate unique batch number in format BATCH[YYMMDD][NNNN]
2. WHEN a Baker selects recipe and quantity, THE System SHALL calculate required ingredients based on batch size
3. WHEN a Baker confirms production, THE System SHALL verify sufficient ingredient stock is available
4. IF ingredient stock is insufficient, THEN THE System SHALL display error message and prevent production
5. WHEN production is saved, THE System SHALL increase finished goods stock by quantity produced
6. WHEN production is saved, THE System SHALL decrease each ingredient stock by calculated quantity
7. WHEN production is saved, THE System SHALL calculate production cost from ingredient costs
8. WHEN production is saved, THE System SHALL create stock ledger entries for finished goods and ingredients
9. WHEN a Baker views production history, THE System SHALL display batch number, date, quantity, and cost
10. WHEN a Manager views production report, THE System SHALL show total liters produced vs cups sold

---

### Requirement 6: Cost Tracking and Profit Calculation

**User Story:** As a Manager, I want to track costs and calculate profits for each item, so that I can make informed pricing decisions.

#### Acceptance Criteria

1. WHEN a product is sold, THE System SHALL record cost price from weighted average cost or recipe cost
2. WHEN a sale line is created, THE System SHALL calculate profit as (selling price - cost price) × quantity
3. WHEN a Manager views item-wise profit report, THE System SHALL display quantity sold, revenue, cost, and margin
4. WHEN a Manager filters profit report by date range, THE System SHALL calculate totals for selected period
5. WHEN a Manager views product profitability, THE System SHALL display profit percentage as ((revenue - cost) / revenue × 100)
6. WHEN a Manager views dashboard, THE System SHALL display today's total profit
7. WHEN a Manager views top movers, THE System SHALL rank products by revenue and quantity sold
8. WHEN a Manager views cost analysis, THE System SHALL compare ingredient cost vs selling price for made items
9. WHEN a Manager exports profit report, THE System SHALL include all columns in Excel format
10. WHEN a Manager views yearly profit trend, THE System SHALL display monthly profit comparison chart

---

### Requirement 7: Sales Reports and Analytics

**User Story:** As a Manager, I want comprehensive sales reports and analytics, so that I can understand business performance and trends.

#### Acceptance Criteria

1. WHEN a Manager views daily sales summary, THE System SHALL display total sales, transaction count, and average bill value
2. WHEN a Manager views payment breakdown, THE System SHALL show totals for Cash, Card, UPI, and Credit
3. WHEN a Manager views hourly sales chart, THE System SHALL display sales amount for each hour of the day
4. WHEN a Manager views weekly sales report, THE System SHALL display daily totals for past 7 days
5. WHEN a Manager views monthly sales report, THE System SHALL display daily totals for selected month
6. WHEN a Manager views yearly sales report, THE System SHALL display monthly totals for selected year
7. WHEN a Manager views top 5 selling items, THE System SHALL rank by quantity sold and revenue
8. WHEN a Manager views category-wise sales, THE System SHALL group sales by product category
9. WHEN a Manager views cashier performance, THE System SHALL display sales per cashier with transaction count
10. WHEN a Manager exports sales report, THE System SHALL generate PDF with company header and date range

---

### Requirement 8: Dashboard with Key Performance Indicators

**User Story:** As a Manager, I want a dashboard with real-time KPIs, so that I can monitor business health at a glance.

#### Acceptance Criteria

1. WHEN a Manager opens dashboard, THE System SHALL display today's sales amount updated in real-time
2. WHEN a Manager views dashboard, THE System SHALL display today's profit amount
3. WHEN a Manager views dashboard, THE System SHALL display today's order count
4. WHEN a Manager views dashboard, THE System SHALL display average bill value for today
5. WHEN a Manager views dashboard, THE System SHALL display top 5 selling items for current month
6. WHEN a Manager views dashboard, THE System SHALL display low stock alerts with product names
7. WHEN a Manager views dashboard, THE System SHALL display hourly sales trend chart for today
8. WHEN a Manager views dashboard, THE System SHALL display payment mode distribution pie chart
9. WHEN a Manager views dashboard, THE System SHALL display production vs sales comparison for made items
10. WHEN a Manager views dashboard, THE System SHALL refresh data automatically every 30 seconds

---

### Requirement 9: User Management with Role-Based Access

**User Story:** As an Admin, I want to manage users with different roles and permissions, so that I can control system access appropriately.

#### Acceptance Criteria

1. WHEN an Admin creates user, THE System SHALL require email, password, full name, and role
2. WHEN an Admin assigns role, THE System SHALL support Admin, Manager, Cashier, and Baker roles
3. WHERE user role is Admin, THE System SHALL grant access to all modules and features
4. WHERE user role is Manager, THE System SHALL grant access to inventory, purchases, production, and reports
5. WHERE user role is Cashier, THE System SHALL grant access only to POS billing and daily sales view
6. WHERE user role is Baker, THE System SHALL grant access to recipes, production, and stock view
7. WHEN an Admin deactivates user, THE System SHALL prevent login but retain historical data
8. WHEN a user logs in, THE System SHALL validate credentials and create session token
9. WHEN a user session expires, THE System SHALL redirect to login page
10. WHEN an Admin views user activity log, THE System SHALL display login times and actions performed

---

### Requirement 10: Waste and Spoilage Tracking

**User Story:** As a Manager, I want to track waste and spoilage, so that I can identify loss areas and improve efficiency.

#### Acceptance Criteria

1. WHEN a Manager records waste, THE System SHALL require product, quantity, and reason
2. WHEN waste is recorded, THE System SHALL create stock adjustment with adjustment type 'waste'
3. WHEN waste is recorded, THE System SHALL decrease current stock by waste quantity
4. WHEN waste is recorded, THE System SHALL create stock ledger entry with transaction type 'waste'
5. WHEN a Manager views waste report, THE System SHALL display total waste value calculated from cost
6. WHEN a Manager filters waste by date range, THE System SHALL show waste per product
7. WHEN a Manager views waste trend, THE System SHALL display monthly waste comparison chart
8. WHEN a Manager views waste percentage, THE System SHALL calculate as (waste quantity / total production × 100)
9. WHEN a Manager identifies high waste items, THE System SHALL rank products by waste value
10. WHEN a Manager exports waste report, THE System SHALL include product, quantity, value, and reason

---

### Requirement 11: Thermal Receipt Printing

**User Story:** As a Cashier, I want to print thermal receipts for customers, so that I can provide proof of purchase.

#### Acceptance Criteria

1. WHEN a sale is completed, THE System SHALL format receipt with shop name, address, and contact
2. WHEN receipt is printed, THE System SHALL include bill number, date, and time
3. WHEN receipt is printed, THE System SHALL list all items with quantity, price, and line total
4. WHEN receipt is printed, THE System SHALL display subtotal, discount, tax, and grand total
5. WHEN receipt is printed, THE System SHALL show payment mode and amount received
6. WHEN receipt is printed, THE System SHALL include thank you message and footer
7. WHEN receipt is printed, THE System SHALL use 58mm or 80mm paper width based on printer configuration
8. WHEN receipt is printed, THE System SHALL send ESC/POS commands to thermal printer
9. IF printer is offline, THEN THE System SHALL queue receipt and retry when printer is available
10. WHEN a Cashier reprints receipt, THE System SHALL retrieve original bill data and print duplicate copy

---

### Requirement 12: Stock Valuation and Inventory Reports

**User Story:** As a Manager, I want detailed inventory reports, so that I can understand stock value and movement patterns.

#### Acceptance Criteria

1. WHEN a Manager views stock valuation report, THE System SHALL calculate value as (current stock × weighted average cost)
2. WHEN a Manager views stock movement report, THE System SHALL display purchases, sales, production, and adjustments
3. WHEN a Manager views slow-moving items, THE System SHALL identify products with no sales in past 30 days
4. WHEN a Manager views fast-moving items, THE System SHALL rank products by sales velocity
5. WHEN a Manager views stock aging report, THE System SHALL group stock by purchase date ranges
6. WHEN a Manager views reorder report, THE System SHALL list products below reorder level
7. WHEN a Manager views stock turnover ratio, THE System SHALL calculate as (cost of goods sold / average inventory)
8. WHEN a Manager views category-wise stock, THE System SHALL group current stock by category
9. WHEN a Manager views supplier-wise purchases, THE System SHALL display total purchases per supplier
10. WHEN a Manager exports inventory report, THE System SHALL include all stock details in Excel format

---

### Requirement 13: Offline Mode and Data Synchronization

**User Story:** As a Cashier, I want the system to work offline during internet outages, so that billing operations are not interrupted.

#### Acceptance Criteria

1. WHEN internet connection is lost, THE System SHALL continue POS operations using cached data
2. WHEN operating offline, THE System SHALL store transactions in local IndexedDB
3. WHEN internet connection is restored, THE System SHALL automatically sync pending transactions
4. WHEN syncing transactions, THE System SHALL maintain transaction order and timestamps
5. WHEN sync fails, THE System SHALL retry with exponential backoff
6. WHEN sync completes, THE System SHALL display success notification
7. WHEN a Manager views sync status, THE System SHALL show pending transaction count
8. WHEN operating offline, THE System SHALL display offline indicator in header
9. WHEN product data is cached, THE System SHALL refresh cache every 5 minutes when online
10. WHEN offline mode is enabled, THE System SHALL support up to 1000 cached products

---

### Requirement 14: Multi-Device Support and Responsive Design

**User Story:** As a User, I want to access the system from desktop, tablet, or mobile, so that I can work from any device.

#### Acceptance Criteria

1. WHEN a User accesses system from desktop, THE System SHALL display full layout with sidebar navigation
2. WHEN a User accesses system from tablet, THE System SHALL adapt layout for touch interface
3. WHEN a User accesses system from mobile, THE System SHALL display hamburger menu and stacked layout
4. WHEN a User rotates device, THE System SHALL adjust layout for portrait or landscape orientation
5. WHEN a User taps buttons on touch device, THE System SHALL provide visual feedback
6. WHEN a User installs PWA, THE System SHALL function as standalone app with app icon
7. WHEN a User uses POS on tablet, THE System SHALL optimize for quick product selection
8. WHEN a User views reports on mobile, THE System SHALL display scrollable tables
9. WHEN a User prints from mobile, THE System SHALL support Bluetooth thermal printers
10. WHEN a User works on slow connection, THE System SHALL display loading indicators

---

### Requirement 15: Data Export and Backup

**User Story:** As an Admin, I want to export data and create backups, so that I can ensure data safety and compliance.

#### Acceptance Criteria

1. WHEN an Admin exports sales data, THE System SHALL generate Excel file with all sale details
2. WHEN an Admin exports inventory data, THE System SHALL include current stock and valuation
3. WHEN an Admin exports profit report, THE System SHALL include item-wise margins
4. WHEN an Admin schedules backup, THE System SHALL create daily database backup automatically
5. WHEN backup is created, THE System SHALL store in cloud storage with date timestamp
6. WHEN an Admin restores backup, THE System SHALL validate backup integrity before restore
7. WHEN an Admin exports for accounting, THE System SHALL format data for Tally import
8. WHEN an Admin exports customer data, THE System SHALL comply with data privacy regulations
9. WHEN an Admin views export history, THE System SHALL display all exports with download links
10. WHEN backup fails, THE System SHALL send email notification to admin

---

### Requirement 16: Multi-Store Management with Store-Specific Data Isolation

**User Story:** As a Manager, I want to view and manage data separately for each store location, so that I can track performance and inventory independently across multiple branches.

#### Acceptance Criteria

1. WHEN a User logs in, THE System SHALL require selection of active store from available stores
2. WHEN a User selects a store, THE System SHALL filter all data to show only that store's information
3. WHEN a Manager views dashboard, THE System SHALL display KPIs for the currently selected store only
4. WHEN a Manager views sales reports, THE System SHALL show transactions for the currently selected store only
5. WHEN a Manager views production records, THE System SHALL display production runs for the currently selected store only
6. WHEN a Manager views inventory, THE System SHALL show stock levels for the currently selected store only
7. WHEN a Cashier processes a sale, THE System SHALL associate the transaction with the currently selected store
8. WHEN a Baker records production, THE System SHALL deduct ingredients from the currently selected store's inventory
9. WHEN a Manager switches stores, THE System SHALL refresh all data to reflect the newly selected store
10. WHERE a User has Admin role, THE System SHALL allow viewing consolidated reports across all stores
11. WHEN an Admin views multi-store analytics, THE System SHALL display comparative metrics for all stores
12. WHEN a Manager views profit reports, THE System SHALL calculate profits based on the currently selected store's data
13. WHEN a Manager views hourly sales chart, THE System SHALL show sales trend for the currently selected store only
14. WHEN a Manager views top selling items, THE System SHALL rank products based on the currently selected store's sales
15. WHEN a User views low stock alerts, THE System SHALL show alerts for the currently selected store only

---

## Success Metrics

1. **Inventory Traceability**: 100% of stock movements tracked from purchase to sale
2. **Real-time Profit Visibility**: Profit calculated and displayed within 1 second of sale
3. **Recipe-based Costing**: Accurate ingredient cost calculation for all made-in-house items
4. **Operational Efficiency**: Average billing time reduced to under 30 seconds per transaction
5. **Stock Accuracy**: Physical stock matches system stock with 98% accuracy
6. **User Adoption**: All staff trained and using system within 2 weeks of go-live
7. **System Uptime**: 99.5% availability during business hours
8. **Report Generation**: All reports generated within 5 seconds
9. **Data Integrity**: Zero data loss incidents
10. **Customer Satisfaction**: Faster checkout and accurate billing

---

## Constraints

1. **Budget**: Development within allocated budget
2. **Timeline**: MVP delivery in 8 weeks
3. **Hardware**: Compatible with Android tablets and thermal printers
4. **Internet**: Must function with intermittent connectivity
5. **Scalability**: Support up to 1000 products and 10,000 transactions per month
6. **Compliance**: Adhere to local tax and data privacy regulations
7. **Training**: Maximum 2 hours training required per user role
8. **Language**: English interface (multi-language support in future)
9. **Browser**: Support Chrome, Safari, Edge (latest 2 versions)
10. **Database**: PostgreSQL for data storage

---

## Assumptions

1. Stable power supply with UPS backup available
2. Staff have basic computer literacy
3. Internet connection available most of the time
4. Thermal printer supports ESC/POS protocol
5. System supports multiple store locations with independent inventory and sales tracking
6. GST compliance not required in MVP (future phase)
7. Customer database not required in MVP
8. Supplier payments tracked separately
9. Bank reconciliation done manually
10. Barcode scanner available for product entry
