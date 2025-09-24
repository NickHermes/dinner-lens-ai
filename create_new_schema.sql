-- New schema for dishes and instances (variants)
-- Run this to completely redesign the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. DISHES TABLE (Base items - like products)
CREATE TABLE public.dishes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    base_photo_url TEXT,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
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
    notes TEXT,
    effort TEXT CHECK (effort IN ('easy', 'medium', 'hard')),
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner',
    photo_url TEXT,
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

-- INDEXES for performance
CREATE INDEX idx_dishes_user_id ON public.dishes(user_id);
CREATE INDEX idx_dishes_title ON public.dishes(title);
CREATE INDEX idx_dinner_instances_dish_id ON public.dinner_instances(dish_id);
CREATE INDEX idx_dinner_instances_user_id ON public.dinner_instances(user_id);
CREATE INDEX idx_dinner_instances_datetime ON public.dinner_instances(datetime);
CREATE INDEX idx_tags_dish_id ON public.tags(dish_id);
CREATE INDEX idx_tags_instance_id ON public.tags(instance_id);
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_is_base_tag ON public.tags(is_base_tag);
CREATE INDEX idx_photos_instance_id ON public.photos(instance_id);
CREATE INDEX idx_embeddings_dish_id ON public.embeddings(dish_id);

-- RLS (Row Level Security) Policies
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dinner_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

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

