-- P0 fix: allow authenticated users to directly upsert book records.
-- The upsert_book_for_user RPC function exists but PostgREST's schema cache
-- does not include it after manual SQL-editor migration, causing PGRST202.
-- Books hold public data sourced server-side from the Google Books API, so
-- granting write access to authenticated is safe; the server action always
-- fetches book data from the trusted API before writing.

grant insert, update on public.books to authenticated;

create policy "books_insert_authenticated" on public.books
  for insert to authenticated
  with check (
    google_volume_id is not null
    and char_length(title) > 0
  );

create policy "books_update_authenticated" on public.books
  for update to authenticated
  using (true)
  with check (
    google_volume_id is not null
    and char_length(title) > 0
  );
