/*
  # Add voice settings RLS policy

  1. Security
    - Enable RLS on voice_settings table (if not already enabled)
    - Add policy for authenticated users to insert their own voice settings
*/

ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own voice settings"
  ON voice_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);