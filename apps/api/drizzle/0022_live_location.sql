-- LIVE location platform (additive). No DROP.

CREATE TABLE IF NOT EXISTS live_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  entity_kind text NOT NULL,
  external_id text NOT NULL,
  name text,
  status text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS live_entities_company_ext_uidx ON live_entities (company_id, entity_kind, external_id);
CREATE INDEX IF NOT EXISTS live_entities_company_kind_idx ON live_entities (company_id, entity_kind);

CREATE TABLE IF NOT EXISTS location_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  entity_id uuid NOT NULL REFERENCES live_entities(id),
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  accuracy numeric(10, 2),
  speed numeric(10, 2),
  heading numeric(6, 2),
  altitude numeric(10, 2),
  recorded_at timestamptz NOT NULL,
  battery_level numeric(5, 2),
  is_moving boolean NOT NULL DEFAULT false,
  device_id text,
  platform text,
  activity text,
  permission_status text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS location_samples_idem_uidx ON location_samples (company_id, idempotency_key);
CREATE INDEX IF NOT EXISTS location_samples_entity_time_idx ON location_samples (company_id, entity_id, recorded_at);

CREATE TABLE IF NOT EXISTS location_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  entity_id uuid NOT NULL REFERENCES live_entities(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  platform text,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS location_sessions_company_idx ON location_sessions (company_id, started_at);

CREATE TABLE IF NOT EXISTS live_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'depo',
  shape text NOT NULL DEFAULT 'circle',
  center_lat numeric(10, 7),
  center_lng numeric(10, 7),
  radius_meters integer,
  polygon jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_arrive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS live_geofences_company_idx ON live_geofences (company_id);

CREATE TABLE IF NOT EXISTS live_geofence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  geofence_id uuid NOT NULL REFERENCES live_geofences(id),
  entity_id uuid NOT NULL REFERENCES live_entities(id),
  event_type text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS live_geofence_events_company_idx ON live_geofence_events (company_id, created_at);

CREATE TABLE IF NOT EXISTS live_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  name text,
  entity_id uuid REFERENCES live_entities(id),
  distance_km numeric(10, 2),
  duration_min integer,
  geometry jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS live_routes_company_idx ON live_routes (company_id);

CREATE TABLE IF NOT EXISTS live_route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES live_routes(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  seq integer NOT NULL,
  label text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS live_route_stops_route_idx ON live_route_stops (route_id, seq);

CREATE TABLE IF NOT EXISTS live_tracking_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  token text NOT NULL,
  source text NOT NULL DEFAULT 'live',
  entity_id uuid REFERENCES live_entities(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS live_tracking_tokens_token_uidx ON live_tracking_tokens (token);
CREATE INDEX IF NOT EXISTS live_tracking_tokens_company_idx ON live_tracking_tokens (company_id);

CREATE TABLE IF NOT EXISTS mapbox_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  kind text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  day text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS mapbox_usage_company_kind_day_uidx ON mapbox_usage_counters (company_id, kind, day);
