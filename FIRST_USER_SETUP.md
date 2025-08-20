# RLST8 First User Setup Guide

## Option 1: Automatic Setup (Recommended)

1. **Visit Setup Page**: Go to `/setup-admin` on your deployed app
2. **Company Info**: Fill in your company details
3. **Admin Account**: Create your administrator account
4. **Sign In**: Use your credentials to sign in

## Option 2: Manual Setup (Advanced)

### Step 1: Create Supabase Auth User
1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add User"**
4. Enter:
   - Email: `your-email@example.com`
   - Password: `your-secure-password`
5. **Copy the User ID** from the created user

### Step 2: Run SQL Script
1. Go to Supabase **SQL Editor**
2. Run the script `scripts/05_create_first_user.sql`
3. Replace the placeholder values:
   - `Your Company Name` → Your actual company name
   - `your-company@example.com` → Your company email
   - `Your Full Name` → Your full name
   - `+254700000000` → Your phone number
   - `YOUR_TENANT_ID_HERE` → Tenant ID from the INSERT result
   - `YOUR_AUTH_USER_ID_HERE` → User ID from Step 1

### Step 3: Sign In
1. Go to `/auth/signin`
2. Use the email and password from Step 1

## Troubleshooting

### "No accounts found" Error
- Complete the setup process first
- Check that both tenant and user records exist in database

### "Authentication failed" Error
- Verify email/password are correct
- Check that auth user exists in Supabase Auth
- Ensure user record exists in users table with correct auth_user_id

### "Environment variables missing" Error
- Add Supabase integration in Vercel
- Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## Default Admin Permissions

Your first user will have `company_admin` role with access to:
- ✅ All properties and units
- ✅ All tenants and leases  
- ✅ All payments and transactions
- ✅ All maintenance requests
- ✅ User management
- ✅ System settings

## Next Steps

After signing in:
1. **Add Properties**: Create your first property
2. **Add Users**: Invite agents, landlords, etc.
3. **Add Tenants**: Create tenant accounts
4. **Set Up Units**: Configure unit types and pricing
5. **Start Managing**: Begin using the full platform
