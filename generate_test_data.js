// Test data generator for Dinner Lens AI
// Run with: node generate_test_data.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Sample data arrays
const dishNames = [
  'Margherita Pizza', 'Chicken Pad Thai', 'Salmon Teriyaki', 'Beef Tacos', 'Caesar Salad',
  'Pasta Carbonara', 'Fish and Chips', 'Chicken Curry', 'Vegetable Stir Fry', 'Beef Burger',
  'Sushi Roll', 'Greek Salad', 'Chicken Wings', 'Lamb Kebabs', 'Vegetable Soup',
  'Pork Chops', 'Shrimp Scampi', 'Turkey Sandwich', 'Egg Fried Rice', 'Lobster Roll',
  'Quinoa Bowl', 'Chicken Parmesan', 'Beef Steak', 'Vegetable Lasagna', 'Fish Tacos',
  'Chicken Noodle Soup', 'Pork Belly', 'Shrimp Fried Rice', 'Turkey Burger', 'Egg Salad',
  'Lobster Bisque', 'Quinoa Salad', 'Chicken Tenders', 'Beef Brisket', 'Vegetable Curry',
  'Fish Sandwich', 'Chicken Salad', 'Pork Tenderloin', 'Shrimp Cocktail', 'Turkey Wrap',
  'Egg Benedict', 'Lobster Mac', 'Quinoa Stir Fry', 'Chicken Fajitas', 'Beef Ribs',
  'Vegetable Pasta', 'Fish Cakes', 'Chicken Quesadilla', 'Pork Shoulder', 'Shrimp Tempura',
  'Turkey Meatballs', 'Egg Drop Soup', 'Lobster Roll', 'Quinoa Burger', 'Chicken Marsala',
  'Beef Wellington', 'Vegetable Risotto', 'Fish Pie', 'Chicken Tikka', 'Pork Ribs',
  'Shrimp Pad Thai', 'Turkey Chili', 'Egg Curry', 'Lobster Thermidor', 'Quinoa Pilaf',
  'Chicken Cacciatore', 'Beef Stroganoff', 'Vegetable Tagine', 'Fish Curry', 'Chicken Kiev',
  'Pork Loin', 'Shrimp Gumbo', 'Turkey Pot Pie', 'Egg Foo Young', 'Lobster Newburg',
  'Quinoa Casserole', 'Chicken Piccata', 'Beef Bourguignon', 'Vegetable Ratatouille'
];

const mealTypes = ['breakfast', 'lunch', 'dinner'];
const effortLevels = ['easy', 'medium', 'hard'];
const locations = [
  'Home', 'Restaurant', 'Friend\'s House', 'Work', 'Park', 'Beach', 'Mountain', 'City',
  null, '', 'At Home', 'Kitchen', 'Dining Room', 'Backyard', 'Patio', 'Balcony'
];

const tags = [
  'italian', 'chinese', 'japanese', 'mexican', 'indian', 'thai', 'french', 'spanish',
  'greek', 'korean', 'vietnamese', 'lebanese', 'turkish', 'moroccan', 'ethiopian',
  'brazilian', 'peruvian', 'argentinian', 'caribbean', 'american', 'british', 'german',
  'russian', 'polish', 'hungarian', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'spicy', 'mild', 'sweet', 'savory', 'healthy', 'comfort', 'quick', 'slow-cooked',
  'grilled', 'fried', 'baked', 'steamed', 'roasted', 'braised', 'sautéed', 'raw'
];

const variantTitles = [
  'Classic', 'Spicy', 'Mild', 'Extra Cheese', 'No Onions', 'Gluten-Free', 'Vegan',
  'With Bacon', 'Extra Spicy', 'Light', 'Heavy', 'Family Size', 'Individual',
  'With Side Salad', 'No Sauce', 'Extra Sauce', 'With Rice', 'With Noodles',
  'With Vegetables', 'With Meat', 'Without Meat', 'With Extra Protein'
];

// Generate random date within last 3 years
function getRandomDate() {
  const now = new Date();
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
  const randomTime = threeYearsAgo.getTime() + Math.random() * (now.getTime() - threeYearsAgo.getTime());
  return new Date(randomTime);
}

// Generate random consumption dates for a dish
function getConsumptionDates(dishDate, count) {
  const dates = [];
  const dishTime = new Date(dishDate).getTime();
  const now = new Date().getTime();
  
  for (let i = 0; i < count; i++) {
    const randomTime = dishTime + Math.random() * (now - dishTime);
    dates.push(new Date(randomTime));
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

// Generate test data
async function generateTestData() {
  console.log('Starting test data generation...');
  
  // Get current user (you'll need to be logged in)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Please log in first:', userError);
    return;
  }
  
  console.log('Generating data for user:', user.id);
  
  const dishes = [];
  const instances = [];
  const consumptionRecords = [];
  const dishTags = [];
  const instanceTags = [];
  
  for (let i = 0; i < 80; i++) {
    const dishName = dishNames[i];
    const dishDate = getRandomDate();
    const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
    const effort = effortLevels[Math.floor(Math.random() * effortLevels.length)];
    const healthScore = Math.floor(Math.random() * 5) + 1; // 1-5
    
    // Create dish
    const dish = {
      id: `dish-${i}`,
      title: dishName,
      health_score: healthScore,
      base_photo_url: `https://picsum.photos/400/300?random=${i}`, // Small random images
      effort: effort,
      meal_type: mealType,
      notes: `Test dish ${i + 1} - ${dishName}`,
      user_id: user.id,
      created_at: dishDate.toISOString(),
      updated_at: dishDate.toISOString()
    };
    dishes.push(dish);
    
    // Generate 1-4 variants per dish
    const variantCount = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < variantCount; j++) {
      const variantDate = new Date(dishDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Within 30 days
      const variantTitle = variantTitles[Math.floor(Math.random() * variantTitles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      const instance = {
        id: `instance-${i}-${j}`,
        dish_id: dish.id,
        datetime: variantDate.toISOString(),
        location: location,
        variant_title: variantTitle,
        notes: `Variant ${j + 1} of ${dishName}`,
        photo_url: `https://picsum.photos/400/300?random=${i}-${j}`,
        place_id: null,
        count: Math.floor(Math.random() * 3) + 1,
        user_id: user.id,
        created_at: variantDate.toISOString(),
        updated_at: variantDate.toISOString()
      };
      instances.push(instance);
      
      // Generate 1-3 consumption records per instance
      const consumptionCount = Math.floor(Math.random() * 3) + 1;
      const consumptionDates = getConsumptionDates(variantDate, consumptionCount);
      
      for (let k = 0; k < consumptionCount; k++) {
        const consumptionDate = consumptionDates[k];
        const consumptionLocation = locations[Math.floor(Math.random() * locations.length)];
        
        const consumptionRecord = {
          id: `consumption-${i}-${j}-${k}`,
          instance_id: instance.id,
          consumed_at: consumptionDate.toISOString(),
          location: consumptionLocation,
          user_id: user.id,
          created_at: consumptionDate.toISOString()
        };
        consumptionRecords.push(consumptionRecord);
      }
    }
    
    // Add 2-5 base tags per dish
    const baseTagCount = Math.floor(Math.random() * 4) + 2;
    const selectedTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, baseTagCount);
    
    for (const tagName of selectedTags) {
      dishTags.push({
        id: `dish-tag-${i}-${tagName}`,
        dish_id: dish.id,
        name: tagName,
        type: 'custom',
        is_base_tag: true,
        approved: true,
        user_id: user.id,
        created_at: dishDate.toISOString()
      });
    }
    
    // Add 1-3 instance tags per instance
    for (let j = 0; j < variantCount; j++) {
      const instanceTagCount = Math.floor(Math.random() * 3) + 1;
      const selectedInstanceTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, instanceTagCount);
      
      for (const tagName of selectedInstanceTags) {
        instanceTags.push({
          id: `instance-tag-${i}-${j}-${tagName}`,
          instance_id: `instance-${i}-${j}`,
          name: tagName,
          type: 'custom',
          is_base_tag: false,
          approved: true,
          user_id: user.id,
          created_at: instances.find(inst => inst.id === `instance-${i}-${j}`).created_at
        });
      }
    }
  }
  
  console.log(`Generated ${dishes.length} dishes, ${instances.length} instances, ${consumptionRecords.length} consumption records`);
  console.log(`Generated ${dishTags.length} dish tags, ${instanceTags.length} instance tags`);
  
  // Insert data in batches
  try {
    console.log('Inserting dishes...');
    const { error: dishesError } = await supabase
      .from('dishes')
      .insert(dishes);
    
    if (dishesError) throw dishesError;
    
    console.log('Inserting instances...');
    const { error: instancesError } = await supabase
      .from('dinner_instances')
      .insert(instances);
    
    if (instancesError) throw instancesError;
    
    console.log('Inserting consumption records...');
    const { error: consumptionError } = await supabase
      .from('consumption_records')
      .insert(consumptionRecords);
    
    if (consumptionError) throw consumptionError;
    
    console.log('Inserting dish tags...');
    const { error: dishTagsError } = await supabase
      .from('tags')
      .insert(dishTags);
    
    if (dishTagsError) throw dishTagsError;
    
    console.log('Inserting instance tags...');
    const { error: instanceTagsError } = await supabase
      .from('tags')
      .insert(instanceTags);
    
    if (instanceTagsError) throw instanceTagsError;
    
    console.log('✅ Test data generation completed successfully!');
    console.log(`Created ${dishes.length} dishes with ${instances.length} variants and ${consumptionRecords.length} consumption records`);
    
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}

// Run the generator
generateTestData().catch(console.error);
