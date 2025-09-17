import EXIF from 'exif-js'
import { heicTo } from 'heic-to'

export interface ExifData {
  latitude?: number
  longitude?: number
  timestamp?: string
  width?: number
  height?: number
}

export interface ProcessedFileData {
  file: File
  exifData: ExifData
}

// Convert HEIC to JPEG for preview (using heic-to library)
export const convertHeicForPreview = async (file: File): Promise<File | null> => {
  try {
    console.log('Converting HEIC for preview using heic-to...', {
      type: file.type,
      name: file.name,
      size: file.size
    })
    
    const jpegBlob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.8
    })
    
    const jpegFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: file.lastModified
    })
    
    console.log('HEIC preview conversion successful:', {
      originalSize: file.size,
      convertedSize: jpegFile.size,
      convertedType: jpegFile.type
    })
    
    return jpegFile
  } catch (error) {
    console.warn('HEIC preview conversion failed:', error)
    return null
  }
}

export const processFileAndExtractExif = async (file: File): Promise<ProcessedFileData> => {
  // Check if it's a HEIC file
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    console.log('HEIC file detected:', {
      type: file.type,
      name: file.name,
      size: file.size
    })
    
    // For HEIC files, return original file (preview will use placeholder)
    // But conversion will happen separately for upload/AI analysis
    return { 
      file: file, 
      exifData: { width: undefined, height: undefined } 
    }
  }

  // For other formats, try to extract EXIF data with fallback
  try {
    console.log('Attempting EXIF extraction for:', file.name)
    const exifData = await extractExifDataWithFallback(file)
    console.log('EXIF extraction successful:', exifData)
    return { file: file, exifData }
  } catch (error) {
    console.warn('EXIF extraction failed, using fallback:', error)
    // Return file with empty EXIF data if extraction fails
    return { 
      file: file, 
      exifData: { width: undefined, height: undefined } 
    }
  }
}

// New function that tries multiple approaches for EXIF extraction
export const extractExifDataWithFallback = async (file: File): Promise<ExifData> => {
  // First try to get image dimensions using Image API (reliable on all browsers)
  const imageDimensions = await getImageDimensions(file)
  
  // Try EXIF extraction with timeout, but don't let it block the process
  let gpsData: Partial<ExifData> = {}
  
  try {
    console.log('Trying EXIF-js extraction with timeout...')
    const exifData = await extractExifData(file)
    if (exifData.latitude && exifData.longitude) {
      gpsData = {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        timestamp: exifData.timestamp
      }
      console.log('GPS data extracted successfully:', gpsData)
    } else {
      console.log('No GPS data found in EXIF')
    }
  } catch (error) {
    console.warn('EXIF-js extraction failed, continuing without GPS data:', error)
  }
  
  return {
    ...gpsData,
    width: imageDimensions.width,
    height: imageDimensions.height
  }
}

// Get image dimensions using Image API (works reliably on all browsers)
const getImageDimensions = async (file: File): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ 
        width: img.naturalWidth || img.width, 
        height: img.naturalHeight || img.height 
      })
    }
    img.onerror = () => {
      console.warn('Could not load image for dimensions')
      resolve({ width: 0, height: 0 })
    }
    img.src = URL.createObjectURL(file)
  })
}

export const extractExifData = async (file: File): Promise<ExifData> => {
  return new Promise((resolve) => {
    let resolved = false
    
    // Set a timeout to prevent hanging on mobile Safari EXIF issues
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.warn('EXIF extraction timed out - using fallback')
        resolve({ width: undefined, height: undefined })
      }
    }, 2000) // 2 second timeout
    
    try {
      EXIF.getData(file, function() {
        if (resolved) return // Already timed out
        
        try {
          const exifData: ExifData = {}
          
          // Extract GPS coordinates
          const lat = EXIF.getTag(this, 'GPSLatitude')
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef')
          const lon = EXIF.getTag(this, 'GPSLongitude')
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef')
          
          if (lat && latRef && lon && lonRef) {
            // Convert GPS coordinates to decimal degrees
            exifData.latitude = convertDMSToDD(lat, latRef)
            exifData.longitude = convertDMSToDD(lon, lonRef)
          }
          
          // Extract timestamp
          const dateTime = EXIF.getTag(this, 'DateTime')
          if (dateTime) {
            // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO string
            const [date, time] = dateTime.split(' ')
            const [year, month, day] = date.split(':')
            const [hour, minute, second] = time.split(':')
            exifData.timestamp = new Date(
              parseInt(year),
              parseInt(month) - 1, // Month is 0-indexed
              parseInt(day),
              parseInt(hour),
              parseInt(minute),
              parseInt(second)
            ).toISOString()
          }
          
          // Extract image dimensions - try multiple EXIF tags
          exifData.width = EXIF.getTag(this, 'PixelXDimension') || 
                          EXIF.getTag(this, 'ImageWidth') || 
                          EXIF.getTag(this, 'ExifImageWidth') || 
                          undefined
          exifData.height = EXIF.getTag(this, 'PixelYDimension') || 
                           EXIF.getTag(this, 'ImageHeight') || 
                           EXIF.getTag(this, 'ExifImageHeight') || 
                           undefined
          
          clearTimeout(timeout)
          resolved = true
          resolve(exifData)
        } catch (error) {
          if (!resolved) {
            console.warn('Error extracting EXIF tags:', error)
            clearTimeout(timeout)
            resolved = true
            resolve({ width: undefined, height: undefined })
          }
        }
      })
    } catch (error) {
      if (!resolved) {
        console.warn('Error reading EXIF data:', error)
        clearTimeout(timeout)
        resolved = true
        resolve({ width: undefined, height: undefined })
      }
    }
  })
}

// Helper function to convert GPS coordinates from DMS to decimal degrees
const convertDMSToDD = (dms: number[], ref: string): number => {
  let dd = dms[0] + dms[1]/60 + dms[2]/(60*60)
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1
  }
  return dd
}
