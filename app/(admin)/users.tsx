/**
 * Admin — Gestión de usuarios registrados
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type UserRole   = 'client' | 'provider';
type UserStatus = 'active' | 'suspended' | 'blocked';

interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  registeredAt: string;
  lastActive: string;
  reports: number;
  reservations: number;
  level?: string;
}

// ─── Datos seed ───────────────────────────────────────────────────────────────
const SEED_USERS: AppUser[] = [
  { id: 'u1', fullName: 'Carlos Mendoza', email: 'carlos@email.com', phone: '7551234567', role: 'client', status: 'active', registeredAt: '10/01/2026', lastActive: '18/06/2026', reports: 0, reservations: 4, level: 'intermedio' },
  { id: 'u2', fullName: 'Ana Torres', email: 'ana@email.com', phone: '7559876543', role: 'client', status: 'active', registeredAt: '15/02/2026', lastActive: '17/06/2026', reports: 1, reservations: 2, level: 'principiante' },
  { id: 'u3', fullName: 'Jorge Leal', email: 'jorge@email.com', phone: '7558765432', role: 'client', status: 'suspended', registeredAt: '03/03/2026', lastActive: '01/06/2026', reports: 3, reservations: 1, level: 'avanzado' },
  { id: 'u4', fullName: 'María Sánchez', email: 'maria@email.com', phone: '7554321098', role: 'client', status: 'active', registeredAt: '20/03/2026', lastActive: '19/06/2026', reports: 0, reservations: 7, level: 'principiante' },
  { id: 'u5', fullName: 'Roberto Cruz', email: 'roberto@email.com', phone: '7557654321', role: 'client', status: 'blocked', registeredAt: '05/04/2026', lastActive: '10/05/2026', reports: 5, reservations: 0 },
  { id: 'u6', fullName: 'Lanchas El Cazador', email: 'cazador@email.com', phone: '7551111111', role: 'provider', status: 'active', registeredAt: '01/01/2026', lastActive: '19/06/2026', reports: 1, reservations: 28 },
  { id: 'u7', fullName: 'Mariscos La Gaviota', email: 'gaviota@email.com', phone: '7552222222', role: 'provider', status: 'active', registeredAt: '15/01/2026', lastActive: '18/06/2026', reports: 0, reservations: 15 },
  { id: 'u8', fullName: 'Pedro Ríos', email: 'pedro@email.com', phone: '7553333333', role: 'client', status: 'active', registeredAt: '22/04/2026', lastActive: '16/06/2026', reports: 0, reservations: 3, level: 'intermedio' },
];

// ─── Colores de estado y rol ──────────────────────────────────────────────────
const STATUS_COLOR: Record<UserStatus, string> = {
  active:    COLORS.success,
  suspended: COLORS.warning,
  blocked:   COLORS.danger,
};
const STATUS_LABEL: Record<UserStatus, string> = {
  active:    'Activo',
  suspended: 'Suspendido',
  blocked:   'Bloqueado',
};
const ROLE_COLOR: Record<UserRole, string> = {
  client:   COLORS.info,
  provider: COLORS.ocean,
};
const ROLE_LABEL: Record<UserRole, string> = {
  client:   'Cliente',
  provider: 'Proveedor',
};

// ─── Modal de detalle ─────────────────────────────────────────────────────────
function UserDetailModal({ user, onClose, onStatusChange }: {
  user: AppUser;
  onClose: () => void;
  onStatusChange: (id: string, status: UserStatus) => void;
}) {
  const color = STATUS_COLOR[user.status];

  const actions: { label: string; status: UserStatus; color: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: 'Activar cuenta',   status: 'active',    color: COLORS.success, icon: 'check-circle' },
    { label: 'Suspender',        status: 'suspended', color: COLORS.warning, icon: 'pause-circle' },
    { label: 'Bloquear',         status: 'blocked',   color: COLORS.danger,  icon: 'block' },
  ].filter((a) => a.status !== user.status);

  const fields = [
    { label: 'Correo',             value: user.email,       icon: 'email' as const },
    { label: 'Teléfono',           value: user.phone,       icon: 'phone' as const },
    { label: 'Rol',                value: ROLE_LABEL[user.role], icon: 'person' as const },
    { label: 'Registrado',         value: user.registeredAt, icon: 'calendar-today' as const },
    { label: 'Última actividad',   value: user.lastActive,  icon: 'access-time' as const },
    { label: 'Reservaciones',      value: String(user.reservations), icon: 'event-available' as const },
    { label: 'Reportes recibidos', value: String(user.reports), icon: 'report' as const },
    ...(user.level ? [{ label: 'Nivel de pesca', value: user.level, icon: 'emoji-events' as const }] : []),
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${ROLE_COLOR[user.role]}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name={user.role === 'provider' ? 'storefront' : 'person'} size={24} color={ROLE_COLOR[user.role]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>{user.fullName}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
              <View style={{ backgroundColor: `${ROLE_COLOR[user.role]}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: ROLE_COLOR[user.role], fontSize: 10, fontWeight: '800' }}>{ROLE_LABEL[user.role]}</Text>
              </View>
              <View style={{ backgroundColor: `${color}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{STATUS_LABEL[user.status]}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Info fields */}
          <CardBox>
            {fields.map((f) => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <MaterialIcons name={f.icon} size={17} color={COLORS.ocean} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700' }}>{f.label}</Text>
                  <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 13 }}>{f.value}</Text>
                </View>
              </View>
            ))}
          </CardBox>

          {/* Acciones */}
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, marginBottom: 10 }}>Acciones de cuenta</Text>
          <View style={{ gap: 10 }}>
            {actions.map((a) => (
              <TouchableOpacity
                key={a.status}
                onPress={() => {
                  Alert.alert(
                    a.label,
                    `¿Confirmas que quieres ${a.label.toLowerCase()} la cuenta de ${user.fullName}?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Confirmar', style: a.status === 'blocked' ? 'destructive' : 'default', onPress: () => { onStatusChange(user.id, a.status); onClose(); } },
                    ],
                  );
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 13, borderRadius: 14, borderWidth: 1,
                  borderColor: `${a.color}40`, backgroundColor: `${a.color}08`,
                }}
              >
                <MaterialIcons name={a.icon} size={20} color={a.color} />
                <Text style={{ fontWeight: '800', color: a.color, flex: 1 }}>{a.label}</Text>
                <MaterialIcons name="chevron-right" size={18} color={a.color} />
              </TouchableOpacity>
            ))}
          </View>

          {user.reports > 0 && (
            <View style={{ marginTop: 16, backgroundColor: `${COLORS.danger}08`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${COLORS.danger}25`, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <MaterialIcons name="warning" size={18} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, fontWeight: '600', flex: 1 }}>
                Este usuario tiene {user.reports} reporte{user.reports > 1 ? 's' : ''} en su contra. Revisa la sección de Reportes para más detalles.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function UsersScreen() {
  const [users, setUsers]           = useState<AppUser[]>(SEED_USERS);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [selected, setSelected]     = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchRole   = roleFilter === 'all'   || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(() => ({
    all:       users.length,
    active:    users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    blocked:   users.filter((u) => u.status === 'blocked').length,
    client:    users.filter((u) => u.role === 'client').length,
    provider:  users.filter((u) => u.role === 'provider').length,
  }), [users]);

  const handleStatusChange = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status } : u));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Título */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.ocean}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="people" size={24} color={COLORS.ocean} />
          </View>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>Usuarios registrados</Text>
            <Text style={{ color: '#64748B', fontSize: 12 }}>{counts.all} cuentas · {counts.client} clientes · {counts.provider} proveedores</Text>
          </View>
        </View>

        {/* Stats rápidos */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {([
            { label: 'Activos',     val: counts.active,    color: COLORS.success },
            { label: 'Suspendidos', val: counts.suspended, color: COLORS.warning },
            { label: 'Bloqueados',  val: counts.blocked,   color: COLORS.danger  },
          ] as const).map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Buscador */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, gap: 8, marginBottom: 12 }}>
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, correo o teléfono..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros rol */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
          {(['all', 'client', 'provider'] as const).map((r) => {
            const labels = { all: 'Todos los roles', client: '👤 Clientes', provider: '🏪 Proveedores' };
            const active = roleFilter === r;
            return (
              <TouchableOpacity key={r} onPress={() => setRoleFilter(r)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? COLORS.ocean : '#fff', borderWidth: 1, borderColor: active ? COLORS.ocean : '#E2E8F0' }}
              >
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
              <TouchableOpacity key={s} onPress={() => setStatusFilter(s)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? colors[s] : '#fff', borderWidth: 1, borderColor: active ? colors[s] : '#E2E8F0' }}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: active ? '#fff' : '#0F172A' }}>{labels[s]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState icon="people" title="Sin resultados" message="No hay usuarios que coincidan con tu búsqueda." buttonLabel="Limpiar filtros" onPress={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }} />
        ) : (
          filtered.map((user) => {
            const stColor = STATUS_COLOR[user.status];
            const rlColor = ROLE_COLOR[user.role];
            return (
              <TouchableOpacity key={user.id} onPress={() => setSelected(user)}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  {/* Avatar */}
                  <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${rlColor}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MaterialIcons name={user.role === 'provider' ? 'storefront' : 'person'} size={24} color={rlColor} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{user.fullName}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>{user.email}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                      <View style={{ backgroundColor: `${rlColor}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: rlColor, fontSize: 10, fontWeight: '800' }}>{ROLE_LABEL[user.role]}</Text>
                      </View>
                      <View style={{ backgroundColor: `${stColor}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: stColor, fontSize: 10, fontWeight: '800' }}>{STATUS_LABEL[user.status]}</Text>
                      </View>
                      {user.reports > 0 && (
                        <View style={{ backgroundColor: `${COLORS.danger}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: COLORS.danger, fontSize: 10, fontWeight: '800' }}>⚠ {user.reports} reporte{user.reports > 1 ? 's' : ''}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Fecha + chevron */}
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 10 }}>{user.registeredAt}</Text>
                    <Text style={{ color: '#CBD5E1', fontSize: 10 }}>{user.reservations} reservas</Text>
                    <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
