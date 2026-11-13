CREATE TABLE public.knowledge_embedding_status (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  blocked boolean NOT NULL DEFAULT false,
  status_code integer,
  safe_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.knowledge_embedding_status TO service_role;
ALTER TABLE public.knowledge_embedding_status ENABLE ROW LEVEL SECURITY;