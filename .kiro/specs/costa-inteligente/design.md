# Documento de Diseño Técnico — Costa Inteligente

## 1. Resumen Ejecutivo

### Propuesta de valor
Costa Inteligente conecta a pescadores y turistas costeros de México con zonas de pesca verificadas, guías locales y servicios náuticos, ofreciendo información meteorológica en tiempo real, calendario de temporadas y un módulo SOS de emergencia. Para los proveedores, es un canal digital de reservaciones y pagos que no requiere infraestructura web propia.

### Problema que resuelve
- Los pescadores locales y turistas no tienen información centralizada y confiable sobre zonas de pesca, temporadas y vedas en Zihuatanejo.
- Los negocios costeros (pescadores de lancha, guías, restaurantes) operan sin presencia digital ni sistema de reservaciones.
- No existe una herramienta de emergencia contextualizada para usuarios en el mar.

### Métricas de éxito del MVP (primeros 3 meses)
| Métrica | Objetivo |
|---|---|
| Clientes registrados | ≥ 200 |
| Proveedores verificados activos | ≥ 15 |
| Reservaciones completadas | ≥ 50 |
| Calificación media en tiendas | ≥ 4.0 estrellas |
| Crash-free sessions | ≥ 99% |
| Costo infraestructura mensual | < $20 USD |

---

## 2. Arquitectura del Sistema

### Diagrama de capas

```
┌─────────────────────────────────────────────────┐
│              REACT NATIVE (Expo SDK 52+)         │
│  Expo Router · NativeWind · Zustand · TanStack   │
│  Query · react-native-maps · Expo Notifications  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────┐
│                    SUPABASE                       │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │PostrgreSQL│ │  Auth    │ │    Storage      │  │
│  │  + RLS   │ │  (JWT)   │ │  (4 buckets)    │  │
│  └──────────┘ └──────────┘ └─────────────────┘  │
│  ┌──────────────────────────────────────────┐    │
│  │         Edge Functions (Deno)             │    │
│  │  get-weather · send-push-notification     │    │
│  │  create-payment-preference                │    │
│  │  mercadopago-webhook                      │    │
│  │  deactivate-expired-promotions            │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │         Supabase Realtime                 │    │
│  │  (messages, reservations, metrics)        │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              SERVICIOS EXTERNOS                   │
│  Open-Meteo API  ·  Mercado Pago  ·  Expo Push   │
│  OpenStreetMap tiles  ·  YouTube embed            │
└─────────────────────────────────────────────────┘
```

### Supabase Storage — Buckets

| Bucket | Acceso | Descripción |
|---|---|---|
| `avatars` | Authenticated | Fotos de perfil de usuarios |
| `zone-photos` | Public read | Fotografías de zonas de pesca |
| `verification-docs` | Private (admin only) | Documentos RFC/verificación de proveedores |
| `community-posts` | Public read / Auth write | Fotos de capturas de la comunidad |
| `service-photos` | Public read / Auth write | Fotos de servicios de proveedores |

### Edge Functions

| Función | Trigger | Descripción |
|---|---|---|
| `get-weather` | HTTP GET | Consulta Open-Meteo API para Zihuatanejo, cachea 60 min |
| `send-push-notification` | HTTP POST interno | Envía notificaciones Expo Push a lotes de tokens |
| `create-payment-preference` | HTTP POST | Genera preferencia de pago en Mercado Pago |
| `mercadopago-webhook` | HTTP POST (webhook) | Valida firma HMAC y procesa eventos de pago |
| `deactivate-expired-promotions` | Cron (00:01 CDMX diario) | Desactiva promociones con `end_date` pasada |

### Flujo de autenticación

```
1. App inicia → supabase.auth.getSession()
2. Si sesión válida → refresh automático cada 50 min
3. Si no hay sesión → redirigir a /auth/login
4. Login email/pass → supabase.auth.signInWithPassword()
5. Login Google → Expo AuthSession → supabase.auth.signInWithIdToken()
6. Post-login → leer tabla profiles → determinar rol → redirigir a dashboard correspondiente
7. Logout → supabase.auth.signOut() → limpiar Zustand → Secure Store
```

---

## 3. Esquema de Base de Datos

### Tablas principales

```sql
-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfiles extendidos (vinculado a auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  notification_prefs JSONB DEFAULT '{"weather": true, "vedas": true, "general": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Proveedores
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 3 AND 100),
  service_type TEXT NOT NULL,
  rfc TEXT NOT NULL CHECK (char_length(rfc) BETWEEN 12 AND 13),
  phone TEXT NOT NULL CHECK (phone ~ '^\d{10}$'),
  address TEXT NOT NULL CHECK (char_length(address) BETWEEN 10 AND 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_user_id ON providers(user_id);

-- Servicios de proveedores (8 módulos)
CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN (
    'pescador_lancha','guia_pesca','pesca_deportiva','renta_embarcacion',
    'restaurante_mariscos','tienda_pesca','pescaderia','transporte_turistico'
  )),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500),
  schedule_start TIME NOT NULL,
  schedule_end TIME NOT NULL,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT schedule_check CHECK (schedule_end > schedule_start)
);
CREATE INDEX idx_provider_services_provider_id ON provider_services(provider_id);
CREATE INDEX idx_provider_services_status ON provider_services(status);

-- Especies
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  local_name TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zonas de pesca
CREATE TABLE fishing_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) BETWEEN 10 AND 1000),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  level TEXT NOT NULL CHECK (level IN ('principiante', 'intermedio', 'avanzado')),
  zone_type TEXT NOT NULL,
  lures TEXT[] DEFAULT ARRAY[]::TEXT[],
  baits TEXT[] DEFAULT ARRAY[]::TEXT[],
  optimal_hours TEXT,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fishing_zones_is_active ON fishing_zones(is_active);
CREATE INDEX idx_fishing_zones_level ON fishing_zones(level);

-- Relación zona-especie
CREATE TABLE zone_fish (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES fishing_zones(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  probability TEXT NOT NULL CHECK (probability IN ('probable', 'posible')),
  UNIQUE(zone_id, species_id)
);
CREATE INDEX idx_zone_fish_zone_id ON zone_fish(zone_id);

-- Temporadas mensuales
CREATE TABLE monthly_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  species_id UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  probability TEXT NOT NULL CHECK (probability IN ('probable', 'posible')),
  suggested_zone_ids UUID[] DEFAULT ARRAY[]::UUID[],
  veda_start DATE,
  veda_end DATE,
  UNIQUE(month, species_id),
  CONSTRAINT veda_dates_check CHECK (
    (veda_start IS NULL AND veda_end IS NULL) OR
    (veda_start IS NOT NULL AND veda_end IS NOT NULL AND veda_end > veda_start)
  )
);
CREATE INDEX idx_monthly_seasons_month ON monthly_seasons(month);

-- Reseñas de zonas
CREATE TABLE zone_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES fishing_zones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zone_id, user_id)
);
CREATE INDEX idx_zone_reviews_zone_id ON zone_reviews(zone_id);

-- Disponibilidad del proveedor
CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES provider_services(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, blocked_date)
);
CREATE INDEX idx_availability_service_date ON provider_availability(service_id, blocked_date);

-- Reservaciones
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES provider_services(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  reservation_date DATE NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size >= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','confirmed','rejected','rescheduled','completed','cancelled')
  ),
  rejection_reason TEXT CHECK (
    rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 10 AND 200
  ),
  proposed_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending','paid','failed')
  ),
  amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reservations_client_id ON reservations(client_id);
CREATE INDEX idx_reservations_provider_id ON reservations(provider_id);
CREATE INDEX idx_reservations_service_id ON reservations(service_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);

-- Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  mp_payment_id TEXT UNIQUE NOT NULL,
  mp_preference_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_mp_payment_id ON payments(mp_payment_id);

-- Mensajes de chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_reservation_id ON messages(reservation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- Publicaciones de comunidad
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id UUID REFERENCES species(id),
  zone_id UUID REFERENCES fishing_zones(id),
  photo_urls TEXT[] NOT NULL,
  weight_kg NUMERIC(6,2) CHECK (weight_kg > 0),
  catch_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

-- Favoritos del usuario
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES fishing_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, zone_id)
);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);

-- Alertas del administrador
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('weather','veda','general')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 500),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reportes y denuncias
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('provider','post','user')),
  target_id UUID NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reports_status ON reports(status);

-- Logs de auditoría
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Tokens push
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT CHECK (platform IN ('ios','android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- Equipo recomendado
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  recommended_use TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoriales
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  level TEXT CHECK (level IN ('principiante','intermedio','avanzado')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promociones
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES provider_services(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 300),
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT promotion_dates_check CHECK (end_date > start_date)
);
CREATE INDEX idx_promotions_service_id ON promotions(service_id);
CREATE INDEX idx_promotions_status ON promotions(status);

-- Trigger: crear perfil al registrar usuario en auth.users
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
```

### Políticas RLS

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener rol
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- profiles: cada usuario ve/edita solo su perfil; admin ve todos
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- providers: proveedor gestiona el suyo; admin gestiona todos; clientes ven aprobados
CREATE POLICY "providers_select" ON providers FOR SELECT USING (
  user_id = auth.uid() OR get_user_role() = 'admin' OR
  (status = 'approved' AND get_user_role() = 'client')
);
CREATE POLICY "providers_insert" ON providers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "providers_update_own" ON providers FOR UPDATE USING (
  user_id = auth.uid() OR get_user_role() = 'admin'
);

-- provider_services: proveedor gestiona los suyos; clientes ven activos de aprobados; admin ve todos
CREATE POLICY "services_select" ON provider_services FOR SELECT USING (
  get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid()) OR
  (status = 'active' AND EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.status = 'approved'))
);
CREATE POLICY "services_write" ON provider_services FOR ALL USING (
  get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

-- fishing_zones: todos los autenticados leen activas; admin gestiona todas
CREATE POLICY "zones_select" ON fishing_zones FOR SELECT USING (
  is_active = TRUE OR get_user_role() = 'admin'
);
CREATE POLICY "zones_write" ON fishing_zones FOR ALL USING (get_user_role() = 'admin');

-- zone_reviews: todos leen; solo dueño escribe/edita la propia
CREATE POLICY "reviews_select" ON zone_reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON zone_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update" ON zone_reviews FOR UPDATE USING (user_id = auth.uid());

-- reservations: cliente ve las suyas; proveedor ve las de sus servicios; admin ve todas
CREATE POLICY "reservations_select" ON reservations FOR SELECT USING (
  client_id = auth.uid() OR get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (
  client_id = auth.uid() OR get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

-- messages: solo participantes de la reservación leen y escriben
CREATE POLICY "messages_access" ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = reservation_id AND (
      r.client_id = auth.uid() OR
      EXISTS (SELECT 1 FROM providers p WHERE p.id = r.provider_id AND p.user_id = auth.uid())
    )
  )
);

-- payments: cliente y proveedor de la reservación; admin ve todos
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  get_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM reservations r WHERE r.id = reservation_id AND (
      r.client_id = auth.uid() OR
      EXISTS (SELECT 1 FROM providers p WHERE p.id = r.provider_id AND p.user_id = auth.uid())
    )
  )
);

-- community_posts: todos leen; solo dueño escribe/elimina
CREATE POLICY "posts_select" ON community_posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_delete" ON community_posts FOR DELETE USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- user_favorites: solo el propio usuario
CREATE POLICY "favorites_access" ON user_favorites FOR ALL USING (user_id = auth.uid());

-- push_tokens: solo el propio usuario; edge functions usan service role
CREATE POLICY "push_tokens_access" ON push_tokens FOR ALL USING (user_id = auth.uid());

-- alerts: todos leen; solo admin escribe
CREATE POLICY "alerts_select" ON alerts FOR SELECT USING (TRUE);
CREATE POLICY "alerts_write" ON alerts FOR ALL USING (get_user_role() = 'admin');

-- reports: usuario ve los suyos; admin ve todos
CREATE POLICY "reports_select" ON reports FOR SELECT USING (
  reporter_id = auth.uid() OR get_user_role() = 'admin'
);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (get_user_role() = 'admin');

-- audit_logs: solo admin lee
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- promotions: todos leen activas; proveedor gestiona las suyas
CREATE POLICY "promotions_select" ON promotions FOR SELECT USING (
  status = 'active' OR get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);
CREATE POLICY "promotions_write" ON promotions FOR ALL USING (
  get_user_role() = 'admin' OR
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);
```

---

## 4. Módulos Funcionales

### Módulo 1: Autenticación
| Item | Detalle |
|---|---|
| Pantallas | `LoginScreen`, `RegisterClientScreen`, `RegisterProviderScreen`, `EmailVerificationScreen`, `PendingApprovalScreen` |
| Componentes clave | `AuthForm`, `SocialAuthButton`, `PasswordInput`, `PrivacyNoticeModal` |
| Supabase | `signInWithPassword`, `signUp`, `signInWithIdToken`, `getSession`, `signOut` |
| Zustand store | `useAuthStore` (`user`, `session`, `role`, `isLoading`) |
| Esfuerzo | 5 días-dev |

### Módulo 2: Dashboard del Cliente
| Item | Detalle |
|---|---|
| Pantallas | `ClientDashboardScreen` |
| Componentes clave | `WeatherCard`, `FishOfMonthCard`, `QuickAccessGrid`, `SOSButton` |
| Supabase / APIs | Edge Function `get-weather`, query `monthly_seasons` para mes actual |
| TanStack Query | `useWeather` (stale: 60min), `useCurrentSeasonFish` (stale: 24h) |
| Esfuerzo | 3 días-dev |

### Módulo 3: Mapa y Zonas de Pesca
| Item | Detalle |
|---|---|
| Pantallas | `MapScreen`, `ZoneDetailScreen` |
| Componentes clave | `FishingMap`, `ZoneMarker`, `FilterBar`, `ZoneDetailCard`, `ReviewList`, `StarRating` |
| Supabase | `fishing_zones` con filtros, `zone_fish`, `zone_reviews` |
| TanStack Query | `useFishingZones(filters)`, `useZoneDetail(id)`, `useZoneReviews(zoneId)` |
| Zustand | `useMapStore` (filtros activos, zona seleccionada) |
| Esfuerzo | 8 días-dev |

### Módulo 4: Temporadas
| Item | Detalle |
|---|---|
| Pantallas | `SeasonsScreen` |
| Componentes clave | `MonthSelector`, `SpeciesList`, `VedaBadge`, `SuggestedZoneCard` |
| Supabase | `monthly_seasons` JOIN `species` JOIN `fishing_zones` por mes |
| TanStack Query | `useMonthlySeasons(month)` (stale: 24h) |
| Esfuerzo | 3 días-dev |

### Módulo 5: SOS de Emergencia
| Item | Detalle |
|---|---|
| Pantallas | `SOSScreen` |
| Componentes clave | `SOSButton` (global overlay), `EmergencyContactCard`, `GPSCoordinatesDisplay` |
| APIs nativas | `expo-location`, `Linking.openURL('tel:...')` |
| Offline | Contactos hardcodeados como fallback en bundle |
| Esfuerzo | 3 días-dev |

### Módulo 6: Comunidad
| Item | Detalle |
|---|---|
| Pantallas | `CommunityFeedScreen`, `NewPostScreen` |
| Componentes clave | `CatchCard`, `ImagePicker`, `InfiniteScrollList` |
| Supabase | `community_posts` paginado, Supabase Storage upload |
| TanStack Query | `useCommunityFeed` (infinite query, pageSize: 20) |
| Libs | `expo-image-manipulator` para compresión |
| Esfuerzo | 5 días-dev |

### Módulo 7: Panel del Proveedor
| Item | Detalle |
|---|---|
| Pantallas | `ProviderDashboard`, `ServiceListScreen`, `ServiceFormScreen`, `AvailabilityCalendar`, `ReservationListScreen`, `ChatScreen`, `PaymentHistoryScreen`, `ReviewsScreen`, `PromotionsScreen` |
| Componentes clave | `MetricsCard`, `ReservationCard`, `CalendarPicker`, `ChatBubble`, `PromotionForm` |
| Supabase | CRUD `provider_services`, CRUD `provider_availability`, `reservations`, `payments`, `messages` (Realtime), `zone_reviews`, `promotions` |
| Zustand | `useProviderStore` (servicios activos, reservaciones pendientes) |
| Esfuerzo | 18 días-dev |

### Módulo 8: Panel de Administración
| Item | Detalle |
|---|---|
| Pantallas | `AdminDashboard`, `VerificationQueueScreen`, `ProviderDetailScreen`, `ZoneManagementScreen`, `ZoneFormScreen`, `SeasonManagementScreen`, `ReportsScreen`, `AlertsScreen`, `AuditLogScreen` |
| Componentes clave | `MetricsRealtime`, `VerificationCard`, `ApproveRejectModal`, `ZoneForm`, `AlertComposer` |
| Supabase | Realtime en `providers`/`reservations` para métricas, CRUD `fishing_zones`, CRUD `monthly_seasons`, UPDATE `reports`, INSERT `alerts` + Edge Function |
| Esfuerzo | 15 días-dev |

### Módulo 9: Reservaciones del Cliente
| Item | Detalle |
|---|---|
| Pantallas | `ServiceListScreen`, `ServiceDetailScreen`, `BookingFormScreen`, `MyReservationsScreen` |
| Componentes clave | `ServiceCard`, `BookingCalendar`, `PartySelector`, `ReservationStatusBadge` |
| Supabase | INSERT `reservations`, SELECT `reservations` del cliente |
| Esfuerzo | 6 días-dev |

### Módulo 10: Pagos con Mercado Pago
| Item | Detalle |
|---|---|
| Pantallas | `PaymentScreen` (WebView) |
| Componentes clave | `PaymentWebView`, `PaymentStatusCard` |
| Supabase | Edge Function `create-payment-preference`, `mercadopago-webhook`, tabla `payments` |
| Esfuerzo | 6 días-dev |

### Módulo 11: Notificaciones Push
| Item | Detalle |
|---|---|
| Componentes | `useNotifications` hook (registro + handler) |
| Edge Functions | `send-push-notification` |
| Supabase | tabla `push_tokens` |
| Libs | `expo-notifications` |
| Esfuerzo | 4 días-dev |

### Módulo 12: Equipo y Tutoriales
| Item | Detalle |
|---|---|
| Pantallas | `EquipmentScreen`, `TutorialsScreen` |
| Componentes clave | `EquipmentCard`, `TutorialCard`, `YouTubeEmbed` |
| Supabase | `equipment`, `tutorials` |
| TanStack Query | `useEquipment(level)`, `useTutorials()` (stale: 24h) |
| Libs | `react-native-webview` para YouTube embed |
| Esfuerzo | 2 días-dev |

---

## 5. Estructura del Proyecto

```
costa-inteligente/
├── app/
│   ├── _layout.tsx                 # Root layout (AuthProvider, QueryProvider)
│   ├── index.tsx                   # Redirect según rol
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register-client.tsx
│   │   └── register-provider.tsx
│   ├── (client)/                   # Tab navigator para Cliente
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Dashboard
│   │   ├── map.tsx
│   │   ├── seasons.tsx
│   │   ├── community/
│   │   │   ├── index.tsx
│   │   │   └── new-post.tsx
│   │   ├── favorites.tsx
│   │   ├── sos.tsx
│   │   ├── equipment.tsx
│   │   ├── tutorials.tsx
│   │   ├── zones/
│   │   │   └── [id].tsx            # Detalle de zona
│   │   ├── services/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── reservations/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── book/[serviceId].tsx
│   │   ├── chat/
│   │   │   └── [reservationId].tsx
│   │   └── profile.tsx
│   ├── (provider)/                 # Stack navigator para Proveedor
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Dashboard
│   │   ├── services/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── [id]/
│   │   │       ├── edit.tsx
│   │   │       └── availability.tsx
│   │   ├── reservations/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── chat/
│   │   │   └── [reservationId].tsx
│   │   ├── payments.tsx
│   │   ├── reviews.tsx
│   │   ├── promotions/
│   │   │   ├── index.tsx
│   │   │   └── new.tsx
│   │   └── profile.tsx
│   └── (admin)/                    # Stack navigator para Admin
│       ├── _layout.tsx
│       ├── index.tsx               # Dashboard métricas
│       ├── verification/
│       │   ├── index.tsx
│       │   └── [providerId].tsx
│       ├── zones/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── [id].tsx
│       ├── seasons/
│       │   └── [month].tsx
│       ├── reports.tsx
│       ├── alerts.tsx
│       └── audit-logs.tsx
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   ├── SocialAuthButton.tsx
│   │   └── PrivacyNoticeModal.tsx
│   ├── map/
│   │   ├── FishingMap.tsx
│   │   ├── ZoneMarker.tsx
│   │   └── FilterBar.tsx
│   ├── zones/
│   │   ├── ZoneDetailCard.tsx
│   │   ├── ReviewList.tsx
│   │   └── StarRating.tsx
│   ├── sos/
│   │   ├── SOSButton.tsx
│   │   └── EmergencyContactCard.tsx
│   ├── provider/
│   │   ├── MetricsCard.tsx
│   │   ├── ReservationCard.tsx
│   │   ├── ServiceForm.tsx
│   │   └── CalendarPicker.tsx
│   ├── chat/
│   │   └── ChatBubble.tsx
│   ├── community/
│   │   ├── CatchCard.tsx
│   │   └── InfiniteScrollList.tsx
│   ├── admin/
│   │   ├── VerificationCard.tsx
│   │   └── AlertComposer.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── SkeletonLoader.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase.ts                 # Cliente Supabase configurado
│   ├── queryClient.ts              # TanStack Query client
│   ├── constants.ts                # Coordenadas Zihuatanejo, contactos SOS
│   ├── validation/
│   │   ├── auth.schemas.ts
│   │   ├── provider.schemas.ts
│   │   └── reservation.schemas.ts
│   └── utils/
│       ├── imageCompressor.ts
│       ├── formatCurrency.ts
│       └── dateHelpers.ts
├── stores/
│   ├── authStore.ts
│   ├── mapStore.ts
│   └── providerStore.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useWeather.ts
│   ├── useFishingZones.ts
│   ├── useZoneDetail.ts
│   ├── useMonthlySeasons.ts
│   ├── useCommunityFeed.ts
│   ├── useReservations.ts
│   ├── useProviderServices.ts
│   ├── useMessages.ts
│   ├── useNotifications.ts
│   └── usePayments.ts
├── types/
│   ├── database.types.ts           # Tipos generados por Supabase CLI
│   └── index.ts
└── assets/
    ├── images/
    ├── fonts/
    └── icons/
```

---

## 6. Flujos Críticos

### 6.1 Onboarding — Cliente

```
1. App abre → _layout detecta sin sesión → redirect /auth/login
2. Usuario elige "Google" → Expo AuthSession → supabase.signInWithIdToken()
   O elige email/pass → RegisterClientScreen → supabase.signUp()
3. Si email: mostrar EmailVerificationScreen (polling cada 3s a getSession)
4. Sesión activa → trigger crea registro en profiles (rol: client)
5. useAuthStore.setUser() → router.replace('/(client)/')
```

### 6.2 Verificación de Proveedor

```
1. Proveedor completa RegisterProviderScreen con datos del negocio
2. supabase.signUp() + INSERT providers (status: 'pending')
3. Redirect → PendingApprovalScreen (WHILE status=pending)
4. Admin en VerificationQueueScreen ve el proveedor
5. Admin toca "Aprobar" → UPDATE providers SET status='approved'
   → INSERT audit_logs → invoke send-push-notification
6. Proveedor recibe push "Tu cuenta fue aprobada"
7. App detecta cambio vía Realtime → redirect /(provider)/
```

### 6.3 Reservación completa

```
1. Cliente navega ServiceDetailScreen → toca "Reservar"
2. BookingFormScreen: selecciona fecha del calendario disponible + num. personas
3. INSERT reservations (status: pending) → invoke send-push-notification al proveedor
4. Proveedor en ReservationListScreen ve la solicitud
5. Proveedor toca "Confirmar" → UPDATE reservations (status: confirmed)
   → Edge Function create-payment-preference → retorna checkout_url
6. Push al cliente "Reservación confirmada"
7. Cliente en PaymentScreen (WebView con checkout_url de MP)
8. Pago exitoso → MP webhook → mercadopago-webhook Edge Function
   → valida firma → UPDATE payments (paid) → UPDATE reservations (payment_status: paid)
9. Chat habilitado entre cliente y proveedor para la reservación
```

### 6.4 SOS de Emergencia

```
1. Usuario toca SOSButton (overlay en cualquier pantalla)
2. Navega a SOSScreen
3. expo-location.requestForegroundPermissionsAsync()
4. Si OK → expo-location.getCurrentPositionAsync({ timeout: 10000 })
5. Si coords obtenidas → mostrar lat/lng + lista de contactos + botones tel:
6. Si timeout (10s) → mostrar contactos sin coords + mensaje "Ubicación no disponible"
7. Toca botón de contacto → Linking.openURL('tel:+527555542009')
8. Sin internet → usar contactos de constants.ts (hardcoded en bundle)
```

### 6.5 Alerta del Admin con Push

```
1. Admin en AlertsScreen: escribe título + mensaje + selecciona tipo
2. Toca "Publicar y Notificar"
3. INSERT alerts → HTTP POST a Edge Function send-push-notification
4. Edge Function: SELECT tokens FROM push_tokens WHERE usuarios tienen el tipo habilitado
5. Lote de tokens → llamada a Expo Push API
6. Tokens inválidos (DeviceNotRegistered) → DELETE from push_tokens
7. Todos los Clientes/Proveedores con token reciben la push notification
```

---

## 7. Integraciones Externas

### 7.1 Supabase JS Client v2

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/database.types';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 7.2 TanStack Query + Supabase

```typescript
// hooks/useFishingZones.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ZoneFilters {
  level?: 'principiante' | 'intermedio' | 'avanzado';
  speciesId?: string;
}

export function useFishingZones(filters: ZoneFilters = {}) {
  return useQuery({
    queryKey: ['fishing_zones', filters],
    queryFn: async () => {
      let query = supabase
        .from('fishing_zones')
        .select(`*, zone_fish(species_id, probability, species(name))`)
        .eq('is_active', true);

      if (filters.level) query = query.eq('level', filters.level);
      if (filters.speciesId) {
        query = query.contains('zone_fish.species_id', [filters.speciesId]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 48,
  });
}
```

### 7.3 react-native-maps + OpenStreetMap

```typescript
// components/map/FishingMap.tsx
import MapView, { Marker, UrlTile } from 'react-native-maps';

const ZIHUATANEJO = { latitude: 17.6392, longitude: -101.5507 };
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function FishingMap({ zones }: { zones: FishingZone[] }) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{ ...ZIHUATANEJO, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
      mapType="none"
    >
      <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
          title={zone.name}
        />
      ))}
    </MapView>
  );
}
```

### 7.4 Open-Meteo API (Edge Function)

```typescript
// supabase/functions/get-weather/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const ZIHUATANEJO_LAT = 17.6392;
const ZIHUATANEJO_LON = -101.5507;

serve(async () => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${ZIHUATANEJO_LAT}&longitude=${ZIHUATANEJO_LON}&current=temperature_2m,weathercode,windspeed_10m&timezone=America/Mexico_City`;
  
  const res = await fetch(url);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
```

### 7.5 Expo Notifications + Edge Function Push

```typescript
// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useNotifications(userId: string) {
  useEffect(() => {
    registerForPushNotifications(userId);
  }, [userId]);
}

async function registerForPushNotifications(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  })).data;

  await supabase.from('push_tokens').upsert(
    { user_id: userId, token },
    { onConflict: 'user_id,token' }
  );
}
```

```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { title, body, userIds } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let query = supabase.from('push_tokens').select('token');
  if (userIds?.length) query = query.in('user_id', userIds);
  const { data: tokens } = await query;

  const messages = tokens!.map((t) => ({
    to: t.token, title, body, sound: 'default',
  }));

  // Enviar en lotes de 100
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    const result = await response.json();
    // Limpiar tokens inválidos
    const invalid = result.data
      ?.filter((r: any) => r.details?.error === 'DeviceNotRegistered')
      .map((_: any, idx: number) => batch[idx].to);
    if (invalid?.length) {
      await supabase.from('push_tokens').delete().in('token', invalid);
    }
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 7.6 Mercado Pago — Create Payment Preference

```typescript
// supabase/functions/create-payment-preference/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

serve(async (req) => {
  const { reservationId, amount, serviceName, clientEmail } = await req.json();
  
  const preference = {
    items: [{ title: serviceName, quantity: 1, unit_price: amount, currency_id: 'MXN' }],
    payer: { email: clientEmail },
    external_reference: reservationId,
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    back_urls: {
      success: 'costainteligente://payment/success',
      failure: 'costainteligente://payment/failure',
    },
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const data = await res.json();
  return new Response(JSON.stringify({ checkoutUrl: data.init_point }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 7.7 YouTube Embed

```typescript
// components/TutorialCard.tsx
import { WebView } from 'react-native-webview';

function getYouTubeEmbedId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match?.[1] ?? '';
}

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const embedId = getYouTubeEmbedId(tutorial.youtube_url);
  const embedHtml = `
    <html><body style="margin:0">
      <iframe width="100%" height="100%"
        src="https://www.youtube.com/embed/${embedId}?playsinline=1"
        frameborder="0" allowfullscreen></iframe>
    </body></html>
  `;
  return (
    <WebView
      style={{ height: 200 }}
      source={{ html: embedHtml }}
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction
    />
  );
}
```

---

## 8. Plan de Publicación

### eas.json

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": { "APP_ENV": "preview" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@costainteligente.mx",
        "ascAppId": "XXXXXXXXXX",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### app.json (fragmento relevante)

```json
{
  "expo": {
    "name": "Costa Inteligente",
    "slug": "costa-inteligente",
    "version": "1.0.0",
    "scheme": "costainteligente",
    "ios": {
      "bundleIdentifier": "mx.costainteligente.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Necesitamos tu ubicación para mostrarla en el mapa y para el módulo SOS de emergencia.",
        "NSLocationAlwaysUsageDescription": "El módulo SOS requiere acceso a tu ubicación en todo momento para emergencias en el mar.",
        "NSCameraUsageDescription": "Necesitamos acceso a la cámara para que puedas subir fotos de tus capturas.",
        "NSPhotoLibraryUsageDescription": "Necesitamos acceso a tu galería para subir fotos de capturas a la comunidad."
      }
    },
    "android": {
      "package": "mx.costainteligente.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Requerida para el módulo SOS." }],
      ["expo-notifications", { "sounds": ["./assets/sounds/notification.wav"] }],
      "expo-image-manipulator"
    ],
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "runtimeVersion": { "policy": "appVersion" }
  }
}
```

### Checklist de lanzamiento

- [ ] Variables de entorno configuradas en EAS Secrets (Supabase URL, Anon Key, MP Access Token, MP Webhook Secret)
- [ ] RLS habilitado y probado en todas las tablas
- [ ] Edge Functions desplegadas y probadas en producción
- [ ] Política de privacidad publicada en URL pública (requerida por App Store y Google Play)
- [ ] Términos de servicio publicados
- [ ] Aviso de privacidad LFPDPPP visible en flujo de registro
- [ ] Screenshots y metadata en App Store Connect y Google Play Console
- [ ] Cuenta de desarrollador Apple activa ($99/año)
- [ ] Cuenta de desarrollador Google Play activa ($25 único pago)
- [ ] Certificados iOS y perfiles de aprovisionamiento generados con EAS
- [ ] Keystore Android generado y respaldado de forma segura
- [ ] TestFlight build probado internamente antes de subir a App Store
- [ ] Build Android en track "Internal Testing" de Google Play antes de producción
- [ ] Expo Updates canal `production` configurado y probado con un OTA de prueba
- [ ] Integración Mercado Pago probada en entorno de staging con credenciales de sandbox

---

## 9. Seguridad

### Validación con Zod

```typescript
// lib/validation/auth.schemas.ts
import { z } from 'zod';

export const registerClientSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido').max(100),
});

export const registerProviderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(3).max(100),
  rfc: z.string().regex(/^[A-Z&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  address: z.string().min(10).max(200),
});

export const reservationSchema = z.object({
  serviceId: z.string().uuid(),
  reservationDate: z.coerce.date().min(new Date(), 'La fecha debe ser futura'),
  partySize: z.number().int().min(1),
});
```

### Variables de entorno con EAS

```bash
# Configurar secrets en EAS (nunca en el repo)
eas secret:create --scope project --name SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name MP_ACCESS_TOKEN --value "APP_USR-..."
eas secret:create --scope project --name MP_WEBHOOK_SECRET --value "abc123..."

# En el código, acceder via process.env (solo las EXPO_PUBLIC_ son accesibles en cliente)
# Las demás solo están disponibles en Edge Functions (Deno.env.get)
```

### Cumplimiento LFPDPPP

El aviso de privacidad debe incluir:
- **Responsable**: Nombre comercial, domicilio, correo de contacto
- **Datos recopilados**: nombre, correo, teléfono, ubicación GPS (cuando se otorga permiso), fotos, datos de negocio para proveedores
- **Finalidades**: prestación del servicio, reservaciones, pagos, notificaciones
- **Transferencias**: Supabase (almacenamiento en nube), Mercado Pago (procesamiento de pagos), Expo (notificaciones push)
- **Derechos ARCO**: correo `privacidad@costainteligente.mx` para ejercerlos
- **Retención de datos**: mientras la cuenta esté activa; se eliminan 30 días tras solicitud de baja

---

## 10. Roadmap

| Fase | Período | Features | Criterio de Done |
|---|---|---|---|
| **Fase 1 — MVP** | Mes 1–3 | Auth (3 perfiles), Mapa + Zonas, Temporadas, SOS, Dashboard cliente, Panel admin básico (cola verificación + gestión zonas) | App publicada en TestFlight y Google Play Internal Testing con los 3 roles funcionales |
| **Fase 2 — Proveedores** | Mes 3–5 | Panel proveedor completo, 8 módulos de servicio, Calendario disponibilidad, Reservaciones, Pagos Mercado Pago, Chat | 10+ proveedores activos, 20+ reservaciones completadas con pago procesado |
| **Fase 3 — Engagement** | Mes 5–7 | Comunidad (feed capturas), Favoritos, Notificaciones push, Reseñas, Promociones, Equipo y Tutoriales | 100+ usuarios activos mensuales, push notifications operativas, calificación ≥ 4.0 en tiendas |
| **Fase 4 — Escala** | Mes 7+ | Soporte multi-región (más costas de México), Modo offline con MMKV, Analíticas con PostHog/Mixpanel, Soporte multi-idioma (ES/EN) | 3+ ciudades costeras activas, DAU > 500 |

---

## 11. Testing y CI/CD

### Estrategia de testing

```
Unit tests (Jest):         lógica de validación Zod, helpers, formatters
Integration tests (RNTL):  componentes con mocks de Supabase
E2E tests (Maestro):       flujos críticos en dispositivo real/simulador
RLS tests (Supabase):      verificación de políticas con roles distintos
```

### Tests críticos del día 1

```typescript
// __tests__/auth.test.ts
describe('Auth schemas', () => {
  it('rechaza contraseña menor a 8 caracteres', () => {
    expect(() => registerClientSchema.parse({ email: 'a@b.com', password: '1234' }))
      .toThrow();
  });
  it('acepta email válido con contraseña de 8+ caracteres', () => {
    expect(() => registerClientSchema.parse({ email: 'a@b.com', password: '12345678', fullName: 'Juan' }))
      .not.toThrow();
  });
});

// maestro/flows/reservation.yaml
appId: mx.costainteligente.app
---
- launchApp
- tapOn: "Iniciar sesión"
- inputText:
    id: email-input
    text: "cliente@test.com"
- inputText:
    id: password-input  
    text: "password123"
- tapOn: "Entrar"
- assertVisible: "Dashboard"
- tapOn: "Mapa"
- assertVisible: "Zonas de pesca"
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx tsc --noEmit

  build-preview:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile preview --non-interactive
```
