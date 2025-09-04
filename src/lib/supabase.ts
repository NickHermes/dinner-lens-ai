import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', {
  url: supabaseUrl,
  keyExists: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  isDevBuild: import.meta.env.VITE_IS_DEV_BUILD,
  allEnvVars: import.meta.env
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey,
    isDevBuild: import.meta.env.VITE_IS_DEV_BUILD
  })
  throw new Error(`Missing Supabase environment variables: URL=${supabaseUrl}, Key=${!!supabaseAnonKey}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Dinner {
  id: string
  user_id: string
  title: string
  datetime: string
  place_id?: string
  notes?: string
  favorite: boolean
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

export interface Place {
  id: string
  user_id: string
  name: string
  type: 'home' | 'friend' | 'restaurant' | 'other'
  lat?: number
  lon?: number
  radius_m: number
  address?: string
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  dinner_id: string
  url: string
  width?: number
  height?: number
  exif_time?: string
  exif_lat?: number
  exif_lon?: number
  created_at: string
}

export interface Tag {
  id: string
  dinner_id: string
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course' | 'custom'
  source: 'ai' | 'user'
  approved: boolean
  confidence?: number
  created_at: string
}