-- 전통놀이 마당 — Supabase SQL Editor에 통째로 붙여 넣고 Run.
-- 타자연습(type_game) 프로젝트를 같이 쓰기 때문에 모든 이름 앞에 madang_ 을 붙였다. 다른 표는 건드리지 않는다.

-- 계정당 한 줄: 모든 게임이 같이 쓰는 것 (포인트, 캐릭터)
create table public.madang_profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,16}$'),
  nickname text not null check (char_length(nickname) between 1 and 10),
  points bigint not null default 0 check (points >= 0),
  character text not null default 'kid',        -- 지금 쓰는 캐릭터
  chars jsonb not null default '{"kid": true}', -- 가진 캐릭터
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- (계정, 게임)당 한 줄: 그 게임에서만 쓰는 것. 순위에 쓰는 값(트로피, 레벨)은 따로 칸을 둔다.
-- 게임을 새로 추가해도 표를 고칠 필요 없이 game 값만 늘어난다 ('ttakji', 'tuho', ...).
create table public.madang_saves (
  user_id uuid not null references public.madang_profiles(id) on delete cascade,
  game text not null check (game ~ '^[a-z0-9_]{1,20}$'),
  trophies int not null default 0,
  level int not null default 1,
  data jsonb not null default '{}',             -- 아이템, 알바, 버프 등
  last_trophy_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

alter table public.madang_profiles enable row level security;
alter table public.madang_saves enable row level security;
create policy "내 프로필 보기" on public.madang_profiles for select using (auth.uid() = id);
create policy "내 프로필 만들기" on public.madang_profiles for insert with check (auth.uid() = id);
create policy "내 프로필 고치기" on public.madang_profiles for update using (auth.uid() = id);
create policy "내 저장 보기" on public.madang_saves for select using (auth.uid() = user_id);
create policy "내 저장 만들기" on public.madang_saves for insert with check (auth.uid() = user_id);
create policy "내 저장 고치기" on public.madang_saves for update using (auth.uid() = user_id);

-- 새 계정은 포인트 0, 꼬마 캐릭터로 시작. 아이디는 바꿀 수 없다.
create or replace function public.madang_profile_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.points := 0;
    new.character := 'kid';
    new.chars := '{"kid": true}';
  else
    new.username := old.username;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger madang_profile_guard before insert or update on public.madang_profiles
for each row execute function public.madang_profile_guard();

-- 순위 조작 막기 (게임 계산이 브라우저에서 돌아가서 완벽하진 않지만, 쉬운 조작은 막는다)
--  * 새 저장은 트로피 0, 레벨 1로 시작
--  * 트로피는 한 번에 1개씩만, 줄어들 수 없고, 1분에 1개보다 빨리 늘 수 없다
--  * 레벨은 1~20
create or replace function public.madang_save_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.trophies := 0;
    new.level := 1;
    new.last_trophy_at := null;
  else
    if new.trophies < old.trophies then
      new.trophies := old.trophies;
    elsif new.trophies > old.trophies then
      if new.trophies > old.trophies + 1
         or (old.last_trophy_at is not null and now() - old.last_trophy_at < interval '1 minute') then
        new.trophies := old.trophies;
      else
        new.last_trophy_at := now();
      end if;
    else
      new.last_trophy_at := old.last_trophy_at;
    end if;
  end if;
  new.level := least(greatest(new.level, 1), 20);
  new.updated_at := now();
  return new;
end $$;

create trigger madang_save_guard before insert or update on public.madang_saves
for each row execute function public.madang_save_guard();

-- 순위표: 닉네임·캐릭터·게임별 트로피·레벨만 공개 (아이디, 포인트, 저장 데이터는 비공개)
create view public.madang_leaderboard as
select p.id, p.nickname, p.character, s.game, s.trophies, s.level
from public.madang_saves s
join public.madang_profiles p on p.id = s.user_id;

grant select on public.madang_leaderboard to anon, authenticated;
