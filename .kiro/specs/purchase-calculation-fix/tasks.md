# Implementation Plan - Purchase Calculation Fix

## Overview

This implementation plan breaks down the purchase calculation fix into discrete, actionable coding tasks. Each task builds incrementally on previous work to improve calculation accuracy and UI clarity.

---

## Tasks

- [ ] 1. Create calculation utility functions
  - Create `src/lib/purchaseCalculations.ts` file with calculation and validation functions
  - Implement `parseNumericInput()` function to safely parse and round decimal numbers
  - Implement `calculateUnitCost()` function to calculate total cost ÷ quantity with proper rounding
  - Implement `calculateGrandTotal()` function to sum all total costs from purchase lines
  - Implement `formatLineDetails()` function to generate human-readable line details
  - Implement `validatePurchaseLine()` function to validate product, quantity, and total cost
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.9, 2.5, 2.6, 2.9, 3.1, 3.2, 3.3, 3.9, 3.10_

- [ ] 1.1 Write unit tests for calculation utilities
  - Create test file for purchase calculations
  - Write tests for unit cost calculation (800 ÷ 400 = 2.00)
  - Write tests for grand total calculation (sum of all total costs)
  - Write tests for edge cases (empty, zero, negative values, division by zero)
  - Write tests for rounding behavior
  - Write tests for validation logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9, 3.1, 3.2_

- [ ] 2. Create enhanced UI components for purchase lines
  - Create `QuantityInput` component with unit label display
  - Add unit label positioned inside/next to the input field
  - Add placeholder text showing unit (e.g., "Qty in g")
  - Implement number input with step="0.001" for 3 decimal places
  - Add min="0" and max="999999" constraints
  - Create `TotalCostInput` component for manual total entry
  - Add rupee symbol (₹) prefix to total cost input
  - Add placeholder text "Total Cost"
  - Implement number input with step="0.01" for 2 decimal places
  - Style components with proper spacing and visual hierarchy
  - _Requirements: 1.1, 1.2, 1.5, 1.6, 3.9, 3.10, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 3. Implement line total display
  - Create `LineTotalDisplay` component showing the manually entered total cost
  - Display total cost with proper currency formatting
  - Add calculated unit cost display below total (optional, for reference)
  - Format unit cost as "₹X.XX per [unit]"
  - Style with proper spacing and visual hierarchy
  - _Requirements: 1.7, 1.8, 1.10, 5.1, 5.6_

- [ ] 4. Update PurchasesPage to use new components
  - Import calculation utilities from `purchaseCalculations.ts`
  - Change lineItems state from `unit_cost` to `total_cost` field
  - Replace existing quantity input with `QuantityInput` component
  - Pass product unit to `QuantityInput` component
  - Replace existing unit cost input with `TotalCostInput` component
  - Replace line total display with `LineTotalDisplay` component
  - Pass total_cost to `LineTotalDisplay` component
  - Update `calculateGrandTotal` calls to use utility function
  - Update form submission to calculate unit_cost before saving
  - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.9, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Implement validation and error handling
  - Add `lineErrors` state to track validation errors per line
  - Implement `validateAllLines()` function to validate before submission
  - Add inline error display for quantity input
  - Add inline error display for total cost input
  - Add inline error display for product selection
  - Show validation errors when user attempts to submit
  - Clear errors when user corrects the input
  - Prevent form submission if validation fails
  - Display error toast with specific validation message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 6. Create grand total breakdown display
  - Create `GrandTotalDisplay` component
  - Display itemized list of all valid purchase lines
  - Show product name, quantity with unit, total cost, and calculated unit cost for each item
  - Calculate and display grand total using `calculateGrandTotal()`
  - Format grand total with large, bold styling
  - Use green color for grand total amount
  - Add proper spacing and border separation
  - Handle empty state (no valid lines)
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 5.2, 5.3_

- [ ] 7. Replace existing grand total with new component
  - Import `GrandTotalDisplay` component in PurchasesPage
  - Replace existing grand total calculation section
  - Pass `lineItems` and `products` arrays to component
  - Remove old `calculateGrandTotal()` function from PurchasesPage
  - Verify real-time updates when lines change
  - Test adding new lines updates grand total
  - Test removing lines updates grand total
  - Test changing quantity/cost updates grand total
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.10_

- [ ] 8. Add responsive design and mobile optimizations
  - Adjust grid layout for mobile screens (stack vertically)
  - Ensure touch targets are large enough (min 44px)
  - Make tooltip work on mobile (tap instead of hover)
  - Test number input keyboard on mobile devices
  - Ensure currency formatting works on all screen sizes
  - Add horizontal scroll for table on small screens
  - Test form usability on tablet devices
  - Verify all components are accessible via keyboard navigation
  - _Requirements: 4.9, 5.9_

- [ ] 8.1 Test on multiple devices and browsers
  - Test on Chrome desktop (latest version)
  - Test on Safari desktop (latest version)
  - Test on Edge desktop (latest version)
  - Test on Chrome mobile (Android)
  - Test on Safari mobile (iOS)
  - Test on tablet devices (iPad, Android tablet)
  - Verify decimal input works correctly on all platforms
  - Verify calculations are accurate across all browsers
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 9. Add accessibility improvements
  - Add aria-labels to quantity input ("Quantity in [unit]")
  - Add aria-labels to unit cost input ("Unit cost per [unit]")
  - Add aria-labels to line total ("Line total")
  - Add aria-describedby for error messages
  - Ensure error messages are announced by screen readers
  - Add keyboard shortcuts for adding/removing lines (optional)
  - Test with screen reader (NVDA, JAWS, or VoiceOver)
  - Ensure focus management works correctly
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9.1 Conduct accessibility audit
  - Run automated accessibility checker (axe, Lighthouse)
  - Fix any WCAG violations found
  - Test keyboard-only navigation
  - Test with screen reader
  - Verify color contrast ratios meet WCAG AA standards
  - Document accessibility features
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Update existing purchase records display
  - Ensure saved purchases display quantity with unit
  - Format purchase history with unit labels
  - Show total cost and calculated unit cost in purchase details view
  - Add unit information to purchase export/print
  - Verify backward compatibility with existing data (unit_cost field still exists)
  - _Requirements: 4.8, 4.9, 4.10, 5.6, 5.7, 5.10_

- [ ] 10.1 Test with existing purchase data
  - Load existing purchases from database
  - Verify all purchases display correctly
  - Check that totals match saved amounts
  - Ensure no data corruption or loss
  - Test editing existing purchases (if applicable)
  - _Requirements: 5.6, 5.7_

---

## Implementation Order

1. **Foundation** (Tasks 1): Create utility functions and tests
2. **UI Components** (Tasks 2-3): Build reusable components
3. **Integration** (Tasks 4, 7): Integrate components into PurchasesPage
4. **Validation** (Task 5): Add error handling and validation
5. **Enhancement** (Task 6): Add grand total breakdown
6. **Polish** (Tasks 8-9): Responsive design and accessibility
7. **Compatibility** (Task 10): Ensure backward compatibility

---

## Testing Checklist

### Functional Testing
- [ ] Manual entry: 400g quantity, ₹800 total = ₹800.00 displayed
- [ ] Unit cost calculation: ₹800 ÷ 400g = ₹2.00/g
- [ ] Multiple lines sum correctly (800 + 320 = 1120)
- [ ] Empty lines excluded from total
- [ ] Validation prevents invalid submission
- [ ] Grand total breakdown shows all lines with calculated unit costs
- [ ] Saved purchases store correct unit_cost for inventory costing

### Edge Cases
- [ ] Zero quantity handled correctly
- [ ] Zero unit cost handled correctly
- [ ] Negative values prevented/validated
- [ ] Very large numbers (999,999) handled
- [ ] Very small decimals (0.001) handled
- [ ] Empty product selection validated

### UI/UX Testing
- [ ] Unit labels clearly visible
- [ ] "Per unit" label displayed
- [ ] Tooltip appears on hover
- [ ] Grand total breakdown readable
- [ ] Error messages clear and helpful
- [ ] Form responsive on mobile
- [ ] Touch interactions work on tablet

### Integration Testing
- [ ] Purchase saves with correct totals
- [ ] Stock updates correctly after purchase
- [ ] Purchase history displays correctly
- [ ] Existing purchases unaffected
- [ ] Export/print includes unit info

---

## Rollback Plan

If critical issues are discovered:
1. Revert `src/pages/PurchasesPage.tsx` to previous version
2. Keep `src/lib/purchaseCalculations.ts` for future use
3. Document issues encountered
4. Plan alternative implementation approach

---

## Success Criteria

- ✅ All calculations verified accurate
- ✅ Unit labels clearly displayed
- ✅ Validation prevents errors
- ✅ Tooltip shows calculation
- ✅ Grand total breakdown visible
- ✅ No regression in existing functionality
- ✅ Responsive on all devices
- ✅ Accessible to all users
- ✅ Zero user confusion about units
