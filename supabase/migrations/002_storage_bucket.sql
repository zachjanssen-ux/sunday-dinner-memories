-- Create recipe-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-photos', 'recipe-photos', true);

-- Anyone can view recipe photos
CREATE POLICY "Anyone can view recipe photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');

-- Authenticated users can upload recipe photos
CREATE POLICY "Authenticated users can upload recipe photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);
