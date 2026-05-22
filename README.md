# EcoNode — Power-Optimized Automation Dashboard

A polished single-page Next.js dashboard for a 5V regulated IoT node featuring dual-mode (Auto/Manual) climate and lighting control, with Supabase real-time sync.

## Stack

- **Next.js 14** (App Router) — Vercel-ready
- **React 18**
- **Tailwind CSS** — dark-mode-first, glass-morphism aesthetic
- **@supabase/supabase-js** — realtime postgres_changes subscriptions

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Supabase Schema

The dashboard expects two tables. Run this in the Supabase SQL editor:

```sql
-- Sensor telemetry (firmware writes here)
create table econode_telemetry (
  id          bigserial primary key,
  temperature numeric,           -- °C
  humidity    numeric,           -- %
  motion      boolean default false,
  is_dark     boolean default false,
  fan_on      boolean default false,   -- actual fan state (firmware decides in AUTO)
  light_on    boolean default false,   -- actual light state (firmware decides in AUTO)
  created_at  timestamptz default now()
);

-- Device settings (single-row config, id=1)
create table econode_device_settings (
  id              int primary key,
  mode            text check (mode in ('AUTO','MANUAL')) default 'AUTO',
  fan_override    boolean default false,
  light_override  boolean default false,
  updated_at      timestamptz default now()
);

insert into econode_device_settings (id, mode) values (1, 'AUTO');

-- Enable realtime
alter publication supabase_realtime add table econode_telemetry;
alter publication supabase_realtime add table econode_device_settings;
```

## How Modes Work

| Mode     | Fan / Light source                                  | Toggles in UI |
| -------- | --------------------------------------------------- | ------------- |
| `AUTO`   | `telemetry.fan_on` / `telemetry.light_on` (firmware decides via thresholds) | Disabled |
| `MANUAL` | `settings.fan_override` / `settings.light_override` (user controls)         | Enabled  |

The firmware on the 5V node should:

1. Read `mode` from `econode_device_settings` where `id = 1`.
2. In **AUTO**: apply threshold logic (28°C / 65% humidity for fan; motion + dark for light) and write the result to `econode_telemetry`.
3. In **MANUAL**: drive actuators from `fan_override` / `light_override`.

## File Tree

```
econode-dashboard/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js                  # Main dashboard
├── components/
│   ├── ClimateCard.js
│   ├── LightingCard.js
│   ├── ModeSwitch.js
│   ├── StatusPill.js
│   └── Toggle.js
├── lib/
│   └── supabaseClient.js
├── .env.local.example
├── jsconfig.json
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## Deploy to Vercel

Push to a Git repo, import on Vercel, then add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Project Settings → Environment Variables.
