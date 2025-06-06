-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS streak_activity CASCADE;

-- Create courses table with correct schema
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  duration TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  bookmarked BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create streak_activity table
CREATE TABLE streak_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  videos_watched INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_playlist_id ON courses(playlist_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON user_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_streak_activity_user_id ON streak_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activity_date ON streak_activity(date);
