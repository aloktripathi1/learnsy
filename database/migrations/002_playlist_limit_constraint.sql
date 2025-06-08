-- Add a function to check playlist limit per user
CREATE OR REPLACE FUNCTION check_playlist_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already has 4 or more playlists
    IF (SELECT COUNT(*) FROM courses WHERE user_id = NEW.user_id) >= 4 THEN
        RAISE EXCEPTION 'User has reached the maximum limit of 4 playlists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce playlist limit on insert
DROP TRIGGER IF EXISTS enforce_playlist_limit ON courses;
CREATE TRIGGER enforce_playlist_limit
    BEFORE INSERT ON courses
    FOR EACH ROW
    EXECUTE FUNCTION check_playlist_limit();

-- Add a comment to document the limit
COMMENT ON TRIGGER enforce_playlist_limit ON courses IS 'Enforces maximum of 4 playlists per user';
