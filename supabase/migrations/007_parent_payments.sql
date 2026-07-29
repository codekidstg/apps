-- ============================================================
-- 007 — Espace Parent + Paiements
-- ============================================================

-- ── parent_children ─────────────────────────────────────────
create table if not exists public.parent_children (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id)  on delete cascade,
  linked_by  uuid references public.profiles(id),          -- admin qui a fait le lien
  linked_at  timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ── parental_consents ────────────────────────────────────────
create table if not exists public.parental_consents (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.students(id)  on delete cascade,
  version     text not null default 'v1',
  consented_at timestamptz not null default now(),
  ip          text,
  user_agent  text,
  revoked_at  timestamptz,
  unique (parent_id, student_id, version)
);

-- ── subscription_plans ──────────────────────────────────────
create table if not exists public.subscription_plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  plan_type    text not null check (plan_type in ('freemium','premium','b2b')),
  price_fcfa   int  not null default 0,
  billing_cycle text not null check (billing_cycle in ('month','year','lifetime')) default 'month',
  features     jsonb not null default '[]',
  active       boolean not null default true
);

-- Plans par défaut
insert into public.subscription_plans (name, plan_type, price_fcfa, billing_cycle, features) values
  ('Freemium',       'freemium', 0,     'month',    '["2 premières leçons par zone","Avatar basique","Progression visible parent"]'),
  ('Premium Mensuel','premium',  2000,  'month',    '["Tout le contenu débloqué","Badges premium","Certificats PDF","Avatars exclusifs"]'),
  ('Premium Annuel', 'premium',  18000, 'year',     '["Tout le contenu débloqué","Badges premium","Certificats PDF","Avatars exclusifs","2 mois offerts"]'),
  ('Licence École',  'b2b',      0,     'lifetime', '["Par classe ou école","Rapports CSV","Support prioritaire"]')
on conflict do nothing;

-- ── subscriptions ────────────────────────────────────────────
create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.students(id)  on delete cascade,
  plan_id     uuid not null references public.subscription_plans(id),
  status      text not null check (status in ('trial','active','cancelled','expired')) default 'trial',
  provider    text not null check (provider in ('cinetpay','cash','b2b','free')) default 'free',
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ── payments ─────────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  parent_id       uuid not null references public.profiles(id) on delete cascade,
  amount_fcfa     int  not null,
  provider        text not null check (provider in ('cinetpay','cash','b2b')),
  provider_tx_id  text,
  status          text not null check (status in ('pending','success','failed')) default 'pending',
  -- cash fields
  cash_date       date,
  cash_ref        text,
  cash_note       text,
  cash_validated_by uuid references public.profiles(id),
  cash_validated_at timestamptz,
  -- webhook
  webhook_payload jsonb,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── certificates ────────────────────────────────────────────
create table if not exists public.certificates (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id) on delete cascade,
  theme_id        uuid references public.themes(id) on delete set null,
  level_num       int,                                    -- null = certificat thème, int = diplôme niveau
  cert_type       text not null check (cert_type in ('theme','level')),
  score           numeric(5,2),
  total_xp        int,
  issued_at       timestamptz not null default now(),
  validated_by    uuid references public.profiles(id),    -- prof qui valide
  validated_at    timestamptz,
  pdf_path        text,                                   -- chemin Supabase Storage
  verify_hash     text,                                   -- SHA-256 court
  revoked         boolean not null default false,
  unique (student_id, theme_id, cert_type)
);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.parent_children     enable row level security;
alter table public.parental_consents   enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.payments            enable row level security;
alter table public.certificates        enable row level security;

-- parent_children
drop policy if exists "admin_parent_children"   on public.parent_children;
drop policy if exists "parent_read_own_children" on public.parent_children;
create policy "admin_parent_children"    on public.parent_children for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_read_own_children" on public.parent_children for select
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- parental_consents
drop policy if exists "admin_consents"  on public.parental_consents;
drop policy if exists "parent_consents" on public.parental_consents;
create policy "admin_consents"  on public.parental_consents for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_consents" on public.parental_consents for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- subscriptions
drop policy if exists "admin_subscriptions"  on public.subscriptions;
drop policy if exists "parent_subscriptions" on public.subscriptions;
create policy "admin_subscriptions"  on public.subscriptions for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_subscriptions" on public.subscriptions for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- payments
drop policy if exists "admin_payments"  on public.payments;
drop policy if exists "parent_payments" on public.payments;
create policy "admin_payments"  on public.payments for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_payments" on public.payments for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- certificates
drop policy if exists "admin_certificates"   on public.certificates;
drop policy if exists "teacher_certificates" on public.certificates;
drop policy if exists "parent_certificates"  on public.certificates;
drop policy if exists "student_certificates" on public.certificates;
create policy "admin_certificates"   on public.certificates for all
  using (get_my_role() in ('admin','manager'));
create policy "teacher_certificates" on public.certificates for all
  using (get_my_role() = 'teacher');
create policy "student_certificates" on public.certificates for select
  using (get_my_role() = 'student'
    and student_id in (select id from public.students where profile_id = auth.uid()));
create policy "parent_certificates"  on public.certificates for select
  using (get_my_role() = 'parent'
    and student_id in (
      select pc.student_id from public.parent_children pc where pc.parent_id = auth.uid()
    ));
