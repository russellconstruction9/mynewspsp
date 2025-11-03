-- Test Row Level Security
-- Run these queries in Supabase SQL Editor to verify security

-- 1. Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'reports', 'stored_documents', 'incident_templates', 'co_parent_messages', 'user_subscriptions');

-- 2. View all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test user isolation (this should return empty when run by different users)
-- Each user will only see their own data
SELECT 'user_profiles' as table_name, count(*) as my_records FROM user_profiles
UNION ALL
SELECT 'reports', count(*) FROM reports
UNION ALL  
SELECT 'stored_documents', count(*) FROM stored_documents
UNION ALL
SELECT 'incident_templates', count(*) FROM incident_templates
UNION ALL
SELECT 'co_parent_messages', count(*) FROM co_parent_messages
UNION ALL
SELECT 'user_subscriptions', count(*) FROM user_subscriptions;

-- 4. Check current authenticated user
SELECT auth.uid() as current_user_id, auth.email() as current_user_email;