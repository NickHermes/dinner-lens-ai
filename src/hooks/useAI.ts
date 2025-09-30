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
      
      console.log('Starting AI analysis for file:', imageFile.name, 'size:', imageFile.size)
      console.log('Uploading to Supabase Storage with filename:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dinner-photos')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      console.log('Upload result:', { uploadData, uploadError })
      if (uploadError) throw uploadError

      // Prefer a short-lived signed URL for OpenAI fetch, but store public URL in DB
      let imageUrlForAI: string
      let imageUrlForDb: string
      console.log('Creating signed URL for file:', fileName)
      try {
        const { data: signed } = await supabase.storage
          .from('dinner-photos')
          .createSignedUrl(fileName, 300) // allow up to 5 minutes for analysis
        console.log('Signed URL response:', signed)
        if (signed?.signedUrl) {
          imageUrlForAI = signed.signedUrl
          console.log('Using signed URL for AI:', imageUrlForAI)
        } else {
          // Fallback to public URL (if bucket is public)
          const { data: urlData } = supabase.storage
            .from('dinner-photos')
            .getPublicUrl(fileName)
          imageUrlForAI = urlData.publicUrl
          imageUrlForDb = urlData.publicUrl
          console.log('Using public URL for AI:', imageUrlForAI)
        }
      } catch (signedError) {
        console.warn('Signed URL creation failed:', signedError)
        const { data: urlData } = supabase.storage
          .from('dinner-photos')
          .getPublicUrl(fileName)
        imageUrlForAI = urlData.publicUrl
        imageUrlForDb = urlData.publicUrl
        console.log('Fallback to public URL:', imageUrlForAI)
      }

      // Call AI analysis Edge Function
      console.log('Calling AI analysis with URL:', imageUrlForAI)
      const { data, error } = await supabase.functions.invoke('ai-vision-analysis', {
        body: {
          imageUrl: imageUrlForAI,
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
      // Ensure we store a stable (public) URL in DB
      const photoUrlToStore = imageUrlForDb ?? (await supabase.storage
        .from('dinner-photos')
        .getPublicUrl(fileName)).data.publicUrl

      await supabase.from('photos').insert({
        dinner_id: dinnerId,
        url: photoUrlToStore,
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
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast({
        title: "Analysis Failed",
        description: `Could not analyze the image: ${error.message || 'Unknown error'}`,
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