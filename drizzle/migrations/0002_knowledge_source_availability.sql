CREATE OR REPLACE FUNCTION public.has_knowledge_sources()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.knowledge_sources);
$$;
GRANT EXECUTE ON FUNCTION public.has_knowledge_sources() TO anon, authenticated, service_role;