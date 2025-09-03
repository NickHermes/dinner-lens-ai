-- Recreate essential tables after database reset

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('home', 'friend', 'restaurant', 'other')),
  lat DECIMAL(10, 8) NOT NULL,
  lon DECIMAL(11, 8) NOT NULL,
  radius_m INTEGER DEFAULT 150,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dinners table
CREATE TABLE IF NOT EXISTS dinners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  notes TEXT,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dinner_id UUID REFERENCES dinners(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  exif_time TIMESTAMP WITH TIME ZONE,
  exif_location POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dinner_id UUID REFERENCES dinners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingredient', 'cuisine', 'dish', 'diet', 'method', 'course', 'custom')),
  source TEXT NOT NULL CHECK (source IN ('ai', 'user')),
  approved BOOLEAN DEFAULT TRUE,
  confidence DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dinner_id UUID REFERENCES dinners(id) ON DELETE CASCADE,
  vector vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dinners_user_id ON dinners(user_id);
CREATE INDEX IF NOT EXISTS idx_dinners_datetime ON dinners(datetime);
CREATE INDEX IF NOT EXISTS idx_photos_dinner_id ON photos(dinner_id);
CREATE INDEX IF NOT EXISTS idx_dinners_place_id ON dinners(place_id);
CREATE INDEX IF NOT EXISTS idx_tags_dinner_id ON tags(dinner_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_approved ON tags(approved);
CREATE INDEX IF NOT EXISTS idx_places_user_id ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_dinner_id ON embeddings(dinner_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinners ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own places" ON places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own places" ON places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own places" ON places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own places" ON places FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own dinners" ON dinners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dinners" ON dinners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dinners" ON dinners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dinners" ON dinners FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own photos" ON photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = photos.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = photos.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = photos.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can delete own photos" ON photos FOR DELETE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = photos.dinner_id AND dinners.user_id = auth.uid())
);

CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = tags.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can insert own tags" ON tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = tags.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = tags.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = tags.dinner_id AND dinners.user_id = auth.uid())
);

CREATE POLICY "Users can view own embeddings" ON embeddings FOR SELECT USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = embeddings.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can insert own embeddings" ON embeddings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = embeddings.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can update own embeddings" ON embeddings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = embeddings.dinner_id AND dinners.user_id = auth.uid())
);
CREATE POLICY "Users can delete own embeddings" ON embeddings FOR DELETE USING (
  EXISTS (SELECT 1 FROM dinners WHERE dinners.id = embeddings.dinner_id AND dinners.user_id = auth.uid())
);

CREATE POLICY "Users can view own saved filters" ON saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved filters" ON saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved filters" ON saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved filters" ON saved_filters FOR DELETE USING (auth.uid() = user_id);
