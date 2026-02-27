-- Sprint 6: Cleaning Activities & Room Tasks

-- cleaning_activities: supervisor creates an activity for a floor on a date
create table cleaning_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  floor_id uuid not null references floors(id),
  created_by uuid not null references users(id),
  name text not null,
  status activity_status not null default 'draft',
  scheduled_date date not null,
  window_start time not null,
  window_end time not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cleaning_activities enable row level security;

create policy "Org members can manage activities"
  on cleaning_activities for all
  using (org_id = auth_org_id());

create trigger set_cleaning_activities_updated_at
  before update on cleaning_activities
  for each row execute function update_updated_at();

create index idx_cleaning_activities_org_date
  on cleaning_activities (org_id, scheduled_date);

create index idx_cleaning_activities_floor
  on cleaning_activities (floor_id);

-- room_tasks: one row per room within an activity
create table room_tasks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references cleaning_activities(id) on delete cascade,
  room_id uuid not null references rooms(id),
  assigned_to uuid references users(id),
  org_id uuid not null references organisations(id),
  status room_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, room_id)
);

alter table room_tasks enable row level security;

create policy "Org members can manage room tasks"
  on room_tasks for all
  using (org_id = auth_org_id());

create trigger set_room_tasks_updated_at
  before update on room_tasks
  for each row execute function update_updated_at();

create index idx_room_tasks_assigned
  on room_tasks (assigned_to, status);
