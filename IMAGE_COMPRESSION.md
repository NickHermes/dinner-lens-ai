# Image Compression Implementation

## Overview
This app implements client-side image compression to reduce file sizes before uploading to Supabase Storage.

## Compression Strategy

### **Where**: Client-side (in the browser)
- **Why**: Reduces upload time, storage costs, and bandwidth usage
- **When**: Before uploading to Supabase Storage

### **Target Specifications**
- **Max Dimensions**: 1920x1080px (maintains aspect ratio)
- **Quality**: 85% JPEG compression
- **Max File Size**: ~500KB per image
- **Min Size for Compression**: 100KB (smaller files skip compression)

### **Supported Formats**
- JPEG, PNG, WebP → Compressed to JPEG
- HEIC/HEIF → Converted to JPEG, then compressed

## Implementation Details

### **Files Modified**
1. `src/lib/imageConfig.ts` - Configuration settings
2. `src/lib/exif.ts` - Compression logic
3. `src/components/AddDinner.tsx` - User notifications

### **Compression Process**
1. **File Selection**: User selects image
2. **Size Check**: Skip compression if file < 100KB
3. **Dimension Check**: Resize if > 1920x1080px
4. **Compression**: Convert to JPEG at 85% quality
5. **Notification**: Show compression ratio to user
6. **Upload**: Compressed file uploaded to Supabase

### **Benefits**
- **Performance**: Faster uploads and page loads
- **Cost**: Lower Supabase storage costs
- **Mobile**: Better performance on mobile devices
- **Bandwidth**: Reduced data usage

### **User Experience**
- Automatic compression (no user action needed)
- Toast notification shows compression ratio
- Original quality maintained for viewing
- HEIC files automatically converted

## Configuration

You can adjust compression settings in `src/lib/imageConfig.ts`:

```typescript
export const IMAGE_CONFIG = {
  maxWidth: 1920,        // Maximum width
  maxHeight: 1080,       // Maximum height
  quality: 0.85,         // JPEG quality (0.0-1.0)
  maxFileSize: 500 * 1024, // Target max size (500KB)
  minSizeForCompression: 100 * 1024, // Skip compression below 100KB
}
```

## Technical Notes

- Uses HTML5 Canvas API for compression
- Maintains aspect ratio during resizing
- Preserves EXIF data from original file
- Handles HEIC conversion before compression
- Graceful fallback if compression fails
