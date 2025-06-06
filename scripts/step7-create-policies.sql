-- Step 7: Create RLS policies
CREATE POLICY "Users can only see their own courses" ON courses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see videos from their courses" ON videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = videos.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own streak activity" ON streak_activity
  FOR ALL USING (auth.uid() = user_id);
