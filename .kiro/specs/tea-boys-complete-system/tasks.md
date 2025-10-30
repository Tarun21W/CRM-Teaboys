# Implementation Plan - Multi-Store Support

## Overview
This implementation plan focuses on adding multi-store support to the Tea Boys Management System, enabling store-specific data isolation for dashboard, production, and reports pages.

---

- [x] 1. Create database schema for multi-store support



  - Create `stores` table with store information (name, code, address, phone)
  - Create `user_stores` junction table for user-store associations
  - Add `store_id` column to `sales` table with foreign key to stores
  - Add `store_id` column to `production_runs` table with foreign key to stores
  - Add `store_id` column to `stock_ledger` table with foreign key to stores
  - Create `store_inventory` table to track stock levels per store
  - Add composite indexes on (store_id, date) columns for performance
  - _Requirements: 16.1, 16.2, 16.6_

- [x] 2. Implement Row Level Security (RLS) policies

  - Enable RLS on `sales` table with store-based read policy
  - Enable RLS on `production_runs` table with store-based read policy
  - Enable RLS on `stock_ledger` table with store-based read policy
  - Enable RLS on `store_inventory` table with store-based read policy
  - Create admin override policy for cross-store access

  - _Requirements: 16.2, 16.3, 16.10_

- [x] 3. Create store context and state management

  - Create `StoreContext` with currentStore, stores list, and switchStore function
  - Implement `useStoreContext` hook for accessing store state
  - Add localStorage persistence for selected store
  - Create `useStores` hook to fetch available stores for current user
  - Implement store switching logic with data refresh
  - _Requirements: 16.1, 16.9_

- [x] 4. Build store selector UI component

  - Create StoreSelector dropdown component for header
  - Display current store name and code
  - List all accessible stores in dropdown
  - Handle store selection and trigger context update
  - Show loading state during store switch
  - Style component to match existing header design
  - _Requirements: 16.1, 16.9_

- [x] 5. Update dashboard to filter by selected store

  - Modify KPI queries to filter by currentStore.id
  - Update today's sales query with store filter
  - Update today's profit query with store filter
  - Update order count query with store filter
  - Update hourly sales chart query with store filter
  - Update top products query with store filter
  - Update low stock alerts query with store filter
  - _Requirements: 16.3, 16.13, 16.14, 16.15_

- [x] 6. Update reports pages to filter by selected store

  - Modify sales reports query to filter by store_id
  - Modify profit reports query to filter by store_id
  - Update date range filters to work with store filtering
  - Update report exports to include store information
  - Add store name to report headers
  - _Requirements: 16.4, 16.12_

- [x] 7. Update production page to filter by selected store


  - Modify production runs query to filter by store_id
  - Update production form to associate with current store
  - Modify ingredient deduction to use store-specific inventory
  - Update production history display with store filter
  - _Requirements: 16.5, 16.8_

- [x] 8. Update inventory management for store-specific stock


  - Modify inventory queries to use store_inventory table
  - Update stock display to show current store's levels
  - Modify purchase operations to update store-specific inventory
  - Update stock adjustments to work with store_inventory
  - Modify wastage tracking to deduct from store-specific stock
  - _Requirements: 16.6, 16.15_

- [x] 9. Update POS billing to associate sales with current store



  - Modify sale creation to include store_id from context
  - Update stock deduction to use store-specific inventory
  - Ensure bill numbers remain unique across all stores
  - Update receipt printing to include store information
  - _Requirements: 16.7_

- [ ] 10. Create multi-store analytics page for admins
  - Create new MultiStoreAnalyticsPage component
  - Implement comparative sales metrics across stores
  - Add store performance comparison charts
  - Create consolidated inventory view
  - Add filters for date range and store selection
  - _Requirements: 16.10, 16.11_

- [ ] 11. Add data migration script for existing data
  - Create migration to add default store record
  - Update existing sales records with default store_id
  - Update existing production_runs with default store_id
  - Update existing stock_ledger with default store_id
  - Create store_inventory records from existing stock data
  - Create user_stores associations for existing users
  - _Requirements: 16.1, 16.2_

- [ ] 12. Write integration tests for multi-store functionality
  - Test store switching updates all data correctly
  - Test RLS policies prevent cross-store data access
  - Test dashboard shows correct store-specific data
  - Test reports filter by selected store
  - Test production operations use correct store inventory
  - Test admin can view multi-store analytics
  - _Requirements: 16.2, 16.3, 16.9_

---

## Notes

- All tasks build incrementally on previous tasks
- Store context must be implemented before updating individual pages
- RLS policies should be tested thoroughly before production deployment
- Optional tasks (marked with *) can be implemented after core functionality
- Each task references specific requirements from requirements.md
