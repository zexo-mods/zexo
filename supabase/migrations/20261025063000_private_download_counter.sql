drop function if exists public.admin_moderate_add_on(uuid,text,text);
drop function if exists public.admin_set_file_scan_status(uuid,text);
drop function if exists public.record_download(uuid,uuid);

create or replace function private.increment_download_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.add_ons
  set download_count = download_count + 1
  where id = new.add_on_id;
  return new;
end;
$$;
revoke all on function private.increment_download_count() from public, anon, authenticated;

drop trigger if exists increment_add_on_download_count on public.downloads;
create trigger increment_add_on_download_count
after insert on public.downloads
for each row execute function private.increment_download_count();
