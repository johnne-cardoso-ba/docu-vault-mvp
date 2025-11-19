-- Make documents bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'documents';

-- Add RLS policies for documents storage
CREATE POLICY "Admins and collaborators can access all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'colaborador'::app_role))
);

CREATE POLICY "Clients can access their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM documents d
    JOIN clients c ON d.client_id = c.id
    JOIN profiles p ON c.email = p.email
    WHERE d.file_url LIKE '%' || storage.objects.name || '%'
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Admins and collaborators can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'colaborador'::app_role))
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);