-- Step 4: Create user_progress table
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
