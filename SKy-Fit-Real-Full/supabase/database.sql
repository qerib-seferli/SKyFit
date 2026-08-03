begin;
create extension if not exists pgcrypto;

do $$ begin
 create type public.user_role as enum ('admin','staff','member');
exception when duplicate_object then null; end $$;
do $$ begin
 create type public.sale_mode as enum ('unit','portion');
exception when duplicate_object then null; end $$;
do $$ begin
 create type public.payment_status as enum ('paid','debt','cancelled','refunded');
exception when duplicate_object then null; end $$;
do $$ begin
 create type public.entry_type as enum ('income','expense');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles(
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid unique references auth.users(id) on delete set null,
 role public.user_role not null default 'member',
 full_name text not null default '',
 email text,
 phone text,
 birth_date date,
 address text,
 avatar_url text,
 is_manual boolean not null default false,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists profiles_auth_idx on public.profiles(auth_user_id) where auth_user_id is not null;

create table if not exists public.membership_plans(
 id uuid primary key default gen_random_uuid(), name text not null unique, price numeric(12,2) not null check(price>=0),
 duration_days integer not null check(duration_days>0), is_daily boolean not null default false, is_active boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.memberships(
 id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id) on delete cascade,
 plan_id uuid not null references public.membership_plans(id), start_date date not null, end_date date not null,
 price numeric(12,2) not null, status text not null default 'active', payment_status public.payment_status not null default 'paid',
 created_by uuid references public.profiles(id), created_at timestamptz default now()
);
create index if not exists memberships_member_idx on public.memberships(member_id,end_date desc);

create table if not exists public.attendance(
 id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id) on delete cascade,
 membership_id uuid references public.memberships(id) on delete set null, attendance_type text not null default 'membership',
 amount numeric(12,2) not null default 0, checked_in_at timestamptz not null default now(), created_by uuid references public.profiles(id)
);

create table if not exists public.products(
 id uuid primary key default gen_random_uuid(), name text not null, description text, sku text unique,
 image_url text, category text, sale_mode public.sale_mode not null default 'unit', stock_unit text not null default 'ədəd',
 stock_quantity numeric(14,3) not null default 0 check(stock_quantity>=0), portion_size numeric(14,3) not null default 1 check(portion_size>0),
 retail_price numeric(12,2) not null default 0 check(retail_price>=0), portion_price numeric(12,2) not null default 0 check(portion_price>=0),
 cost_price numeric(12,2) not null default 0 check(cost_price>=0), low_stock_threshold numeric(14,3) not null default 0,
 show_public boolean not null default true, is_active boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.stock_movements(
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 movement_type text not null check(movement_type in ('purchase','sale','adjustment','waste','return')),
 quantity numeric(14,3) not null, balance_after numeric(14,3) not null, unit_cost numeric(12,4) default 0,
 reference_id uuid, note text, created_by uuid references public.profiles(id), created_at timestamptz default now()
);

create table if not exists public.sales(
 id uuid primary key default gen_random_uuid(), receipt_no bigint generated always as identity,
 member_id uuid references public.profiles(id), subtotal numeric(12,2) not null, discount_amount numeric(12,2) not null default 0,
 total_amount numeric(12,2) not null, payment_method text not null default 'cash',
 payment_status public.payment_status not null default 'paid', notes text, created_by uuid references public.profiles(id), created_at timestamptz default now()
);
create table if not exists public.sale_items(
 id uuid primary key default gen_random_uuid(), sale_id uuid not null references public.sales(id) on delete cascade,
 product_id uuid not null references public.products(id), product_name text not null, quantity numeric(14,3) not null,
 stock_deduction numeric(14,3) not null, unit_price numeric(12,2) not null, line_total numeric(12,2) not null
);

create table if not exists public.debt_accounts(
 member_id uuid primary key references public.profiles(id) on delete cascade, balance numeric(12,2) not null default 0 check(balance>=0), updated_at timestamptz default now()
);
create table if not exists public.debt_transactions(
 id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id) on delete cascade,
 transaction_type text not null check(transaction_type in ('debt','payment','adjustment')), amount numeric(12,2) not null check(amount>0),
 reference_id uuid, note text, payment_method text, created_by uuid references public.profiles(id), created_at timestamptz default now()
);

create table if not exists public.ledger_entries(
 id uuid primary key default gen_random_uuid(), entry_type public.entry_type not null, category text not null, description text,
 amount numeric(12,2) not null check(amount>0), entry_date date not null default current_date, reference_type text, reference_id uuid,
 created_by uuid references public.profiles(id), created_at timestamptz default now()
);
create index if not exists ledger_date_idx on public.ledger_entries(entry_date,entry_type);

create table if not exists public.trainers(
 id uuid primary key default gen_random_uuid(), full_name text not null, specialty text, bio text, image_url text,
 phone text, instagram_url text, sort_order integer default 0, is_active boolean default true, created_at timestamptz default now()
);

create or replace function public.current_profile_id() returns uuid language sql stable security definer set search_path=public as $$
 select id from public.profiles where auth_user_id=auth.uid() limit 1
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where auth_user_id=auth.uid() and role in ('admin','staff') and is_active)
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,auth_user_id,full_name,email,phone,role)
 values(new.id,new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email,new.raw_user_meta_data->>'phone','member')
 on conflict(id) do update set auth_user_id=excluded.auth_user_id,email=excluded.email;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
drop trigger if exists profiles_touch on public.profiles; create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products; create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create or replace function public.process_sale(p_member_id uuid,p_payment_method text,p_payment_status public.payment_status,p_items jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_sale uuid;v_total numeric:=0;v_item jsonb;v_p public.products%rowtype;v_qty numeric;v_price numeric;v_deduct numeric;v_line numeric;v_staff uuid;
begin
 if not public.is_staff() then raise exception 'İcazə yoxdur'; end if;
 v_staff:=public.current_profile_id();
 if jsonb_array_length(p_items)=0 then raise exception 'Səbət boşdur'; end if;
 for v_item in select * from jsonb_array_elements(p_items) loop
  select * into v_p from public.products where id=(v_item->>'product_id')::uuid and is_active for update;
  if not found then raise exception 'Məhsul tapılmadı';end if;
  v_qty:=(v_item->>'quantity')::numeric; if v_qty<=0 then raise exception 'Miqdar yanlışdır';end if;
  v_price:=coalesce((v_item->>'unit_price')::numeric,case when v_p.sale_mode='portion' then v_p.portion_price else v_p.retail_price end);
  v_deduct:=case when v_p.sale_mode='portion' then v_qty*v_p.portion_size else v_qty end;
  if v_p.stock_quantity<v_deduct then raise exception '% üçün stok kifayət deyil',v_p.name;end if;
  v_total:=v_total+(v_qty*v_price);
 end loop;
 insert into public.sales(member_id,subtotal,total_amount,payment_method,payment_status,created_by)
 values(p_member_id,v_total,v_total,p_payment_method,p_payment_status,v_staff) returning id into v_sale;
 for v_item in select * from jsonb_array_elements(p_items) loop
  select * into v_p from public.products where id=(v_item->>'product_id')::uuid for update;
  v_qty:=(v_item->>'quantity')::numeric;v_price:=coalesce((v_item->>'unit_price')::numeric,case when v_p.sale_mode='portion' then v_p.portion_price else v_p.retail_price end);
  v_deduct:=case when v_p.sale_mode='portion' then v_qty*v_p.portion_size else v_qty end;v_line:=v_qty*v_price;
  update public.products set stock_quantity=stock_quantity-v_deduct where id=v_p.id;
  insert into public.sale_items(sale_id,product_id,product_name,quantity,stock_deduction,unit_price,line_total) values(v_sale,v_p.id,v_p.name,v_qty,v_deduct,v_price,v_line);
  insert into public.stock_movements(product_id,movement_type,quantity,balance_after,reference_id,created_by) values(v_p.id,'sale',-v_deduct,v_p.stock_quantity-v_deduct,v_sale,v_staff);
 end loop;
 if p_payment_status='paid' then
  insert into public.ledger_entries(entry_type,category,description,amount,entry_date,reference_type,reference_id,created_by)
  values('income','Məhsul satışı','POS satış',v_total,current_date,'sale',v_sale,v_staff);
 elsif p_payment_status='debt' then
  if p_member_id is null then raise exception 'Borc satışı üçün üzv seçilməlidir';end if;
  insert into public.debt_accounts(member_id,balance) values(p_member_id,v_total) on conflict(member_id) do update set balance=public.debt_accounts.balance+excluded.balance,updated_at=now();
  insert into public.debt_transactions(member_id,transaction_type,amount,reference_id,note,created_by) values(p_member_id,'debt',v_total,v_sale,'POS borc satışı',v_staff);
 end if;
 return v_sale;
end $$;

create or replace function public.add_stock(p_product_id uuid,p_quantity numeric,p_total_cost numeric,p_note text)
returns void language plpgsql security definer set search_path=public as $$
declare v_after numeric;v_staff uuid;
begin
 if not public.is_staff() then raise exception 'İcazə yoxdur';end if;if p_quantity<=0 then raise exception 'Miqdar sıfırdan böyük olmalıdır';end if;
 v_staff:=public.current_profile_id();update public.products set stock_quantity=stock_quantity+p_quantity where id=p_product_id returning stock_quantity into v_after;
 insert into public.stock_movements(product_id,movement_type,quantity,balance_after,unit_cost,note,created_by) values(p_product_id,'purchase',p_quantity,v_after,case when p_quantity>0 then p_total_cost/p_quantity else 0 end,p_note,v_staff);
 if p_total_cost>0 then insert into public.ledger_entries(entry_type,category,description,amount,entry_date,reference_type,created_by) values('expense','Məhsul alışı',p_note,p_total_cost,current_date,'stock',v_staff);end if;
end $$;

create or replace function public.create_membership(p_member_id uuid,p_plan_id uuid,p_start_date date,p_payment_status public.payment_status)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_plan public.membership_plans%rowtype;v_id uuid;v_end date;v_staff uuid;
begin
 if not public.is_staff() then raise exception 'İcazə yoxdur';end if;select * into v_plan from public.membership_plans where id=p_plan_id and is_active;
 if not found then raise exception 'Plan tapılmadı';end if;v_staff:=public.current_profile_id();v_end:=p_start_date+(v_plan.duration_days-1);
 update public.memberships set status='expired' where member_id=p_member_id and status='active';
 insert into public.memberships(member_id,plan_id,start_date,end_date,price,payment_status,created_by) values(p_member_id,p_plan_id,p_start_date,v_end,v_plan.price,p_payment_status,v_staff) returning id into v_id;
 if p_payment_status='paid' then insert into public.ledger_entries(entry_type,category,description,amount,entry_date,reference_type,reference_id,created_by) values('income','Abunəlik',v_plan.name,v_plan.price,current_date,'membership',v_id,v_staff);
 else insert into public.debt_accounts(member_id,balance) values(p_member_id,v_plan.price) on conflict(member_id) do update set balance=public.debt_accounts.balance+excluded.balance,updated_at=now();
 insert into public.debt_transactions(member_id,transaction_type,amount,reference_id,note,created_by) values(p_member_id,'debt',v_plan.price,v_id,'Abunəlik borcu',v_staff);end if;return v_id;
end $$;

create or replace function public.pay_debt(p_member_id uuid,p_amount numeric,p_method text)
returns void language plpgsql security definer set search_path=public as $$
declare v_balance numeric;v_staff uuid;
begin
 if not public.is_staff() then raise exception 'İcazə yoxdur';end if;v_staff:=public.current_profile_id();select balance into v_balance from public.debt_accounts where member_id=p_member_id for update;
 if v_balance is null or p_amount<=0 or p_amount>v_balance then raise exception 'Ödəniş məbləği yanlışdır';end if;
 update public.debt_accounts set balance=balance-p_amount,updated_at=now() where member_id=p_member_id;
 insert into public.debt_transactions(member_id,transaction_type,amount,payment_method,note,created_by) values(p_member_id,'payment',p_amount,p_method,'Borc ödənişi',v_staff);
 insert into public.ledger_entries(entry_type,category,description,amount,entry_date,reference_type,created_by) values('income','Borc ödənişi','Müştəri borc ödənişi',p_amount,current_date,'debt_payment',v_staff);
end $$;

insert into public.membership_plans(name,price,duration_days,is_daily) values
('Aylıq üzvlük',30,30,false),('Günlük giriş',3,1,true)
on conflict(name) do update set price=excluded.price,duration_days=excluded.duration_days;

alter table public.profiles enable row level security;alter table public.membership_plans enable row level security;alter table public.memberships enable row level security;alter table public.attendance enable row level security;alter table public.products enable row level security;alter table public.stock_movements enable row level security;alter table public.sales enable row level security;alter table public.sale_items enable row level security;alter table public.debt_accounts enable row level security;alter table public.debt_transactions enable row level security;alter table public.ledger_entries enable row level security;alter table public.trainers enable row level security;

drop policy if exists profiles_own_select on public.profiles;create policy profiles_own_select on public.profiles for select to authenticated using(auth_user_id=auth.uid() or public.is_staff());
drop policy if exists profiles_own_update on public.profiles;create policy profiles_own_update on public.profiles for update to authenticated using(auth_user_id=auth.uid() or public.is_staff()) with check(auth_user_id=auth.uid() or public.is_staff());
drop policy if exists profiles_staff_insert on public.profiles;create policy profiles_staff_insert on public.profiles for insert to authenticated with check(public.is_staff() or auth_user_id=auth.uid());
drop policy if exists public_products on public.products;create policy public_products on public.products for select to anon,authenticated using((show_public and is_active) or public.is_staff());
drop policy if exists staff_products on public.products;create policy staff_products on public.products for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists public_trainers on public.trainers;create policy public_trainers on public.trainers for select to anon,authenticated using(is_active or public.is_staff());
drop policy if exists staff_trainers on public.trainers;create policy staff_trainers on public.trainers for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists plans_read on public.membership_plans;create policy plans_read on public.membership_plans for select to authenticated using(true);
drop policy if exists plans_staff on public.membership_plans;create policy plans_staff on public.membership_plans for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists memberships_read on public.memberships;create policy memberships_read on public.memberships for select to authenticated using(member_id=public.current_profile_id() or public.is_staff());
drop policy if exists memberships_staff on public.memberships;create policy memberships_staff on public.memberships for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists attendance_read on public.attendance;create policy attendance_read on public.attendance for select to authenticated using(member_id=public.current_profile_id() or public.is_staff());
drop policy if exists attendance_staff on public.attendance;create policy attendance_staff on public.attendance for all to authenticated using(public.is_staff()) with check(public.is_staff());
drop policy if exists sales_read on public.sales;create policy sales_read on public.sales for select to authenticated using(member_id=public.current_profile_id() or public.is_staff());
drop policy if exists sale_items_read on public.sale_items;create policy sale_items_read on public.sale_items for select to authenticated using(exists(select 1 from public.sales s where s.id=sale_id and (s.member_id=public.current_profile_id() or public.is_staff())));
drop policy if exists debt_read on public.debt_accounts;create policy debt_read on public.debt_accounts for select to authenticated using(member_id=public.current_profile_id() or public.is_staff());
drop policy if exists debt_tx_read on public.debt_transactions;create policy debt_tx_read on public.debt_transactions for select to authenticated using(member_id=public.current_profile_id() or public.is_staff());
drop policy if exists staff_stock on public.stock_movements;create policy staff_stock on public.stock_movements for select to authenticated using(public.is_staff());
drop policy if exists staff_ledger on public.ledger_entries;create policy staff_ledger on public.ledger_entries for all to authenticated using(public.is_staff()) with check(public.is_staff());

insert into storage.buckets(id,name,public) values('avatars','avatars',true),('product-images','product-images',true),('trainer-images','trainer-images',true) on conflict(id) do update set public=true;
drop policy if exists storage_public_read on storage.objects;create policy storage_public_read on storage.objects for select to public using(bucket_id in ('avatars','product-images','trainer-images'));
drop policy if exists storage_auth_insert on storage.objects;create policy storage_auth_insert on storage.objects for insert to authenticated with check(bucket_id in ('avatars','product-images','trainer-images'));
drop policy if exists storage_owner_update on storage.objects;create policy storage_owner_update on storage.objects for update to authenticated using(owner_id=auth.uid() or public.is_staff());

grant execute on function public.process_sale(uuid,text,public.payment_status,jsonb) to authenticated;
grant execute on function public.add_stock(uuid,numeric,numeric,text) to authenticated;
grant execute on function public.create_membership(uuid,uuid,date,public.payment_status) to authenticated;
grant execute on function public.pay_debt(uuid,numeric,text) to authenticated;

do $$ begin
 alter publication supabase_realtime add table public.products,public.memberships,public.debt_accounts,public.ledger_entries;
exception when duplicate_object then null; end $$;
commit;
