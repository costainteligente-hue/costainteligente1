/**
 * ServicesScreen — fiel al PWA
 * Config toggle + Registry list (search + cards) + Admin view (management-grid)
 */
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useProviderStore } from '@/stores/providerStore';
import { SERVICE_DEFS, COLORS, getServiceDef, serviceSupportsOptions, formatCurrency, formatDuration } from '@/lib/constants';
import { BusinessRecord, ServiceModuleId } from '@/types';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';
import { InfoChip } from '@/components/ui/InfoChip';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function fetchApproved(userId: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`${API_BASE}/api/auth/provider-status?userId=${userId}`);
      return (await res.json()).status === 'approved';
    }
    const { getDb } = await import('@/lib/db/client');
    const { providers } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await getDb().select({ status: providers.status }).from(providers).where(eq(providers.userId, userId));
    return rows[0]?.status === 'approved';
  } catch { return false; }
}

function useIsApproved() {
  const { user } = useAuthStore();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { if (user?.id) fetchApproved(user.id).then(setOk); }, [user?.id]);
  return ok;
}

// ─── Configure Services ───────────────────────────────────────────────────────
function ConfigureServices({ onBack }: { onBack: () => void }) {
  const { selectedServices, toggleService } = useProviderStore();
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Regresar</Text>
      </TouchableOpacity>
      <HeaderCard title="Configurar servicios" subtitle="Activa o desactiva las categorías que administra el proveedor." icon="tune" color={COLORS.ocean} />
      {SERVICE_DEFS.map((def) => {
        const active = selectedServices.has(def.id);
        return (
          <TouchableOpacity key={def.id} onPress={() => toggleService(def.id)}>
            <CardBox>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={def.icon as any} size={24} color={def.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{def.name}</Text>
                  <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }} numberOfLines={2}>{def.description}</Text>
                </View>
                <MaterialIcons name={active ? 'check-circle' : 'radio-button-unchecked'} size={24} color={active ? def.color : '#94A3B8'} />
              </View>
            </CardBox>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
        <MaterialIcons name="check" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '900' }}>Guardar configuración</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Admin view (management-grid) ─────────────────────────────────────────────
function AdminView({ serviceId, record: init, onBack, onUpdate, onDelete }: {
  serviceId: ServiceModuleId; record: BusinessRecord;
  onBack: () => void; onUpdate: (r: BusinessRecord) => void; onDelete: () => void;
}) {
  const def = getServiceDef(serviceId);
  const [record] = useState(init);
  const router = useRouter();
  const optCount = def.hasCatalog ? record.catalog.length : record.routeOptions.length;
  const optLabel = def.hasCatalog ? 'catálogo' : 'opciones';

  const mgmt = [
    { key: 'info',   title: 'Información',          subtitle: 'Datos principales y descripción pública',   icon: 'edit-note' as const,    color: def.color },
    { key: 'sched',  title: def.hasCatalog || ['restaurant','store','fishMarket'].includes(serviceId) ? 'Horarios de atención' : 'Horarios de salida', subtitle: 'Horarios configurados', icon: 'schedule' as const, color: COLORS.success },
    ...(serviceSupportsOptions(serviceId) ? [{ key: 'opts', title: ['boat','rental'].includes(serviceId) ? 'Recorridos y precios' : serviceId === 'sport' ? 'Paquetes deportivos' : serviceId === 'guide' ? 'Paquetes y asesorías' : 'Rutas y tarifas', subtitle: 'Opciones y precios', icon: 'route' as const, color: COLORS.info }] : []),
    ...(def.hasCatalog ? [{ key: 'cat', title: def.id === 'restaurant' ? 'Menú visual y platillos' : def.id === 'fishMarket' ? 'Menú de productos frescos' : 'Menú visual de productos', subtitle: 'Productos del catálogo', icon: 'menu-book' as const, color: COLORS.purple }] : []),
    { key: 'avail',  title: 'Disponibilidad',        subtitle: 'Marca días no disponibles',                 icon: 'event-busy' as const,   color: record.isAvailable ? COLORS.success : COLORS.danger },
    { key: 'gallery',title: 'Galería',               subtitle: 'Subir, borrar y destacar fotos',            icon: 'photo-library' as const, color: COLORS.ocean },
    { key: 'pub',    title: 'Publicación en usuarios',subtitle: 'Foto principal, contacto y visibilidad',   icon: 'people' as const,       color: COLORS.purple },
    { key: 'docs',   title: 'Documentos',            subtitle: 'Requisitos y evidencias en foto',           icon: 'task-alt' as const,     color: COLORS.warning },
    { key: 'res',    title: 'Reservas',              subtitle: 'Solicitudes y confirmaciones',              icon: 'event-available' as const, color: COLORS.success },
    { key: 'rev',    title: 'Reseñas',              subtitle: 'Opiniones, promedio y confianza',           icon: 'star-border' as const,  color: COLORS.caution },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Regresar</Text>
      </TouchableOpacity>

      <HeaderCard title={record.title} subtitle={`${record.serviceType} · ${record.status}`} icon={def.icon as any} color={def.color} />

      {/* Info chips */}
      <CardBox>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <InfoChip icon="location-on" text={record.location} />
          <InfoChip icon="schedule" text={`${record.schedules.length} horarios`} />
          <InfoChip icon={record.isAvailable ? 'check-circle' : 'block'} text={record.isAvailable ? 'Disponible' : 'Pausado'} color={record.isAvailable ? COLORS.success : COLORS.danger} />
          <InfoChip icon={def.hasCatalog ? 'menu-book' : 'route'} text={`${optCount} ${optLabel}`} />
          <InfoChip icon="photo-library" text={`${record.gallery.length} fotos`} />
        </View>
      </CardBox>

      {/* Section header */}
      <SectionHeader title="Administración del servicio" subtitle="Modifica información variable después de pasar revisión."
        actionLabel="Modificar" actionIcon="edit" onAction={() => {}} actionColor={def.color} />
      <View style={{ height: 8 }} />

      {/* Management grid 2-col */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        {mgmt.map((s) => (
          <TouchableOpacity key={s.key} onPress={() => {
            if (s.key === 'opts') router.push({ pathname: '/(provider)/route-manager', params: { serviceId, recordId: record.id } } as any);
            else if (s.key === 'cat') router.push({ pathname: '/(provider)/catalog-manager', params: { serviceId, recordId: record.id } } as any);
            else if (s.key === 'gallery') router.push({ pathname: '/(provider)/gallery-manager', params: { serviceId, recordId: record.id } } as any);
          }}
            style={{ width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, minHeight: 128, justifyContent: 'space-between',
              shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: `${s.color}20`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={s.icon} size={20} color={s.color} />
            </View>
            <View>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, lineHeight: 18, marginBottom: 3 }}>{s.title}</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, lineHeight: 16 }} numberOfLines={2}>{s.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danger zone */}
      <CardBox>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialIcons name="warning" size={22} color={COLORS.danger} />
          <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 14 }}>Eliminar este registro del panel.</Text>
          <TouchableOpacity onPress={onDelete} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger }}>
            <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </CardBox>
    </ScrollView>
  );
}

// ─── Service Registry (list + search + cards) ─────────────────────────────────
function Registry({ serviceId, onBack, approved }: { serviceId: ServiceModuleId; onBack: () => void; approved: boolean }) {
  const { records, deleteRecord, addRecord, updateRecord, confirmBeforeDelete } = useProviderStore();
  const def  = getServiceDef(serviceId);
  const list = records[serviceId] ?? [];
  const router = useRouter();
  const [query, setQuery]   = useState('');
  const [admin, setAdmin]   = useState<BusinessRecord | null>(null);

  const filtered = query.trim()
    ? list.filter((r) => [r.title, r.subtitle, r.location, r.serviceType].join(' ').toLowerCase().includes(query.toLowerCase()))
    : list;

  const addLabel = () => ({ boat: 'Añadir embarcación', rental: 'Añadir embarcación', restaurant: 'Añadir restaurante', store: 'Añadir tienda', fishMarket: 'Añadir pescadería', transport: 'Añadir transporte', sport: 'Añadir paquete', guide: 'Añadir guía' }[serviceId] ?? 'Añadir');

  const del = (r: BusinessRecord) => {
    if (confirmBeforeDelete) {
      Alert.alert(`Eliminar ${r.title}`, 'Esta acción quitará este registro del panel comercial.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteRecord(serviceId, r.id) },
      ]);
    } else deleteRecord(serviceId, r.id);
  };

  if (admin) return (
    <AdminView serviceId={serviceId} record={admin} onBack={() => setAdmin(null)}
      onUpdate={(u) => { updateRecord(serviceId, u); setAdmin(u); }}
      onDelete={() => { deleteRecord(serviceId, admin.id); setAdmin(null); }} />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Todos los servicios</Text>
      </TouchableOpacity>

      <HeaderCard title={def.name} subtitle={def.description} icon={def.icon as any} color={def.color} />

      <SectionHeader title={({ boat:'Embarcaciones registradas', rental:'Embarcaciones en renta', restaurant:'Restaurantes registrados', store:'Tiendas registradas', fishMarket:'Pescaderías registradas', transport:'Servicios de transporte', sport:'Paquetes de pesca deportiva', guide:'Servicios de guía' }[serviceId] ?? 'Registros')}
        subtitle="Administra registros aceptados, pendientes o guardados."
        actionLabel={approved ? addLabel() : undefined} actionIcon="add"
        onAction={approved ? () => router.push({ pathname: '/(provider)/service-form', params: { serviceId } } as any) : undefined}
        actionColor={def.color} />
      <View style={{ height: 8 }} />

      {/* Search box */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, marginBottom: 12, height: 48 }}>
        <MaterialIcons name="search" size={18} color="rgba(15,23,42,0.62)" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar registros por nombre, tipo o ubicación" placeholderTextColor="#94A3B8" style={{ flex: 1, fontSize: 14, color: '#0F172A' }} />
        {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><MaterialIcons name="close" size={18} color="#94A3B8" /></TouchableOpacity>}
      </View>

      {!approved && (
        <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 10 }}>
          <MaterialIcons name="lock" size={18} color={COLORS.warning} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 13, lineHeight: 18 }}>Tu cuenta está pendiente de aprobación. No puedes agregar ni publicar servicios.</Text>
        </View>
      )}

      {filtered.length === 0 ? (
        list.length > 0
          ? <EmptyState icon="search" title="Sin resultados" message="No hay registros que coincidan con tu búsqueda." buttonLabel="Limpiar búsqueda" onPress={() => setQuery('')} />
          : <EmptyState icon={def.icon as any} title="Sin registros" message={approved ? 'Agrega un registro para capturar información del servicio.' : 'Podrás agregar registros una vez que tu cuenta sea aprobada.'} buttonLabel={approved ? addLabel() : undefined} onPress={approved ? () => router.push({ pathname: '/(provider)/service-form', params: { serviceId } } as any) : undefined} color={def.color} />
      ) : filtered.map((r) => (
        <CardBox key={r.id}>
          {/* record-card: auto | 1fr | auto */}
          <TouchableOpacity onPress={() => approved && setAdmin(r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={def.icon as any} size={28} color={def.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{r.title}</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }} numberOfLines={2}>{r.subtitle} · {r.isAvailable ? 'Disponible' : 'No disponible'}</Text>
            </View>
            <StatusPill status={r.isAvailable ? ({ saved:'Guardado', pending:'Pendiente', verified:'Aceptado', rejected:'Rechazado' }[r.status]) : 'No disponible'} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
          {/* inline-actions */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => del(r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={approved ? () => setAdmin(r) : undefined}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: approved ? def.color : '#94A3B8' }}>
              <MaterialIcons name="dashboard-customize" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Administrar</Text>
            </TouchableOpacity>
          </View>
        </CardBox>
      ))}

      <InfoBox text={def.requiresNavigationLicense ? 'Servicios con embarcación: certificado de seguridad, certificado de matrícula de Capitanía, fotos de la embarcación y permiso CONAPESCA si el servicio es de pesca.' : def.requiresBusinessLicense ? 'Negocios físicos: licencia de funcionamiento, fotografías del local, ubicación real y evidencia comercial enviada en imagen.' : 'Este servicio requiere datos del responsable, ubicación real, fotografías y evidencia operativa.'} />
    </ScrollView>
  );
}

// ─── Main Services Screen ─────────────────────────────────────────────────────
export default function ServicesScreen() {
  const [view, setView] = useState<'list' | 'config' | ServiceModuleId>('list');
  const { selectedServices, records } = useProviderStore();
  const approved = useIsApproved();
  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  if (view === 'config') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ConfigureServices onBack={() => setView('list')} />
    </SafeAreaView>
  );

  if (view !== 'list') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <Registry serviceId={view as ServiceModuleId} onBack={() => setView('list')} approved={approved === true} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <SectionHeader title="Mis servicios" subtitle="Administra los módulos de tu negocio."
          actionLabel="Configurar" actionIcon="tune" onAction={() => setView('config')} />
        <View style={{ height: 12 }} />

        {approved === false && (
          <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name="hourglass-bottom" size={20} color={COLORS.warning} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 13, marginBottom: 3 }}>Cuenta pendiente de aprobación</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, lineHeight: 18 }}>Podrás publicar y gestionar servicios una vez que el administrador apruebe tu cuenta.</Text>
            </View>
          </View>
        )}

        {enabledDefs.length === 0 ? (
          <EmptyState icon="storefront" title="Sin servicios activos" message="Activa al menos un tipo de servicio para comenzar." buttonLabel="Configurar servicios" onPress={() => setView('config')} />
        ) : (
          enabledDefs.map((def) => {
            const count = records[def.id]?.length ?? 0;
            return (
              <TouchableOpacity key={def.id} onPress={() => setView(def.id as ServiceModuleId)}>
                <CardBox>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name={def.icon as any} size={28} color={def.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{def.name}</Text>
                      <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>
                        {count === 0 ? 'Sin registros' : `${count} registro aceptado activo`}
                      </Text>
                    </View>
                    {approved === false && <MaterialIcons name="lock" size={18} color={COLORS.warning} />}
                    <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                  </View>
                </CardBox>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
