-- Tornar o bucket documents público para permitir download direto dos arquivos
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';