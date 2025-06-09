# Role-Based Access Control System

This document explains how the role-based access control system has been implemented in the application.

## Overview

The system now supports user roles with specific permissions that control what features users have access to. Instead of a simple "admin/non-admin" approach, we now have granular permissions that can be assigned to different user types.

## Current Permissions

| Permission | Description |
|------------|-------------|
| `isAdmin` | Full access to all system features including admin dashboard |
| `canDistributeKits` | Permission to access the kit distribution functionality |

## Database Structure

The `admin_users` table has been updated with the following columns:

- `is_admin` (boolean): Indicates if a user has full admin access
- `can_distribute_kits` (boolean): Indicates if a user can distribute kits

All existing admin users have been automatically granted both permissions.

## Implementation Details

### Authentication System

The authentication system (AuthContext) has been updated to:
- Store user roles
- Check permissions
- Handle role-based rendering of UI elements

### Protected Routes

The `ProtectedRoute` component has been enhanced to:
- Accept a `requiredPermission` prop
- Display an access denied message if permission is missing
- Redirect to login if not authenticated

### Navigation

The navigation component will now show/hide menu items based on the user's permissions.

## How to Add a New User with Specific Permissions

To add a new user with specific permissions, use the SQL Editor in Supabase:

```sql
-- Add a kit distribution staff member who is not an admin
INSERT INTO admin_users (username, password_hash, is_admin, can_distribute_kits)
VALUES ('distributor', 'your_password_hash', FALSE, TRUE);

-- Add a regular admin user
INSERT INTO admin_users (username, password_hash, is_admin, can_distribute_kits) 
VALUES ('admin_user', 'your_password_hash', TRUE, TRUE);
```

## How to Extend the System

To add new permissions:

1. Update the `UserRole` interface in `AuthContext.tsx`:
   ```typescript
   interface UserRole {
     isAdmin: boolean;
     canDistributeKits: boolean;
     newPermission: boolean; // Add your new permission
   }
   ```

2. Update the `ProtectedRouteProps` interface in `ProtectedRoute.tsx`:
   ```typescript
   interface ProtectedRouteProps {
     children: React.ReactNode;
     requiredPermission?: 'isAdmin' | 'canDistributeKits' | 'newPermission';
   }
   ```

3. Add the new column to the database schema:
   ```sql
   ALTER TABLE admin_users
   ADD COLUMN new_permission BOOLEAN DEFAULT FALSE;
   ```

4. Update the login function in `AuthContext.tsx` to include the new permission

## Security Considerations

- All permission checks are performed on both client and server sides
- Token validation ensures permissions cannot be spoofed
- Permission updates require re-authentication
