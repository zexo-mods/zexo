-- Split ALL policies into single actions to avoid duplicate permissive policy evaluation.
drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins insert roles" on public.user_roles for insert to authenticated with check ((select private.is_admin()));
create policy "admins update roles" on public.user_roles for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete roles" on public.user_roles for delete to authenticated using ((select private.is_admin()));

drop policy if exists "creators manage own creator profile" on public.creator_profiles;
create policy "creators insert own creator profile" on public.creator_profiles for insert to authenticated
with check ((user_id = (select auth.uid()) and verification_status in ('unverified','pending')) or (select private.is_admin()));
create policy "creators update own creator profile" on public.creator_profiles for update to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check ((user_id = (select auth.uid()) and verification_status in ('unverified','pending')) or (select private.is_admin()));
create policy "creators delete own creator profile" on public.creator_profiles for delete to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "admins manage categories" on public.categories;
create policy "admins insert categories" on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy "admins update categories" on public.categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete categories" on public.categories for delete to authenticated using ((select private.is_admin()));

drop policy if exists "creators manage own images" on public.add_on_images;
create policy "creators insert own images" on public.add_on_images for insert to authenticated with check (
  exists (select 1 from public.add_ons a where a.id = add_on_id and (a.creator_id = (select auth.uid()) or (select private.is_admin())))
);
create policy "creators update own images" on public.add_on_images for update to authenticated using (
  exists (select 1 from public.add_ons a where a.id = add_on_id and (a.creator_id = (select auth.uid()) or (select private.is_admin())))
) with check (
  exists (select 1 from public.add_ons a where a.id = add_on_id and (a.creator_id = (select auth.uid()) or (select private.is_admin())))
);
create policy "creators delete own images" on public.add_on_images for delete to authenticated using (
  exists (select 1 from public.add_ons a where a.id = add_on_id and (a.creator_id = (select auth.uid()) or (select private.is_admin())))
);

drop policy if exists "admins manage reports" on public.reports;
create policy "admins update reports" on public.reports for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete reports" on public.reports for delete to authenticated using ((select private.is_admin()));
