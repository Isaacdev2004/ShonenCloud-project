-- Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'blog-images'
);

-- Allow authenticated users to update their own blog images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'blog-images'
);

-- Allow everyone to read blog images
CREATE POLICY "Anyone can view blog images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'blog-images'
);