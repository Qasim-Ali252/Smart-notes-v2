-- TEMPORARY: Disable RLS for development without auth
-- Run this in Supabase SQL Editor to allow notes CRUD without authentication
-- REMEMBER TO RE-ENABLE LATER!

-- Disable RLS on notes table
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on documents table
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Note: When you re-enable authentication, run the original schema.sql again
-- to restore the RLS policies
