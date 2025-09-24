// New type definitions for dishes and instances

export interface Dish {
  id: string
  user_id: string
  title: string
  base_photo_url?: string
  health_score?: number
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
  notes?: string
  effort?: 'easy' | 'medium' | 'hard'
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other'
  photo_url?: string
  created_at: string
  updated_at: string
  
  // Computed/joined fields
  dish?: Dish
  place?: Place
  photos?: Photo[]
  instance_tags?: Tag[]
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

export interface Embedding {
  id: string
  dish_id: string
  embedding: number[]
  created_at: string
}

// Search and UI related types
export interface DishSearchResult {
  dish: Dish
  instances: DinnerInstance[]
  match_score?: number
}

export interface InstanceSearchResult {
  instance: DinnerInstance
  dish: Dish
  match_score?: number
}

// Form data types
export interface CreateDishData {
  title: string
  base_photo_url?: string
  health_score?: number
  base_tags: Omit<Tag, 'id' | 'dish_id' | 'created_at'>[]
}

export interface CreateInstanceData {
  dish_id: string
  datetime: string
  place_id?: string
  notes?: string
  effort?: 'easy' | 'medium' | 'hard'
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other'
  photo_url?: string
  instance_tags: Omit<Tag, 'id' | 'instance_id' | 'created_at'>[]
}

