-- Create storage bucket for comic images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comic-images',
  'comic-images',
  true,
  5242880, -- 5MB max per image
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Create storage bucket for script covers/thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'script-covers',
  'script-covers',
  true,
  2097152, -- 2MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow public read access to comic images
CREATE POLICY "Public can view comic images"
ON storage.objects FOR SELECT
USING (bucket_id = 'comic-images');

-- Allow authenticated users to upload their own comic images
CREATE POLICY "Users can upload comic images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comic-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own images
CREATE POLICY "Users can update their comic images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'comic-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their comic images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comic-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Same policies for script covers
CREATE POLICY "Public can view script covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'script-covers');

CREATE POLICY "Users can upload script covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'script-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their script covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'script-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their script covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'script-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);