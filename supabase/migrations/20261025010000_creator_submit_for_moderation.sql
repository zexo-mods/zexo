
drop policy if exists "Creators update own drafts" on public.mods;
create policy "Creators update own drafts" on public.mods
for update to authenticated
using ((creator_id = (select auth.uid()) and status in ('draft','changes_requested')) or (select private.is_admin()))
with check ((creator_id = (select auth.uid()) and status in ('draft','changes_requested','pending_review')) or (select private.is_admin()));
