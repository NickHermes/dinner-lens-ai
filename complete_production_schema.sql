-- Complete Production Schema for Dinner Lens AI
-- This includes everything needed for production Supabase

-- ===== STEP 1: DROP EXISTING TABLES =====
DROP TABLE IF EXISTS public.embeddings CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.consumption_records CASCADE;
DROP TABLE IF EXISTS public.dinner_instances CASCADE;
DROP TABLE IF EXISTS public.dishes CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
DROP FUNCTION IF EXISTS match_embeddings CASCADE;

-- ===== STEP 2: CREATE NEW SCHEMA =====

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 0. PLACES TABLE (Referenced by dinner_instances)
CREATE TABLE public.places (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('home', 'friend', 'restaurant', 'other')) DEFAULT 'other',
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    radius_m INTEGER DEFAULT 150,
    address TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. DISHES TABLE (Base items - like products)
CREATE TABLE public.dishes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    base_photo_url TEXT,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    effort TEXT CHECK (effort IN ('easy', 'medium', 'hard')),
    meal_type TEXT CHECK (me al_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DINNER_INSTANCES TABLE (Variants - like product variants)
CREATE TABLE public.dinner_instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    place_id UUID REFERENCES public.places(id),
    location TEXT,
    variant_title TEXT,
    notes TEXT,
    photo_url TEXT,
    count INTEGER DEFAULT 1 NOT NULL,
    last_consumed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TAGS TABLE (Both base and instance-specific tags)
CREATE TABLE public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dish_id UUID REFERENCES public.dishes(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.dinner_instances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('ingredient', 'cuisine', 'dish', 'diet', 'method', 'course', 'custom')) DEFAULT 'custom',
    source TEXT CHECK (source IN ('ai', 'user')) DEFAULT 'user',
    is_base_tag BOOLEAN DEFAULT FALSE, -- TRUE for dish-level tags, FALSE for instance-specific
    approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints: tag must belong to either dish OR instance, not both
    CONSTRAINT tags_belongs_to_one CHECK (
        (dish_id IS NOT NULL AND instance_id IS NULL AND is_base_tag = TRUE) OR
        (dish_id IS NULL AND instance_id IS NOT NULL AND is_base_tag = FALSE)
    )
);

-- 4. PHOTOS TABLE (Updated to reference instances)
CREATE TABLE public.photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instance_id UUID REFERENCES public.dinner_instances(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    exif_lat DECIMAL,
    exif_lon DECIMAL,
    exif_time TIMESTAMP WITH TIME ZONE,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EMBEDDINGS TABLE (Updated for dishes)
CREATE TABLE public.embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONSUMPTION_RECORDS TABLE (Track individual consumption events)
CREATE TABLE public.consumption_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES public.dinner_instances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_places_user_id ON public.places(user_id);
CREATE INDEX idx_places_type ON public.places(type);
CREATE INDEX idx_places_is_default ON public.places(is_default);
CREATE INDEX idx_dishes_user_id ON public.dishes(user_id);
CREATE INDEX idx_dishes_title ON public.dishes(title);
CREATE INDEX idx_dishes_effort ON public.dishes(effort);
CREATE INDEX idx_dishes_meal_type ON public.dishes(meal_type);
CREATE INDEX idx_dishes_notes ON public.dishes(notes);
CREATE INDEX idx_dinner_instances_dish_id ON public.dinner_instances(dish_id);
CREATE INDEX idx_dinner_instances_user_id ON public.dinner_instances(user_id);
CREATE INDEX idx_dinner_instances_datetime ON public.dinner_instances(datetime);
CREATE INDEX idx_dinner_instances_location ON public.dinner_instances(location);
CREATE INDEX idx_dinner_instances_variant_title ON public.dinner_instances(variant_title);
CREATE INDEX idx_dinner_instances_count ON public.dinner_instances(count);
CREATE INDEX idx_dinner_instances_last_consumed ON public.dinner_instances(last_consumed);
CREATE INDEX idx_tags_dish_id ON public.tags(dish_id);
CREATE INDEX idx_tags_instance_id ON public.tags(instance_id);
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_is_base_tag ON public.tags(is_base_tag);
CREATE INDEX idx_photos_instance_id ON public.photos(instance_id);
CREATE INDEX idx_embeddings_dish_id ON public.embeddings(dish_id);
CREATE INDEX idx_consumption_records_instance_id ON public.consumption_records(instance_id);
CREATE INDEX idx_consumption_records_user_id ON public.consumption_records(user_id);
CREATE INDEX idx_consumption_records_consumed_at ON public.consumption_records(consumed_at);

-- RLS (Row Level Security) Policies
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dinner_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;

-- Places policies
CREATE POLICY "Users can view own places" ON public.places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own places" ON public.places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own places" ON public.places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own places" ON public.places FOR DELETE USING (auth.uid() = user_id);

-- Dishes policies
CREATE POLICY "Users can view own dishes" ON public.dishes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dishes" ON public.dishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dishes" ON public.dishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dishes" ON public.dishes FOR DELETE USING (auth.uid() = user_id);

-- Dinner instances policies
CREATE POLICY "Users can view own dinner instances" ON public.dinner_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dinner instances" ON public.dinner_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dinner instances" ON public.dinner_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dinner instances" ON public.dinner_instances FOR DELETE USING (auth.uid() = user_id);

-- Tags policies (more complex - need to check ownership through dish or instance)
CREATE POLICY "Users can view tags on own dishes/instances" ON public.tags FOR SELECT USING (
    (dish_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())) OR
    (instance_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid()))
);
CREATE POLICY "Users can insert tags on own dishes/instances" ON public.tags FOR INSERT WITH CHECK (
    (dish_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())) OR
    (instance_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid()))
);
CREATE POLICY "Users can update tags on own dishes/instances" ON public.tags FOR UPDATE USING (
    (dish_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())) OR
    (instance_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid()))
);
CREATE POLICY "Users can delete tags on own dishes/instances" ON public.tags FOR DELETE USING (
    (dish_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())) OR
    (instance_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid()))
);

-- Photos policies
CREATE POLICY "Users can view photos on own instances" ON public.photos FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert photos on own instances" ON public.photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update photos on own instances" ON public.photos FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete photos on own instances" ON public.photos FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dinner_instances WHERE id = instance_id AND user_id = auth.uid())
);

-- Embeddings policies
CREATE POLICY "Users can view embeddings on own dishes" ON public.embeddings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert embeddings on own dishes" ON public.embeddings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update embeddings on own dishes" ON public.embeddings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete embeddings on own dishes" ON public.embeddings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dishes WHERE id = dish_id AND user_id = auth.uid())
);

-- Consumption records policies
CREATE POLICY "Users can view their own consumption records" ON public.consumption_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consumption records" ON public.consumption_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consumption records" ON public.consumption_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consumption records" ON public.consumption_records FOR DELETE USING (auth.uid() = user_id);

-- Update the match_embeddings function for dishes
CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  dish_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.dish_id,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_places_updated_at 
  BEFORE UPDATE ON public.places 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at 
  BEFORE UPDATE ON public.dishes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dinner_instances_updated_at 
  BEFORE UPDATE ON public.dinner_instances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumption_records_updated_at 
  BEFORE UPDATE ON public.consumption_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing the new dishes/instances schema
-- Using your actual user IDs:
-- nickhermes@me.com: 5f85e910-4630-4c6f-bc67-1f52fad65754
-- lotvantouw@gmail.com: 72ca31ec-fb27-4547-8773-d61a57f2a1ae

-- Sample places for nickhermes@me.com
INSERT INTO public.places (id, user_id, name, type, lat, lon, radius_m, is_default) VALUES
('770e8400-e29b-41d4-a716-446655440001', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Home', 'home', 52.3676, 4.9041, 150, true),
('770e8400-e29b-41d4-a716-446655440002', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Tony''s Pizzeria', 'restaurant', 52.3702, 4.8952, 500, false);

-- Sample places for lotvantouw@gmail.com
INSERT INTO public.places (id, user_id, name, type, lat, lon, radius_m, is_default) VALUES
('770e8400-e29b-41d4-a716-446655440003', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', 'Home', 'home', 52.3676, 4.9041, 150, true),
('770e8400-e29b-41d4-a716-446655440004', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', 'Local Restaurant', 'restaurant', 52.3702, 4.8952, 500, false);

-- Sample dishes for nickhermes@me.com
INSERT INTO public.dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Chicken Pad Thai', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400', 75, 'medium', 'dinner', 'Classic Thai noodle dish'),
('550e8400-e29b-41d4-a716-446655440002', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Margherita Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 60, 'hard', 'dinner', 'Traditional Italian pizza'),
('550e8400-e29b-41d4-a716-446655440003', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Salmon Bowl', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 90, 'easy', 'lunch', 'Healthy salmon with quinoa'),
('550e8400-e29b-41d4-a716-446655440004', '5f85e910-4630-4c6f-bc67-1f52fad65754', 'Chicken Curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 80, 'medium', 'dinner', 'Spicy Indian curry');

-- Sample dishes for lotvantouw@gmail.com
INSERT INTO public.dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes) VALUES
('550e8400-e29b-41d4-a716-446655440005', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', 'Caesar Salad', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 75, 'easy', 'lunch', 'Fresh romaine lettuce with caesar dressing'),
('550e8400-e29b-41d4-a716-446655440006', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', 'Pasta Carbonara', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 70, 'medium', 'dinner', 'Rich and creamy carbonara');

-- Sample base tags for dishes
INSERT INTO public.tags (dish_id, name, type, source, is_base_tag, approved) VALUES
-- Chicken Pad Thai base tags (nickhermes)
('550e8400-e29b-41d4-a716-446655440001', 'chicken', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440001', 'thai', 'cuisine', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440001', 'noodles', 'ingredient', 'user', true, true),

-- Margherita Pizza base tags (nickhermes)
('550e8400-e29b-41d4-a716-446655440002', 'pizza', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'italian', 'cuisine', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'vegetarian', 'diet', 'user', true, true),

-- Salmon Bowl base tags (nickhermes)
('550e8400-e29b-41d4-a716-446655440003', 'salmon', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'healthy', 'diet', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'fish', 'ingredient', 'user', true, true),

-- Chicken Curry base tags (nickhermes)
('550e8400-e29b-41d4-a716-446655440004', 'chicken', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'curry', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'indian', 'cuisine', 'user', true, true),

-- Caesar Salad base tags (lotvantouw)
('550e8400-e29b-41d4-a716-446655440005', 'salad', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'lettuce', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'healthy', 'diet', 'user', true, true),

-- Pasta Carbonara base tags (lotvantouw)
('550e8400-e29b-41d4-a716-446655440006', 'pasta', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'italian', 'cuisine', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'bacon', 'ingredient', 'user', true, true);

-- Sample dinner instances for nickhermes@me.com
INSERT INTO public.dinner_instances (id, dish_id, user_id, datetime, place_id, location, variant_title, notes, photo_url, count, last_consumed) VALUES
-- Chicken Pad Thai instances (3 variants)
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-15 19:30:00+00', '770e8400-e29b-41d4-a716-446655440001', 'Home', 'Spicy', 'Spicy version with extra peanuts', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400', 1, '2024-01-15 19:30:00+00'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-10 12:00:00+00', '770e8400-e29b-41d4-a716-446655440001', 'Home', 'Mild', 'Mild version for lunch', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400', 1, '2024-01-10 12:00:00+00'),

-- Margherita Pizza instances (2 variants)
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-14 18:00:00+00', '770e8400-e29b-41d4-a716-446655440001', 'Home', 'Homemade', 'Homemade version', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 1, '2024-01-14 18:00:00+00'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-08 19:00:00+00', '770e8400-e29b-41d4-a716-446655440002', 'Tony''s Pizzeria', 'Restaurant', 'From Tony''s Pizzeria', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 1, '2024-01-08 19:00:00+00'),

-- Salmon Bowl instances (1 variant)
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-12 12:30:00+00', '770e8400-e29b-41d4-a716-446655440001', 'Home', 'Quinoa', 'With quinoa and avocado', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 1, '2024-01-12 12:30:00+00');

-- Sample dinner instances for lotvantouw@gmail.com
INSERT INTO public.dinner_instances (id, dish_id, user_id, datetime, place_id, location, variant_title, notes, photo_url, count, last_consumed) VALUES
-- Caesar Salad instances
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', '2024-01-15 12:00:00+00', '770e8400-e29b-41d4-a716-446655440003', 'Home', 'Classic', 'Traditional caesar salad', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 1, '2024-01-15 12:00:00+00'),

-- Pasta Carbonara instances
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', '2024-01-14 19:00:00+00', '770e8400-e29b-41d4-a716-446655440003', 'Home', 'Traditional', 'Rich and creamy carbonara', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 1, '2024-01-14 19:00:00+00');

-- Sample instance-specific tags
INSERT INTO public.tags (instance_id, name, type, source, is_base_tag, approved) VALUES
-- Pad Thai spicy variant tags (nickhermes)
('660e8400-e29b-41d4-a716-446655440001', 'spicy', 'custom', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440001', 'peanuts', 'ingredient', 'user', false, true),

-- Pizza homemade variant tags (nickhermes)
('660e8400-e29b-41d4-a716-446655440003', 'homemade', 'method', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440003', 'sourdough', 'ingredient', 'user', false, true),

-- Salmon bowl variant tags (nickhermes)
('660e8400-e29b-41d4-a716-446655440005', 'quinoa', 'ingredient', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440005', 'avocado', 'ingredient', 'user', false, true),

-- Caesar salad variant tags (lotvantouw)
('660e8400-e29b-41d4-a716-446655440006', 'croutons', 'ingredient', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440006', 'parmesan', 'ingredient', 'user', false, true),

-- Pasta carbonara variant tags (lotvantouw)
('660e8400-e29b-41d4-a716-446655440007', 'eggs', 'ingredient', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440007', 'creamy', 'custom', 'user', false, true);

-- Sample consumption records for nickhermes@me.com
INSERT INTO public.consumption_records (id, instance_id, user_id, consumed_at, location) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-15 19:30:00+00', 'Home'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-10 12:00:00+00', 'Home'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-14 18:00:00+00', 'Home'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-08 19:00:00+00', 'Tony''s Pizzeria'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', '5f85e910-4630-4c6f-bc67-1f52fad65754', '2024-01-12 12:30:00+00', 'Home');

-- Sample consumption records for lotvantouw@gmail.com
INSERT INTO public.consumption_records (id, instance_id, user_id, consumed_at, location) VALUES
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', '2024-01-15 12:00:00+00', 'Home'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', '72ca31ec-fb27-4547-8773-d61a57f2a1ae', '2024-01-14 19:00:00+00', 'Home');

-- Summary of created data:
-- 4 places (2 for each user: Home + Restaurant)
-- 6 dishes (4 for nickhermes, 2 for lotvantouw)
-- 7 dinner instances (5 for nickhermes, 2 for lotvantouw)
-- 18 base tags (3 per dish)
-- 10 instance-specific tags
-- 7 consumption records (5 for nickhermes, 2 for lotvantouw)
-- Total: Complete working schema with sample data for both users
