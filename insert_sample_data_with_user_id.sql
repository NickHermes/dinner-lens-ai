-- Sample data for testing the new dishes/instances schema
-- This uses your actual user ID: cf64a8ab-2eec-474d-bc8b-c881225fa9ca

-- Sample dishes
INSERT INTO public.dishes (id, user_id, title, base_photo_url, health_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Chicken Pad Thai', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400', 75),
('550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Margherita Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 60),
('550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Salmon Bowl', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 90),
('550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Chicken Curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 80);

-- Sample base tags for dishes
INSERT INTO public.tags (dish_id, name, type, source, is_base_tag, approved) VALUES
-- Chicken Pad Thai base tags
('550e8400-e29b-41d4-a716-446655440001', 'chicken', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440001', 'thai', 'cuisine', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440001', 'noodles', 'ingredient', 'user', true, true),

-- Margherita Pizza base tags
('550e8400-e29b-41d4-a716-446655440002', 'pizza', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'italian', 'cuisine', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'vegetarian', 'diet', 'user', true, true),

-- Salmon Bowl base tags
('550e8400-e29b-41d4-a716-446655440003', 'salmon', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'healthy', 'diet', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'fish', 'ingredient', 'user', true, true),

-- Chicken Curry base tags
('550e8400-e29b-41d4-a716-446655440004', 'chicken', 'ingredient', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'curry', 'dish', 'user', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'indian', 'cuisine', 'user', true, true);

-- Sample dinner instances (variants)
INSERT INTO public.dinner_instances (id, dish_id, user_id, datetime, notes, effort, meal_type, photo_url) VALUES
-- Chicken Pad Thai instances (3 variants)
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-15 19:30:00+00', 'Spicy version with extra peanuts', 'medium', 'dinner', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-10 12:00:00+00', 'Mild version for lunch', 'easy', 'lunch', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-05 20:00:00+00', 'Original recipe', 'medium', 'dinner', 'https://images.unsplash.com/photo-1559314809-0f31657daf05?w=400'),

-- Margherita Pizza instances (2 variants)
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-14 18:00:00+00', 'Homemade version', 'hard', 'dinner', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-08 19:00:00+00', 'From Tony''s Pizzeria', 'easy', 'dinner', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'),

-- Salmon Bowl instances (1 variant)
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-12 12:30:00+00', 'With quinoa and avocado', 'easy', 'lunch', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),

-- Chicken Curry instances (4 variants - most frequent)
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-16 19:00:00+00', 'Coconut curry version', 'medium', 'dinner', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-13 18:30:00+00', 'Spicy madras curry', 'hard', 'dinner', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-09 19:15:00+00', 'Mild curry with rice', 'easy', 'dinner', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-03 20:00:00+00', 'Traditional curry', 'medium', 'dinner', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400');

-- Sample instance-specific tags
INSERT INTO public.tags (instance_id, name, type, source, is_base_tag, approved) VALUES
-- Pad Thai spicy variant tags
('660e8400-e29b-41d4-a716-446655440001', 'spicy', 'custom', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440001', 'peanuts', 'ingredient', 'user', false, true),

-- Pizza homemade variant tags
('660e8400-e29b-41d4-a716-446655440004', 'homemade', 'method', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440004', 'sourdough', 'ingredient', 'user', false, true),

-- Salmon bowl variant tags
('660e8400-e29b-41d4-a716-446655440006', 'quinoa', 'ingredient', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440006', 'avocado', 'ingredient', 'user', false, true),

-- Curry variant tags
('660e8400-e29b-41d4-a716-446655440007', 'coconut', 'ingredient', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440008', 'madras', 'custom', 'user', false, true),
('660e8400-e29b-41d4-a716-446655440008', 'very-spicy', 'custom', 'user', false, true);

-- Sample default place for testing
INSERT INTO public.places (id, user_id, name, type, lat, lon, radius_m, is_default) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Home', 'home', 52.3676, 4.9041, 150, true);

-- Update some instances to have place_id
UPDATE public.dinner_instances SET place_id = '770e8400-e29b-41d4-a716-446655440001' 
WHERE id IN ('660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440009');
