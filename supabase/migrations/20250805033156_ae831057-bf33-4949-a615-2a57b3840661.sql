-- Check and potentially fix auth configuration
-- The security definer view might be in the auth schema or system views

-- Query system views to find the problematic view
SELECT schemaname, viewname 
FROM pg_views 
WHERE definition ILIKE '%SECURITY DEFINER%';