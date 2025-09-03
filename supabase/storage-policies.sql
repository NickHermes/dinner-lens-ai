-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload to dinner-photos bucket
CREATE POLICY "Allow authenticated users to upload dinner photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dinner-photos' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to view dinner photos
CREATE POLICY "Allow authenticated users to view dinner photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dinner-photos' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow users to update their own photos
CREATE POLICY "Allow users to update their own dinner photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dinner-photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own photos
CREATE POLICY "Allow users to delete their own dinner photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dinner-photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
