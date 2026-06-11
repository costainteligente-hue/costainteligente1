-- ============================================================
-- Costa Inteligente — Initial Schema
-- Migration 001: All tables, indexes, constraints and triggers
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'client'
                CHECK (role IN ('client', 'provider', 'admin')),
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  notification_prefs JSONB DEFAULT
    '{"weather": true, "vedas": true, "general": true}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ── providers ─────────────────────────────────────────────────
CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 3 AND 100),
  service_type    TEXT NOT NULL,
  rfc             TEXT NOT NULL CHECK (char_length(rfc) BETWEEN 12 AND 13),
  phone           TEXT NOT NULL CHECK (phone ~ '^\d{10}$'),
  address         TEXT NOT NULL CHECK (char_length(address) BETWEEN 10 AND 200),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_providers_status  ON providers(status);
CREATE INDEX idx_providers_user_id ON providers(user_id);

-- ── provider_services ─────────────────────────────────────────
CREATE TABLE provider_services (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id    UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  module_type    TEXT NOT NULL CHECK (module_type IN (
    'boat','guide','sport','rental',
    'restaurant','store','fishMarket','transport'
  )),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description    TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  capacity       INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500),
  schedule_start TIME NOT NULL,
  schedule_end   TIME NOT NULL,
  photo_urls     TEXT[]  DEFAULT ARRAY[]::TEXT[],
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT schedule_check CHECK (schedule_end > schedule_start)
);
CREATE INDEX idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX idx_provider_services_status   ON provider_services(status);

-- ── species ───────────────────────────────────────────────────
CREATE TABLE species (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  local_name  TEXT,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── fishing_zones ─────────────────────────────────────────────
CREATE TABLE fishing_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) BETWEEN 10 AND 1000),
  latitude    DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude   DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  level       TEXT NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  zone_type   TEXT NOT NULL,
  lures       TEXT[]  DEFAULT ARRAY[]::TEXT[],
  baits       TEXT[]  DEFAULT ARRAY[]::TEXT[],
  optimal_hours TEXT,
  photo_urls  TEXT[]  DEFAULT ARRAY[]::TEXT[],
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_zones_active ON fishing_zones(is_active);
CREATE INDEX idx_zones_level  ON fishing_zones(level);

-- ── zone_fish ─────────────────────────────────────────────────
CREATE TABLE zone_fish (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id     UUID NOT NULL REFERENCES fishing_zones(id) ON DELETE CASCADE,
  species_id  UUID NOT NULL REFERENCES species(id)       ON DELETE CASCADE,
  probability TEXT NOT NULL CHECK (probability IN ('probable','posible')),
  UNIQUE (zone_id, species_id)
);
CREATE INDEX idx_zone_fish_zone ON zone_fish(zone_id);

-- ── monthly_seasons ───────────────────────────────────────────
CREATE TABLE monthly_seasons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month               INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  species_id          UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  probability         TEXT NOT NULL CHECK (probability IN ('probable','posible')),
  suggested_zone_ids  UUID[]  DEFAULT ARRAY[]::UUID[],
  veda_start          DATE,
  veda_end            DATE,
  UNIQUE (month, species_id),
  CONSTRAINT veda_dates CHECK (
    (veda_start IS NULL AND veda_end IS NULL)
    OR (veda_start IS NOT NULL AND veda_end IS NOT NULL AND veda_end > veda_start)
  )
);
CREATE INDEX idx_seasons_month ON monthly_seasons(month);

-- ── zone_reviews ──────────────────────────────────────────────
CREATE TABLE zone_reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id    UUID NOT NULL REFERENCES fishing_zones(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT CHECK (char_length(comment) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (zone_id, user_id)
);
CREATE INDEX idx_reviews_zone ON zone_reviews(zone_id);

-- ── provider_availability ─────────────────────────────────────
CREATE TABLE provider_availability (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id   UUID NOT NULL REFERENCES provider_services(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (service_id, blocked_date)
);
CREATE INDEX idx_avail_service_date ON provider_availability(service_id, blocked_date);

-- ── reservations ──────────────────────────────────────────────
CREATE TABLE reservations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES profiles(id),
  service_id       UUID NOT NULL REFERENCES provider_services(id),
  provider_id      UUID NOT NULL REFERENCES providers(id),
  reservation_date DATE NOT NULL,
  party_size       INTEGER NOT NULL CHECK (party_size >= 1),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','confirmed','rejected','rescheduled','completed','cancelled'
  )),
  rejection_reason TEXT CHECK (
    rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 10 AND 200
  ),
  proposed_date    DATE,
  payment_status   TEXT DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid','failed')),
  amount           NUMERIC(10,2),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_res_client   ON reservations(client_id);
CREATE INDEX idx_res_provider ON reservations(provider_id);
CREATE INDEX idx_res_service  ON reservations(service_id);
CREATE INDEX idx_res_status   ON reservations(status);
CREATE INDEX idx_res_date     ON reservations(reservation_date);

-- ── payments ──────────────────────────────────────────────────
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id   UUID NOT NULL REFERENCES reservations(id),
  mp_payment_id    TEXT UNIQUE NOT NULL,
  mp_preference_id TEXT,
  amount           NUMERIC(10,2) NOT NULL,
  currency         TEXT DEFAULT 'MXN',
  status           TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_res ON payments(reservation_id);
CREATE INDEX idx_payments_mp  ON payments(mp_payment_id);

-- ── messages ──────────────────────────────────────────────────
CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL REFERENCES profiles(id),
  content        TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  sent_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_msg_reservation ON messages(reservation_id);
CREATE INDEX idx_msg_sent_at     ON messages(sent_at);

-- ── community_posts ───────────────────────────────────────────
CREATE TABLE community_posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  species_id UUID REFERENCES species(id),
  zone_id    UUID REFERENCES fishing_zones(id),
  photo_urls TEXT[] NOT NULL,
  weight_kg  NUMERIC(6,2) CHECK (weight_kg > 0),
  catch_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_user ON community_posts(user_id);
CREATE INDEX idx_posts_date ON community_posts(catch_date DESC);

-- ── user_favorites ────────────────────────────────────────────
CREATE TABLE user_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  zone_id    UUID NOT NULL REFERENCES fishing_zones(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, zone_id)
);
CREATE INDEX idx_favs_user ON user_favorites(user_id);

-- ── alerts ────────────────────────────────────────────────────
CREATE TABLE alerts (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  type     TEXT NOT NULL CHECK (type IN ('weather','veda','general')),
  title    TEXT NOT NULL CHECK (char_length(title)   BETWEEN 3  AND 100),
  message  TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 500),
  sent_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── reports ───────────────────────────────────────────────────
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('provider','post','user')),
  target_id   UUID NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
  resolved_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reports_status ON reports(status);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_date  ON audit_logs(created_at DESC);

-- ── push_tokens ───────────────────────────────────────────────
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT CHECK (platform IN ('ios','android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);
CREATE INDEX idx_tokens_user ON push_tokens(user_id);

-- ── equipment ─────────────────────────────────────────────────
CREATE TABLE equipment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  recommended_use TEXT,
  image_url       TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── tutorials ─────────────────────────────────────────────────
CREATE TABLE tutorials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  level       TEXT CHECK (level IN ('principiante','intermedio','avanzado')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── promotions ────────────────────────────────────────────────
CREATE TABLE promotions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id      UUID NOT NULL REFERENCES providers(id)         ON DELETE CASCADE,
  service_id       UUID NOT NULL REFERENCES provider_services(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title)       BETWEEN 3  AND 100),
  description      TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 300),
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT promo_dates CHECK (end_date > start_date)
);
CREATE INDEX idx_promos_service ON promotions(service_id);
CREATE INDEX idx_promos_status  ON promotions(status);

-- ── Trigger: auto-create profile on new auth user ────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Helper: get current user role ────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
