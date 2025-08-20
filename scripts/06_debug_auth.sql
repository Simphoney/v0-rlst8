-- Debug Authentication Issues
-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if tenants exist
SELECT 'TENANTS' as table_name, count(*) as count, 
       array_agg(name) as names
FROM tenants;

-- 2. Check if users exist  
SELECT 'USERS' as table_name, count(*) as count,
       array_agg(full_name || ' (' || email || ')') as users
FROM users;

-- 3. Check auth users (this might not work from SQL editor)
-- You need to check this in Supabase Dashboard > Authentication > Users

-- 4. Check if auth_user_id links are correct
SELECT 
  u.full_name,
  u.email as user_email,
  u.auth_user_id,
  u.role,
  t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;

-- 5. Check for orphaned records
SELECT 
  'Orphaned users (no tenant)' as issue,
  count(*) as count
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id  
WHERE t.id IS NULL

UNION ALL

SELECT 
  'Users without auth_user_id' as issue,
  count(*) as count
FROM users
WHERE auth_user_id IS NULL;

-- 6. Show recent registrations
SELECT 
  'Recent registrations' as info,
  u.full_name,
  u.email,
  u.role,
  u.created_at,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ No auth link'
    ELSE '✅ Auth linked'
  END as auth_status
FROM users u
ORDER BY u.created_at DESC
LIMIT 5;
