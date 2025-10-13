-- Test Data Generator for Dinner Lens AI
-- Run this in Supabase SQL Editor
-- Generates 80 dishes with variants, consumption records, and tags for user cf64a8ab-2eec-474d-bc8b-c881225fa9ca

-- Set the user ID
\set user_id 'cf64a8ab-2eec-474d-bc8b-c881225fa9ca'

-- Sample data arrays (using CTEs for better organization)
WITH dish_data AS (
  SELECT * FROM (VALUES
    ('Margherita Pizza', 'dinner', 'medium', 4),
    ('Chicken Pad Thai', 'dinner', 'medium', 3),
    ('Salmon Teriyaki', 'dinner', 'easy', 5),
    ('Beef Tacos', 'dinner', 'easy', 3),
    ('Caesar Salad', 'lunch', 'easy', 4),
    ('Pasta Carbonara', 'dinner', 'medium', 4),
    ('Fish and Chips', 'dinner', 'medium', 3),
    ('Chicken Curry', 'dinner', 'hard', 4),
    ('Vegetable Stir Fry', 'dinner', 'easy', 5),
    ('Beef Burger', 'dinner', 'easy', 3),
    ('Sushi Roll', 'dinner', 'hard', 4),
    ('Greek Salad', 'lunch', 'easy', 5),
    ('Chicken Wings', 'dinner', 'medium', 3),
    ('Lamb Kebabs', 'dinner', 'medium', 4),
    ('Vegetable Soup', 'lunch', 'easy', 5),
    ('Pork Chops', 'dinner', 'medium', 3),
    ('Shrimp Scampi', 'dinner', 'medium', 4),
    ('Turkey Sandwich', 'lunch', 'easy', 3),
    ('Egg Fried Rice', 'lunch', 'easy', 3),
    ('Lobster Roll', 'dinner', 'hard', 4),
    ('Quinoa Bowl', 'lunch', 'easy', 5),
    ('Chicken Parmesan', 'dinner', 'medium', 4),
    ('Beef Steak', 'dinner', 'medium', 3),
    ('Vegetable Lasagna', 'dinner', 'hard', 4),
    ('Fish Tacos', 'dinner', 'easy', 4),
    ('Chicken Noodle Soup', 'lunch', 'easy', 4),
    ('Pork Belly', 'dinner', 'hard', 3),
    ('Shrimp Fried Rice', 'dinner', 'medium', 3),
    ('Turkey Burger', 'dinner', 'easy', 3),
    ('Egg Salad', 'lunch', 'easy', 4),
    ('Lobster Bisque', 'dinner', 'hard', 4),
    ('Quinoa Salad', 'lunch', 'easy', 5),
    ('Chicken Tenders', 'dinner', 'easy', 3),
    ('Beef Brisket', 'dinner', 'hard', 4),
    ('Vegetable Curry', 'dinner', 'medium', 4),
    ('Fish Sandwich', 'lunch', 'easy', 3),
    ('Chicken Salad', 'lunch', 'easy', 4),
    ('Pork Tenderloin', 'dinner', 'medium', 4),
    ('Shrimp Cocktail', 'dinner', 'easy', 4),
    ('Turkey Wrap', 'lunch', 'easy', 3),
    ('Egg Benedict', 'breakfast', 'medium', 4),
    ('Lobster Mac', 'dinner', 'hard', 3),
    ('Quinoa Stir Fry', 'dinner', 'easy', 4),
    ('Chicken Fajitas', 'dinner', 'medium', 3),
    ('Beef Ribs', 'dinner', 'hard', 3),
    ('Vegetable Pasta', 'dinner', 'easy', 4),
    ('Fish Cakes', 'dinner', 'medium', 3),
    ('Chicken Quesadilla', 'dinner', 'easy', 3),
    ('Pork Shoulder', 'dinner', 'hard', 3),
    ('Shrimp Tempura', 'dinner', 'hard', 4),
    ('Turkey Meatballs', 'dinner', 'medium', 3),
    ('Egg Drop Soup', 'lunch', 'easy', 3),
    ('Lobster Roll', 'dinner', 'hard', 4),
    ('Quinoa Burger', 'dinner', 'easy', 4),
    ('Chicken Marsala', 'dinner', 'medium', 4),
    ('Beef Wellington', 'dinner', 'hard', 4),
    ('Vegetable Risotto', 'dinner', 'hard', 4),
    ('Fish Pie', 'dinner', 'medium', 3),
    ('Chicken Tikka', 'dinner', 'medium', 4),
    ('Pork Ribs', 'dinner', 'hard', 3),
    ('Shrimp Pad Thai', 'dinner', 'medium', 3),
    ('Turkey Chili', 'dinner', 'medium', 3),
    ('Egg Curry', 'dinner', 'medium', 3),
    ('Lobster Thermidor', 'dinner', 'hard', 4),
    ('Quinoa Pilaf', 'dinner', 'easy', 4),
    ('Chicken Cacciatore', 'dinner', 'medium', 4),
    ('Beef Stroganoff', 'dinner', 'medium', 3),
    ('Vegetable Tagine', 'dinner', 'medium', 4),
    ('Fish Curry', 'dinner', 'medium', 3),
    ('Chicken Kiev', 'dinner', 'hard', 3),
    ('Pork Loin', 'dinner', 'medium', 4),
    ('Shrimp Gumbo', 'dinner', 'hard', 3),
    ('Turkey Pot Pie', 'dinner', 'medium', 3),
    ('Egg Foo Young', 'dinner', 'medium', 3),
    ('Lobster Newburg', 'dinner', 'hard', 4),
    ('Quinoa Casserole', 'dinner', 'easy', 4),
    ('Chicken Piccata', 'dinner', 'medium', 4),
    ('Beef Bourguignon', 'dinner', 'hard', 4),
    ('Vegetable Ratatouille', 'dinner', 'medium', 4)
  ) AS t(title, meal_type, effort, health_score)
),
tag_data AS (
  SELECT * FROM (VALUES
    ('italian'), ('chinese'), ('japanese'), ('mexican'), ('indian'), ('thai'), ('french'), ('spanish'),
    ('greek'), ('korean'), ('vietnamese'), ('lebanese'), ('turkish'), ('moroccan'), ('ethiopian'),
    ('brazilian'), ('peruvian'), ('argentinian'), ('caribbean'), ('american'), ('british'), ('german'),
    ('russian'), ('polish'), ('hungarian'), ('vegetarian'), ('vegan'), ('gluten-free'), ('dairy-free'),
    ('spicy'), ('mild'), ('sweet'), ('savory'), ('healthy'), ('comfort'), ('quick'), ('slow-cooked'),
    ('grilled'), ('fried'), ('baked'), ('steamed'), ('roasted'), ('braised'), ('sautéed'), ('raw')
  ) AS t(name)
),
variant_data AS (
  SELECT * FROM (VALUES
    ('Classic'), ('Spicy'), ('Mild'), ('Extra Cheese'), ('No Onions'), ('Gluten-Free'), ('Vegan'),
    ('With Bacon'), ('Extra Spicy'), ('Light'), ('Heavy'), ('Family Size'), ('Individual'),
    ('With Side Salad'), ('No Sauce'), ('Extra Sauce'), ('With Rice'), ('With Noodles'),
    ('With Vegetables'), ('With Meat'), ('Without Meat'), ('With Extra Protein')
  ) AS t(title)
),
location_data AS (
  SELECT * FROM (VALUES
    ('Home'), ('Restaurant'), ('Friend''s House'), ('Work'), ('Park'), ('Beach'), ('Mountain'), ('City'),
    (NULL), (''), ('At Home'), ('Kitchen'), ('Dining Room'), ('Backyard'), ('Patio'), ('Balcony')
  ) AS t(name)
)

-- Insert dishes
INSERT INTO dishes (title, health_score, base_photo_url, effort, meal_type, notes, user_id, created_at, updated_at)
SELECT 
  dd.title,
  dd.health_score,
  'https://picsum.photos/400/300?random=' || (row_number() OVER ()) as base_photo_url,
  dd.effort,
  dd.meal_type,
  'Test dish ' || (row_number() OVER ()) || ' - ' || dd.title as notes,
  :'user_id'::uuid as user_id,
  (now() - (random() * interval '3 years')) as created_at,
  (now() - (random() * interval '3 years')) as updated_at
FROM dish_data dd;

-- Get the dish IDs we just created
WITH inserted_dishes AS (
  SELECT id, title, created_at, row_number() OVER (ORDER BY created_at) as rn
  FROM dishes 
  WHERE user_id = :'user_id'::uuid 
  ORDER BY created_at DESC 
  LIMIT 80
)

-- Insert dinner instances (variants)
INSERT INTO dinner_instances (dish_id, datetime, location, variant_title, notes, photo_url, place_id, count, user_id, created_at, updated_at)
SELECT 
  id.id as dish_id,
  (id.created_at + (random() * interval '30 days')) as datetime,
  ld.name as location,
  vd.title as variant_title,
  'Variant of ' || id.title as notes,
  'https://picsum.photos/400/300?random=' || id.rn || '-' || (row_number() OVER (PARTITION BY id.id)) as photo_url,
  NULL as place_id,
  (floor(random() * 3) + 1) as count,
  :'user_id'::uuid as user_id,
  (id.created_at + (random() * interval '30 days')) as created_at,
  (id.created_at + (random() * interval '30 days')) as updated_at
FROM inserted_dishes id
CROSS JOIN variant_data vd
CROSS JOIN location_data ld
WHERE (floor(random() * 4) + 1) = 1  -- Random 1-4 variants per dish
LIMIT 200;  -- Cap at 200 instances total

-- Get the instance IDs we just created
WITH inserted_instances AS (
  SELECT di.id, di.dish_id, di.datetime, di.created_at, row_number() OVER (ORDER BY di.created_at) as rn
  FROM dinner_instances di
  JOIN dishes d ON d.id = di.dish_id
  WHERE d.user_id = :'user_id'::uuid 
  ORDER BY di.created_at DESC 
  LIMIT 200
)

-- Insert consumption records
INSERT INTO consumption_records (instance_id, consumed_at, location, user_id, created_at)
SELECT 
  ii.id as instance_id,
  (ii.datetime + (random() * interval '1 year')) as consumed_at,
  ld.name as location,
  :'user_id'::uuid as user_id,
  (ii.datetime + (random() * interval '1 year')) as created_at
FROM inserted_instances ii
CROSS JOIN location_data ld
WHERE (floor(random() * 3) + 1) = 1  -- Random 1-3 consumption records per instance
LIMIT 400;  -- Cap at 400 consumption records total

-- Insert dish-level tags (base tags)
WITH inserted_dishes AS (
  SELECT id, title, created_at, row_number() OVER (ORDER BY created_at) as rn
  FROM dishes 
  WHERE user_id = :'user_id'::uuid 
  ORDER BY created_at DESC 
  LIMIT 80
)
INSERT INTO tags (dish_id, name, type, is_base_tag, approved, user_id, created_at)
SELECT 
  id.id as dish_id,
  td.name,
  'custom' as type,
  true as is_base_tag,
  true as approved,
  :'user_id'::uuid as user_id,
  id.created_at
FROM inserted_dishes id
CROSS JOIN tag_data td
WHERE (floor(random() * 4) + 2) = 1  -- Random 2-5 tags per dish
LIMIT 300;  -- Cap at 300 dish tags total

-- Insert instance-level tags (variant tags)
WITH inserted_instances AS (
  SELECT di.id, di.dish_id, di.datetime, di.created_at, row_number() OVER (ORDER BY di.created_at) as rn
  FROM dinner_instances di
  JOIN dishes d ON d.id = di.dish_id
  WHERE d.user_id = :'user_id'::uuid 
  ORDER BY di.created_at DESC 
  LIMIT 200
)
INSERT INTO tags (instance_id, name, type, is_base_tag, approved, user_id, created_at)
SELECT 
  ii.id as instance_id,
  td.name,
  'custom' as type,
  false as is_base_tag,
  true as approved,
  :'user_id'::uuid as user_id,
  ii.created_at
FROM inserted_instances ii
CROSS JOIN tag_data td
WHERE (floor(random() * 3) + 1) = 1  -- Random 1-3 tags per instance
LIMIT 400;  -- Cap at 400 instance tags total

-- Summary
SELECT 
  'Test data generation completed!' as status,
  (SELECT COUNT(*) FROM dishes WHERE user_id = :'user_id'::uuid) as dishes_created,
  (SELECT COUNT(*) FROM dinner_instances di JOIN dishes d ON d.id = di.dish_id WHERE d.user_id = :'user_id'::uuid) as instances_created,
  (SELECT COUNT(*) FROM consumption_records WHERE user_id = :'user_id'::uuid) as consumption_records_created,
  (SELECT COUNT(*) FROM tags WHERE user_id = :'user_id'::uuid) as tags_created;
