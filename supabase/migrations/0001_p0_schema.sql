create extension if not exists pgcrypto;

create type public.reading_status as enum ('want_to_read', 'reading', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 1 and 100),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  google_volume_id text not null unique,
  isbn10 text,
  isbn13 text,
  title text not null,
  subtitle text,
  authors text[] not null default '{}',
  publisher text,
  published_date text,
  description text,
  categories text[] not null default '{}',
  language text,
  page_count integer check (page_count is null or page_count >= 0),
  thumbnail_url text,
  preview_link text,
  info_link text,
  canonical_volume_link text,
  google_average_rating numeric(3,2) check (google_average_rating is null or google_average_rating between 0 and 5),
  google_ratings_count integer check (google_ratings_count is null or google_ratings_count >= 0),
  saleability text,
  is_ebook boolean,
  buy_link text,
  retail_price numeric check (retail_price is null or retail_price >= 0),
  currency_code text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  status public.reading_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table public.user_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  rating smallint check (rating is null or rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id),
  check (rating is not null or nullif(btrim(review_text), '') is not null)
);

create index user_library_recent_idx on public.user_library(user_id, created_at desc);
create index user_library_status_idx on public.user_library(user_id, status, created_at desc);
create index user_reviews_user_idx on public.user_reviews(user_id, updated_at desc);
create index books_isbn13_idx on public.books(isbn13) where isbn13 is not null;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger books_set_updated_at before update on public.books for each row execute function public.set_updated_at();
create trigger library_set_updated_at before update on public.user_library for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.user_reviews for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'BookScope 사용자'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.user_library enable row level security;
alter table public.user_reviews enable row level security;

create policy "profiles_read_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "books_read_authenticated" on public.books for select to authenticated using (true);
create policy "library_read_own" on public.user_library for select to authenticated using ((select auth.uid()) = user_id);
create policy "library_insert_own" on public.user_library for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "library_update_own" on public.user_library for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "library_delete_own" on public.user_library for delete to authenticated using ((select auth.uid()) = user_id);
create policy "reviews_read_own" on public.user_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "reviews_insert_own" on public.user_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reviews_update_own" on public.user_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reviews_delete_own" on public.user_reviews for delete to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.books from anon, authenticated;
grant select on public.books to authenticated;
grant select, insert, update, delete on public.user_library, public.user_reviews to authenticated;
grant select, update on public.profiles to authenticated;
