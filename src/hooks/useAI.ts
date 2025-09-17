import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { processFileAndExtractExif } from '@/lib/exif'

export interface AITag {
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course'
  confidence: number
  approved?: boolean
}

export interface AIAnalysis {
  title: string
  caption: string
  tags: AITag[]
  nutrition: {
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
  }
  health_score: number
}

export const useAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const analyzeImage = async (imageFile: File, dinnerId: string): Promise<AIAnalysis | null> => {
    setIsAnalyzing(true)
    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${dinnerId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dinner-photos')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('dinner-photos')
        .getPublicUrl(fileName)

      const imageUrl = urlData.publicUrl

      // Call AI analysis Edge Function
      const { data, error } = await supabase.functions.invoke('ai-vision-analysis', {
        body: {
          imageUrl,
          dinnerId
        }
      })

      if (error) throw error

      // Process file and extract EXIF data
      let exifData: any = { width: 0, height: 0 }
      try {
        const processed = await processFileAndExtractExif(imageFile)
        exifData = processed.exifData
        console.log('Extracted EXIF data in useAI:', exifData)
      } catch (error) {
        console.warn('Failed to extract EXIF data in useAI:', error)
      }

      // Store photo record with EXIF data
      await supabase.from('photos').insert({
        dinner_id: dinnerId,
        url: imageUrl,
        width: exifData.width || 0,
        height: exifData.height || 0,
        exif_lat: exifData.latitude || null,
        exif_lon: exifData.longitude || null,
        exif_time: exifData.timestamp || null
      })

      toast({
        title: "AI Analysis Complete",
        description: "Generated tags and nutrition estimates"
      })

      return data as AIAnalysis

    } catch (error) {
      console.error('AI Analysis Error:', error)
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive"
      })
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  const searchDinners = async (query: string) => {
    setIsSearching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: {
          query,
          userId: user.id,
          limit: 50
        }
      })

      if (error) throw error

      return data

    } catch (error) {
      console.error('AI Search Error:', error)
      toast({
        title: "Search Failed",
        description: "Could not search dinners. Please try again.",
        variant: "destructive"
      })
      return { results: [], total: 0 }
    } finally {
      setIsSearching(false)
    }
  }

  const approveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ approved: true })
        .eq('id', tagId)

      if (error) throw error

      toast({
        description: "Tag approved"
      })

    } catch (error) {
      console.error('Approve Tag Error:', error)
      toast({
        title: "Failed to approve tag",
        variant: "destructive"
      })
    }
  }

  const rejectTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      toast({
        description: "Tag removed"
      })

    } catch (error) {
      console.error('Reject Tag Error:', error)
      toast({
        title: "Failed to remove tag",
        variant: "destructive"
      })
    }
  }

  const addCustomTag = async (dinnerId: string, name: string, type: AITag['type']) => {
    try {
      const { error } = await supabase.from('tags').insert({
        dinner_id: dinnerId,
        name,
        type,
        source: 'user',
        approved: true,
        confidence: 1.0
      })

      if (error) throw error

      toast({
        description: "Custom tag added"
      })

    } catch (error) {
      console.error('Add Custom Tag Error:', error)
      toast({
        title: "Failed to add tag",
        variant: "destructive"
      })
    }
  }

  return {
    analyzeImage,
    searchDinners,
    approveTag,
    rejectTag,
    addCustomTag,
    isAnalyzing,
    isSearching
  }
}