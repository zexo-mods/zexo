-- Admin-only moderation RPCs. The functions validate the caller before using elevated privileges.
create or replace function public.admin_moderate_add_on(
  p_add_on_id uuid,
  p_action text,
  p_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator uuid;
  v_next_status text;
begin
  if not (select private.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select creator_id into v_creator
  from public.add_ons
  where id = p_add_on_id
  for update;

  if v_creator is null then
    raise exception 'Add-on not found';
  end if;

  case p_action
    when 'approve' then v_next_status := 'approved';
    when 'publish' then v_next_status := 'published';
    when 'request_changes' then v_next_status := 'changes_requested';
    when 'reject' then v_next_status := 'rejected';
    when 'suspend' then v_next_status := 'suspended';
    when 'restore' then v_next_status := 'published';
    else raise exception 'Unsupported moderation action';
  end case;

  if v_next_status = 'published' and not exists (
    select 1 from public.add_on_files
    where add_on_id = p_add_on_id and scan_status = 'clean'
  ) then
    raise exception 'Cannot publish: no file has passed the safety review';
  end if;

  update public.add_ons
  set status = v_next_status,
      moderation_feedback = nullif(p_reason, ''),
      published_at = case when v_next_status = 'published' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = p_add_on_id;

  insert into public.moderation_events (admin_id, add_on_id, action, reason)
  values ((select auth.uid()), p_add_on_id, p_action, coalesce(p_reason, ''));

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), p_action, 'add_on', p_add_on_id::text, jsonb_build_object('reason', coalesce(p_reason, '')));

  insert into public.notifications (user_id, title, message)
  values (
    v_creator,
    'Add-on review update',
    case p_action
      when 'publish' then 'Your add-on is now published on ZEXO.'
      when 'request_changes' then 'The review team requested changes to your add-on.'
      when 'reject' then 'Your add-on submission was rejected.'
      when 'suspend' then 'Your add-on has been suspended.'
      when 'restore' then 'Your add-on has been restored.'
      else 'Your add-on review status has been updated.'
    end
  );
end;
$$;
revoke all on function public.admin_moderate_add_on(uuid,text,text) from public, anon;
grant execute on function public.admin_moderate_add_on(uuid,text,text) to authenticated;

create or replace function public.admin_set_file_scan_status(
  p_file_id uuid,
  p_scan_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_scan_status not in ('clean','quarantined','rejected') then
    raise exception 'Unsupported scan status';
  end if;

  update public.add_on_files
  set scan_status = p_scan_status
  where id = p_file_id;

  if not found then
    raise exception 'File not found';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), 'file_scan_' || p_scan_status, 'add_on_file', p_file_id::text, '{}'::jsonb);
end;
$$;
revoke all on function public.admin_set_file_scan_status(uuid,text) from public, anon;
grant execute on function public.admin_set_file_scan_status(uuid,text) to authenticated;
