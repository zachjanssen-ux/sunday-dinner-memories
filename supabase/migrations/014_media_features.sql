-- ============================================================
-- 014: Media Features — Photos, Video, Audio enhancements
-- ============================================================

-- Add photo and video columns to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url text;

-- Create audio-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Anyone can view audio files" ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
CREATE POLICY "Authenticated users can upload audio files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own audio uploads" ON storage.objects FOR DELETE USING (bucket_id = 'audio-files' AND auth.uid() IS NOT NULL);

-- RLS for audio_memories — allow public select for the /listen/:id page
CREATE POLICY "Anyone can view audio memories for listen page" ON audio_memories FOR SELECT USING (true);
