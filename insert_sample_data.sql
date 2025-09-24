-- Sample data for testing the new dishes/instances schema
-- Run this in Supabase SQL Editor to add test data

-- Note: Replace 'your-user-id' with your actual user ID from auth.users
-- You can find it by running: SELECT id FROM auth.users LIMIT 1;

-- Sample dishes
INSERT INTO public.dishes (id, user_id, title, base_photo_url, health_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Chicken Pad Thai', 'https://example.com/pad-thai.jpg', 75),
('550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Margherita Pizza', 'https://example.com/pizza.jpg', 60),
('550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Salmon Bowl', 'https://example.com/salmon.jpg', 90);

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
('550e8400-e29b-41d4-a716-446655440003', 'fish', 'ingredient', 'user', true, true);

-- Sample dinner instances (variants)
INSERT INTO public.dinner_instances (id, dish_id, user_id, datetime, notes, effort, meal_type, photo_url) VALUES
-- Chicken Pad Thai instances
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-15 19:30:00+00', 'Spicy version with extra peanuts', 'medium', 'dinner', 'https://example.com/pad-thai-spicy.jpg'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-10 12:00:00+00', 'Mild version for lunch', 'easy', 'lunch', 'https://example.com/pad-thai-mild.jpg'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-05 20:00:00+00', 'Original recipe', 'medium', 'dinner', 'https://example.com/pad-thai-original.jpg'),

-- Margherita Pizza instances
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-14 18:00:00+00', 'Homemade version', 'hard', 'dinner', 'https://example.com/pizza-homemade.jpg'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-08 19:00:00+00', 'From Tony\'s Pizzeria', 'easy', 'dinner', 'https://example.com/pizza-restaurant.jpg'),

-- Salmon Bowl instances
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', '2024-01-12 12:30:00+00', 'With quinoa and avocado', 'easy', 'lunch', 'https://example.com/salmon-quinoa.jpg');

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
('660e8400-e29b-41d4-a716-446655440006', 'avocado', 'ingredient', 'user', false, true);

-- Note: Remember to replace 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca' with your actual user ID!

