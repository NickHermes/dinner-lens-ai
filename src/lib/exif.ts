import EXIF from 'exif-js'

export interface ExifData {
  latitude?: number
  longitude?: number
  timestamp?: string
  width?: number
  height?: number
}

export const extractExifData = (file: File): Promise<ExifData> => {
  return new Promise((resolve) => {
    EXIF.getData(file, function() {
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
      
      // Extract image dimensions
      exifData.width = EXIF.getTag(this, 'PixelXDimension') || file.width
      exifData.height = EXIF.getTag(this, 'PixelYDimension') || file.height
      
      resolve(exifData)
    })
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
