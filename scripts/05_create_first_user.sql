-- RLST8 First User Setup Script
-- Run this in Supabase SQL Editor if you prefer manual setup

-- Step 1: Create your tenant (company)
INSERT INTO tenants (
  name, 
  entity_type, 
  legal_entity_type,
  phone, 
  email, 
  contact_person_name
) VALUES (
  'Your Company Name',           -- Replace with your company name
  'legal_entity',
  'company_private_limited',
  '+254700000000',              -- Replace with your phone
  'your-company@example.com',   -- Replace with your email
  'Your Full Name'              -- Replace with your name
) RETURNING id;

-- Step 2: Get the tenant ID from above and create Supabase auth user
-- You need to do this in Supabase Dashboard > Authentication > Users
-- Click "Add User" and create user with:
-- Email: your-email@example.com
-- Password: your-secure-password
-- Then copy the User ID from the auth.users table

-- Step 3: Create user record (replace the UUIDs with actual values)
INSERT INTO users (
  tenant_id,                    -- Use tenant ID from Step 1
  auth_user_id,                 -- Use auth user ID from Step 2  
  entity_type,
  full_name,
  phone,
  email,
  role,
  is_active
) VALUES (
  'YOUR_TENANT_ID_HERE',        -- Replace with tenant ID from Step 1
  'YOUR_AUTH_USER_ID_HERE',     -- Replace with auth user ID from Step 2
  'natural_person',
  'Your Full Name',             -- Replace with your name
  '+254700000000',              -- Replace with your phone
  'your-email@example.com',     -- Replace with your email
  'company_admin',
  true
);

-- Verify setup
SELECT 
  t.name as company_name,
  u.full_name as admin_name,
  u.email as admin_email,
  u.role as admin_role
FROM tenants t
JOIN users u ON t.id = u.tenant_id
WHERE u.role = 'company_admin';
