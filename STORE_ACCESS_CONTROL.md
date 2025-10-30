# Store Access Control Implementation

## Overview

Implemented proper store access control to ensure users can only access stores they are assigned to, with special privileges for admin users.

## Changes Made

### 1. Store Access Logic (`src/stores/storeStore.ts`)

**Admin Users:**
- Can access ALL stores
- `canAccessAllStores` flag set to `true`
- Store selector shows all active stores

**Non-Admin Users:**
- Can ONLY access stores they are assigned to via `user_stores` table
- `canAccessAllStores` flag set to `false`
- Store selector shows only assigned stores
- If no stores assigned, user sees "No Store Access" message

**Removed Fallback:**
- Removed the fallback that showed all stores when no `user_stores` associations exist
- Now properly enforces store assignments

### 2. No Store Access Message (`src/pages/DashboardPage.tsx`)

Added a user-friendly message when a user has no store access:
- Yellow alert box with clear messaging
- Instructs user to contact administrator
- Mentions where admins can manage store assignments

### 3. Store Assignment Management

Admins can assign users to stores via:
- **User-Store Management Page** (`/user-store-management`)
- Functions available:
  - `assign_user_to_store(user_id, store_id, is_default)`
  - `remove_user_from_store(user_id, store_id)`

## User Flow

### For Admin Users:
1. Login → See all stores in store selector
2. Can switch between any store
3. Can access Multi-Store Analytics page
4. Can manage user-store assignments

### For Non-Admin Users:
1. Login → See only assigned stores in store selector
2. Can only switch between assigned stores
3. If no stores assigned → See "No Store Access" message
4. Cannot access stores they're not assigned to

### For New Users:
1. Admin creates user account
2. Admin assigns user to one or more stores via User-Store Management
3. Admin can set a default store for the user
4. User logs in and sees only their assigned stores

## Database Structure

### `user_stores` Table:
```sql
- user_id (UUID) → references profiles(id)
- store_id (UUID) → references stores(id)
- is_default (BOOLEAN) → marks default store for user
- created_at (TIMESTAMP)
```

### RLS Policies:
- Admins can manage all user-store associations
- Users can view their own associations
- Non-admins cannot modify associations

## Security Features

1. **Database-Level Security:**
   - RLS policies enforce store access at database level
   - All queries filtered by `store_id`
   - Users cannot query data from stores they don't have access to

2. **Application-Level Security:**
   - Store selector only shows accessible stores
   - Pages check for `currentStore` before loading data
   - No fallback to "all stores" for non-admins

3. **UI-Level Security:**
   - Store selector hidden if user has no stores
   - Clear messaging when no access
   - Admin-only pages protected by role check

## Testing Checklist

- [ ] Admin can see all stores
- [ ] Admin can switch between all stores
- [ ] Non-admin sees only assigned stores
- [ ] Non-admin cannot access unassigned stores
- [ ] User with no stores sees "No Store Access" message
- [ ] Store selector hidden when only one store assigned
- [ ] Default store loads correctly on login
- [ ] Store selection persists in localStorage
- [ ] All pages filter data by current store
- [ ] RLS policies prevent unauthorized data access

## Migration Notes

**For Existing Users:**
- Admins automatically get access to all stores (no `user_stores` entries needed)
- Non-admin users need to be assigned to stores via User-Store Management
- Until assigned, non-admin users will see "No Store Access" message

**Admin Action Required:**
1. Go to User-Store Management page
2. Assign each non-admin user to their appropriate store(s)
3. Set default store for each user (optional)

## Future Enhancements

1. **Bulk Assignment:** Allow admins to assign multiple users to a store at once
2. **Store Permissions:** Add granular permissions (read-only, full access, etc.)
3. **Temporary Access:** Allow time-limited store access
4. **Access Logs:** Track which users accessed which stores and when
5. **Self-Service:** Allow managers to request access to additional stores
