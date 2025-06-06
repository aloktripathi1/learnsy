-- First, let's check the current RLS policies for the courses table
SELECT * FROM pg_policies WHERE tablename = 'courses';

-- Drop the existing policy for courses
DROP POLICY IF EXISTS "Users can only see their own courses" ON courses;

-- Create a new policy that allows users to insert, select, update, and delete their own courses
CREATE POLICY "Users can manage their own courses" ON courses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'courses';
