/**
 * Drizzle ORM Schema — Costa Inteligente
 * PostgreSQL via Railway
 * @module lib/db/schema
 */

import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum        = pgEnum('user_role',        ['client', 'provider', 'admin']);
export const providerStatusEnum  = pgEnum('provider_status',  ['pending', 'approved', 'rejected']);
export const moduleTypeEnum      = pgEnum('module_type',      ['boat','guide','sport','rental','restaurant','store','fishMarket','transport']);
export const serviceStatusEnum   = pgEnum('service_status',   ['active', 'inactive']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pending','confirmed','rejected','rescheduled','completed','cancelled']);
export const paymentStatusEnum   = pgEnum('payment_status',   ['pending', 'paid', 'failed']);
export const paymentFullStatusEnum = pgEnum('payment_full_status', ['pending','paid','failed','refunded']);
export const alertTypeEnum       = pgEnum('alert_type',       ['weather', 'veda', 'general']);
export const reportTypeEnum      = pgEnum('report_type',      ['provider', 'post', 'user']);
export const reportStatusEnum    = pgEnum('report_status',    ['pending', 'resolved']);
export const platformEnum        = pgEnum('platform',         ['ios', 'android']);
export const levelEnum           = pgEnum('level',            ['principiante', 'intermedio', 'avanzado']);
export const probabilityEnum     = pgEnum('probability',      ['probable', 'posible']);
export const promoStatusEnum     = pgEnum('promo_status',     ['active', 'inactive']);

// ─── Helper: timestamps reutilizables ─────────────────────────────────────────
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ─── users (auth) ─────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           text('id').primaryKey(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  ...timestamps,
}, (t) => ({
  emailIdx: uniqueIndex('idx_users_email').on(t.email),
}));

// ─── profiles ─────────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id:                text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  role:              userRoleEnum('role').notNull().default('client'),
  fullName:          text('full_name'),
  avatarUrl:         text('avatar_url'),
  phone:             text('phone'),
  notificationPrefs: text('notification_prefs').default('{"weather":true,"vedas":true,"general":true}'),
  ...timestamps,
}, (t) => ({
  roleIdx: index('idx_profiles_role').on(t.role),
}));

// ─── sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex('idx_sessions_token').on(t.token),
  userIdx:  index('idx_sessions_user').on(t.userId),
}));

// ─── providers ────────────────────────────────────────────────────────────────
export const providers = pgTable('providers', {
  id:              text('id').primaryKey(),
  userId:          text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  businessName:    text('business_name').notNull(),
  serviceType:     text('service_type').notNull(),
  rfc:             text('rfc').notNull(),
  phone:           text('phone').notNull(),
  address:         text('address').notNull(),
  status:          providerStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  ...timestamps,
}, (t) => ({
  statusIdx: index('idx_providers_status').on(t.status),
  userIdx:   index('idx_providers_user_id').on(t.userId),
}));

// ─── species ──────────────────────────────────────────────────────────────────
export const species = pgTable('species', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull().unique(),
  localName:   text('local_name'),
  description: text('description'),
  imageUrl:    text('image_url'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── fishing_zones ────────────────────────────────────────────────────────────
export const fishingZones = pgTable('fishing_zones', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  description:  text('description'),
  latitude:     real('latitude').notNull(),
  longitude:    real('longitude').notNull(),
  level:        levelEnum('level').notNull(),
  zoneType:     text('zone_type').notNull(),
  lures:        text('lures').default('[]'),
  baits:        text('baits').default('[]'),
  optimalHours: text('optimal_hours'),
  photoUrls:    text('photo_urls').default('[]'),
  isActive:     boolean('is_active').notNull().default(true),
  ...timestamps,
}, (t) => ({
  activeIdx: index('idx_zones_active').on(t.isActive),
  levelIdx:  index('idx_zones_level').on(t.level),
}));

// ─── zone_fish ────────────────────────────────────────────────────────────────
export const zoneFish = pgTable('zone_fish', {
  id:          text('id').primaryKey(),
  zoneId:      text('zone_id').notNull().references(() => fishingZones.id, { onDelete: 'cascade' }),
  speciesId:   text('species_id').notNull().references(() => species.id, { onDelete: 'cascade' }),
  probability: probabilityEnum('probability').notNull(),
}, (t) => ({
  uniqueZoneSpecies: uniqueIndex('idx_zone_fish_unique').on(t.zoneId, t.speciesId),
  zoneIdx:           index('idx_zone_fish_zone').on(t.zoneId),
}));

// ─── monthly_seasons ──────────────────────────────────────────────────────────
export const monthlySeasons = pgTable('monthly_seasons', {
  id:               text('id').primaryKey(),
  month:            integer('month').notNull(),
  speciesId:        text('species_id').notNull().references(() => species.id, { onDelete: 'cascade' }),
  probability:      probabilityEnum('probability').notNull(),
  suggestedZoneIds: text('suggested_zone_ids').default('[]'),
  vedaStart:        text('veda_start'),
  vedaEnd:          text('veda_end'),
}, (t) => ({
  uniqueMonthSpecies: uniqueIndex('idx_seasons_unique').on(t.month, t.speciesId),
  monthIdx:           index('idx_seasons_month').on(t.month),
}));

// ─── zone_reviews ─────────────────────────────────────────────────────────────
export const zoneReviews = pgTable('zone_reviews', {
  id:      text('id').primaryKey(),
  zoneId:  text('zone_id').notNull().references(() => fishingZones.id, { onDelete: 'cascade' }),
  userId:  text('user_id').notNull().references(() => profiles.id,     { onDelete: 'cascade' }),
  rating:  integer('rating').notNull(),
  comment: text('comment'),
  ...timestamps,
}, (t) => ({
  uniqueZoneUser: uniqueIndex('idx_reviews_unique').on(t.zoneId, t.userId),
  zoneIdx:        index('idx_reviews_zone').on(t.zoneId),
}));

// ─── provider_services ────────────────────────────────────────────────────────
export const providerServices = pgTable('provider_services', {
  id:            text('id').primaryKey(),
  providerId:    text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  moduleType:    moduleTypeEnum('module_type').notNull(),
  name:          text('name').notNull(),
  description:   text('description').notNull(),
  price:         real('price').notNull(),
  capacity:      integer('capacity').notNull(),
  scheduleStart: text('schedule_start').notNull(),
  scheduleEnd:   text('schedule_end').notNull(),
  photoUrls:     text('photo_urls').default('[]'),
  status:        serviceStatusEnum('status').notNull().default('active'),
  metadata:      text('metadata').default('{}'),
  ...timestamps,
}, (t) => ({
  providerIdx: index('idx_provider_services_provider').on(t.providerId),
  statusIdx:   index('idx_provider_services_status').on(t.status),
}));

// ─── provider_availability ────────────────────────────────────────────────────
export const providerAvailability = pgTable('provider_availability', {
  id:          text('id').primaryKey(),
  serviceId:   text('service_id').notNull().references(() => providerServices.id, { onDelete: 'cascade' }),
  blockedDate: text('blocked_date').notNull(),
  reason:      text('reason'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueServiceDate: uniqueIndex('idx_avail_unique').on(t.serviceId, t.blockedDate),
  serviceDateIdx:    index('idx_avail_service_date').on(t.serviceId, t.blockedDate),
}));

// ─── reservations ─────────────────────────────────────────────────────────────
export const reservations = pgTable('reservations', {
  id:              text('id').primaryKey(),
  clientId:        text('client_id').notNull().references(() => profiles.id),
  serviceId:       text('service_id').notNull().references(() => providerServices.id),
  providerId:      text('provider_id').notNull().references(() => providers.id),
  reservationDate: text('reservation_date').notNull(),
  partySize:       integer('party_size').notNull(),
  status:          reservationStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  proposedDate:    text('proposed_date'),
  paymentStatus:   paymentStatusEnum('payment_status').default('pending'),
  amount:          real('amount'),
  ...timestamps,
}, (t) => ({
  clientIdx:   index('idx_res_client').on(t.clientId),
  providerIdx: index('idx_res_provider').on(t.providerId),
  serviceIdx:  index('idx_res_service').on(t.serviceId),
  statusIdx:   index('idx_res_status').on(t.status),
  dateIdx:     index('idx_res_date').on(t.reservationDate),
}));

// ─── payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id:              text('id').primaryKey(),
  reservationId:   text('reservation_id').notNull().references(() => reservations.id),
  mpPaymentId:     text('mp_payment_id').notNull().unique(),
  mpPreferenceId:  text('mp_preference_id'),
  amount:          real('amount').notNull(),
  currency:        text('currency').default('MXN'),
  status:          paymentFullStatusEnum('status').notNull(),
  processedAt:     timestamp('processed_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  resIdx: index('idx_payments_res').on(t.reservationId),
  mpIdx:  uniqueIndex('idx_payments_mp').on(t.mpPaymentId),
}));

// ─── messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id:            text('id').primaryKey(),
  reservationId: text('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  senderId:      text('sender_id').notNull().references(() => profiles.id),
  content:       text('content').notNull(),
  sentAt:        timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  resIdx:    index('idx_msg_reservation').on(t.reservationId),
  sentAtIdx: index('idx_msg_sent_at').on(t.sentAt),
}));

// ─── community_posts ──────────────────────────────────────────────────────────
export const communityPosts = pgTable('community_posts', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  speciesId: text('species_id').references(() => species.id),
  zoneId:    text('zone_id').references(() => fishingZones.id),
  photoUrls: text('photo_urls').notNull().default('[]'),
  weightKg:  real('weight_kg'),
  catchDate: text('catch_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('idx_posts_user').on(t.userId),
  dateIdx: index('idx_posts_date').on(t.catchDate),
}));

// ─── user_favorites ───────────────────────────────────────────────────────────
export const userFavorites = pgTable('user_favorites', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  zoneId:    text('zone_id').notNull().references(() => fishingZones.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueUserZone: uniqueIndex('idx_favs_unique').on(t.userId, t.zoneId),
  userIdx:        index('idx_favs_user').on(t.userId),
}));

// ─── alerts ───────────────────────────────────────────────────────────────────
export const alerts = pgTable('alerts', {
  id:      text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => profiles.id),
  type:    alertTypeEnum('type').notNull(),
  title:   text('title').notNull(),
  message: text('message').notNull(),
  sentAt:  timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── reports ──────────────────────────────────────────────────────────────────
export const reports = pgTable('reports', {
  id:          text('id').primaryKey(),
  reporterId:  text('reporter_id').notNull().references(() => profiles.id),
  reportType:  reportTypeEnum('report_type').notNull(),
  targetId:    text('target_id').notNull(),
  description: text('description').notNull(),
  status:      reportStatusEnum('status').notNull().default('pending'),
  resolvedBy:  text('resolved_by').references(() => profiles.id),
  ...timestamps,
}, (t) => ({
  statusIdx: index('idx_reports_status').on(t.status),
}));

// ─── audit_logs ───────────────────────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id:          text('id').primaryKey(),
  adminId:     text('admin_id').notNull().references(() => profiles.id),
  action:      text('action').notNull(),
  targetType:  text('target_type'),
  targetId:    text('target_id'),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adminIdx: index('idx_audit_admin').on(t.adminId),
  dateIdx:  index('idx_audit_date').on(t.createdAt),
}));

// ─── push_tokens ──────────────────────────────────────────────────────────────
export const pushTokens = pgTable('push_tokens', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  platform:  platformEnum('platform'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueUserToken: uniqueIndex('idx_tokens_unique').on(t.userId, t.token),
  userIdx:         index('idx_tokens_user').on(t.userId),
}));

// ─── equipment ────────────────────────────────────────────────────────────────
export const equipment = pgTable('equipment', {
  id:             text('id').primaryKey(),
  name:           text('name').notNull(),
  description:    text('description').notNull(),
  level:          levelEnum('level').notNull(),
  recommendedUse: text('recommended_use'),
  imageUrl:       text('image_url'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── tutorials ────────────────────────────────────────────────────────────────
export const tutorials = pgTable('tutorials', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  youtubeUrl:  text('youtube_url').notNull(),
  level:       levelEnum('level'),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── promotions ───────────────────────────────────────────────────────────────
export const promotions = pgTable('promotions', {
  id:              text('id').primaryKey(),
  providerId:      text('provider_id').notNull().references(() => providers.id,        { onDelete: 'cascade' }),
  serviceId:       text('service_id').notNull().references(() => providerServices.id,  { onDelete: 'cascade' }),
  title:           text('title').notNull(),
  description:     text('description').notNull(),
  discountPercent: integer('discount_percent').notNull(),
  startDate:       text('start_date').notNull(),
  endDate:         text('end_date').notNull(),
  status:          promoStatusEnum('status').notNull().default('active'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  serviceIdx: index('idx_promos_service').on(t.serviceId),
  statusIdx:  index('idx_promos_status').on(t.status),
}));

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user:         one(users,     { fields: [profiles.id], references: [users.id] }),
  provider:     one(providers, { fields: [profiles.id], references: [providers.userId] }),
  reservations: many(reservations),
  reviews:      many(zoneReviews),
  favorites:    many(userFavorites),
  posts:        many(communityPosts),
  pushTokens:   many(pushTokens),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  profile:      one(profiles, { fields: [providers.userId], references: [profiles.id] }),
  services:     many(providerServices),
  reservations: many(reservations),
  promotions:   many(promotions),
}));

export const providerServicesRelations = relations(providerServices, ({ one, many }) => ({
  provider:     one(providers, { fields: [providerServices.providerId], references: [providers.id] }),
  availability: many(providerAvailability),
  reservations: many(reservations),
  promotions:   many(promotions),
}));

export const fishingZonesRelations = relations(fishingZones, ({ many }) => ({
  zoneFish:  many(zoneFish),
  reviews:   many(zoneReviews),
  favorites: many(userFavorites),
  posts:     many(communityPosts),
}));

export const zoneFishRelations = relations(zoneFish, ({ one }) => ({
  zone:    one(fishingZones, { fields: [zoneFish.zoneId],    references: [fishingZones.id] }),
  species: one(species,      { fields: [zoneFish.speciesId], references: [species.id] }),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  zoneFish: many(zoneFish),
  seasons:  many(monthlySeasons),
  posts:    many(communityPosts),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  client:   one(profiles,        { fields: [reservations.clientId],   references: [profiles.id] }),
  service:  one(providerServices,{ fields: [reservations.serviceId],  references: [providerServices.id] }),
  provider: one(providers,       { fields: [reservations.providerId], references: [providers.id] }),
  messages: many(messages),
  payments: many(payments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  reservation: one(reservations, { fields: [messages.reservationId], references: [reservations.id] }),
  sender:      one(profiles,     { fields: [messages.senderId],      references: [profiles.id] }),
}));
