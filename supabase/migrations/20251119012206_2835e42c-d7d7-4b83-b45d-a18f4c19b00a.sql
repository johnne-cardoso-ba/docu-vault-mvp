-- Corrigir função generate_protocol com search_path
CREATE OR REPLACE FUNCTION generate_protocol()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
  protocol TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM requests
  WHERE protocol LIKE year_prefix || '%';
  
  protocol := year_prefix || LPAD(next_number::TEXT, 6, '0');
  
  RETURN protocol;
END;
$$;

-- Corrigir função set_request_protocol com search_path
CREATE OR REPLACE FUNCTION set_request_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.protocol IS NULL OR NEW.protocol = '' THEN
    NEW.protocol := generate_protocol();
  END IF;
  RETURN NEW;
END;
$$;