-- Alternative script to add missing columns if you don't want to recreate tables
-- Run this if you want to keep existing data

-- Check if playlist_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='courses' AND column_name='playlist_id') THEN
        ALTER TABLE courses ADD COLUMN playlist_id TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update the default value constraint
ALTER TABLE courses ALTER COLUMN playlist_id DROP DEFAULT;

-- Add index for playlist_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_courses_playlist_id ON courses(playlist_id);
