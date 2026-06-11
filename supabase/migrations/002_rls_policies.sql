-- ============================================================
-- Costa Inteligente — RLS Policies
-- Migration 002: Row Level Security for all tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_zones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_fish           ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_seasons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE species             ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ── providers ─────────────────────────────────────────────────
CREATE POLICY "providers_select"
  ON providers FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role() = 'admin'
    OR (status = 'approved' AND get_user_role() = 'client')
  );

CREATE POLICY "providers_insert"
  ON providers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "providers_update"
  ON providers FOR UPDATE
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- ── provider_services ─────────────────────────────────────────
CREATE POLICY "services_select"
  ON provider_services FOR SELECT
  USING (
    get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
    OR (
      status = 'active'
      AND EXISTS (
        SELECT 1 FROM providers p
        WHERE p.id = provider_id AND p.status = 'approved'
      )
    )
  );

CREATE POLICY "services_write"
  ON provider_services FOR ALL
  USING (
    get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

-- ── fishing_zones ─────────────────────────────────────────────
CREATE POLICY "zones_select"
  ON fishing_zones FOR SELECT
  USING (is_active = TRUE OR get_user_role() = 'admin');

CREATE POLICY "zones_write"
  ON fishing_zones FOR ALL
  USING (get_user_role() = 'admin');

-- ── zone_fish ─────────────────────────────────────────────────
CREATE POLICY "zone_fish_select"
  ON zone_fish FOR SELECT
  USING (TRUE);

CREATE POLICY "zone_fish_write"
  ON zone_fish FOR ALL
  USING (get_user_role() = 'admin');

-- ── species ───────────────────────────────────────────────────
CREATE POLICY "species_select"
  ON species FOR SELECT USING (TRUE);

CREATE POLICY "species_write"
  ON species FOR ALL
  USING (get_user_role() = 'admin');

-- ── monthly_seasons ───────────────────────────────────────────
CREATE POLICY "seasons_select"
  ON monthly_seasons FOR SELECT USING (TRUE);

CREATE POLICY "seasons_write"
  ON monthly_seasons FOR ALL
  USING (get_user_role() = 'admin');

-- ── zone_reviews ──────────────────────────────────────────────
CREATE POLICY "reviews_select"
  ON zone_reviews FOR SELECT USING (TRUE);

CREATE POLICY "reviews_insert"
  ON zone_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update"
  ON zone_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "reviews_delete"
  ON zone_reviews FOR DELETE
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- ── provider_availability ─────────────────────────────────────
CREATE POLICY "avail_select"
  ON provider_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_services ps
      JOIN providers p ON p.id = ps.provider_id
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
    OR get_user_role() IN ('admin','client')
  );

CREATE POLICY "avail_write"
  ON provider_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM provider_services ps
      JOIN providers p ON p.id = ps.provider_id
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
    OR get_user_role() = 'admin'
  );

-- ── reservations ──────────────────────────────────────────────
CREATE POLICY "res_select"
  ON reservations FOR SELECT
  USING (
    client_id = auth.uid()
    OR get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "res_insert"
  ON reservations FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "res_update"
  ON reservations FOR UPDATE
  USING (
    client_id = auth.uid()
    OR get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

-- ── payments ──────────────────────────────────────────────────
CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (
    get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
      AND (
        r.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM providers p
          WHERE p.id = r.provider_id AND p.user_id = auth.uid()
        )
      )
    )
  );

-- ── messages ──────────────────────────────────────────────────
CREATE POLICY "msg_access"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
      AND (
        r.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM providers p
          WHERE p.id = r.provider_id AND p.user_id = auth.uid()
        )
      )
    )
  );

-- ── community_posts ───────────────────────────────────────────
CREATE POLICY "posts_select"
  ON community_posts FOR SELECT USING (TRUE);

CREATE POLICY "posts_insert"
  ON community_posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_delete"
  ON community_posts FOR DELETE
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- ── user_favorites ────────────────────────────────────────────
CREATE POLICY "favs_all"
  ON user_favorites FOR ALL
  USING (user_id = auth.uid());

-- ── alerts ────────────────────────────────────────────────────
CREATE POLICY "alerts_select"
  ON alerts FOR SELECT USING (TRUE);

CREATE POLICY "alerts_write"
  ON alerts FOR ALL
  USING (get_user_role() = 'admin');

-- ── reports ───────────────────────────────────────────────────
CREATE POLICY "reports_select"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "reports_insert"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update"
  ON reports FOR UPDATE
  USING (get_user_role() = 'admin');

-- ── audit_logs ────────────────────────────────────────────────
CREATE POLICY "audit_select"
  ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "audit_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- ── push_tokens ───────────────────────────────────────────────
CREATE POLICY "tokens_all"
  ON push_tokens FOR ALL
  USING (user_id = auth.uid());

-- ── equipment & tutorials ─────────────────────────────────────
CREATE POLICY "equipment_select"
  ON equipment FOR SELECT
  USING (is_active = TRUE OR get_user_role() = 'admin');

CREATE POLICY "equipment_write"
  ON equipment FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "tutorials_select"
  ON tutorials FOR SELECT
  USING (is_active = TRUE OR get_user_role() = 'admin');

CREATE POLICY "tutorials_write"
  ON tutorials FOR ALL
  USING (get_user_role() = 'admin');

-- ── promotions ────────────────────────────────────────────────
CREATE POLICY "promos_select"
  ON promotions FOR SELECT
  USING (
    status = 'active'
    OR get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "promos_write"
  ON promotions FOR ALL
  USING (
    get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );
