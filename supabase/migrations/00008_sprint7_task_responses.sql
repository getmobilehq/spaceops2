-- Sprint 7: Janitor Cleaning Execution — Task Item Responses

-- task_item_responses: tracks checklist completion per room_task
create table task_item_responses (
  id                uuid primary key default gen_random_uuid(),
  room_task_id      uuid not null references room_tasks(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id) on delete cascade,
  org_id            uuid not null references organisations(id),
  is_completed      boolean not null default false,
  photo_url         text,
  note              text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (room_task_id, checklist_item_id)
);

alter table task_item_responses enable row level security;

create policy "Org members can manage task item responses"
  on task_item_responses for all
  using (org_id = auth_org_id());

create trigger set_task_item_responses_updated_at
  before update on task_item_responses
  for each row execute function update_updated_at();

create index idx_task_item_responses_room_task
  on task_item_responses (room_task_id);

-- Storage bucket for cleaning photos
insert into storage.buckets (id, name, public)
values ('cleaning-photos', 'cleaning-photos', true)
on conflict (id) do nothing;

-- Storage policies for cleaning-photos bucket
create policy "Org members can upload cleaning photos"
  on storage.objects for insert
  with check (
    bucket_id = 'cleaning-photos'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.users where id = auth.uid()
    )
  );

create policy "Org members can view cleaning photos"
  on storage.objects for select
  using (
    bucket_id = 'cleaning-photos'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.users where id = auth.uid()
    )
  );

create policy "Org members can update cleaning photos"
  on storage.objects for update
  using (
    bucket_id = 'cleaning-photos'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.users where id = auth.uid()
    )
  );
