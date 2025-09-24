-- Insert corrected sample data that matches the current schema
-- (effort and meal_type are now at dish level, not instance level)

-- Replace with your actual user ID
DO $$
DECLARE
    user_uuid UUID := 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca'; -- Replace with the actual user ID
    place_home_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    place_restaurant_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    dish_chicken_pad_thai_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    dish_margherita_pizza_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    dish_salmon_bowl_id UUID := '550e8400-e29b-41d4-a716-446655440003';
    dish_chicken_curry_id UUID := '550e8400-e29b-41d4-a716-446655440004';
    dish_chicken_burrito_id UUID := 'a66eae0c-5568-447b-901a-dd71d45e00a0'; -- The actual dish ID from your gallery
BEGIN

-- Clear existing data first
DELETE FROM public.tags WHERE dish_id IN (dish_chicken_pad_thai_id, dish_margherita_pizza_id, dish_salmon_bowl_id, dish_chicken_curry_id, dish_chicken_burrito_id) OR instance_id IN (SELECT id FROM public.dinner_instances WHERE dish_id IN (dish_chicken_pad_thai_id, dish_margherita_pizza_id, dish_salmon_bowl_id, dish_chicken_curry_id, dish_chicken_burrito_id));
DELETE FROM public.dinner_instances WHERE dish_id IN (dish_chicken_pad_thai_id, dish_margherita_pizza_id, dish_salmon_bowl_id, dish_chicken_curry_id, dish_chicken_burrito_id);
DELETE FROM public.dishes WHERE id IN (dish_chicken_pad_thai_id, dish_margherita_pizza_id, dish_salmon_bowl_id, dish_chicken_curry_id, dish_chicken_burrito_id);
DELETE FROM public.places WHERE id IN (place_home_id, place_restaurant_id);

-- Insert sample places
INSERT INTO public.places (id, user_id, name, type, lat, lon, radius_m, is_default)
VALUES
    (place_home_id, user_uuid, 'Home', 'home', 52.3702, 4.8952, 150, TRUE),
    (place_restaurant_id, user_uuid, 'Tony''s Pizzeria', 'restaurant', 52.3702, 4.8952, 500, FALSE);

-- Insert sample dishes with effort and meal_type at dish level
INSERT INTO public.dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type)
VALUES
    (dish_chicken_pad_thai_id, user_uuid, 'Chicken Pad Thai', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400', 75, 'medium', 'dinner'),
    (dish_margherita_pizza_id, user_uuid, 'Margherita Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 60, 'hard', 'dinner'),
    (dish_salmon_bowl_id, user_uuid, 'Salmon Bowl', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 90, 'easy', 'lunch'),
    (dish_chicken_curry_id, user_uuid, 'Chicken Curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 80, 'medium', 'dinner'),
    (dish_chicken_burrito_id, user_uuid, 'Chicken Burrito', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', 75, 'medium', 'dinner');

-- Insert sample dinner instances (NO effort or meal_type here)
INSERT INTO public.dinner_instances (id, dish_id, user_id, datetime, place_id, notes, photo_url) VALUES
-- Chicken Pad Thai instances (3 variants)
('660e8400-e29b-41d4-a716-446655440001', dish_chicken_pad_thai_id, user_uuid, '2024-01-15 19:30:00+00', place_home_id, 'Home | Spicy version with extra peanuts', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),
('660e8400-e29b-41d4-a716-446655440002', dish_chicken_pad_thai_id, user_uuid, '2024-01-10 12:00:00+00', place_home_id, 'Home | Mild version for lunch', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),
('660e8400-e29b-41d4-a716-446655440003', dish_chicken_pad_thai_id, user_uuid, '2024-01-05 20:00:00+00', place_home_id, 'Home | Original recipe', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),

-- Margherita Pizza instances (2 variants)
('660e8400-e29b-41d4-a716-446655440004', dish_margherita_pizza_id, user_uuid, '2024-01-14 18:00:00+00', place_home_id, 'Home | Homemade version', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'),
('660e8400-e29b-41d4-a716-446655440005', dish_margherita_pizza_id, user_uuid, '2024-01-08 19:00:00+00', place_restaurant_id, 'Tony''s Pizzeria | From the restaurant', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'),

-- Salmon Bowl instances (1 variant)
('660e8400-e29b-41d4-a716-446655440006', dish_salmon_bowl_id, user_uuid, '2024-01-12 12:30:00+00', place_home_id, 'Home | With quinoa and avocado', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),

-- Chicken Curry instances (4 variants - most frequent)
('660e8400-e29b-41d4-a716-446655440007', dish_chicken_curry_id, user_uuid, '2024-01-16 19:00:00+00', place_home_id, 'Home | Coconut curry version', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440008', dish_chicken_curry_id, user_uuid, '2024-01-13 18:30:00+00', place_home_id, 'Home | Spicy madras curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440009', dish_chicken_curry_id, user_uuid, '2024-01-09 19:15:00+00', place_home_id, 'Home | Mild curry with rice', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440010', dish_chicken_curry_id, user_uuid, '2024-01-03 20:00:00+00', place_home_id, 'Home | Traditional curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),

-- Chicken Burrito instances (3 variants) - THIS IS THE KEY FIX
('660e8400-e29b-41d4-a716-446655440011', dish_chicken_burrito_id, user_uuid, '2024-01-20 12:00:00+00', place_home_id, 'Home | Homemade burrito with beans', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'),
('660e8400-e29b-41d4-a716-446655440012', dish_chicken_burrito_id, user_uuid, '2024-01-18 19:30:00+00', place_restaurant_id, 'Mexican Restaurant | Spicy chicken burrito', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'),
('660e8400-e29b-41d4-a716-446655440013', dish_chicken_burrito_id, user_uuid, '2024-01-15 13:00:00+00', place_home_id, 'Home | Quick lunch burrito', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400');

-- Insert base tags for dishes
INSERT INTO public.tags (dish_id, name, type, source, is_base_tag, approved) VALUES
-- Chicken Pad Thai base tags
(dish_chicken_pad_thai_id, 'chicken', 'ingredient', 'user', true, true),
(dish_chicken_pad_thai_id, 'noodles', 'ingredient', 'user', true, true),
(dish_chicken_pad_thai_id, 'thai', 'cuisine', 'user', true, true),

-- Margherita Pizza base tags
(dish_margherita_pizza_id, 'pizza', 'dish', 'user', true, true),
(dish_margherita_pizza_id, 'italian', 'cuisine', 'user', true, true),
(dish_margherita_pizza_id, 'vegetarian', 'diet', 'user', true, true),

-- Salmon Bowl base tags
(dish_salmon_bowl_id, 'salmon', 'ingredient', 'user', true, true),
(dish_salmon_bowl_id, 'healthy', 'diet', 'user', true, true),
(dish_salmon_bowl_id, 'fish', 'ingredient', 'user', true, true),

-- Chicken Curry base tags
(dish_chicken_curry_id, 'chicken', 'ingredient', 'user', true, true),
(dish_chicken_curry_id, 'curry', 'dish', 'user', true, true),
(dish_chicken_curry_id, 'indian', 'cuisine', 'user', true, true),

-- Chicken Burrito base tags
(dish_chicken_burrito_id, 'chicken', 'ingredient', 'user', true, true),
(dish_chicken_burrito_id, 'burrito', 'dish', 'user', true, true),
(dish_chicken_burrito_id, 'mexican', 'cuisine', 'user', true, true);

-- Insert some instance-specific tags
INSERT INTO public.tags (instance_id, name, type, source, is_base_tag, approved) VALUES
-- Pad Thai spicy variant tags
('660e8400-e29b-41d4-a716-446655440001', 'spicy', 'custom', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440001', 'peanuts', 'ingredient', 'user', false, true),

-- Pizza homemade variant tags
('660e8400-e29b-41d4-a716-446655440004', 'homemade', 'method', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440004', 'sourdough', 'ingredient', 'user', false, true),

-- Burrito spicy variant tags
('660e8400-e29b-41d4-a716-446655440012', 'spicy', 'custom', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440012', 'jalapeños', 'ingredient', 'user', false, true);

END $$;


