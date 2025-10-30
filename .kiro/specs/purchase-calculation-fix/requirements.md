# Requirements Document - Purchase Calculation Fix

## Introduction

This document outlines the requirements for fixing the purchase calculation logic in the Tea Boys Management System. Currently, the purchase form is calculating incorrect totals when entering product quantities and unit costs, leading to inflated purchase amounts that don't match the expected calculations.

## Glossary

- **System**: Tea Boys Management Software
- **Purchase Line**: Individual product entry in a purchase order with quantity, unit cost, and total
- **Unit Cost**: Price per unit of measurement (e.g., ₹400 per kg)
- **Line Total**: Calculated as (quantity × unit cost)
- **Grand Total**: Sum of all line totals in a purchase order
- **Number Input**: HTML input field with type="number" that accepts decimal values
- **Real-time Calculation**: Immediate recalculation of totals when quantity or unit cost changes

---

## Requirements

### Requirement 1: Manual Purchase Line Entry with Total Cost

**User Story:** As a Manager, I want to manually enter quantity and total cost for each purchase line, so that I can record purchases without worrying about unit conversions or calculations.

#### Acceptance Criteria

1. WHEN a Manager enters quantity in a purchase line, THE System SHALL accept the value as entered without unit conversion
2. WHEN a Manager enters total cost in a purchase line, THE System SHALL accept the value as the line total
3. WHEN a Manager enters "400" as quantity and "320" as total cost, THE System SHALL record 400 units at ₹320 total
4. WHEN either quantity or total cost is empty, THE System SHALL display line total as ₹0.00
5. WHEN a Manager enters decimal values for quantity, THE System SHALL support up to 3 decimal places
6. WHEN a Manager enters decimal values for total cost, THE System SHALL support up to 2 decimal places
7. WHEN a Manager views line total, THE System SHALL display the manually entered total cost
8. WHEN a Manager views line total, THE System SHALL format the amount with currency symbol and thousand separators
9. WHEN a purchase is saved, THE System SHALL calculate unit cost as (total cost ÷ quantity) for inventory costing
10. WHEN a Manager views saved purchase, THE System SHALL display quantity, total cost, and calculated unit cost

---

### Requirement 2: Real-time Grand Total Calculation

**User Story:** As a Manager, I want the grand total to update automatically as I add or modify purchase lines, so that I can see the total purchase amount in real-time.

#### Acceptance Criteria

1. WHEN a Manager adds a new purchase line, THE System SHALL recalculate grand total immediately
2. WHEN a Manager removes a purchase line, THE System SHALL recalculate grand total immediately
3. WHEN a Manager changes quantity in any line, THE System SHALL keep the same total cost
4. WHEN a Manager changes total cost in any line, THE System SHALL recalculate grand total immediately
5. WHEN calculating grand total, THE System SHALL sum all manually entered line total costs
6. WHEN a purchase line has empty quantity or total cost, THE System SHALL exclude it from grand total
7. WHEN all purchase lines are empty, THE System SHALL display grand total as ₹0.00
8. WHEN grand total exceeds ₹1,00,000, THE System SHALL display with proper thousand separators (e.g., ₹3,20,000.00)
9. WHEN grand total is calculated, THE System SHALL round to 2 decimal places
10. WHEN a Manager views grand total, THE System SHALL display it prominently with larger font and bold styling

---

### Requirement 3: Input Validation and Error Prevention

**User Story:** As a Manager, I want the system to validate my inputs and prevent data entry errors, so that I can avoid entering incorrect purchase data.

#### Acceptance Criteria

1. WHEN a Manager enters negative quantity, THE System SHALL prevent the input or display validation error
2. WHEN a Manager enters negative total cost, THE System SHALL prevent the input or display validation error
3. WHEN a Manager enters non-numeric characters, THE System SHALL prevent the input
4. WHEN a Manager enters quantity exceeding 999999, THE System SHALL display validation warning
5. WHEN a Manager enters total cost exceeding 9999999, THE System SHALL display validation warning
6. WHEN a Manager attempts to submit with empty product selection, THE System SHALL display error message
7. WHEN a Manager attempts to submit with zero quantity, THE System SHALL display error message
8. WHEN a Manager attempts to submit with zero total cost, THE System SHALL display error message
9. WHEN a Manager enters more than 3 decimal places in quantity, THE System SHALL round to 3 decimal places
10. WHEN a Manager enters more than 2 decimal places in total cost, THE System SHALL round to 2 decimal places

---

### Requirement 4: Unit of Measurement Display and Clarity

**User Story:** As a Manager, I want to see the unit of measurement clearly when entering quantities, so that I know what unit I'm recording.

#### Acceptance Criteria

1. WHEN a Manager selects a product, THE System SHALL display the product's unit of measurement next to the quantity field
2. WHEN a product is measured in kg, THE System SHALL display "kg" label next to quantity input
3. WHEN a product is measured in grams, THE System SHALL display "g" label next to quantity input
4. WHEN a product is measured in liters, THE System SHALL display "L" label next to quantity input
5. WHEN a product is measured in pieces, THE System SHALL display "pcs" label next to quantity input
6. WHEN a Manager enters quantity, THE System SHALL provide placeholder text indicating the unit (e.g., "Qty in g")
7. WHEN a Manager enters total cost, THE System SHALL provide placeholder text "Total Cost"
8. WHEN a Manager views purchase history, THE System SHALL display quantity with unit (e.g., "400 g")
9. WHEN a Manager views purchase history, THE System SHALL display calculated unit cost (total ÷ quantity)
10. WHEN printing purchase order, THE System SHALL include unit of measurement and total cost for each line item

---

### Requirement 5: Data Transparency and Record Keeping

**User Story:** As a Manager, I want to see clear purchase records with all details, so that I can verify and audit purchase amounts.

#### Acceptance Criteria

1. WHEN a Manager views a purchase line, THE System SHALL display quantity, total cost, and calculated unit cost clearly
2. WHEN a Manager views grand total, THE System SHALL show breakdown of all line totals
3. WHEN a Manager reviews purchase before submission, THE System SHALL display summary with all line items
4. WHEN a Manager saves a purchase, THE System SHALL calculate and store unit cost as (total cost ÷ quantity)
5. WHEN a Manager saves a purchase, THE System SHALL update weighted average cost using the calculated unit cost
6. WHEN a Manager views saved purchase, THE System SHALL display quantity, total cost, and calculated unit cost
7. WHEN a Manager exports purchase data, THE System SHALL include quantity, total cost, and unit cost
8. WHEN a Manager views purchase history, THE System SHALL show all line items with totals
9. WHEN a Manager prints purchase order, THE System SHALL include all purchase details
10. WHEN a Manager views purchase report, THE System SHALL show total amount with line item breakdown

---

## Success Metrics

1. **Calculation Accuracy**: 100% of purchase calculations match manual verification
2. **User Confidence**: Zero reported calculation errors after fix implementation
3. **Data Integrity**: All saved purchases have correct total amounts
4. **Input Validation**: Zero invalid purchases saved to database
5. **User Experience**: Managers can complete purchase entry without confusion about units or calculations

---

## Constraints

1. **Backward Compatibility**: Fix must not affect existing purchase records
2. **Performance**: Calculations must complete within 100ms for real-time updates
3. **Browser Support**: Must work on Chrome, Safari, Edge (latest 2 versions)
4. **Decimal Precision**: Must maintain accuracy for fractional quantities (e.g., 0.4 kg)
5. **Currency Format**: Must display amounts in Indian Rupee format with proper separators

---

## Assumptions

1. Managers understand the unit of measurement for each product
2. Unit costs are entered in the product's base unit (e.g., per kg, not per gram)
3. Quantity can be entered as decimal for fractional amounts
4. Currency calculations use 2 decimal places for rupees and paise
5. Number input fields support decimal values in all target browsers

---

## Root Cause Analysis

Based on the screenshot showing "Tea Powder (g)" with quantity "0.4" and total cost "800" resulting in ₹320.00:

**Current Behavior:**
- User enters quantity: 0.4 (trying to enter 400g but system interprets as 0.4g)
- User enters total cost: 800
- System displays: ₹320.00 (incorrect)

**Issue Identified:**
The system has a quantity × unit cost calculation that's causing confusion:
1. Users want to enter the actual quantity (400g) and the total cost (₹800)
2. System is trying to calculate based on unit cost, leading to wrong totals
3. Unit conversion between grams and kilograms adds complexity

**Solution Approach:**
1. Remove unit cost field entirely
2. Replace with "Total Cost" field that accepts the actual purchase amount
3. Display unit of measurement clearly next to quantity input
4. Calculate unit cost automatically when saving: unit_cost = total_cost ÷ quantity
5. Use calculated unit cost for weighted average cost updates
6. Simplify UI to just: Product | Quantity | Total Cost | Actions
