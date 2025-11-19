-- Função para obter próximo número de RPS de forma segura
CREATE OR REPLACE FUNCTION public.get_next_rps()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_rps bigint;
BEGIN
  SELECT COALESCE(MAX(numero_rps), 0) + 1 INTO next_rps FROM nfse_emitidas;
  RETURN next_rps;
END;
$$;