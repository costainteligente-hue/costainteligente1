/**
 * Admin — Gestión de usuarios registrados (datos reales de Railway/PostgreSQL)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

type UserStatus = 'active' | 'suspended' | 'blocked';

interface AppUser {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: UserStatus;
  registeredAt: string;
}

// ─── Fetch real ───────────────────────────────────────────────────────────────
async function fetchAdminUsers(): Promise<AppUser[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=users`);
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  }
  const { adminUsersRepository } = await import('@/lib/repositories/admin-users.repository');
  return adminUsersRepository.findAll();
}

async function changeUserStatus(userId: string, status: UserStatus, reason?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status, reason }),
    });
    if (!res.ok) throw new Error('Error al cambiar estado');
    return;
  }
  // Native: direct DB upsert
  const { getDb } = await import('@/lib/db/client');
  const db = getDb();
  // user_blocks table may not exist yet — graceful fallback
  try {
    await db.execute(
      `INSERT INTO user_blocks (user_id, status, reason, updated_at)
       VALUES ('${userId}', '${status}', ${reason ? `'${reason}'` : 'NULL'}, NOW())
       ON CONFLICT (user_id) DO UPDATE SET status = '${status}', updated_at = NOW()` as any
    );
  } catch {
    // table doesn't exist yet; status stored locally only
  }
}

function useAdminUsers() {
  return useQuery({ queryKey: ['admin_users'], queryFn: fetchAdminUsers, staleTime: 1000 * 60 * 2 });
}

// ─── Colores ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<UserStatus, string> = { active: COLORS.success, suspended: COLORS.warning, blocked: COLORS.danger };
const STATUS_LABEL: Record<UserStatus, string> = { active: 'Activo', suspended: 'Suspendido', blocked: 'Bloqueado' };
const ROLE_COLOR: Record<string, string>  = { client: COLORS.info, provider: COLORS.ocean, admin: COLORS.purple };
const ROLE_LABEL: Record<string, string>  = { client: 'Cliente', provider: 'Proveedor', admin: 'Admin' };

// ─── Modal detalle ────────────────────────────────────────────────────────────
function UserDetailModal({ user, onClose, onStatusChange }: {
  user: AppUser; onClose: () => void; onStatusChange: (id: string, s: UserStatus) => void;
}) {
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const color = STATUS_COLOR[user.status];
  const rlColor = ROLE_COLOR[user.role] ?? COLORS.ocean;

  const actions: { label: string; status: UserStatus; color: string; icon: keyof typeof MaterialIcons.glyphMap; confirm: string }[] = [
    { label: 'Activar cuenta',  status: 'active',    color: COLORS.success, icon: 'check-circle', confirm: 'Esto permitirá al usuario usar la app normalmente.' },
    { label: 'Suspender',       status: 'suspended', color: COLORS.warning, icon: 'pause-circle',  confirm: 'El usuario no podrá iniciar sesión temporalmente.' },
    { label: 'Bloquear',        status: 'blocked',   color: COLORS.danger,  icon: 'block',         confirm: 'El usuario quedará bloqueado permanentemente.' },
  ].filter((a) => a.status !== user.status);

  const handleAction = (a: typeof actions[0]) => {
    Alert.alert(a.label, a.confirm, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: a.status === 'blocked' ? 'destructive' : 'default',
        onPress: async () => {
          setSaving(true);
          try {
            await changeUserStatus(user.id, a.status);
            onStatusChange(user.id, a.status);
            qc.invalidateQueries({ queryKey: ['admin_users'] });
            onClose();
          } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado. Intenta de nuevo.');
          } finally { setSaving(false); }
        },
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${rlColor}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name={user.role === 'provider' ? 'storefront' : 'person'} size={24} color={rlColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>{user.fullName ?? '(Sin nombre)'}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
              <View style={{ backgroundColor: `${rlColor}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: rlColor, fontSize: 10, fontWeight: '800' }}>{ROLE_LABEL[user.role] ?? user.role}</Text>
              </View>
              <View style={{ backgroundColor: `${color}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{STATUS_LABEL[user.status]}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <CardBox>
            {[
              { label: 'Correo',     value: user.email,                      icon: 'email'          as const },
              { label: 'Teléfono',   value: user.phone ?? 'No registrado',   icon: 'phone'          as const },
              { label: 'Rol',        value: ROLE_LABEL[user.role] ?? user.role, icon: 'person'       as const },
              { label: 'Registrado', value: user.registeredAt,               icon: 'calendar-today' as const },
            ].map((f) => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <MaterialIcons name={f.icon} size={17} color={COLORS.ocean} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700' }}>{f.label}</Text>
                  <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 13 }}>{f.value}</Text>
                </View>
              </View>
            ))}
          </CardBox>

          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, marginBottom: 10 }}>Acciones de cuenta</Text>
          {saving && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color={COLORS.ocean} />
              <Text style={{ color: '#64748B', marginTop: 8 }}>Aplicando cambio...</Text>
            </View>
          )}
          {!saving && (
            <View style={{ gap: 10 }}>
              {actions.map((a) => (
                <TouchableOpacity key={a.status} onPress={() => handleAction(a)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: `${a.color}40`, backgroundColor: `${a.color}08` }}>
                  <MaterialIcons name={a.icon} size={20} color={a.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: a.color }}>{a.label}</Text>
                    <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 2 }}>{a.confirm}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={a.color} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function UsersScreen() {
  const { data, isLoading, error, refetch } = useAdminUsers();
  const [localStatus, setLocalStatus] = useState<Record<string, UserStatus>>({});
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [selected, setSelected]       = useState<AppUser | null>(null);

  const users = useMemo<AppUser[]>(() => {
    return (data ?? []).map((u) => ({ ...u, status: localStatus[u.id] ?? u.status }));
  }, [data, localStatus]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch  = !q || (u.fullName ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? '').includes(q);
      const matchRole    = roleFilter === 'all'   || u.role === roleFilter;
      const matchStatus  = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(() => ({
    total:     users.length,
    active:    users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    blocked:   users.filter((u) => u.status === 'blocked').length,
    clients:   users.filter((u) => u.role === 'client').length,
    providers: users.filter((u) => u.role === 'provider').length,
  }), [users]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, s) => setLocalStatus((prev) => ({ ...prev, [id]: s }))}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Título */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.ocean}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="people" size={24} color={COLORS.ocean} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>Usuarios registrados</Text>
            <Text style={{ color: '#64748B', fontSize: 12 }}>
              {isLoading ? 'Cargando...' : `${counts.total} cuentas · ${counts.clients} clientes · ${counts.providers} proveedores`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} style={{ padding: 8 }}>
            <MaterialIcons name="refresh" size={22} color={COLORS.ocean} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {([
            { label: 'Activos',     val: counts.active,    color: COLORS.success },
            { label: 'Suspendidos', val: counts.suspended, color: COLORS.warning },
            { label: 'Bloqueados',  val: counts.blocked,   color: COLORS.danger  },
          ] as const).map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{isLoading ? '—' : s.val}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Buscador */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, gap: 8, marginBottom: 12 }}>
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nombre, correo o teléfono..." placeholderTextColor="#94A3B8" style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' }} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={18} color="#94A3B8" /></TouchableOpacity>}
        </View>

        {/* Filtros rol */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
          {(['all', 'client', 'provider'] as const).map((r) => {
            const labels = { all: 'Todos', client: '👤 Clientes', provider: '🏪 Proveedores' };
            const active = roleFilter === r;
            return (
              <TouchableOpacity key={r} onPress={() => setRoleFilter(r)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? COLORS.ocean : '#fff', borderWidth: 1, borderColor: active ? COLORS.ocean : '#E2E8F0' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: active ? '#fff' : '#0F172A' }}>{labels[r]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filtros estado */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {(['all', 'active', 'suspended', 'blocked'] as const).map((s) => {
            const labels = { all: 'Todos', active: '✅ Activos', suspended: '⏸ Suspendidos', blocked: '🚫 Bloqueados' };
            const colors = { all: '#64748B', active: COLORS.success, suspended: COLORS.warning, blocked: COLORS.danger };
            const active = statusFilter === s;
            return (
              <TouchableOpacity key={s} onPress={() => setStatusFilter(s)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? colors[s] : '#fff', borderWidth: 1, borderColor: active ? colors[s] : '#E2E8F0' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: active ? '#fff' : '#0F172A' }}>{labels[s]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Estado de carga / error */}
        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando usuarios...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30`, marginBottom: 12 }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar usuarios. Verifica tu conexión.</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista */}
        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState icon="people" title="Sin resultados" message="No hay usuarios que coincidan con tu búsqueda." buttonLabel="Limpiar filtros" onPress={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }} />
        )}

        {!isLoading && filtered.map((user) => {
          const stColor = STATUS_COLOR[user.status];
          const rlColor = ROLE_COLOR[user.role] ?? COLORS.ocean;
          return (
            <TouchableOpacity key={user.id} onPress={() => setSelected(user)}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: `${rlColor}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MaterialIcons name={user.role === 'provider' ? 'storefront' : 'person'} size={22} color={rlColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{user.fullName ?? '(Sin nombre)'}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>{user.email}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: `${rlColor}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: rlColor, fontSize: 10, fontWeight: '800' }}>{ROLE_LABEL[user.role] ?? user.role}</Text>
                    </View>
                    <View style={{ backgroundColor: `${stColor}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: stColor, fontSize: 10, fontWeight: '800' }}>{STATUS_LABEL[user.status]}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 10 }}>{user.registeredAt}</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
