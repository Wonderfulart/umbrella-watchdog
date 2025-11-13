# Admin Setup Guide

## Creating Your First Admin User

After deploying the authentication system, follow these steps to create your first admin user:

### Step 1: Sign Up
1. Navigate to `/signup` in your application
2. Fill out the signup form with your details:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
3. Click "Sign Up"

Your profile will be automatically created in the `profiles` table.

### Step 2: Assign Admin Role

Since this is your first user, you need to manually assign the admin role:

1. Open the Lovable Cloud dashboard (Backend tab)
2. Navigate to the `user_roles` table
3. Click "Insert row"
4. Fill in the following:
   - `user_id`: Copy your user ID from the `profiles` table (same as your auth.users ID)
   - `role`: Select `admin` from the dropdown
5. Save the row

### Step 3: Verify Admin Access

1. Refresh your dashboard page
2. You should now see:
   - "Admin" badge in the header
   - Agent Management tab
   - Storage Uploader tab
   - Setup Guide
   - Email Automation Panel
   - Bulk Import and Add Policy buttons

## Creating Additional Admins (Future Enhancement)

In Phase 2, we'll add a User Management UI where admins can:
- View all users
- Assign/revoke roles
- Manage user access

For now, additional admins must be created manually following Step 2 above.

## Security Notes

- **Never store roles in client-side storage** (localStorage, sessionStorage)
- Roles are validated server-side through RLS policies using the `has_role()` function
- The `user_roles` table is protected by RLS - only admins can modify it
- All admin-only operations are secured at the database level

## Troubleshooting

### I can't see admin features after assigning the role
- Try signing out and signing back in
- Clear your browser cache
- Verify the role was correctly inserted in the `user_roles` table

### I'm locked out with no admin users
- Manually insert an admin role through the Lovable Cloud dashboard
- Use your user ID from the `profiles` or `auth.users` table
