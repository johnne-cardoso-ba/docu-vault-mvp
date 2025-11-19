-- Corrigir função de geração de protocolo para evitar ambiguidade
CREATE OR REPLACE FUNCTION generate_protocol()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
  new_protocol TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(requests.protocol FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM requests
  WHERE requests.protocol LIKE year_prefix || '%';
  
  new_protocol := year_prefix || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_protocol;
END;
$$;