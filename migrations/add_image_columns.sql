-- =============================================
-- MIGRATION: Add image_url columns to events and programs
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- Add image_url column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- =============================================
-- STORAGE BUCKET SETUP
-- Run these commands to create the images storage bucket
-- =============================================

-- Create the images storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify the changes
-- =============================================

-- Check events table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events';

-- Check programs table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'programs';

-- Check storage buckets
-- SELECT * FROM storage.buckets WHERE id = 'images';
