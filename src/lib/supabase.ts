import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Minimal diagnostics in development only
if (import.meta.env.DEV) {
  console.log('🔧 Supabase config (dev):', {
    url: supabaseUrl,
    keyExists: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


 // Database types - New schema
export interface Dish {
  id: string
  user_id: string
  title: string
  base_photo_url?: string
  health_score?: number
  effort?: 'easy' | 'medium' | 'hard'  // Moved from instance to dish level
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other' // Moved from instance to dish level
  notes?: string // Added dish-level notes
  created_at: string
  updated_at: string
  
  // Computed/joined fields
  total_instances?: number
  latest_instance?: DinnerInstance
  base_tags?: Tag[]
}

export interface DinnerInstance {
  id: string
  dish_id: string
  user_id: string
  datetime: string
  place_id?: string
  location?: string // Added separate location field
  variant_title?: string // Added variant title field
  notes?: string
  // effort and meal_type moved to dish level
  photo_url?: string
  count: number // How many times this specific variant was consumed
  last_consumed?: string // Most recent time this variant was had
  created_at: string
  updated_at: string
  
  // Computed/joined fields
  dish?: Dish
  place?: Place
  photos?: Photo[]
  instance_tags?: Tag[]
  consumption_records?: ConsumptionRecord[]
}

export interface ConsumptionRecord {
  id: string
  instance_id: string
  user_id: string
  consumed_at: string
  location?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  dish_id?: string
  instance_id?: string
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course' | 'custom'
  source: 'ai' | 'user'
  is_base_tag: boolean
  approved: boolean
  created_at: string
}

export interface Photo {
  id: string
  instance_id: string
  url: string
  exif_lat?: number
  exif_lon?: number
  exif_time?: string
  width?: number
  height?: number
  created_at: string
}

export interface Place {
  id: string
  user_id: string
  name: string
  type: 'home' | 'friend' | 'restaurant' | 'other'
  lat: number
  lon: number
  radius_m: number
  is_default: boolean
  created_at: string
  updated_at: string
}

// Legacy interface for backwards compatibility during transition
export interface Dinner {
  id: string
  user_id: string
  title: string
  datetime: string
  place_id?: string
  notes?: string
  favorite: boolean
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other'
  deliciousness?: number
  effort?: 'easy' | 'medium' | 'hard'
  ai_caption?: string
  nutrition_calories?: number
  nutrition_protein_g?: number
  nutrition_carbs_g?: number
  nutrition_fat_g?: number
  nutrition_fiber_g?: number
  health_score?: number
  created_at: string
  updated_at: string
  places?: Place
  photos?: Photo[]
  tags?: Tag[]
}