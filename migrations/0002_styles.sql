create table if not exists styles (
  id           serial primary key,
  code         text not null unique,
  aliases      jsonb not null default '[]'::jsonb,
  colors       jsonb not null default '[]'::jsonb,
  size_range   text not null default '',
  price        double precision,
  composition  text not null default '',
  weight       text not null default '',
  standard     text not null default '',
  safety       text not null default '',
  note         text not null default '',
  category     text not null default '上衣',
  season       text not null default '26冬',
  photo        text not null default '',
  listed       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create index if not exists styles_season_idx on styles (season);
create index if not exists styles_listed_idx on styles (listed);
