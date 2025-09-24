-- Comprehensive Mock Data for Dinner Lens AI
-- This script clears all existing data and creates realistic test scenarios

-- Clear all existing data (in correct order due to foreign key constraints)
DELETE FROM consumption_records;
DELETE FROM photos;
DELETE FROM tags;
DELETE FROM dinner_instances;
DELETE FROM dishes;

-- Insert comprehensive mock data
-- User ID: cf64a8ab-2eec-474d-bc8b-c881225fa9ca

-- 1. DISH WITHOUT VARIANTS - Multiple instances of the same dish
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Grilled Chicken Breast', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 85, 'easy', 'dinner', 'Simple grilled chicken with herbs and spices', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- Multiple instances of the same dish (no variants)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '5 days', 'home kitchen', NULL, 'Perfectly grilled with rosemary', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '3 days', 'home kitchen', NULL, 'Added lemon and garlic', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NULL, 'Tried new marinade', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Consumption records for the instances
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '5 days', 'home kitchen', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '3 days', 'home kitchen', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Base tags for grilled chicken
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'chicken', 'ingredient', 'user', true, true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440001', 'grilled', 'method', 'user', true, true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440001', 'protein', 'diet', 'user', true, true, NOW() - INTERVAL '30 days');

-- 2. DISH WITH MULTIPLE VARIANTS - Pizza with different toppings
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Pizza', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 60, 'medium', 'dinner', 'Homemade pizza with various toppings', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days');

-- Variant 1: Margherita Pizza (multiple instances)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '7 days', 'home kitchen', 'margherita', 'Classic margherita with fresh basil', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 3, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '4 days', 'home kitchen', 'margherita', 'Added extra mozzarella', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '2 days', 'home kitchen', 'margherita', 'Perfect crust this time', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Variant 2: Pepperoni Pizza (single instance)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '6 days', 'home kitchen', 'pepperoni', 'Spicy pepperoni with extra cheese', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', 1, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- Variant 3: Veggie Pizza (multiple instances with different consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '8 days', 'home kitchen', 'veggie', 'Loaded with bell peppers, mushrooms, and onions', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day');

-- Consumption records for pizza variants
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
-- Margherita instances
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '7 days', 'home kitchen', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '5 days', 'home kitchen', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440015', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '4 days', 'home kitchen', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440016', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
-- Pepperoni instance
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440017', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '6 days', 'home kitchen', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- Veggie instances (multiple consumption records for same instance)
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440018', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '8 days', 'home kitchen', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440018', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Base tags for pizza
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440002', 'pizza', 'dish', 'user', true, true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440002', 'italian', 'cuisine', 'user', true, true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440002', 'cheese', 'ingredient', 'user', true, true, NOW() - INTERVAL '25 days');

-- Variant-specific tags
INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440014', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440014', 'basil', 'ingredient', 'user', false, true, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440017', 'pepperoni', 'ingredient', 'user', false, true, NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440017', 'spicy', 'custom', 'user', false, true, NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440018', 'vegetables', 'ingredient', 'user', false, true, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440018', 'healthy', 'diet', 'user', false, true, NOW() - INTERVAL '8 days');

-- 3. EDGE CASE: Dish with only one instance (no variants, no additional consumption records)
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Caesar Salad', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 75, 'easy', 'lunch', 'Fresh romaine lettuce with caesar dressing', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440003', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '15 days', 'office cafeteria', NULL, 'Light lunch option', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 1, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440019', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '15 days', 'office cafeteria', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440003', 'salad', 'dish', 'user', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440003', 'lettuce', 'ingredient', 'user', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440003', 'healthy', 'diet', 'user', true, true, NOW() - INTERVAL '20 days');

-- 4. EDGE CASE: Dish with multiple variants, some with many consumption records
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Pasta', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 70, 'medium', 'dinner', 'Various pasta dishes with different sauces', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days');

-- Variant 1: Spaghetti Carbonara (many consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '12 days', 'home kitchen', 'carbonara', 'Rich and creamy carbonara', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day');

-- Variant 2: Penne Arrabbiata (few consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '10 days', 'home kitchen', 'arrabbiata', 'Spicy tomato sauce', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- Variant 3: Fettuccine Alfredo (no consumption records yet - just created)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440004', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '2 days', 'home kitchen', 'alfredo', 'Creamy alfredo sauce', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Consumption records for pasta variants
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
-- Carbonara (many records)
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440020', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '12 days', 'home kitchen', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440020', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '8 days', 'home kitchen', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440020', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '4 days', 'home kitchen', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440020', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
-- Arrabbiata (few records)
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440021', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '10 days', 'home kitchen', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
-- Alfredo (one record)
('550e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440022', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Base tags for pasta
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440004', 'pasta', 'dish', 'user', true, true, NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440004', 'italian', 'cuisine', 'user', true, true, NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440004', 'comfort food', 'custom', 'user', true, true, NOW() - INTERVAL '18 days');

-- Variant-specific tags
INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440020', 'bacon', 'ingredient', 'user', false, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440020', 'eggs', 'ingredient', 'user', false, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440020', 'creamy', 'custom', 'user', false, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440021', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440021', 'spicy', 'custom', 'user', false, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440022', 'cream', 'ingredient', 'user', false, true, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440022', 'parmesan', 'ingredient', 'user', false, true, NOW() - INTERVAL '2 days');

-- 5. EDGE CASE: Breakfast dish with different meal types
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Avocado Toast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 80, 'easy', 'breakfast', 'Simple and healthy breakfast option', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440005', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '3 days', 'home kitchen', 'basic', 'Simple avocado on toast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440005', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', 'loaded', 'With tomatoes, salt, and pepper', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440023', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '3 days', 'home kitchen', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440023', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440024', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440056', '550e8400-e29b-41d4-a716-446655440005', 'avocado', 'ingredient', 'user', true, true, NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440057', '550e8400-e29b-41d4-a716-446655440005', 'bread', 'ingredient', 'user', true, true, NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440058', '550e8400-e29b-41d4-a716-446655440005', 'healthy', 'diet', 'user', true, true, NOW() - INTERVAL '14 days');

INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440059', '550e8400-e29b-41d4-a716-446655440024', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440024', 'seasoned', 'custom', 'user', false, true, NOW() - INTERVAL '1 day');

-- 6. EDGE CASE: Dish with no photo
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440006', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', 'Instant Ramen', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 40, 'easy', 'lunch', 'Quick and easy lunch option', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440006', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '5 days', 'office', 'chicken flavor', 'Emergency lunch at work', NULL, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440025', 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca', NOW() - INTERVAL '5 days', 'office', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440006', 'ramen', 'dish', 'user', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440006', 'quick', 'custom', 'user', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440006', 'japanese', 'cuisine', 'user', true, true, NOW() - INTERVAL '10 days');

INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440025', 'chicken', 'ingredient', 'user', false, true, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440025', 'processed', 'custom', 'user', false, true, NOW() - INTERVAL '5 days');

-- Summary of created data:
-- 1. Grilled Chicken Breast: 1 dish, 3 instances (no variants), 3 consumption records
-- 2. Pizza: 1 dish, 4 instances (3 variants: margherita, pepperoni, veggie), 8 consumption records
-- 3. Caesar Salad: 1 dish, 1 instance (no variants), 1 consumption record
-- 4. Pasta: 1 dish, 3 instances (3 variants: carbonara, arrabbiata, alfredo), 6 consumption records
-- 5. Avocado Toast: 1 dish, 2 instances (2 variants: basic, loaded), 3 consumption records
-- 6. Instant Ramen: 1 dish, 1 instance (1 variant: chicken flavor), 1 consumption record

-- Total: 6 dishes, 14 instances, 22 consumption records, 35 tags
