# Implementation Plan: Costa Inteligente

## Overview

Plan de implementación incremental en 4 fases para la app móvil Costa Inteligente (React Native + Expo, TypeScript, Supabase, Expo Router, Zustand, TanStack Query, NativeWind, Mercado Pago, EAS Build). Cada tarea construye sobre la anterior y termina con integración funcional. No se deja código huérfano entre pasos.

---

## Tasks

---

### Fase 1 — MVP: Auth, Mapa, Temporadas, SOS, Dashboard, Admin Básico

- [ ] 1. Inicializar proyecto y estructura base
  - [x] 1.1 Crear proyecto Expo con `create-expo-app` usando el template blank TypeScript, configurar `app.json` con `scheme`, `bundleIdentifier` y `package` de Costa Inteligente, instalar dependencias core: `expo-router`, `nativewind`, `tailwindcss`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `zod`, `react-native-url-polyfill`
    - Configurar `babel.config.js` con preset NativeWind y el plugin de Expo Router
    - Crear `.env` local y `.env.example`; agregar `.env` a `.gitignore`
    - _Requerimientos: 24.2, 25.1_

  - [ ] 1.2 Configurar cliente Supabase y store de auth
    - Crear `lib/supabase.ts` con `ExpoSecureStoreAdapter` usando `expo-secure-store` (JWT nunca en AsyncStorage sin cifrado)
    - Crear `stores/authStore.ts` con Zustand: campos `user`, `session`, `role`, `isLoading`
    - Crear `types/index.ts` y stub de `types/database.types.ts`
    - _Requerimientos: 1.10, 24.2, 26.3_

  - [ ] 1.3 Configurar TanStack Query y root layout
    - Crear `lib/queryClient.ts` con `QueryClient` y defaults de `staleTime`
    - Crear `app/_layout.tsx` con `QueryClientProvider`, listener `supabase.auth.onAuthStateChange` que actualice `authStore`, y redirect a `/auth/login` si no hay sesión
    - Crear `app/index.tsx` que redirija al dashboard correspondiente según `role`
    - _Requerimientos: 3.1, 3.2, 3.3_

  - [ ]* 1.4 Escribir tests unitarios de configuración base
    - Verificar que `supabase.ts` exporta un cliente con `persistSession: true`
    - Verificar que `authStore` inicializa con `user: null`, `role: null`, `isLoading: false`
    - _Requerimientos: 1.10, 24.6_

- [ ] 2. Esquema de base de datos y políticas RLS en Supabase
  - [ ] 2.1 Crear migraciones SQL para todas las tablas del esquema
    - Crear archivo `supabase/migrations/001_initial_schema.sql` con todas las tablas definidas en el diseño: `profiles`, `providers`, `provider_services`, `species`, `fishing_zones`, `zone_fish`, `monthly_seasons`, `zone_reviews`, `provider_availability`, `reservations`, `payments`, `messages`, `community_posts`, `user_favorites`, `alerts`, `reports`, `audit_logs`, `push_tokens`, `equipment`, `tutorials`, `promotions`
    - Incluir todos los índices y la función `handle_new_user` con su trigger
    - _Requerimientos: 26.1, 26.2, 26.3_

  - [ ] 2.2 Aplicar políticas RLS en migración separada
    - Crear `supabase/migrations/002_rls_policies.sql` con: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, función `get_user_role()` y todas las políticas definidas en el diseño para los 3 roles
    - _Requerimientos: 26.2, 26.3, 26.4, 2.10, 10.8, 13.6, 16.7_

  - [ ]* 2.3 Escribir tests de políticas RLS
    - Usar `supabase test db` con fixtures de usuarios `client`, `provider` y `admin`
    - Verificar que un cliente no pueda leer registros de otro cliente en `user_favorites`
    - Verificar que un proveedor no pueda leer `provider_services` ajenos
    - Verificar que retorne 403 ante violación de política
    - _Requerimientos: 26.4, 2.10, 13.6_

- [ ] 3. Módulo de autenticación — Cliente y Proveedor
  - [ ] 3.1 Implementar pantallas de login y registro de cliente
    - Crear `components/auth/AuthForm.tsx`, `components/auth/PasswordInput.tsx`, `components/auth/SocialAuthButton.tsx`, `components/auth/PrivacyNoticeModal.tsx`
    - Crear `app/auth/login.tsx`: formulario email/pass con validación Zod (`registerClientSchema`), botón Google OAuth con `Expo AuthSession` → `supabase.signInWithIdToken()`
    - Crear `app/auth/register-client.tsx`: formulario de registro con `registerClientSchema`; al éxito redirigir a `EmailVerificationScreen`; mostrar `PrivacyNoticeModal` antes de crear cuenta
    - Mostrar mensaje genérico "Correo o contraseña incorrectos" sin revelar existencia del correo
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.12, 24.1, 24.3_

  - [ ] 3.2 Implementar verificación de correo, bloqueo por intentos y refresh token
    - Crear `app/auth/email-verification.tsx`: polling cada 3 s a `supabase.auth.getSession()` hasta que `email_confirmed_at` esté presente, luego redirigir
    - Implementar contador de intentos fallidos en `authStore`; tras 5 fallos mostrar bloqueo de 15 minutos con temporizador (req. 1.11)
    - Verificar en `_layout.tsx` que token expirado se renueva automáticamente con refresh token; si refresh inválido, cerrar sesión y redirigir a login
    - _Requerimientos: 1.5, 1.6, 1.8, 1.9, 1.11, 24.7_

  - [ ] 3.3 Implementar registro de proveedor y pantalla de estado de cuenta
    - Crear `app/auth/register-provider.tsx` con `registerProviderSchema` (incluye RFC, teléfono 10 dígitos, dirección); al enviar: `supabase.signUp()` + `INSERT providers (status: 'pending')` de forma atómica
    - Crear `app/auth/pending-approval.tsx`: pantalla "Cuenta en revisión" que restringe acceso a módulos de gestión; si estado es `rejected`, mostrar motivo + botón "Actualizar datos y reenviar solicitud"
    - Suscribir con Realtime a cambios en `providers.status` para el `user_id` del proveedor y redirigir automáticamente al panel cuando cambie a `approved`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.9_

  - [ ] 3.4 Implementar guardia de rutas por rol
    - En `app/(client)/_layout.tsx`: verificar `role === 'client'`; si no, redirigir sin exponer estructura de rutas admin
    - En `app/(provider)/_layout.tsx`: verificar `role === 'provider'` y `provider.status === 'approved'`
    - En `app/(admin)/_layout.tsx`: verificar `role === 'admin'`; si `role` ausente o desconocido, mostrar "Acceso no autorizado" y cerrar sesión
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.5 Escribir tests unitarios del módulo de auth
    - Testear `registerClientSchema` y `registerProviderSchema` con casos válidos e inválidos (contraseña < 8, RFC inválido, teléfono con letras)
    - Testear que `authStore` actualiza correctamente `role` al recibir perfil desde Supabase
    - _Requerimientos: 1.1, 2.1, 24.1_

- [ ] 4. Dashboard del Cliente
  - [ ] 4.1 Implementar pantalla de dashboard con skeleton loaders
    - Crear `app/(client)/index.tsx` con saludo personalizado (nombre de `authStore.user`)
    - Crear `components/ui/SkeletonLoader.tsx` y mostrar skeleton por sección mientras cargan datos
    - Crear `components/map/WeatherCard.tsx`: consumir hook `useWeather` que llama a la Edge Function `get-weather`; mostrar datos de caché con texto "Datos actualizados al [fecha]" si la función falla (req. 4.3)
    - Crear `FishOfMonthCard.tsx` con hook `useCurrentSeasonFish` (query a `monthly_seasons` para el mes actual, `staleTime: 24h`)
    - Crear `QuickAccessGrid.tsx` con accesos a Mapa, Temporadas, Comunidad y SOS
    - Mostrar datos offline desde caché TanStack Query con indicador de última sincronización
    - Renderización completa en < 3 s en 4G/WiFi
    - _Requerimientos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 4.2 Crear Edge Function `get-weather`
    - Crear `supabase/functions/get-weather/index.ts` que consulte Open-Meteo API para Zihuatanejo y retorne caché HTTP `Cache-Control: public, max-age=3600`
    - Crear `hooks/useWeather.ts` con `staleTime: 1000 * 60 * 60` (60 min)
    - _Requerimientos: 4.2, 27.2_

  - [ ]* 4.3 Escribir tests de integración del dashboard
    - Mock de `useWeather` retornando error → verificar que skeleton no bloquea las demás secciones
    - Mock de `useCurrentSeasonFish` → verificar que el componente muestra la lista de peces
    - _Requerimientos: 4.3, 4.5_

- [ ] 5. Mapa interactivo de zonas de pesca
  - [ ] 5.1 Configurar `react-native-maps` con OpenStreetMap y marcadores
    - Instalar `react-native-maps`; configurar en `app.json` para iOS/Android
    - Crear `components/map/FishingMap.tsx`: `MapView` con `UrlTile` de OSM, centrado en Zihuatanejo (17.6392°N, 101.5507°O), zoom 12
    - Crear `components/map/ZoneMarker.tsx` para cada zona activa; al tocar navegar a `zones/[id]`
    - Mostrar posición del usuario con marcador diferenciado si permiso GPS otorgado
    - Crear `app/(client)/map.tsx` que consuma `useFishingZones(filters)`
    - _Requerimientos: 5.1, 5.2, 5.6, 5.9_

  - [ ] 5.2 Implementar filtros de mapa y mensajes de estado vacío/offline
    - Crear `components/map/FilterBar.tsx` con filtros de nivel, tipo y especie (AND lógico)
    - Crear `stores/mapStore.ts` (Zustand) con `activeFilters` y `selectedZone`
    - Aplicar filtros en < 500 ms; si no hay resultados mostrar "No hay zonas disponibles con estos filtros"
    - Offline con caché < 24 h: mostrar banner de desactualización; sin caché: mostrar mensaje "Sin conexión"
    - _Requerimientos: 5.3, 5.4, 5.5, 5.7, 5.8_

  - [ ] 5.3 Crear hook `useFishingZones` y `useZoneDetail`
    - Crear `hooks/useFishingZones.ts` con `staleTime: 24h`, filtros aplicados en queryKey
    - Crear `hooks/useZoneDetail.ts` para query individual de zona con `zone_fish` y especies
    - _Requerimientos: 5.2, 5.3, 21.3_

  - [ ]* 5.4 Escribir tests de integración del mapa
    - Verificar que `FilterBar` con nivel "principiante" filtra marcadores correctamente
    - Verificar que sin conexión y caché vacía muestra mensaje correcto
    - _Requerimientos: 5.3, 5.4, 5.8_

- [ ] 6. Detalle de zona y sistema de reseñas
  - [ ] 6.1 Implementar pantalla de detalle de zona
    - Crear `app/(client)/zones/[id].tsx`
    - Crear `components/zones/ZoneDetailCard.tsx`: foto principal (placeholder si no hay), nombre, descripción, peces probables, señuelos, carnadas, horarios, nivel
    - Crear `components/zones/StarRating.tsx`: calificación promedio redondeada a 0.5; texto "Sin calificaciones aún" si no hay reseñas
    - Crear `components/zones/ReviewList.tsx`: últimas 10 reseñas ordenadas por fecha descendente
    - Botón de favorito con optimistic update (req. 6.6); si falla, revertir y mostrar error
    - _Requerimientos: 6.1, 6.2, 6.3, 6.6_

  - [ ] 6.2 Implementar formulario de reseña
    - Formulario de reseña: calificación 1–5, comentario 1–500 chars; si ya existe reseña, precargar datos para edición
    - Al envío exitoso, recalcular calificación promedio en pantalla en < 2 s
    - Usuario no autenticado → modal "Iniciar sesión / Cancelar"
    - _Requerimientos: 6.4, 6.5, 6.7_

  - [ ]* 6.3 Escribir tests unitarios de StarRating y cálculo de promedio
    - `StarRating` con 0 reseñas → "Sin calificaciones aún"
    - `StarRating` con ratings [3, 4] → muestra 3.5
    - _Requerimientos: 6.2_

- [ ] 7. Temporadas de pesca
  - [ ] 7.1 Implementar pantalla de temporadas
    - Crear `components/seasons/MonthSelector.tsx` con 12 meses; mes actual preseleccionado
    - Crear `components/seasons/SpeciesList.tsx` con clasificación probable/posible
    - Crear `components/seasons/VedaBadge.tsx`: mostrar ícono de advertencia + texto "En veda" en rojo cuando la especie tiene veda en el mes seleccionado
    - Crear `components/seasons/SuggestedZoneCard.tsx`
    - Crear `app/(client)/seasons.tsx` que consuma `useMonthlySeasons(month)`
    - Offline: datos cacheados + indicador de fecha; sin caché → mensaje "Sin conexión"
    - _Requerimientos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 7.2 Crear hook `useMonthlySeasons`
    - Crear `hooks/useMonthlySeasons.ts`: query a `monthly_seasons` JOIN `species` JOIN `fishing_zones`, `staleTime: 24h`
    - _Requerimientos: 7.4, 21.3_

  - [ ]* 7.3 Escribir tests de VedaBadge y selector de mes
    - Verificar que especie con veda activa en mes seleccionado muestra badge rojo
    - Verificar que especie sin veda no muestra badge
    - _Requerimientos: 7.3_

- [ ] 8. Módulo SOS de Emergencia
  - [ ] 8.1 Implementar botón SOS global y pantalla de emergencia
    - Crear `lib/constants.ts` con coordenadas de Zihuatanejo y contactos SOS hardcodeados: SEMAR (800-201-3100), Cruz Roja Zihuatanejo (755-554-2009), Capitanía de Puerto (755-554-2030)
    - Crear `components/sos/SOSButton.tsx`: overlay flotante de mínimo 48×48 dp, visible en todas las pantallas del cliente; al tocar navegar a `/(client)/sos`
    - Integrar `SOSButton` en `app/(client)/_layout.tsx` como overlay persistente
    - Crear `app/(client)/sos.tsx`: solicitar permiso de ubicación con `expo-location`; obtener GPS con timeout 10 s; mostrar coords + `EmergencyContactCard` por cada contacto
    - _Requerimientos: 8.1, 8.2, 8.3, 8.4_

  - [ ] 8.2 Implementar lógica de fallback y llamadas directas
    - Crear `components/sos/EmergencyContactCard.tsx` con botón que invoca `Linking.openURL('tel:...')`
    - Si timeout GPS → mostrar contactos sin coords + "Ubicación no disponible. Muestra esta pantalla a los servicios de emergencia."
    - Si permiso denegado permanentemente → mostrar contactos + mensaje para ir a configuración
    - Sin internet → usar contactos de `constants.ts` (hardcoded en bundle)
    - Sin internet y caché vacía → usar los números hardcodeados del bundle
    - _Requerimientos: 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 8.3 Escribir tests del módulo SOS
    - Mock de `expo-location` con timeout → verificar que se muestran contactos sin coords
    - Mock sin internet → verificar que se usan contactos de `constants.ts`
    - _Requerimientos: 8.6, 8.9_

- [ ] 9. Favoritos del Cliente
  - [ ] 9.1 Implementar gestión de favoritos con optimistic updates
    - Crear `app/(client)/favorites.tsx`: lista de zonas favoritas ordenadas por `created_at` descendente; mensaje vacío "Aún no tienes zonas favoritas..."
    - Implementar toggle de favorito en `ZoneDetailCard`: optimistic update → si falla, revertir visual + mensaje de error
    - Sincronizar favoritos al abrir la pantalla (re-query a Supabase)
    - _Requerimientos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Panel de Administración básico (cola verificación + gestión de zonas)
  - [ ] 10.1 Implementar dashboard y cola de verificación de proveedores
    - Crear `app/(admin)/index.tsx` con métricas: total clientes, proveedores por estado, reservaciones del mes, monto pagado del mes, zonas activas; suscribir con Realtime a cambios y actualizar en < 5 s
    - Crear `app/(admin)/verification/index.tsx`: lista de proveedores `pending` ordenada por `created_at` ASC
    - Crear `app/(admin)/verification/[providerId].tsx`: detalle con todos los datos del negocio
    - Crear `components/admin/VerificationCard.tsx` y `components/admin/ApproveRejectModal.tsx`
    - _Requerimientos: 19.1, 19.2, 20.1, 20.2_

  - [ ] 10.2 Implementar acciones de aprobación/rechazo con notificación push y audit log
    - Aprobar: `UPDATE providers SET status='approved'` + `INSERT audit_logs (action: 'approve_provider')` + llamar Edge Function `send-push-notification` con mensaje de aprobación
    - Rechazar: requerir motivo 10–300 chars, `UPDATE providers SET status='rejected'` + `INSERT audit_logs` con motivo + push de rechazo
    - _Requerimientos: 2.5, 2.6, 2.7, 2.8, 20.3, 20.4_

  - [ ] 10.3 Implementar gestión de zonas de pesca por el admin
    - Crear `app/(admin)/zones/index.tsx`, `new.tsx`, `[id].tsx` con formulario completo (nombre, coords, descripción, nivel, tipo, especies, señuelos, carnadas, horarios, 1–10 fotos)
    - Al guardar, invalidar query key `fishing_zones` en TanStack Query para forzar re-fetch
    - Desactivar zona: `UPDATE fishing_zones SET is_active=false` sin eliminar registro
    - _Requerimientos: 21.1, 21.3, 21.4_

  - [ ] 10.4 Implementar gestión de temporadas por el admin
    - Crear `app/(admin)/seasons/[month].tsx`: formulario para seleccionar especies probables/posibles, zonas sugeridas, fechas de veda (fecha fin > fecha inicio)
    - Al guardar, invalidar query key `monthly_seasons`
    - _Requerimientos: 21.2, 21.3_

  - [ ]* 10.5 Escribir tests de integración del panel admin
    - Mock de proveedor `pending` → flujo de aprobación → verificar que `audit_logs` recibe entrada
    - Verificar que invalidación de caché provoca nuevo fetch de zonas
    - _Requerimientos: 20.3, 21.3_

- [ ] 11. Checkpoint Fase 1
  - Verificar que los 3 roles (cliente, proveedor, admin básico) se autentican y navegan correctamente a sus dashboards
  - Verificar mapa, temporadas, SOS y favoritos funcionales en dispositivo o simulador
  - Asegurar que todas las pruebas unitarias e de integración de Fase 1 pasan sin errores

---

### Fase 2 — Proveedores: Panel Completo, 8 Módulos, Calendario, Reservaciones, Pagos, Chat

- [ ] 12. Panel del Proveedor — Dashboard y gestión de servicios
  - [ ] 12.1 Implementar dashboard del proveedor con métricas
    - Crear `app/(provider)/index.tsx`: número de servicios `active`, reservaciones del mes, calificación promedio, gráfica de barras de reservaciones por día (últimos 30 días)
    - Crear `components/provider/MetricsCard.tsx`
    - Si proveedor no es `approved`, mostrar pantalla "Acceso restringido" con estado actual
    - _Requerimientos: 13.1, 13.2_

  - [ ] 12.2 Implementar lista y CRUD de servicios del proveedor
    - Crear `app/(provider)/services/index.tsx`: lista de servicios del proveedor con toggle activo/inactivo (actualización en < 2 s)
    - Crear `app/(provider)/services/new.tsx` y `[id]/edit.tsx` con formulario: módulo (uno de 8), nombre (3–100), descripción (10–500), precio > 0, 1–5 fotos (máx 5 MB c/u), horario inicio/fin (fin > inicio), capacidad 1–500
    - Compresión de imágenes antes de subir con `lib/utils/imageCompressor.ts` (máx 1280×1280, máx 5 MB)
    - RLS garantiza que proveedor solo ve/modifica sus propios servicios (403 si intenta acceder a ajenos)
    - Crear `stores/providerStore.ts` (Zustand) con `activeServices`, `pendingReservations`
    - _Requerimientos: 13.3, 13.4, 13.5, 13.6, 27.4_

  - [ ]* 12.3 Escribir tests del formulario de servicio
    - Validar que `ServiceForm` bloquea envío si precio ≤ 0 o más de 5 fotos
    - Validar que el toggle activo/inactivo hace UPDATE en Supabase
    - _Requerimientos: 13.4, 13.5_

- [ ] 13. Calendario de disponibilidad del Proveedor
  - [ ] 13.1 Implementar calendario mensual navegable
    - Crear `app/(provider)/services/[id]/availability.tsx` y `components/provider/CalendarPicker.tsx`
    - Mostrar 3 estados visuales: disponible (sin indicador), bloqueado por proveedor (gris/"Bloqueado"), lleno por capacidad (naranja/"Lleno")
    - _Requerimientos: 14.1, 14.5_

  - [ ] 13.2 Implementar bloqueo de fechas con advertencia de reservaciones confirmadas
    - Al marcar día como no disponible: `INSERT provider_availability`; si el día tiene reservaciones `confirmed`, mostrar modal "Este día tiene [N] reservaciones confirmadas. ¿Deseas bloquear igualmente?" y requerir confirmación
    - Cambio reflejado en calendario en < 2 s
    - Al intentar reservar fecha bloqueada: mostrar "Esta fecha no está disponible" + 3 próximas fechas alternativas
    - _Requerimientos: 14.2, 14.3, 14.4_

  - [ ]* 13.3 Escribir tests del calendario de disponibilidad
    - Verificar que día bloqueado no permite crear reservación
    - Verificar que modal aparece cuando hay reservaciones `confirmed` en el día a bloquear
    - _Requerimientos: 14.2, 14.3_

- [ ] 14. Gestión de Reservaciones del Proveedor
  - [ ] 14.1 Implementar lista de reservaciones filtrable
    - Crear `app/(provider)/reservations/index.tsx`: lista filtrable por estado (`pending`, `confirmed`, `rejected`, `rescheduled`), ordenada por fecha de solicitud descendente
    - Crear `components/provider/ReservationCard.tsx` con badge de estado
    - _Requerimientos: 15.1_

  - [ ] 14.2 Implementar acciones sobre reservaciones con notificaciones push
    - Confirmar reservación `pending` → `UPDATE reservations SET status='confirmed'` + push al cliente "Tu reservación para [Servicio] el [fecha] ha sido confirmada."
    - Rechazar: requerir motivo 10–200 chars → `UPDATE ... status='rejected'` + push con motivo
    - Reprogramar: requerir fecha posterior a hoy → `UPDATE ... status='rescheduled'` + push con nueva propuesta; cliente puede aceptar (`confirmed`) o rechazar (`rejected`) desde su panel; en ambos casos notificar al proveedor por push
    - _Requerimientos: 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 14.3 Escribir tests de ciclo de vida de reservaciones
    - Verificar transición `pending` → `confirmed` → `paid`
    - Verificar que rechazo sin motivo bloquea la acción
    - _Requerimientos: 15.2, 15.3_

- [ ] 15. Módulo de Reservaciones del Cliente
  - [ ] 15.1 Implementar exploración y detalle de servicios
    - Crear `app/(client)/services/index.tsx`: lista de servicios `active` de proveedores `approved`; mostrar precio original tachado + precio con descuento cuando hay promoción activa
    - Crear `app/(client)/services/[id].tsx`: detalle con nombre, descripción, precio (con descuento si aplica), fotos, horario, capacidad, calificación promedio del proveedor
    - Crear `hooks/useProviderServices.ts`
    - _Requerimientos: 18.6, 23.1_

  - [ ] 15.2 Implementar flujo de reservación
    - Crear `app/(client)/reservations/book/[serviceId].tsx` (`BookingFormScreen`): calendario de fechas disponibles (excluir bloqueadas y llenas), selector de número de personas (1 – capacidad máx)
    - Al enviar: `INSERT reservations (status: 'pending')` + push al proveedor "Nueva solicitud de reservación para [Servicio] el [fecha]."
    - _Requerimientos: 23.1, 23.2_

  - [ ] 15.3 Implementar lista de reservaciones del cliente y cancelación
    - Crear `app/(client)/reservations/index.tsx`: lista con estado, nombre de servicio, proveedor, fecha, monto; ordenada por `created_at` DESC
    - Cancelación permitida si fecha del servicio > 24 h; si < 24 h, mostrar modal de advertencia con política del proveedor
    - _Requerimientos: 23.3, 23.5, 23.6_

  - [ ]* 15.4 Escribir tests del flujo de reservación
    - Verificar que no se puede reservar fecha bloqueada
    - Verificar que cancelación < 24 h muestra modal de advertencia
    - _Requerimientos: 14.4, 23.5, 23.6_

- [ ] 16. Pagos con Mercado Pago
  - [ ] 16.1 Crear Edge Functions de pagos
    - Crear `supabase/functions/create-payment-preference/index.ts`: generar preferencia MP con `items`, `payer`, `external_reference = reservationId`, `notification_url`, `back_urls`; retornar `checkoutUrl` en < 5 s
    - Crear `supabase/functions/mercadopago-webhook/index.ts`: validar firma HMAC-SHA256 (HTTP 401 si inválida + registrar en audit_logs), idempotencia por `payment_id`, `UPDATE payments` + `UPDATE reservations SET payment_status='paid'`; si pago fallido, push a cliente y proveedor
    - _Requerimientos: 17.1, 17.2, 17.3, 17.6, 17.7_

  - [ ] 16.2 Implementar pantalla de pago WebView y estado de pago
    - Crear `app/(client)/reservations/[id].tsx` con botón "Pagar" cuando `status='confirmed'` y `payment_status='pending'`
    - Crear `components/payments/PaymentWebView.tsx`: `WebView` con `checkoutUrl` de MP; interceptar deep links `costainteligente://payment/success` y `failure`
    - Crear `components/payments/PaymentStatusCard.tsx`
    - _Requerimientos: 17.1_

  - [ ] 16.3 Implementar historial de pagos del proveedor
    - Crear `app/(provider)/payments.tsx`: tabla paginada (20/página) con fecha, monto MXN, cliente, servicio, estado; total acumulado del mes actual y mes anterior
    - Crear `hooks/usePayments.ts`
    - _Requerimientos: 17.4, 17.5_

  - [ ]* 16.4 Escribir tests de la Edge Function de webhook
    - Mock de request con firma inválida → retorna 401
    - Mock de `payment_id` duplicado → retorna 200 sin modificar registros
    - _Requerimientos: 17.2, 17.3, 17.7_

- [ ] 17. Chat en tiempo real
  - [ ] 17.1 Implementar canal de chat con Supabase Realtime
    - Crear `app/(client)/chat/[reservationId].tsx` y `app/(provider)/chat/[reservationId].tsx`
    - Crear `components/chat/ChatBubble.tsx`
    - Chat se habilita automáticamente cuando `status='confirmed'`; modo solo lectura con banner "Esta conversación está cerrada." cuando `status='rejected'` o `completed`
    - Cargar últimos 50 mensajes al abrir, ordenados por `sent_at` ASC
    - Crear `hooks/useMessages.ts` con suscripción Realtime a `messages` filtrada por `reservation_id`
    - _Requerimientos: 16.1, 16.2, 16.6, 16.8_

  - [ ] 17.2 Implementar validación, push y manejo de errores de red en chat
    - Validar: mensaje no vacío y ≤ 500 chars (mostrar error sin enviar)
    - Entregar mensaje en UI en < 2 s (latencia < 100 ms, 4G/WiFi)
    - Si envío falla por red: mostrar mensaje con ícono de error + botón "Reintentar" sin duplicar en Supabase
    - Enviar push "Nuevo mensaje en tu reservación de [Servicio]" si el otro participante tiene la App en background/cerrada
    - RLS garantiza acceso exclusivo a participantes de la reservación (403 a terceros)
    - _Requerimientos: 16.3, 16.4, 16.5, 16.7_

  - [ ]* 17.3 Escribir tests del módulo de chat
    - Mensaje vacío → verificar que no se envía ni persiste
    - Mensaje > 500 chars → verificar error de validación
    - Reservación `completed` → verificar que campo de entrada está deshabilitado
    - _Requerimientos: 16.4, 16.8_

- [ ] 18. Checkpoint Fase 2
  - Verificar flujo completo de reservación: cliente reserva → proveedor confirma → cliente paga con MP → chat habilitado
  - Verificar los 8 módulos de servicio en el formulario del proveedor
  - Verificar que webhook de MP procesa pagos de forma idempotente
  - Asegurar que todas las pruebas de Fase 2 pasan

---

### Fase 3 — Engagement: Comunidad, Notificaciones Push, Reseñas, Promociones, Equipo y Tutoriales

- [ ] 19. Comunidad — Feed de capturas
  - [ ] 19.1 Implementar feed paginado de comunidad
    - Crear `app/(client)/community/index.tsx` con `useCommunityFeed` (infinite query, 20 publicaciones/página, ordenadas por `catch_date` DESC)
    - Crear `components/community/CatchCard.tsx` y `components/community/InfiniteScrollList.tsx`
    - Carga automática de siguiente página al llegar al final; mostrar "Has llegado al final del feed." cuando no hay más resultados
    - _Requerimientos: 10.4, 10.5, 10.6_

  - [ ] 19.2 Implementar creación y eliminación de publicaciones
    - Crear `app/(client)/community/new-post.tsx`: campos obligatorios (1–3 fotos, especie, zona, peso > 0, fecha no futura); compresión de imágenes a ≤ 1280×1280 antes de calcular tamaño; validar ≤ 5 MB tras compresión
    - Confirmación antes de eliminar publicación propia: "¿Eliminar esta publicación? Esta acción no se puede deshacer."
    - RLS garantiza que cliente no elimina publicaciones ajenas (403)
    - Instalar `expo-image-manipulator` para compresión
    - _Requerimientos: 10.1, 10.2, 10.3, 10.7, 10.8_

  - [ ] 19.3 Crear hook `useCommunityFeed` con infinite query
    - Crear `hooks/useCommunityFeed.ts` con `useInfiniteQuery` de TanStack Query
    - _Requerimientos: 10.4, 10.5_

  - [ ]* 19.4 Escribir tests del módulo de comunidad
    - Imagen > 5 MB después de compresión → mensaje de error, no se carga
    - Eliminación de publicación ajena → retorna 403
    - _Requerimientos: 10.3, 10.8_

- [ ] 20. Notificaciones Push
  - [ ] 20.1 Implementar registro de token y preferencias de notificaciones
    - Crear `hooks/useNotifications.ts`: solicitar permiso al primer login del dispositivo, obtener `ExpoPushToken`, upsert en tabla `push_tokens`; si `DeviceNotRegistered`, eliminar token sin interrumpir lote
    - Integrar `useNotifications` en `app/(client)/_layout.tsx` y `app/(provider)/_layout.tsx`
    - Crear `app/(client)/profile.tsx` con sección de preferencias de notificaciones: 3 toggles ("Alertas de clima", "Vedas", "Avisos generales") habilitados por defecto; persistir en `profiles.notification_prefs` JSONB
    - _Requerimientos: 11.1, 11.5, 11.6_

  - [ ] 20.2 Crear Edge Function `send-push-notification`
    - Crear `supabase/functions/send-push-notification/index.ts`: seleccionar tokens según `userIds` y preferencias, enviar en lotes de 100 a Expo Push API, eliminar tokens `DeviceNotRegistered`
    - Usar desde: aprobación/rechazo de proveedor, confirmación/rechazo/reprogramación de reservación, nuevos mensajes de chat, alertas del admin, vedas, clima adverso
    - _Requerimientos: 2.6, 2.8, 11.2, 11.3, 11.4, 11.6, 22.4_

  - [ ]* 20.3 Escribir tests de la Edge Function de push
    - Mock con token `DeviceNotRegistered` → verificar que el token se elimina
    - Verificar que el envío en lotes de 100 no falla con 150 tokens
    - _Requerimientos: 11.6_

- [ ] 21. Reseñas y Promociones del Proveedor
  - [ ] 21.1 Implementar pantalla de reseñas del proveedor
    - Crear `app/(provider)/reviews.tsx`: lista de reseñas de todos sus servicios ordenadas por fecha DESC (calificación, comentario, nombre del cliente, fecha); calificación promedio redondeada a 1 decimal; "Sin calificaciones aún" si vacío
    - _Requerimientos: 18.1, 18.2_

  - [ ] 21.2 Implementar CRUD de promociones
    - Crear `app/(provider)/promotions/index.tsx` y `new.tsx`
    - Validar: título 3–100, descripción 10–300, descuento 1–100%, servicio activo del proveedor, fecha inicio ≥ hoy, fecha fin > fecha inicio
    - Bloquear segunda promoción activa para el mismo servicio: "Este servicio ya tiene una promoción activa..."
    - Crear Edge Function `deactivate-expired-promotions`: cron a las 00:01 CDMX, `UPDATE promotions SET status='inactive' WHERE end_date < NOW() AND status='active'`
    - Mostrar precio con descuento en `ServiceDetailScreen`: precio original tachado + `precio × (1 - descuento/100)` redondeado a 2 decimales
    - _Requerimientos: 18.3, 18.4, 18.5, 18.6_

  - [ ] 21.3 Crear Edge Function `deactivate-expired-promotions`
    - Crear `supabase/functions/deactivate-expired-promotions/index.ts` con trigger de cron en Supabase
    - _Requerimientos: 18.5_

  - [ ]* 21.4 Escribir tests de promociones
    - Validar que segunda promoción activa para el mismo servicio es bloqueada
    - Verificar que precio con descuento del 20% se calcula correctamente (redondeado a 2 decimales)
    - _Requerimientos: 18.4, 18.6_

- [ ] 22. Equipo Recomendado y Tutoriales
  - [ ] 22.1 Implementar pantalla de equipo recomendado
    - Crear `app/(client)/equipment.tsx` con selector de nivel (principiante, intermedio, avanzado)
    - Crear `components/ui/EquipmentCard.tsx`: nombre, descripción, uso recomendado; si no hay items para el nivel: "No hay equipo registrado para este nivel aún."
    - Crear `hooks/useEquipment.ts` con `staleTime: 24h`
    - _Requerimientos: 12.1, 12.2, 12.5_

  - [ ] 22.2 Implementar pantalla de tutoriales con YouTube embed
    - Crear `app/(client)/tutorials.tsx`
    - Crear `components/tutorials/TutorialCard.tsx` y `components/tutorials/YouTubeEmbed.tsx`: `WebView` con HTML de iframe embed; `mediaPlaybackRequiresUserAction: true` (no autoplay); botón de play en miniatura antes de reproducir
    - Instalar `react-native-webview`
    - Crear `hooks/useTutorials.ts` con `staleTime: 24h`
    - _Requerimientos: 12.3, 12.4, 12.5_

  - [ ]* 22.3 Escribir tests de TutorialCard y EquipmentCard
    - Verificar que `YouTubeEmbed` no inicia reproducción automática al montarse
    - Verificar que `useEquipment` con nivel sin registros retorna array vacío y componente muestra mensaje correcto
    - _Requerimientos: 12.2, 12.3_

- [ ] 23. Alertas y reportes del Administrador
  - [ ] 23.1 Implementar composición y envío de alertas
    - Crear `app/(admin)/alerts.tsx` con `components/admin/AlertComposer.tsx`: título 3–100, mensaje 10–500, botón "Publicar y Notificar"
    - Al publicar: `INSERT alerts` + llamar `send-push-notification` a todos los usuarios con token; máximo 60 s de entrega
    - _Requerimientos: 22.3, 22.4_

  - [ ] 23.2 Implementar gestión de reportes y log de auditoría
    - Crear `app/(admin)/reports.tsx`: lista ordenada por `created_at` DESC con tipo, descripción, nombre del reporter, fecha, estado; botón "Marcar como resuelto" → `UPDATE reports SET status='resolved'` + `INSERT audit_logs (action: 'resolve_report')`
    - Crear `app/(admin)/audit-logs.tsx`: tabla paginada (50/página) con nombre del admin, acción, entidad, fecha/hora, descripción; ordenada por `created_at` DESC
    - _Requerimientos: 22.1, 22.2, 22.5_

  - [ ]* 23.3 Escribir tests de alertas y reportes
    - Verificar que alerta con título < 3 chars no se publica
    - Verificar que marcar reporte como resuelto genera entrada en `audit_logs`
    - _Requerimientos: 22.1, 22.2, 22.3_

- [ ] 24. Validación global con Zod y utilidades compartidas
  - [ ] 24.1 Completar esquemas de validación Zod y utilidades
    - Completar `lib/validation/auth.schemas.ts`, `provider.schemas.ts`, `reservation.schemas.ts`
    - Crear `lib/utils/imageCompressor.ts` con `expo-image-manipulator` (resize a 1280×1280, calidad 0.8)
    - Crear `lib/utils/formatCurrency.ts` (formato MXN con `Intl.NumberFormat`)
    - Crear `lib/utils/dateHelpers.ts` (parseo, formato, comparación de fechas)
    - Verificar que Edge Functions validan con Zod y retornan HTTP 422 si falla la validación
    - _Requerimientos: 24.1, 24.5_

  - [ ]* 24.2 Escribir tests unitarios de validaciones y utilidades
    - `reservationSchema` con fecha pasada → error
    - `imageCompressor` produce imagen ≤ 1280×1280
    - `formatCurrency` formatea correctamente a MXN
    - _Requerimientos: 24.1_

- [ ] 25. Checkpoint Fase 3
  - Verificar feed de comunidad, publicación de capturas, favoritos y reseñas funcionales
  - Verificar notificaciones push en dispositivo real (iOS y Android)
  - Verificar promociones: creación, restricción de duplicados y desactivación automática
  - Verificar equipo y tutoriales cargando desde Supabase con caché de 24 h
  - Asegurar que todas las pruebas de Fase 3 pasan

---

### Fase 4 — Publicación: Testing, CI/CD, OTA, Tiendas

- [ ] 26. Testing integral y CI/CD
  - [ ] 26.1 Configurar Jest y React Native Testing Library
    - Instalar y configurar Jest con `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`
    - Crear mocks de `@supabase/supabase-js`, `expo-location`, `expo-notifications`, `expo-secure-store`
    - Crear `__tests__/auth.test.ts` con casos de `registerClientSchema` y `registerProviderSchema`
    - Configurar coverage con umbral mínimo del 70% en `lib/validation/`
    - _Requerimientos: 24.1, 25.1_

  - [ ] 26.2 Crear tests de integración de componentes críticos
    - `__tests__/ZoneDetailCard.test.tsx`: verificar render de calificación promedio y badge de veda
    - `__tests__/SOSButton.test.tsx`: verificar que overlay es visible en todas las pantallas de cliente
    - `__tests__/PaymentWebView.test.tsx`: verificar intercepción de deep links de éxito/fallo
    - _Requerimientos: 6.2, 8.1, 17.1_

  - [ ] 26.3 Configurar pipeline CI/CD con GitHub Actions
    - Crear `.github/workflows/ci.yml`: job `test` (npm ci, npm test --coverage, tsc --noEmit) en push a `main` y `develop`; job `build-preview` (EAS build --platform all --profile preview) condicional a push en `main`
    - Configurar `EXPO_TOKEN` como GitHub Secret
    - _Requerimientos: 25.1_

  - [ ]* 26.4 Crear flows de testing E2E con Maestro
    - Crear `maestro/flows/auth.yaml`: login de cliente → verificar dashboard
    - Crear `maestro/flows/reservation.yaml`: cliente reserva servicio → proveedor confirma → cliente paga → chat habilitado
    - Crear `maestro/flows/sos.yaml`: activar SOS → verificar que aparecen contactos de emergencia
    - _Requerimientos: 8.4, 15.2, 23.1_

- [ ] 27. Configuración EAS Build, OTA y preparación para tiendas
  - [ ] 27.1 Configurar `eas.json` con perfiles de build
    - Crear `eas.json` con perfiles `development` (cliente de desarrollo, distribución interna), `preview` (distribución interna, iOS no-simulator) y `production` (autoIncrement, env `APP_ENV=production`)
    - Configurar sección `submit.production` con `appleId`, `ascAppId`, `appleTeamId` e `serviceAccountKeyPath` para Android
    - _Requerimientos: 25.1, 25.4, 25.5_

  - [ ] 27.2 Configurar Expo Updates para OTA
    - Configurar `app.json` con `updates.url`, `runtimeVersion.policy: appVersion` y canal `production`
    - Verificar que actualizaciones OTA se descargan en background y se aplican en el siguiente reinicio sin interrumpir sesión activa
    - _Requerimientos: 25.2, 25.3_

  - [ ] 27.3 Configurar EAS Secrets y variables de entorno
    - Documentar en `README.md` los comandos `eas secret:create` para: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `EXPO_PUBLIC_PROJECT_ID`
    - Verificar que ningún secret aparece en el código fuente ni en archivos del repositorio
    - _Requerimientos: 24.2, 25.1_

  - [ ] 27.4 Preparar builds de producción y checklist de lanzamiento
    - Ejecutar `eas build --platform ios --profile production` → IPA firmado con perfil App Store → subir a TestFlight
    - Ejecutar `eas build --platform android --profile production` → AAB firmado → subir a Google Play Console (track "internal")
    - Verificar checklist: RLS habilitado y probado, Edge Functions desplegadas, política de privacidad publicada (URL pública), aviso LFPDPPP en flujo de registro, permisos iOS/Android en `app.json`, keystore respaldado, canal `production` de Expo Updates probado con OTA de prueba, integración MP probada en sandbox
    - _Requerimientos: 25.4, 25.5, 24.3, 24.4, 24.6_

  - [ ]* 27.5 Escribir tests de configuración de build
    - Verificar que `app.json` contiene `scheme: 'costainteligente'`, permisos de iOS/Android y `updates.url`
    - Verificar que `eas.json` tiene los 3 perfiles requeridos
    - _Requerimientos: 25.1_

- [ ] 28. Checkpoint Final — Verificación completa
  - Ejecutar suite de tests completa y verificar que todos los tests pasan (unitarios, integración, E2E)
  - Verificar crash-free sessions ≥ 99% en TestFlight y Google Play Internal Testing
  - Verificar que los 3 roles son funcionales de extremo a extremo en dispositivos reales
  - Revisar que costo de infraestructura estimado sea < $20 USD/mes con el plan Free de Supabase
  - Asegurar que todas las métricas del checklist de lanzamiento están completas antes de publicar en tiendas

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido, pero se recomienda completarlas antes de la publicación en tiendas
- Las Edge Functions se desarrollan en Deno TypeScript y se despliegan con `supabase functions deploy`
- El diseño no incluye una sección de "Correctness Properties", por lo que no se incluyen sub-tareas de property-based testing; se usan únicamente tests unitarios e de integración
- Todos los uploads de imagen deben pasar por `imageCompressor.ts` antes de enviarse a Supabase Storage
- Las variables de entorno del cliente usan el prefijo `EXPO_PUBLIC_`; las de las Edge Functions usan `Deno.env.get()`
- El plan Free de Supabase soporta el MVP; migrar a plan Pro cuando cualquier límite llegue al 80%
- Los contactos de emergencia SOS están hardcodeados en `lib/constants.ts` como fallback final sin red

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "2.2"] },
    { "id": 3, "tasks": ["1.4", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.2"] },
    { "id": 5, "tasks": ["3.4", "3.5", "4.1", "8.1"] },
    { "id": 6, "tasks": ["4.3", "5.1", "5.3", "7.2", "8.2"] },
    { "id": 7, "tasks": ["5.2", "6.1", "7.1", "8.3", "9.1"] },
    { "id": 8, "tasks": ["5.4", "6.2", "7.3", "10.1"] },
    { "id": 9, "tasks": ["6.3", "10.2", "10.3"] },
    { "id": 10, "tasks": ["10.4", "10.5"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3", "13.1", "16.1"] },
    { "id": 13, "tasks": ["13.2", "14.1", "15.1"] },
    { "id": 14, "tasks": ["13.3", "14.2", "15.2", "16.2"] },
    { "id": 15, "tasks": ["14.3", "15.3", "16.3"] },
    { "id": 16, "tasks": ["15.4", "16.4", "17.1"] },
    { "id": 17, "tasks": ["17.2"] },
    { "id": 18, "tasks": ["17.3", "19.1", "19.3", "20.1", "20.2"] },
    { "id": 19, "tasks": ["19.2", "20.3", "21.1", "21.2", "21.3", "22.1", "22.2"] },
    { "id": 20, "tasks": ["19.4", "21.4", "22.3", "23.1", "23.2", "24.1"] },
    { "id": 21, "tasks": ["23.3", "24.2"] },
    { "id": 22, "tasks": ["26.1"] },
    { "id": 23, "tasks": ["26.2", "26.3"] },
    { "id": 24, "tasks": ["26.4", "27.1", "27.3"] },
    { "id": 25, "tasks": ["27.2", "27.4"] },
    { "id": 26, "tasks": ["27.5"] }
  ]
}
```
