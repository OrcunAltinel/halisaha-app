-- Run this in the Supabase SQL Editor WITHOUT RLS (SQL Editor → New query → paste → Run).

-- Step 1: Add name and surname columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS surname TEXT;

-- Step 2: Copy existing username into name as a fallback
UPDATE user_profiles SET name = username WHERE name IS NULL AND username IS NOT NULL;

-- Step 3: Make username nullable (no longer required)
ALTER TABLE user_profiles ALTER COLUMN username DROP NOT NULL;

-- Step 4: Drop the old username unique constraint (if it exists)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_unique;

-- Step 5: Drop the old check_username_available function (no longer needed)
DROP FUNCTION IF EXISTS check_username_available(TEXT);
