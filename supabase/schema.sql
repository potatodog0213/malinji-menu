-- Supabase Dashboard > SQL Editor 執行此檔
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null check (price >= 0),
  category text not null check (category in ('牛&豬肉類','羊肉&鴨肉類','雞肉類','海鮮類','蔬菜類','碳烤伴餐類','炸物類','飲品類')),
  category_order integer not null,
  created_at timestamptz not null default now()
);
create table if not exists public.store_settings (
  id integer primary key check (id=1),
  address text not null default '請輸入店面地址',
  hours text not null default '營業時間：17:30~24:00',
  notice text not null default '以現場點餐叫號碼牌為主',
  holiday text not null default '公休日：星期三',
  line_url text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.store_settings(id) values(1) on conflict(id) do nothing;

alter table public.menu_items enable row level security;
alter table public.store_settings enable row level security;

create policy "public read menu" on public.menu_items for select using(true);
create policy "authenticated insert menu" on public.menu_items for insert to authenticated with check(true);
create policy "authenticated update menu" on public.menu_items for update to authenticated using(true) with check(true);
create policy "authenticated delete menu" on public.menu_items for delete to authenticated using(true);

create policy "public read store" on public.store_settings for select using(true);
create policy "authenticated insert store" on public.store_settings for insert to authenticated with check(true);
create policy "authenticated update store" on public.store_settings for update to authenticated using(true) with check(true);

-- 在 Authentication > Users 手動建立管理員帳號。
-- 建議關閉公開註冊。不可將 service_role key 放進 HTML/JS。