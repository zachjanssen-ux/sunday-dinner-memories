-- Run this in the Supabase Dashboard SQL Editor
-- Creates the recipe-photos storage bucket and its access policies

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload recipe photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-photos'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read access to recipe photos
CREATE POLICY "Public read access for recipe photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-photos'
    AND auth.uid() = owner
  );

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-photos'
    AND auth.uid() = owner
  );
