
-- Create storage bucket for content images, videos, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true);

-- Create a policy to allow public read access to the content bucket
CREATE POLICY "Public Access Content" ON storage.objects
FOR SELECT
USING (bucket_id = 'content');

-- Create a policy to allow authenticated users to insert into the content bucket
CREATE POLICY "Authenticated Users Can Upload Content" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content');

-- Create a policy to allow authenticated users to update their own content
CREATE POLICY "Authenticated Users Can Update Their Own Content" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content' AND auth.uid() = owner);

-- Create a policy to allow authenticated users to delete their own content
CREATE POLICY "Authenticated Users Can Delete Their Own Content" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content' AND auth.uid() = owner);
