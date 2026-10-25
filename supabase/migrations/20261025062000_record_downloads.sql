create or replace function public.record_download(
  p_add_on_id uuid,
  p_file_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.add_ons a
    join public.add_on_files f on f.add_on_id = a.id
    where a.id = p_add_on_id
      and f.id = p_file_id
      and a.status = 'published'
      and f.scan_status = 'clean'
  ) then
    raise exception 'This file is not available for download';
  end if;

  insert into public.downloads (user_id, add_on_id, file_id)
  values ((select auth.uid()), p_add_on_id, p_file_id);

  update public.add_ons
  set download_count = download_count + 1
  where id = p_add_on_id;
end;
$$;
revoke all on function public.record_download(uuid,uuid) from public;
grant execute on function public.record_download(uuid,uuid) to anon, authenticated;
