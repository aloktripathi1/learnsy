-- Drop all existing policies
DROP POLICY IF EXISTS "Users can only see their own courses" ON courses;
DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
DROP POLICY IF EXISTS "Users can only see videos from their courses" ON videos;
DROP POLICY IF EXISTS "Users can only see their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can only see their own streak activity" ON streak_activity;

-- Create comprehensive policies for courses table
CREATE POLICY "courses_select_policy" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "courses_insert_policy" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_update_policy" ON courses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_delete_policy" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive policies for videos table
CREATE POLICY "videos_select_policy" ON videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "videos_insert_policy" ON videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "videos_update_policy" ON videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "videos_delete_policy" ON videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- Create comprehensive policies for user_progress table
CREATE POLICY "progress_select_policy" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_insert_policy" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update_policy" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_delete_policy" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive policies for streak_activity table
CREATE POLICY "streak_select_policy" ON streak_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streak_insert_policy" ON streak_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streak_update_policy" ON streak_activity
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streak_delete_policy" ON streak_activity
  FOR DELETE USING (auth.uid() = user_id);

-- Verify all policies are created
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('courses', 'videos', 'user_progress', 'streak_activity')
ORDER BY tablename, policyname;
