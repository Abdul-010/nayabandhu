create extension if not exists vector;

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('pdf','text')),
  content text not null,
  chunk_count integer not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(3072) not null,
  unique (source_id, chunk_index)
);

grant select, insert, update, delete on public.knowledge_sources to authenticated;
grant all on public.knowledge_sources to service_role;
grant all on public.knowledge_chunks to service_role;

alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "Admins manage knowledge sources"
  on public.knowledge_sources for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create or replace function public.match_knowledge_chunks (
  query_embedding vector(3072),
  match_count integer default 6,
  min_similarity double precision default 0.25
)
returns table (
  source_id uuid,
  source_title text,
  chunk_index integer,
  content text,
  similarity double precision
)
language sql stable
security definer
set search_path = public
as $$
  select c.source_id, s.title as source_title, c.chunk_index, c.content,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.knowledge_chunks c
  join public.knowledge_sources s on s.id = c.source_id
  where 1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) >= min_similarity
  order by c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

grant execute on function public.match_knowledge_chunks(vector, integer, double precision) to anon, authenticated, service_role;