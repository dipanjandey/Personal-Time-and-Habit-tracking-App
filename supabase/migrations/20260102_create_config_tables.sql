-- Create work_areas table
CREATE TABLE work_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create work_types table
CREATE TABLE work_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_work_areas_user_id ON work_areas(user_id);
CREATE INDEX idx_work_areas_order ON work_areas(user_id, order_index);
CREATE INDEX idx_work_types_user_id ON work_types(user_id);
CREATE INDEX idx_work_types_order ON work_types(user_id, order_index);

-- Enable RLS
ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;

-- Policies for work_areas
CREATE POLICY "Users can view their own work areas"
  ON work_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work areas"
  ON work_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work areas"
  ON work_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work areas"
  ON work_areas FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for work_types
CREATE POLICY "Users can view their own work types"
  ON work_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work types"
  ON work_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work types"
  ON work_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work types"
  ON work_types FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_work_areas_updated_at
  BEFORE UPDATE ON work_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_types_updated_at
  BEFORE UPDATE ON work_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: Seed data will be inserted by the application when user first visits configure page
-- This allows dynamic seeding based on user context