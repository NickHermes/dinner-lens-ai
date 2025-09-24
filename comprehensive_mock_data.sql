-- Comprehensive Mock Data for Dinner Lens AI
-- This script clears all existing data and creates realistic test scenarios

-- First, get the current user ID (replace with your actual user ID)
-- You can find this by running: SELECT id FROM auth.users LIMIT 1;

-- Clear all existing data (in correct order due to foreign key constraints)
DELETE FROM consumption_records;
DELETE FROM photos;
DELETE FROM tags;
DELETE FROM dinner_instances;
DELETE FROM dishes;

-- Insert comprehensive mock data
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

-- 1. DISH WITHOUT VARIANTS - Multiple instances of the same dish
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-001', 'YOUR_USER_ID_HERE', 'Grilled Chicken Breast', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 85, 'easy', 'dinner', 'Simple grilled chicken with herbs and spices', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- Multiple instances of the same dish (no variants)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-001', 'dish-001', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days', 'home kitchen', NULL, 'Perfectly grilled with rosemary', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('instance-002', 'dish-001', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '3 days', 'home kitchen', NULL, 'Added lemon and garlic', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('instance-003', 'dish-001', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NULL, 'Tried new marinade', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Consumption records for the instances
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('consumption-001', 'instance-001', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days', 'home kitchen', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('consumption-002', 'instance-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '3 days', 'home kitchen', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('consumption-003', 'instance-003', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Base tags for grilled chicken
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-001', 'dish-001', 'chicken', 'ingredient', 'user', true, true, NOW() - INTERVAL '30 days'),
('tag-002', 'dish-001', 'grilled', 'method', 'user', true, true, NOW() - INTERVAL '30 days'),
('tag-003', 'dish-001', 'protein', 'diet', 'user', true, true, NOW() - INTERVAL '30 days');

-- 2. DISH WITH MULTIPLE VARIANTS - Pizza with different toppings
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-002', 'YOUR_USER_ID_HERE', 'Pizza', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 60, 'medium', 'dinner', 'Homemade pizza with various toppings', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days');

-- Variant 1: Margherita Pizza (multiple instances)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-004', 'dish-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '7 days', 'home kitchen', 'margherita', 'Classic margherita with fresh basil', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 3, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
('instance-005', 'dish-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '4 days', 'home kitchen', 'margherita', 'Added extra mozzarella', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('instance-006', 'dish-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '2 days', 'home kitchen', 'margherita', 'Perfect crust this time', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Variant 2: Pepperoni Pizza (single instance)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-007', 'dish-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '6 days', 'home kitchen', 'pepperoni', 'Spicy pepperoni with extra cheese', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 1, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- Variant 3: Veggie Pizza (multiple instances with different consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-008', 'dish-002', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '8 days', 'home kitchen', 'veggie', 'Loaded with bell peppers, mushrooms, and onions', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day');

-- Consumption records for pizza variants
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
-- Margherita instances
('consumption-004', 'instance-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '7 days', 'home kitchen', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('consumption-005', 'instance-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days', 'home kitchen', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('consumption-006', 'instance-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('consumption-007', 'instance-005', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '4 days', 'home kitchen', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('consumption-008', 'instance-006', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
-- Pepperoni instance
('consumption-009', 'instance-007', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '6 days', 'home kitchen', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- Veggie instances (multiple consumption records for same instance)
('consumption-010', 'instance-008', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '8 days', 'home kitchen', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('consumption-011', 'instance-008', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Base tags for pizza
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-004', 'dish-002', 'pizza', 'dish', 'user', true, true, NOW() - INTERVAL '25 days'),
('tag-005', 'dish-002', 'italian', 'cuisine', 'user', true, true, NOW() - INTERVAL '25 days'),
('tag-006', 'dish-002', 'cheese', 'ingredient', 'user', true, true, NOW() - INTERVAL '25 days');

-- Variant-specific tags
INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-007', 'instance-004', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '7 days'),
('tag-008', 'instance-004', 'basil', 'ingredient', 'user', false, true, NOW() - INTERVAL '7 days'),
('tag-009', 'instance-007', 'pepperoni', 'ingredient', 'user', false, true, NOW() - INTERVAL '6 days'),
('tag-010', 'instance-007', 'spicy', 'custom', 'user', false, true, NOW() - INTERVAL '6 days'),
('tag-011', 'instance-008', 'vegetables', 'ingredient', 'user', false, true, NOW() - INTERVAL '8 days'),
('tag-012', 'instance-008', 'healthy', 'diet', 'user', false, true, NOW() - INTERVAL '8 days');

-- 3. EDGE CASE: Dish with only one instance (no variants, no additional consumption records)
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-003', 'YOUR_USER_ID_HERE', 'Caesar Salad', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 75, 'easy', 'lunch', 'Fresh romaine lettuce with caesar dressing', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-009', 'dish-003', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '15 days', 'office cafeteria', NULL, 'Light lunch option', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 1, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('consumption-012', 'instance-009', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '15 days', 'office cafeteria', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-013', 'dish-003', 'salad', 'dish', 'user', true, true, NOW() - INTERVAL '20 days'),
('tag-014', 'dish-003', 'lettuce', 'ingredient', 'user', true, true, NOW() - INTERVAL '20 days'),
('tag-015', 'dish-003', 'healthy', 'diet', 'user', true, true, NOW() - INTERVAL '20 days');

-- 4. EDGE CASE: Dish with multiple variants, some with many consumption records
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-004', 'YOUR_USER_ID_HERE', 'Pasta', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 70, 'medium', 'dinner', 'Various pasta dishes with different sauces', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days');

-- Variant 1: Spaghetti Carbonara (many consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-010', 'dish-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '12 days', 'home kitchen', 'carbonara', 'Rich and creamy carbonara', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day');

-- Variant 2: Penne Arrabbiata (few consumption records)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-011', 'dish-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '10 days', 'home kitchen', 'arrabbiata', 'Spicy tomato sauce', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- Variant 3: Fettuccine Alfredo (no consumption records yet - just created)
INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-012', 'dish-004', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '2 days', 'home kitchen', 'alfredo', 'Creamy alfredo sauce', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Consumption records for pasta variants
INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
-- Carbonara (many records)
('consumption-013', 'instance-010', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '12 days', 'home kitchen', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('consumption-014', 'instance-010', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '8 days', 'home kitchen', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('consumption-015', 'instance-010', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '4 days', 'home kitchen', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('consumption-016', 'instance-010', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
-- Arrabbiata (few records)
('consumption-017', 'instance-011', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '10 days', 'home kitchen', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
-- Alfredo (one record)
('consumption-018', 'instance-012', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '2 days', 'home kitchen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Base tags for pasta
INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-016', 'dish-004', 'pasta', 'dish', 'user', true, true, NOW() - INTERVAL '18 days'),
('tag-017', 'dish-004', 'italian', 'cuisine', 'user', true, true, NOW() - INTERVAL '18 days'),
('tag-018', 'dish-004', 'comfort food', 'custom', 'user', true, true, NOW() - INTERVAL '18 days');

-- Variant-specific tags
INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-019', 'instance-010', 'bacon', 'ingredient', 'user', false, true, NOW() - INTERVAL '12 days'),
('tag-020', 'instance-010', 'eggs', 'ingredient', 'user', false, true, NOW() - INTERVAL '12 days'),
('tag-021', 'instance-010', 'creamy', 'custom', 'user', false, true, NOW() - INTERVAL '12 days'),
('tag-022', 'instance-011', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '10 days'),
('tag-023', 'instance-011', 'spicy', 'custom', 'user', false, true, NOW() - INTERVAL '10 days'),
('tag-024', 'instance-012', 'cream', 'ingredient', 'user', false, true, NOW() - INTERVAL '2 days'),
('tag-025', 'instance-012', 'parmesan', 'ingredient', 'user', false, true, NOW() - INTERVAL '2 days');

-- 5. EDGE CASE: Breakfast dish with different meal types
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-005', 'YOUR_USER_ID_HERE', 'Avocado Toast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 80, 'easy', 'breakfast', 'Simple and healthy breakfast option', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-013', 'dish-005', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '3 days', 'home kitchen', 'basic', 'Simple avocado on toast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('instance-014', 'dish-005', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', 'loaded', 'With tomatoes, salt, and pepper', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('consumption-019', 'instance-013', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '3 days', 'home kitchen', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('consumption-020', 'instance-013', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('consumption-021', 'instance-014', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '1 day', 'home kitchen', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-026', 'dish-005', 'avocado', 'ingredient', 'user', true, true, NOW() - INTERVAL '14 days'),
('tag-027', 'dish-005', 'bread', 'ingredient', 'user', true, true, NOW() - INTERVAL '14 days'),
('tag-028', 'dish-005', 'healthy', 'diet', 'user', true, true, NOW() - INTERVAL '14 days');

INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-029', 'instance-014', 'tomato', 'ingredient', 'user', false, true, NOW() - INTERVAL '1 day'),
('tag-030', 'instance-014', 'seasoned', 'custom', 'user', false, true, NOW() - INTERVAL '1 day');

-- 6. EDGE CASE: Dish with no photo
INSERT INTO dishes (id, user_id, title, base_photo_url, health_score, effort, meal_type, notes, created_at, updated_at) VALUES
('dish-006', 'YOUR_USER_ID_HERE', 'Instant Ramen', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 40, 'easy', 'lunch', 'Quick and easy lunch option', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

INSERT INTO dinner_instances (id, dish_id, user_id, datetime, location, variant_title, notes, photo_url, count, last_consumed, created_at, updated_at) VALUES
('instance-015', 'dish-006', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days', 'office', 'chicken flavor', 'Emergency lunch at work', NULL, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO consumption_records (id, instance_id, user_id, consumed_at, location, created_at, updated_at) VALUES
('consumption-022', 'instance-015', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days', 'office', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO tags (id, dish_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-031', 'dish-006', 'ramen', 'dish', 'user', true, true, NOW() - INTERVAL '10 days'),
('tag-032', 'dish-006', 'quick', 'custom', 'user', true, true, NOW() - INTERVAL '10 days'),
('tag-033', 'dish-006', 'japanese', 'cuisine', 'user', true, true, NOW() - INTERVAL '10 days');

INSERT INTO tags (id, instance_id, name, type, source, is_base_tag, approved, created_at) VALUES
('tag-034', 'instance-015', 'chicken', 'ingredient', 'user', false, true, NOW() - INTERVAL '5 days'),
('tag-035', 'instance-015', 'processed', 'custom', 'user', false, true, NOW() - INTERVAL '5 days');

-- Summary of created data:
-- 1. Grilled Chicken Breast: 1 dish, 3 instances (no variants), 3 consumption records
-- 2. Pizza: 1 dish, 4 instances (3 variants: margherita, pepperoni, veggie), 8 consumption records
-- 3. Caesar Salad: 1 dish, 1 instance (no variants), 1 consumption record
-- 4. Pasta: 1 dish, 3 instances (3 variants: carbonara, arrabbiata, alfredo), 6 consumption records
-- 5. Avocado Toast: 1 dish, 2 instances (2 variants: basic, loaded), 3 consumption records
-- 6. Instant Ramen: 1 dish, 1 instance (1 variant: chicken flavor), 1 consumption record

-- Total: 6 dishes, 14 instances, 22 consumption records, 35 tags



