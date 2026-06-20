import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProviderStore } from '@/stores/providerStore';
import { useAuthStore } from '@/stores/authStore';
import { SERVICE_DEFS, COLORS, formatCurrency, getServiceDef } from '@/lib/constants';
import { BusinessRecord, ServiceModuleId, ScheduleSlot, CatalogItem, ServiceRouteOption } from '@/types';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';
import { InfoChip } from '@/components/ui/InfoChip';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function fetchApprovalStatus(userId: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      const res  = await fetch(`${API_BASE}/api/auth/provider-status?userId=${userId}`);
      const data = await res.json();
      return data.status === 'approved';
    }
    const { getDb }     = await import('@/lib/db/client');
    const { providers } = await import('@/lib/db/schema');
    const { eq }        = await import('drizzle-orm');
    const rows = await getDb().select({ status: providers.status }).from(providers).where(eq(providers.userId, userId));
    return rows[0]?.status === 'approved';
  } catch { return false; }
}

function useIsApproved() {
  const { user } = useAuthStore();
  const [approved, setApproved] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    fetchApprovalStatus(user.id).then(setApproved);
  }, [user?.id]);
  return approved;
}

// ─── Service Registry List ───────────────────────────────────────────────────
function ServiceRegistryList({
  serviceId,
  onBack,
  isApproved = true,
}: {
  serviceId: ServiceModuleId;
  onBack: () => void;
  isApproved?: boolean;
}) {
  const { records, deleteRecord, updateRecord, addRecord, confirmBeforeDelete } = useProviderStore();
  const def = getServiceDef(serviceId);
  const list = records[serviceId] ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<BusinessRecord | null>(null);
  const [adminTarget, setAdminTarget] = useState<BusinessRecord | null>(null);

  const handleDelete = (record: BusinessRecord) => {
    if (confirmBeforeDelete) {
      Alert.alert(
        `Eliminar ${record.title}`,
        'Esta acción quitará este registro del panel comercial.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteRecord(serviceId, record.id),
          },
        ],
      );
    } else {
      deleteRecord(serviceId, record.id);
    }
  };

  if (adminTarget) {
    return (
      <ServiceAdminView
        serviceId={serviceId}
        record={adminTarget}
        onBack={() => setAdminTarget(null)}
        onUpdate={(updated) => {
          updateRecord(serviceId, updated);
          setAdminTarget(updated);
        }}
        onDelete={() => {
          deleteRecord(serviceId, adminTarget.id);
          setAdminTarget(null);
        }}
      />
    );
  }

  if (showForm) {
    return (
      <ServiceForm
        serviceId={serviceId}
        initial={editTarget ?? undefined}
        onSave={(record) => {
          if (editTarget) updateRecord(serviceId, record);
          else addRecord(serviceId, record);
          setShowForm(false);
          setEditTarget(null);
        }}
        onCancel={() => { setShowForm(false); setEditTarget(null); }}
      />
    );
  }

  const addLabel = () => {
    switch (serviceId) {
      case 'boat': case 'rental': return 'Añadir embarcación';
      case 'restaurant': return 'Añadir restaurante';
      case 'store': return 'Añadir tienda';
      case 'fishMarket': return 'Añadir pescadería';
      case 'transport': return 'Añadir transporte';
      case 'sport': return 'Añadir paquete';
      case 'guide': return 'Añadir guía';
      default: return 'Añadir';
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <TouchableOpacity
        onPress={onBack}
        className="flex-row items-center gap-2 mb-3"
      >
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Todos los servicios</Text>
      </TouchableOpacity>

      <HeaderCard
        title={def.name}
        subtitle={def.description}
        icon={def.icon as any}
        color={def.color}
      />

      <SectionHeader
        title="Registros"
        subtitle="Administra registros verificados."
        actionLabel={isApproved ? addLabel() : undefined}
        actionIcon="add"
        onAction={isApproved ? () => setShowForm(true) : undefined}
        actionColor={def.color}
      />
      <View style={{ height: 10 }} />

      {!isApproved && (
        <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <MaterialIcons name="lock" size={18} color={COLORS.warning} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, color: '#64748B', fontSize: 13, lineHeight: 18 }}>
            Tu cuenta está pendiente de aprobación. No puedes agregar ni publicar servicios hasta que un administrador la apruebe.
          </Text>
        </View>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={def.icon as any}
          title="Sin registros"
          message={isApproved
            ? "Agrega un registro para capturar la información del servicio."
            : "Podrás agregar registros una vez que tu cuenta sea aprobada."}
          buttonLabel={isApproved ? addLabel() : undefined}
          onPress={isApproved ? () => setShowForm(true) : undefined}
        />
      ) : (
        list.map((record) => (
          <CardBox key={record.id}>
            <View className="flex-row items-start gap-3">
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: `${def.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={def.icon as any} size={28} color={def.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                  {record.title}
                </Text>
                <Text style={{ color: '#0F172A99', fontSize: 13 }} numberOfLines={2}>
                  {record.subtitle} · {record.isAvailable ? 'Disponible' : 'No disponible'}
                </Text>
                <View className="mt-2">
                  <StatusPill status={record.isAvailable ? record.status : 'No disponible'} />
                </View>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={isApproved ? () => { setEditTarget(record); setShowForm(true); } : undefined}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', opacity: isApproved ? 1 : 0.4 }}
              >
                <MaterialIcons name="edit" size={16} color="#0F172A" />
                <Text style={{ fontWeight: '800', fontSize: 13 }}>Modificar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(record)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={isApproved ? () => setAdminTarget(record) : undefined}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: isApproved ? def.color : '#94A3B8' }}
              >
                <MaterialIcons name="dashboard-customize" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Administrar</Text>
              </TouchableOpacity>
            </View>
          </CardBox>
        ))
      )}

      <InfoBox
        text={
          def.requiresNavigationLicense
            ? 'Servicios con embarcación: licencia de navegación, fotografías, ubicación de salida y evidencia operativa.'
            : def.requiresBusinessLicense
            ? 'Negocios físicos: licencia de funcionamiento, fotografías del local, ubicación real y evidencia comercial.'
            : 'Este servicio requiere datos del responsable, ubicación real, fotografías y evidencia operativa.'
        }
      />
    </ScrollView>
  );
}

// ─── Service Admin View ───────────────────────────────────────────────────────
function ServiceAdminView({
  serviceId,
  record: initialRecord,
  onBack,
  onUpdate,
  onDelete,
}: {
  serviceId: ServiceModuleId;
  record: BusinessRecord;
  onBack: () => void;
  onUpdate: (r: BusinessRecord) => void;
  onDelete: () => void;
}) {
  const def = getServiceDef(serviceId);
  const [record, setRecord] = useState(initialRecord);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleUpdate = (updated: BusinessRecord) => {
    setRecord(updated);
    onUpdate(updated);
  };

  const adminSections = [
    { key: 'info', title: 'Información', subtitle: 'Datos principales y descripción pública', icon: 'edit-note', color: def.color },
    { key: 'schedules', title: 'Horarios', subtitle: 'Horarios de salida o atención', icon: 'schedule', color: COLORS.success },
    { key: 'availability', title: 'Disponibilidad', subtitle: 'Días disponibles y bloqueados', icon: 'event-busy', color: record.isAvailable ? COLORS.success : COLORS.danger },
    { key: 'gallery', title: 'Galería', subtitle: 'Fotos del servicio', icon: 'photo-library', color: COLORS.ocean },
    { key: 'reservations', title: 'Reservaciones', subtitle: 'Solicitudes y confirmaciones', icon: 'event-available', color: COLORS.success },
    { key: 'reviews', title: 'Reseñas', subtitle: 'Opiniones de clientes', icon: 'star-border', color: COLORS.caution },
    ...(def.hasCatalog
      ? [{ key: 'catalog', title: 'Catálogo', subtitle: 'Productos o menú', icon: 'menu-book', color: COLORS.purple }]
      : [{ key: 'options', title: 'Recorridos / paquetes', subtitle: 'Opciones y precios', icon: 'route', color: COLORS.info }]),
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={onBack} className="flex-row items-center gap-2 mb-3">
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Regresar</Text>
      </TouchableOpacity>

      <HeaderCard
        title={record.title}
        subtitle={`${record.serviceType} · ${record.status}`}
        icon={def.icon as any}
        color={def.color}
      />

      {/* Info chips */}
      <CardBox>
        <View className="flex-row flex-wrap gap-2">
          <InfoChip icon="location-on" text={record.location} />
          <InfoChip icon="schedule" text={`${record.schedules.length} horarios`} />
          <InfoChip
            icon={record.isAvailable ? 'check-circle' : 'block'}
            text={record.isAvailable ? 'Disponible' : 'Pausado'}
            color={record.isAvailable ? COLORS.success : COLORS.danger}
          />
          <InfoChip icon="photo-library" text={`${record.gallery.length} fotos`} />
        </View>
      </CardBox>

      {/* Admin grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        {adminSections.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setActiveSection(s.key)}
            style={{
              width: '47%',
              backgroundColor: '#fff',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 14,
              gap: 8,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 99,
                backgroundColor: `${s.color}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{s.title}</Text>
            <Text style={{ color: '#0F172A99', fontSize: 11 }} numberOfLines={2}>{s.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danger zone */}
      <CardBox>
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="warning" size={22} color={COLORS.danger} />
          <Text style={{ flex: 1, color: '#0F172A99' }}>Eliminar este registro del panel.</Text>
          <TouchableOpacity
            onPress={onDelete}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
            style={{ borderColor: COLORS.danger }}
          >
            <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </CardBox>
    </ScrollView>
  );
}

// ─── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({
  serviceId,
  initial,
  onSave,
  onCancel,
}: {
  serviceId: ServiceModuleId;
  initial?: BusinessRecord;
  onSave: (r: BusinessRecord) => void;
  onCancel: () => void;
}) {
  const def = getServiceDef(serviceId);
  const [name, setName] = useState(initial?.title ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [description, setDescription] = useState(initial?.subtitle ?? '');
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    if (!location.trim()) e.location = 'La ubicación es obligatoria.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const record: BusinessRecord = {
      id: initial?.id ?? `${serviceId}-${Date.now()}`,
      serviceId,
      title: name.trim(),
      subtitle: description.trim() || def.description,
      location: location.trim(),
      serviceType: serviceType.trim() || def.name,
      price: initial?.price ?? 0,
      currency: 'MXN',
      durationHours: initial?.durationHours ?? 2,
      durationMinutes: 0,
      status: initial?.status ?? 'pending',
      isAvailable: initial?.isAvailable ?? true,
      availabilityNote: '',
      unavailableDateKeys: initial?.unavailableDateKeys ?? [],
      schedules: initial?.schedules ?? [],
      catalog: initial?.catalog ?? [],
      routeOptions: initial?.routeOptions ?? [],
      gallery: initial?.gallery ?? [],
    };
    onSave(record);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={onCancel} className="flex-row items-center gap-2 mb-3">
          <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Cancelar</Text>
        </TouchableOpacity>

        <HeaderCard
          title={initial ? `Modificar ${def.name}` : `Añadir ${def.name.toLowerCase()}`}
          subtitle={`Registra la información principal del servicio.`}
          icon={def.icon as any}
          color={def.color}
        />

        <CardBox>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 14 }}>
            Datos del servicio
          </Text>

          <FormField
            label={`Nombre del ${def.name.toLowerCase()}`}
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Ej. Embarcación La Esperanza"
          />
          <View style={{ height: 12 }} />
          <FormField
            label="Ubicación / punto de salida"
            value={location}
            onChangeText={setLocation}
            error={errors.location}
            placeholder="Ej. Muelle principal Zihuatanejo"
          />
          <View style={{ height: 12 }} />
          <FormField
            label="Tipo de servicio"
            value={serviceType}
            onChangeText={setServiceType}
            placeholder="Ej. Lancha panga"
          />
          <View style={{ height: 12 }} />
          <FormField
            label="Descripción breve"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe brevemente el servicio..."
          />
        </CardBox>

        <InfoBox text="Los precios, recorridos, horarios y galería se configuran después desde el panel de Administrar." />

        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={{ flex: 1, backgroundColor: def.color, borderRadius: 14, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {initial ? 'Guardar cambios' : 'Registrar servicio'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Form field helper ────────────────────────────────────────────────────────
function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  multiline,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View>
      <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? COLORS.danger : '#E2E8F0',
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: '#0F172A',
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 96 : undefined,
        }}
      />
      {error ? (
        <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

// ─── Configure Services Screen ────────────────────────────────────────────────
function ConfigureServices({
  onBack,
}: {
  onBack: () => void;
}) {
  const { selectedServices, toggleService } = useProviderStore();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={onBack} className="flex-row items-center gap-2 mb-3">
        <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Regresar</Text>
      </TouchableOpacity>

      <HeaderCard
        title="Configurar servicios"
        subtitle="Activa o desactiva las categorías que administra tu negocio."
        icon="tune"
        color={COLORS.ocean}
      />

      {SERVICE_DEFS.map((def) => {
        const active = selectedServices.has(def.id);
        return (
          <TouchableOpacity key={def.id} onPress={() => toggleService(def.id)}>
            <CardBox>
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 99,
                    backgroundColor: `${def.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={def.icon as any} size={22} color={def.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A' }}>{def.name}</Text>
                  <Text style={{ color: '#0F172A99', fontSize: 12 }} numberOfLines={2}>
                    {def.description}
                  </Text>
                </View>
                <MaterialIcons
                  name={active ? 'check-circle' : 'radio-button-unchecked'}
                  size={24}
                  color={active ? def.color : '#94A3B8'}
                />
              </View>
            </CardBox>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Services Screen ─────────────────────────────────────────────────────
export default function ServicesScreen() {
  const [view, setView] = useState<'list' | 'configure' | ServiceModuleId>('list');
  const { selectedServices, records } = useProviderStore();
  const isApproved = useIsApproved();

  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  // Banner de cuenta pendiente
  const PendingBanner = () => (
    <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <MaterialIcons name="hourglass-bottom" size={20} color={COLORS.warning} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginBottom: 3 }}>Cuenta pendiente de aprobación</Text>
        <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}>
          Podrás publicar y gestionar servicios una vez que el administrador apruebe tu cuenta.
        </Text>
      </View>
    </View>
  );

  if (view === 'configure') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
        <ConfigureServices onBack={() => setView('list')} />
      </SafeAreaView>
    );
  }

  if (view !== 'list') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
        <ServiceRegistryList
          serviceId={view as ServiceModuleId}
          onBack={() => setView('list')}
          isApproved={isApproved === true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader
          title="Mis servicios"
          subtitle="Administra los módulos de tu negocio."
          actionLabel="Configurar"
          actionIcon="tune"
          onAction={() => setView('configure')}
        />
        <View style={{ height: 12 }} />

        {isApproved === false && <PendingBanner />}

        {enabledDefs.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="Sin servicios activos"
            message="Activa al menos un tipo de servicio para comenzar."
            buttonLabel="Configurar servicios"
            onPress={() => setView('configure')}
          />
        ) : (
          enabledDefs.map((def) => {
            const count = records[def.id]?.length ?? 0;
            return (
              <TouchableOpacity key={def.id} onPress={() => setView(def.id as ServiceModuleId)}>
                <CardBox>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name={def.icon as any} size={28} color={def.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: '#0F172A' }}>{def.name}</Text>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>
                        {count === 0 ? 'Sin registros' : `${count} registro${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''}`}
                      </Text>
                    </View>
                    {isApproved === false && (
                      <MaterialIcons name="lock" size={18} color={COLORS.warning} />
                    )}
                    <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
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
