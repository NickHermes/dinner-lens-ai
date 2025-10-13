import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const TestDataGenerator = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

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
  const getRandomDate = () => {
    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    const randomTime = threeYearsAgo.getTime() + Math.random() * (now.getTime() - threeYearsAgo.getTime());
    return new Date(randomTime);
  };

  // Generate random consumption dates for a dish
  const getConsumptionDates = (dishDate: Date, count: number) => {
    const dates = [];
    const dishTime = dishDate.getTime();
    const now = new Date().getTime();
    
    for (let i = 0; i < count; i++) {
      const randomTime = dishTime + Math.random() * (now - dishTime);
      dates.push(new Date(randomTime));
    }
    
    return dates.sort((a, b) => a.getTime() - b.getTime());
  };

  const generateTestData = async () => {
    if (!user) {
      setStatus('Please log in first');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting test data generation...');

    try {
      const dishes = [];
      const instances = [];
      const consumptionRecords = [];
      const dishTags = [];
      const instanceTags = [];

      // Generate 80 dishes
      for (let i = 0; i < 80; i++) {
        setProgress((i / 80) * 100);
        setStatus(`Generating dish ${i + 1}/80: ${dishNames[i]}`);

        const dishName = dishNames[i];
        const dishDate = getRandomDate();
        const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
        const effort = effortLevels[Math.floor(Math.random() * effortLevels.length)];
        const healthScore = Math.floor(Math.random() * 5) + 1; // 1-5
        
        // Create dish
        const dish = {
          title: dishName,
          health_score: healthScore,
          base_photo_url: `https://picsum.photos/400/300?random=${i}`, // Small random images
          effort: effort,
          meal_type: mealType,
          notes: `Test dish ${i + 1} - ${dishName}`,
          user_id: user.id,
        };
        dishes.push(dish);
        
        // Generate 1-4 variants per dish
        const variantCount = Math.floor(Math.random() * 4) + 1;
        for (let j = 0; j < variantCount; j++) {
          const variantDate = new Date(dishDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Within 30 days
          const variantTitle = variantTitles[Math.floor(Math.random() * variantTitles.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];
          
          const instance = {
            dish_id: `temp-${i}`, // Will be updated after dish is created
            datetime: variantDate.toISOString(),
            location: location,
            variant_title: variantTitle,
            notes: `Variant ${j + 1} of ${dishName}`,
            photo_url: `https://picsum.photos/400/300?random=${i}-${j}`,
            place_id: null,
            count: Math.floor(Math.random() * 3) + 1,
            user_id: user.id,
          };
          instances.push(instance);
          
          // Generate 1-3 consumption records per instance
          const consumptionCount = Math.floor(Math.random() * 3) + 1;
          const consumptionDates = getConsumptionDates(variantDate, consumptionCount);
          
          for (let k = 0; k < consumptionCount; k++) {
            const consumptionDate = consumptionDates[k];
            const consumptionLocation = locations[Math.floor(Math.random() * locations.length)];
            
            const consumptionRecord = {
              instance_id: `temp-${i}-${j}`, // Will be updated after instance is created
              consumed_at: consumptionDate.toISOString(),
              location: consumptionLocation,
              user_id: user.id,
            };
            consumptionRecords.push(consumptionRecord);
          }
        }
        
        // Add 2-5 base tags per dish
        const baseTagCount = Math.floor(Math.random() * 4) + 2;
        const selectedTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, baseTagCount);
        
        for (const tagName of selectedTags) {
          dishTags.push({
            dish_id: `temp-${i}`, // Will be updated after dish is created
            name: tagName,
            type: 'custom',
            is_base_tag: true,
            approved: true,
            user_id: user.id,
          });
        }
        
        // Add 1-3 instance tags per instance
        for (let j = 0; j < variantCount; j++) {
          const instanceTagCount = Math.floor(Math.random() * 3) + 1;
          const selectedInstanceTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, instanceTagCount);
          
          for (const tagName of selectedInstanceTags) {
            instanceTags.push({
              instance_id: `temp-${i}-${j}`, // Will be updated after instance is created
              name: tagName,
              type: 'custom',
              is_base_tag: false,
              approved: true,
              user_id: user.id,
            });
          }
        }
      }

      setStatus('Inserting dishes...');
      
      // Insert dishes one by one to get IDs
      const createdDishes = [];
      for (let i = 0; i < dishes.length; i++) {
        const { data: dish, error } = await supabase
          .from('dishes')
          .insert(dishes[i])
          .select()
          .single();
        
        if (error) throw error;
        createdDishes.push(dish);
        
        setProgress(((i + 1) / dishes.length) * 50);
      }

      setStatus('Inserting instances...');
      
      // Insert instances and update consumption records
      const createdInstances = [];
      let instanceIndex = 0;
      
      for (let i = 0; i < createdDishes.length; i++) {
        const dish = createdDishes[i];
        const dishInstances = instances.filter(inst => inst.dish_id === `temp-${i}`);
        
        for (let j = 0; j < dishInstances.length; j++) {
          const instance = {
            ...dishInstances[j],
            dish_id: dish.id,
          };
          
          const { data: createdInstance, error } = await supabase
            .from('dinner_instances')
            .insert(instance)
            .select()
            .single();
          
          if (error) throw error;
          createdInstances.push(createdInstance);
          
          // Update consumption records for this instance
          const instanceConsumptions = consumptionRecords.filter(cr => cr.instance_id === `temp-${i}-${j}`);
          for (const consumption of instanceConsumptions) {
            consumption.instance_id = createdInstance.id;
          }
          
          instanceIndex++;
          setProgress(50 + (instanceIndex / instances.length) * 30);
        }
      }

      setStatus('Inserting consumption records...');
      
      // Insert consumption records in batches
      const batchSize = 50;
      for (let i = 0; i < consumptionRecords.length; i += batchSize) {
        const batch = consumptionRecords.slice(i, i + batchSize);
        const { error } = await supabase
          .from('consumption_records')
          .insert(batch);
        
        if (error) throw error;
        
        setProgress(80 + (i / consumptionRecords.length) * 10);
      }

      setStatus('Inserting tags...');
      
      // Update and insert dish tags
      for (let i = 0; i < createdDishes.length; i++) {
        const dish = createdDishes[i];
        const dishTagBatch = dishTags.filter(tag => tag.dish_id === `temp-${i}`);
        
        for (const tag of dishTagBatch) {
          tag.dish_id = dish.id;
        }
        
        if (dishTagBatch.length > 0) {
          const { error } = await supabase
            .from('tags')
            .insert(dishTagBatch);
          
          if (error) throw error;
        }
      }

      // Update and insert instance tags
      for (let i = 0; i < createdInstances.length; i++) {
        const instance = createdInstances[i];
        const instanceTagBatch = instanceTags.filter(tag => tag.instance_id === `temp-${i}`);
        
        for (const tag of instanceTagBatch) {
          tag.instance_id = instance.id;
        }
        
        if (instanceTagBatch.length > 0) {
          const { error } = await supabase
            .from('tags')
            .insert(instanceTagBatch);
          
          if (error) throw error;
        }
      }

      setProgress(100);
      setStatus(`✅ Successfully generated ${dishes.length} dishes with ${instances.length} variants and ${consumptionRecords.length} consumption records!`);
      
    } catch (error) {
      console.error('Error generating test data:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Data Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to generate test data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Data Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will generate 80 test dishes with variants, consumption records, and tags for performance testing.
        </p>
        
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}
        
        {!isGenerating && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{status}</p>
            <Button onClick={generateTestData} className="w-full">
              Generate 80 Test Dishes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestDataGenerator;
