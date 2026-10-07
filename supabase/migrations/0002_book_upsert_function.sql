create or replace function public.upsert_book_for_user(book_data jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.books (
    google_volume_id, isbn10, isbn13, title, subtitle, authors, publisher,
    published_date, description, categories, language, page_count, thumbnail_url,
    preview_link, info_link, canonical_volume_link, google_average_rating,
    google_ratings_count, saleability, is_ebook, buy_link, retail_price, currency_code, fetched_at
  ) values (
    book_data->>'volumeId', book_data->>'isbn10', book_data->>'isbn13', book_data->>'title',
    book_data->>'subtitle', coalesce(array(select jsonb_array_elements_text(book_data->'authors')), '{}'),
    book_data->>'publisher', book_data->>'publishedDate', book_data->>'description',
    coalesce(array(select jsonb_array_elements_text(book_data->'categories')), '{}'), book_data->>'language',
    (book_data->>'pageCount')::integer, book_data->>'thumbnailUrl', book_data->>'previewLink',
    book_data->>'infoLink', book_data->>'canonicalVolumeLink', (book_data->>'averageRating')::numeric,
    (book_data->>'ratingsCount')::integer, book_data#>>'{saleInfo,saleability}', (book_data#>>'{saleInfo,isEbook}')::boolean,
    book_data#>>'{saleInfo,buyLink}', (book_data#>>'{saleInfo,retailPrice,amount}')::numeric,
    book_data#>>'{saleInfo,retailPrice,currencyCode}', now()
  ) on conflict (google_volume_id) do update set
    title=excluded.title, subtitle=excluded.subtitle, authors=excluded.authors, publisher=excluded.publisher,
    published_date=excluded.published_date, description=excluded.description, categories=excluded.categories,
    language=excluded.language, page_count=excluded.page_count, thumbnail_url=excluded.thumbnail_url,
    preview_link=excluded.preview_link, info_link=excluded.info_link, canonical_volume_link=excluded.canonical_volume_link,
    google_average_rating=excluded.google_average_rating, google_ratings_count=excluded.google_ratings_count,
    saleability=excluded.saleability, is_ebook=excluded.is_ebook, buy_link=excluded.buy_link,
    retail_price=excluded.retail_price, currency_code=excluded.currency_code, fetched_at=now()
  returning id into result_id;
  return result_id;
end;
$$;

revoke all on function public.upsert_book_for_user(jsonb) from public;
grant execute on function public.upsert_book_for_user(jsonb) to authenticated;
