-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create wifis table
CREATE TABLE IF NOT EXISTS wifis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wifis_status ON wifis(status);
CREATE INDEX IF NOT EXISTS idx_wifis_location ON wifis(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_wifis_user_id ON wifis(user_id);
CREATE INDEX IF NOT EXISTS idx_wifis_created_at ON wifis(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wifis_updated_at BEFORE UPDATE ON wifis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create admin_users table to track admin users
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create user_submission_limits table for rate limiting
CREATE TABLE IF NOT EXISTS user_submission_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_count INTEGER DEFAULT 0,
  last_submission_at TIMESTAMP WITH TIME ZONE,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '24 hours')
);

-- Row Level Security (RLS) Policies

-- Enable RLS on wifis table
ALTER TABLE wifis ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved WiFi hotspots
CREATE POLICY "Public can view approved wifis"
  ON wifis FOR SELECT
  USING (status = 'approved');

-- Policy: Authenticated users can insert their own submissions
CREATE POLICY "Users can insert their own wifis"
  ON wifis FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Users can view their own submissions (including pending)
CREATE POLICY "Users can view their own wifis"
  ON wifis FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all submissions (including pending)
CREATE POLICY "Admins can view all wifis"
  ON wifis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can update any WiFi submission
CREATE POLICY "Admins can update wifis"
  ON wifis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin_users table
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Enable RLS on user_submission_limits table
ALTER TABLE user_submission_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submission limits
CREATE POLICY "Users can view their own limits"
  ON user_submission_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own submission limits
CREATE POLICY "Users can update their own limits"
  ON user_submission_limits FOR ALL
  USING (auth.uid() = user_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user submission count (for rate limiting)
CREATE OR REPLACE FUNCTION get_user_submission_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
  reset_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT submission_count, reset_at INTO count, reset_time
  FROM user_submission_limits
  WHERE user_id = user_uuid;
  
  -- Reset count if reset time has passed
  IF reset_time IS NULL OR reset_time < NOW() THEN
    UPDATE user_submission_limits
    SET submission_count = 0,
        reset_at = TIMEZONE('utc', NOW()) + INTERVAL '24 hours'
    WHERE user_id = user_uuid;
    RETURN 0;
  END IF;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  wifi_id UUID REFERENCES wifis(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  resolved BOOLEAN DEFAULT false
);

-- Create indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_wifi_id ON reports(wifi_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_resolved ON reports(resolved);

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert a report
CREATE POLICY "Users can insert a report"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can update reports
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to get all users and their admin status
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(id UUID, email TEXT, is_admin BOOLEAN) AS $
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    EXISTS(SELECT 1 FROM admin_users WHERE admin_users.user_id = u.id) as is_admin
  FROM auth.users u;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_admin(user_uuid UUID)
RETURNS VOID AS $
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can make other users admins';
  END IF;

  INSERT INTO admin_users (user_id) VALUES (user_uuid);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
