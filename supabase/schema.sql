-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Row Level Security
-- Note: JWT secret is managed by Supabase automatically

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places table
CREATE TABLE public.places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('home', 'friend', 'restaurant', 'other')) NOT NULL,
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  radius_m INTEGER DEFAULT 150,
  address TEXT,
  is_default BOOLEAN DEFAULT FALSE, -- Whether this place appears as a preset option
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dinners table
CREATE TABLE public.dinners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  place_name TEXT, -- Store place name for mock places or when place_id is null
  notes TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  ai_caption TEXT,
  nutrition_calories INTEGER,
  nutrition_protein_g DECIMAL(5,2),
  nutrition_carbs_g DECIMAL(5,2),
  nutrition_fat_g DECIMAL(5,2),
  nutrition_fiber_g DECIMAL(5,2),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE public.photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dinner_id UUID REFERENCES public.dinners(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  exif_time TIMESTAMP WITH TIME ZONE,
  exif_lat DECIMAL(10, 8),
  exif_lon DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dinner_id UUID REFERENCES public.dinners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('ingredient', 'cuisine', 'dish', 'diet', 'method', 'course', 'custom')) NOT NULL,
  source TEXT CHECK (source IN ('ai', 'user')) NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings table for semantic search
CREATE TABLE public.embeddings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dinner_id UUID REFERENCES public.dinners(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved filters table
CREATE TABLE public.saved_filters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  query_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dinners_user_id ON public.dinners(user_id);
CREATE INDEX idx_dinners_datetime ON public.dinners(datetime DESC);
CREATE INDEX idx_dinners_place_id ON public.dinners(place_id);
CREATE INDEX idx_photos_dinner_id ON public.photos(dinner_id);
CREATE INDEX idx_tags_dinner_id ON public.tags(dinner_id);
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_approved ON public.tags(approved);
CREATE INDEX idx_places_user_id ON public.places(user_id);
CREATE INDEX idx_embeddings_dinner_id ON public.embeddings(dinner_id);

-- Vector similarity search index
CREATE INDEX ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dinners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own places" ON public.places FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own dinners" ON public.dinners FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own photos" ON public.photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.dinners WHERE id = photos.dinner_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage own tags" ON public.tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.dinners WHERE id = tags.dinner_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage own embeddings" ON public.embeddings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.dinners WHERE id = embeddings.dinner_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage own saved filters" ON public.saved_filters FOR ALL USING (auth.uid() = user_id);

-- Function to match embeddings for semantic search
CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  dinner_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.dinner_id,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dinners_updated_at BEFORE UPDATE ON public.dinners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data will be added after users are created through the app
