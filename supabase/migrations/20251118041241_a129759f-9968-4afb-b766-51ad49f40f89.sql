-- Create storage bucket for store items
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-items', 'store-items', true);

-- Create RLS policies for store items bucket
CREATE POLICY "Admins can upload store item images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-items' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update store item images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-items'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete store item images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-items'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Anyone can view store item images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-items');