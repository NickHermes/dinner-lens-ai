// Image compression configuration
export const IMAGE_CONFIG = {
  // Maximum dimensions (maintains aspect ratio)
  maxWidth: 1920,
  maxHeight: 1080,
  
  // JPEG quality (0.0 to 1.0)
  quality: 0.85,
  
  // Maximum file size in bytes (500KB)
  maxFileSize: 500 * 1024,
  
  // Supported formats
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  
  // Compression will be applied if original file is larger than this
  minSizeForCompression: 100 * 1024, // 100KB
}

// Helper function to check if compression is needed
export const shouldCompress = (file: File): boolean => {
  return file.size > IMAGE_CONFIG.minSizeForCompression
}

// Helper function to get compression info
export const getCompressionInfo = (originalSize: number, compressedSize: number) => {
  const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)
  const sizeReduction = originalSize - compressedSize
  
  return {
    compressionRatio: `${compressionRatio}%`,
    sizeReduction: `${Math.round(sizeReduction / 1024)}KB`,
    originalSize: `${Math.round(originalSize / 1024)}KB`,
    compressedSize: `${Math.round(compressedSize / 1024)}KB`
  }
}
