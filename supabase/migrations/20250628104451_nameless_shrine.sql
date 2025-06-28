-- Create video_timestamps table for resume playback functionality
CREATE TABLE IF NOT EXISTS video_timestamps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_timestamps_user_video ON video_timestamps(user_id, video_id);

-- Enable RLS
ALTER TABLE video_timestamps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own video timestamps" ON video_timestamps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video timestamps" ON video_timestamps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video timestamps" ON video_timestamps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video timestamps" ON video_timestamps
    FOR DELETE USING (auth.uid() = user_id);