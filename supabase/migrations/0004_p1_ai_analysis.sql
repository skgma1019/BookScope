-- P1: AI analysis tables
-- Stores external review sources, Gemini analysis results, and their linkage.
-- Cache key priority: isbn13 → isbn10 → google_volume_id

create type public.analysis_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'insufficient_sources'
);

create type public.source_type as enum (
  'professional_review',
  'media_review',
  'publisher_description',
  'reader_review',
  'unknown'
);

-- Stores individual external review/source snippets fetched before Gemini analysis.
create table public.review_sources (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  url text,
  title text,
  publisher text,
  source_type public.source_type not null default 'unknown',
  snippet text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One row per Gemini analysis run (requested or in-flight).
create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  status public.analysis_status not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index analysis_jobs_book_status_idx on public.analysis_jobs(book_id, status, created_at desc);

-- Stores the structured Gemini analysis result for a book.
-- One canonical analysis per book (upserted on conflict).
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null unique references public.books(id) on delete cascade,
  job_id uuid references public.analysis_jobs(id) on delete set null,
  -- 8 PRD fields
  summary text,
  strengths text[],
  criticisms text[],
  mixed_opinions text[],
  themes text[],
  style text,
  target_readers text[],
  evidence_notes text,
  -- metadata
  source_count integer not null default 0,
  model_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Links an analysis to the specific review sources Gemini used as evidence.
create table public.analysis_sources (
  analysis_id uuid not null references public.ai_analyses(id) on delete cascade,
  source_id uuid not null references public.review_sources(id) on delete cascade,
  primary key (analysis_id, source_id)
);

-- Triggers
create trigger analysis_jobs_set_updated_at before update on public.analysis_jobs for each row execute function public.set_updated_at();
create trigger ai_analyses_set_updated_at before update on public.ai_analyses for each row execute function public.set_updated_at();

-- RLS
alter table public.review_sources enable row level security;
alter table public.analysis_jobs enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.analysis_sources enable row level security;

-- Read: all authenticated users can read analysis data (shared global content)
create policy "review_sources_read_authenticated" on public.review_sources for select to authenticated using (true);
create policy "analysis_jobs_read_authenticated" on public.analysis_jobs for select to authenticated using (true);
create policy "ai_analyses_read_authenticated" on public.ai_analyses for select to authenticated using (true);
create policy "analysis_sources_read_authenticated" on public.analysis_sources for select to authenticated using (true);

-- Write: authenticated users can insert/update analysis data via server actions.
-- The server action always validates and computes the content server-side,
-- so direct user manipulation is not a concern here.
create policy "review_sources_write_authenticated" on public.review_sources
  for insert to authenticated with check (snippet is not null and char_length(snippet) > 0);

create policy "analysis_jobs_write_authenticated" on public.analysis_jobs
  for insert to authenticated with check (book_id is not null);
create policy "analysis_jobs_update_authenticated" on public.analysis_jobs
  for update to authenticated using (true);

create policy "ai_analyses_write_authenticated" on public.ai_analyses
  for insert to authenticated with check (book_id is not null);
create policy "ai_analyses_update_authenticated" on public.ai_analyses
  for update to authenticated using (true);

create policy "analysis_sources_write_authenticated" on public.analysis_sources
  for insert to authenticated with check (true);

grant select, insert, update on public.review_sources to authenticated;
grant select, insert, update on public.analysis_jobs to authenticated;
grant select, insert, update on public.ai_analyses to authenticated;
grant select, insert on public.analysis_sources to authenticated;
