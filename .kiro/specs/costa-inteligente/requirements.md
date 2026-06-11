# Requirements Document

## Introduction

Costa Inteligente es una plataforma móvil multiplataforma (iOS y Android) de pesca y turismo costero enfocada inicialmente en Zihuatanejo, Guerrero, México. La aplicación conecta a tres perfiles de usuario — Cliente (Pescador/Turista), Proveedor (Negocio/Servicio costero) y Administrador — con información de zonas de pesca, servicios náuticos, guías locales y gestión de reservaciones.

El sistema se construye con React Native + Expo (SDK más reciente, managed workflow), TypeScript como lenguaje único, Supabase como backend (PostgreSQL + Auth + Storage + Realtime + Edge Functions), Expo Router para navegación basada en archivos, Zustand para estado global, TanStack Query para fetching de datos, NativeWind para estilos, Mercado Pago para pagos, y EAS Build para publicación en Google Play y App Store.

El objetivo es lanzar en iOS y Android en los primeros 6 meses, con un presupuesto de infraestructura menor a $20 USD/mes en etapa inicial, usando un equipo de 2–3 desarrolladores JavaScript/TypeScript.

---

## Glossary

- **App**: La aplicación móvil Costa Inteligente (iOS y Android).
- **Auth_Service**: Módulo de Supabase Auth que gestiona sesiones, tokens JWT y proveedores OAuth.
- **Cliente**: Usuario final con perfil de pescador o turista.
- **Proveedor**: Usuario con perfil de negocio o servicio costero registrado y verificable.
- **Administrador**: Usuario con rol privilegiado que gestiona la plataforma desde un panel dedicado.
- **Zona_De_Pesca**: Registro geográfico con coordenadas, nivel de dificultad, especies, señuelos y horarios.
- **Servicio**: Oferta publicada por un Proveedor dentro de uno de los 8 módulos configurables.
- **Reservacion**: Solicitud de un Cliente hacia un Servicio de un Proveedor, con estado lifecycle.
- **Chat**: Canal de mensajería en tiempo real entre Cliente y Proveedor asociado a una Reservacion.
- **SOS_Module**: Módulo de emergencia que obtiene GPS del Cliente y expone contactos de emergencia locales.
- **Temporada**: Configuración mensual de especies más probables, posibles y zonas sugeridas.
- **Comunidad_Feed**: Sección donde los Clientes publican fotos de capturas con metadatos.
- **Push_Notification**: Notificación enviada vía Expo Notifications + Supabase Edge Functions.
- **Mercado_Pago**: Pasarela de pagos utilizada para cobros de Servicios y suscripciones.
- **RLS**: Row-Level Security de PostgreSQL gestionado en Supabase.
- **Edge_Function**: Función serverless de Supabase (Deno) para lógica de backend.
- **EAS**: Expo Application Services para compilación y publicación de builds.
- **OTA**: Over-the-Air update distribuido por Expo Updates.
- **Zod**: Librería de validación de esquemas TypeScript usada en Edge Functions y formularios.
- **LFPDPPP**: Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México).
- **Veda**: Período oficial de restricción de pesca de ciertas especies.
- **NativeWind**: Implementación de Tailwind CSS para React Native.
- **TanStack_Query**: Librería de fetching y caché de datos (React Query) integrada con Supabase client.

---

## Requirements

---

### Requerimiento 1: Registro e Inicio de Sesión de Clientes

**User Story:** Como Cliente, quiero registrarme e iniciar sesión con correo/contraseña o Google OAuth, para acceder a las funcionalidades personalizadas de la App.

#### Criterios de Aceptación

1. WHEN un Cliente envía el formulario de registro con correo y contraseña, THE Auth_Service SHALL aceptar el registro únicamente si el correo tiene formato RFC 5322 válido y la contraseña tiene mínimo 8 caracteres.
2. WHEN un Cliente envía el formulario de registro con correo y contraseña que no cumplen las reglas de validación, THE Auth_Service SHALL retornar un mensaje de error que identifique el campo inválido sin revelar si el correo ya existe en el sistema.
3. WHEN un Cliente intenta registrarse con un correo que ya existe en el sistema, THE Auth_Service SHALL retornar un error genérico de "credenciales inválidas" sin confirmar la existencia del correo.
4. THE Auth_Service SHALL aceptar inicio de sesión de Clientes mediante Google OAuth utilizando el flujo Expo AuthSession, redirigiendo al Cliente al dashboard tras autenticación exitosa.
5. WHEN un Cliente completa el registro por correo, THE Auth_Service SHALL enviar un correo de verificación con enlace de activación válido por 24 horas antes de activar la sesión.
6. WHEN un Cliente inicia sesión con credenciales válidas, THE Auth_Service SHALL retornar un token JWT con expiración de 1 hora y un refresh token con expiración de 7 días.
7. WHEN un Cliente proporciona credenciales inválidas, THE Auth_Service SHALL retornar el mensaje "Correo o contraseña incorrectos" sin revelar si el correo existe en el sistema.
8. WHEN un token JWT expira, THE Auth_Service SHALL renovarlo automáticamente usando el refresh token, de modo que la sesión del Cliente continúe sin redirigirlo a la pantalla de inicio de sesión.
9. IF el refresh token es inválido o ha expirado, THEN THE Auth_Service SHALL cerrar la sesión y redirigir al Cliente a la pantalla de inicio de sesión.
10. THE App SHALL almacenar el token JWT en el Secure Store de Expo, nunca en AsyncStorage sin cifrado.
11. WHEN un Cliente falla 5 intentos consecutivos de inicio de sesión desde la misma IP, THE Auth_Service SHALL bloquear nuevos intentos desde esa IP durante 15 minutos y mostrar el tiempo restante de bloqueo.
12. WHEN el flujo de Google OAuth falla o es cancelado por el Cliente, THE App SHALL mostrar el mensaje "No se pudo completar el inicio de sesión con Google. Intenta de nuevo." y retornar al formulario de inicio de sesión.

---

### Requerimiento 2: Registro e Inicio de Sesión de Proveedores

**User Story:** Como Proveedor, quiero registrarme con los datos de mi negocio y recibir una verificación de estado, para operar servicios verificados dentro de la plataforma.

#### Criterios de Aceptación

1. WHEN un Proveedor envía el formulario de registro, THE Auth_Service SHALL aceptar el registro únicamente si: el correo tiene formato RFC 5322 válido, la contraseña tiene mínimo 8 caracteres, el nombre del negocio tiene entre 3 y 100 caracteres, el RFC tiene 12 o 13 caracteres alfanuméricos, el teléfono tiene exactamente 10 dígitos, y la dirección tiene entre 10 y 200 caracteres.
2. WHEN un Proveedor intenta registrarse con un correo que ya existe en el sistema, THE Auth_Service SHALL retornar el mensaje "Ya existe una cuenta con este correo" sin exponer datos adicionales del registro existente.
3. WHEN un Proveedor completa el registro, THE Auth_Service SHALL asignar el estado de verificación `pending` al perfil del Proveedor en la base de datos de forma atómica junto con la creación del registro de autenticación.
4. WHILE el Proveedor tiene estado `pending`, THE App SHALL mostrar una pantalla de "Cuenta en revisión" con un mensaje explicativo y restringir el acceso a todos los módulos de gestión de servicios, reservaciones y pagos.
5. WHEN el Administrador aprueba al Proveedor, THE Auth_Service SHALL actualizar el estado a `approved` en la base de datos.
6. WHEN el Administrador aprueba al Proveedor, THE Push_Notification SHALL enviar al Proveedor la notificación "Tu cuenta ha sido aprobada. Ya puedes publicar servicios." dentro de los 30 segundos siguientes a la acción del Administrador.
7. WHEN el Administrador rechaza al Proveedor, THE Auth_Service SHALL actualizar el estado a `rejected` en la base de datos.
8. WHEN el Administrador rechaza al Proveedor, THE Push_Notification SHALL enviar al Proveedor una notificación que incluya el motivo de rechazo proporcionado por el Administrador dentro de los 30 segundos siguientes a la acción.
9. WHEN un Proveedor con estado `rejected` intenta acceder a módulos de gestión, THE App SHALL mostrar el motivo del rechazo y un botón "Actualizar datos y reenviar solicitud" que permita al Proveedor editar sus datos y generar una nueva solicitud con estado `pending`.
10. THE App SHALL garantizar que un Proveedor autenticado solo pueda leer y modificar sus propios registros de servicios, reservaciones, pagos, chats y métricas, retornando un error 403 ante cualquier intento de acceso a registros ajenos.

---

### Requerimiento 3: Registro e Inicio de Sesión de Administradores

**User Story:** Como Administrador, quiero iniciar sesión con credenciales exclusivas y tener mi rol verificado, para gestionar la plataforma con acceso privilegiado.

#### Criterios de Aceptación

1. WHEN un usuario completa el inicio de sesión, THE Auth_Service SHALL verificar la presencia del rol `admin` en los metadatos del usuario de Supabase y, si está presente, redirigir al panel de administración.
2. WHEN un usuario con rol `client` intenta acceder a rutas del panel de administración, THE App SHALL redirigirlo al dashboard de Cliente sin exponer la estructura de rutas del panel de administración.
3. WHEN un usuario con rol `provider` intenta acceder a rutas del panel de administración, THE App SHALL redirigirlo al dashboard de Proveedor sin exponer la estructura de rutas del panel de administración.
4. THE App SHALL garantizar que un usuario con rol `admin` tenga acceso de lectura y escritura a todas las tablas de gestión, mientras que usuarios con roles `client` o `provider` no puedan leer ni modificar las tablas exclusivas del panel de administración.
5. IF un token de sesión de Administrador es invalidado manualmente desde Supabase, THEN THE Auth_Service SHALL cerrar la sesión activa en la App en el siguiente request autenticado y redirigir al Administrador a la pantalla de inicio de sesión.
6. WHEN el proceso de inicio de sesión detecta que los metadatos del usuario no contienen el campo `role` o contienen un valor no reconocido, THE Auth_Service SHALL denegar el acceso, cerrar la sesión y mostrar el mensaje "Acceso no autorizado. Contacta al administrador del sistema."

---

### Requerimiento 4: Dashboard del Cliente

**User Story:** Como Cliente, quiero ver un dashboard personalizado al abrir la App, para obtener contexto relevante del día y accesos rápidos a las funciones principales.

#### Criterios de Aceptación

1. WHEN un Cliente autenticado abre la App, THE App SHALL mostrar el dashboard con: saludo personalizado con el nombre del usuario, condición climática del día para Zihuatanejo, lista de peces del mes actual y accesos rápidos a Mapa, Temporadas, Comunidad y SOS.
2. WHEN la App solicita datos climáticos, THE App SHALL obtenerlos desde una Edge_Function que consulte la API de Open-Meteo, y THE TanStack_Query SHALL cachear la respuesta durante exactamente 60 minutos antes de realizar una nueva solicitud.
3. WHEN la Edge_Function de clima no está disponible o retorna un error, THE App SHALL mostrar la sección climática con los datos de la caché existente y un texto "Datos actualizados al [fecha y hora de la última actualización exitosa]", sin bloquear la carga del resto del dashboard.
4. WHEN el dispositivo del Cliente no tiene conexión a internet, THE App SHALL mostrar todos los datos del dashboard disponibles en la caché local de TanStack_Query, con un indicador de fecha y hora de la última sincronización exitosa.
5. WHILE los datos de cada sección del dashboard se están cargando, THE App SHALL mostrar un skeleton loader por sección, permitiendo que las secciones ya cargadas sean interactivas antes de que el resto termine de cargar.
6. WHEN el dashboard ha recibido todos los datos de red necesarios, THE App SHALL completar la renderización completa en menos de 3 segundos medidos desde el inicio de la navegación a la pantalla, en condiciones de red 4G o WiFi.

---

### Requerimiento 5: Mapa Interactivo de Zonas de Pesca

**User Story:** Como Cliente, quiero explorar un mapa interactivo con zonas de pesca filtradas por nivel, tipo y especie, para encontrar el lugar adecuado según mi experiencia.

#### Criterios de Aceptación

1. THE App SHALL mostrar un mapa usando react-native-maps con teselas de OpenStreetMap, centrado inicialmente en las coordenadas de Zihuatanejo (17.6392° N, 101.5507° O) con un nivel de zoom de 12.
2. THE App SHALL renderizar marcadores en el mapa para cada Zona_De_Pesca activa almacenada en Supabase, cargados al iniciar la pantalla del mapa.
3. WHEN un Cliente selecciona un filtro de nivel (principiante, intermedio o avanzado), THE App SHALL mostrar únicamente los marcadores de Zonas_De_Pesca cuyo campo `level` coincida con el nivel seleccionado, ocultando los demás marcadores del mapa.
4. WHEN un Cliente selecciona un filtro de tipo de zona o especie, THE App SHALL aplicar todos los filtros activos de forma combinada (AND lógico) y actualizar los marcadores visibles en el mapa en menos de 500ms.
5. WHEN la combinación de filtros activos no produce ninguna Zona_De_Pesca coincidente, THE App SHALL mostrar un mensaje en el mapa "No hay zonas disponibles con estos filtros" y mantener visible el mapa sin marcadores.
6. WHEN un Cliente toca un marcador en el mapa, THE App SHALL navegar a la pantalla de detalle de la Zona_De_Pesca correspondiente.
7. WHEN el dispositivo del Cliente no tiene conexión a internet, THE App SHALL cargar los marcadores desde la caché local de TanStack_Query; si la caché tiene más de 24 horas de antigüedad, THE App SHALL mostrar un banner "Datos del mapa desactualizados. Última actualización: [fecha y hora]".
8. WHEN el dispositivo no tiene conexión y la caché local está vacía, THE App SHALL mostrar el mapa sin marcadores y el mensaje "Sin conexión. Conecta a internet para ver las zonas de pesca."
9. IF la ubicación GPS del Cliente está disponible y el Cliente ha otorgado permiso de ubicación, THEN THE App SHALL mostrar la posición actual del Cliente en el mapa con un marcador diferenciado del de las zonas de pesca.

---

### Requerimiento 6: Detalle de Zona de Pesca

**User Story:** Como Cliente, quiero ver el detalle completo de una zona de pesca, para decidir si es adecuada para mi excursión.

#### Criterios de Aceptación

1. THE App SHALL mostrar en la pantalla de detalle: fotografía principal (con imagen de sustitución si no hay foto disponible), nombre, descripción, lista de peces probables, señuelos recomendados, carnadas recomendadas, horarios óptimos de pesca y nivel de dificultad.
2. THE App SHALL mostrar la calificación promedio de la Zona_De_Pesca calculada a partir de todas las reseñas de Clientes, con una escala de 1 a 5 estrellas redondeada al 0.5 más cercano; si no hay reseñas, THE App SHALL mostrar "Sin calificaciones aún".
3. THE App SHALL listar las últimas 10 reseñas de Clientes para la Zona_De_Pesca, ordenadas por fecha descendente.
4. WHEN un Cliente autenticado envía una reseña con calificación entera de 1 a 5 y comentario de entre 1 y 500 caracteres, THE App SHALL persistirla en Supabase y recalcular la calificación promedio mostrada en pantalla dentro de los 2 segundos siguientes al envío exitoso.
5. IF un Cliente ya tiene una reseña para la misma Zona_De_Pesca, THEN THE App SHALL mostrar el formulario de reseña pre-cargado con los datos de la reseña existente para editarla en lugar de crear una nueva.
6. WHEN un Cliente autenticado toca el botón de favorito en la pantalla de detalle, THE App SHALL alternar el estado de favorito (guardar si no era favorito, eliminar si ya lo era) de forma inmediata en la UI y persistir el cambio en Supabase.
7. WHEN un Cliente no autenticado intenta agregar una zona a favoritos o enviar una reseña, THE App SHALL mostrar un modal solicitando iniciar sesión, con botones de "Iniciar sesión" y "Cancelar".

---

### Requerimiento 7: Temporadas de Pesca

**User Story:** Como Cliente, quiero consultar las temporadas de pesca por mes, para planificar mis excursiones según la disponibilidad de especies.

#### Criterios de Aceptación

1. THE App SHALL mostrar un selector de mes con los 12 meses del año (enero–diciembre) en la pantalla de Temporadas, con el mes actual preseleccionado al abrir la pantalla.
2. WHEN un Cliente selecciona un mes, THE App SHALL mostrar: la lista de especies clasificadas como "más probables" para ese mes, la lista de especies clasificadas como "posibles", las Zonas_De_Pesca sugeridas para ese mes y los períodos de Veda vigentes que intersecten con ese mes.
3. WHEN una especie mostrada en la pantalla de Temporadas tiene un período de Veda que incluye el mes seleccionado, THE App SHALL mostrar esa especie con un ícono de advertencia y un texto en color rojo "En veda" junto a su nombre.
4. WHEN la App solicita datos de temporadas desde Supabase, THE TanStack_Query SHALL cachear la respuesta durante exactamente 24 horas antes de realizar una nueva solicitud.
5. WHEN el dispositivo no tiene conexión y los datos de temporadas están en caché, THE App SHALL mostrar los datos cacheados con un indicador de fecha de última actualización; si la caché está vacía, THE App SHALL mostrar el mensaje "Sin conexión. Conecta a internet para ver las temporadas."

---

### Requerimiento 8: Módulo SOS de Emergencia

**User Story:** Como Cliente, quiero un botón de emergencia accesible desde cualquier pantalla, para solicitar ayuda y contactar servicios de emergencia cuando esté en el mar.

#### Criterios de Aceptación

1. THE App SHALL mostrar un botón de SOS como overlay flotante fijo de mínimo 48×48 dp, siempre visible en primer plano en todas las pantallas de la App accesibles por el Cliente, incluyendo las pantallas de mapa, detalle de zona, dashboard, temporadas, comunidad y favoritos.
2. WHEN un Cliente activa el módulo SOS y el permiso de ubicación no ha sido otorgado previamente, THE SOS_Module SHALL solicitar el permiso de ubicación al sistema operativo antes de intentar obtener las coordenadas GPS.
3. WHEN el permiso de ubicación es otorgado, THE SOS_Module SHALL iniciar la obtención de coordenadas GPS del dispositivo con un timeout máximo de 10 segundos.
4. WHEN el SOS_Module obtiene las coordenadas GPS exitosamente, THE App SHALL mostrar: las coordenadas actuales del Cliente en formato decimal (latitud, longitud), la lista de contactos de emergencia locales (SEMAR: 800-201-3100, Cruz Roja Zihuatanejo: 755-554-2009, Capitanía de Puerto: 755-554-2030) con nombre y teléfono, y un botón de llamada directa por cada contacto.
5. WHEN un Cliente toca el botón de llamada de un contacto de emergencia, THE App SHALL invocar el marcador telefónico nativo del dispositivo con el número correspondiente pre-marcado.
6. IF el SOS_Module no obtiene coordenadas GPS dentro de los 10 segundos del timeout, THEN THE App SHALL mostrar los contactos de emergencia sin coordenadas, con el texto "Ubicación no disponible. Muestra esta pantalla a los servicios de emergencia."
7. IF el Cliente denegó permanentemente el permiso de ubicación, THEN THE App SHALL mostrar los contactos de emergencia sin coordenadas y el mensaje "Activa los permisos de ubicación en la configuración de tu dispositivo para compartir tu posición."
8. WHEN un Cliente activa el módulo SOS y el dispositivo no tiene conexión a internet, THE App SHALL mostrar los contactos de emergencia almacenados en la caché local del dispositivo, permitiendo la llamada directa sin requerir conexión.
9. IF la caché local de contactos de emergencia está vacía y el dispositivo no tiene conexión, THEN THE App SHALL mostrar los contactos de emergencia con números hardcodeados en el bundle de la App como respaldo final.

---

### Requerimiento 9: Favoritos del Cliente

**User Story:** Como Cliente, quiero guardar zonas de pesca como favoritos, para acceder rápidamente a mis lugares preferidos.

#### Criterios de Aceptación

1. WHEN un Cliente autenticado guarda una Zona_De_Pesca como favorito, THE App SHALL actualizar el ícono de favorito en la UI de forma inmediata (optimistic update) y persistir la relación en Supabase; si la persistencia falla, THE App SHALL revertir el cambio visual y mostrar un mensaje de error.
2. WHEN un Cliente autenticado elimina una Zona_De_Pesca de sus favoritos, THE App SHALL actualizar el ícono de favorito en la UI de forma inmediata (optimistic update) y eliminar la relación en Supabase; si la eliminación falla, THE App SHALL revertir el cambio visual y mostrar un mensaje de error.
3. THE App SHALL mostrar la lista completa de Zonas_De_Pesca marcadas como favoritas en una pantalla dedicada, ordenadas por fecha de guardado descendente.
4. WHEN la lista de favoritos está vacía, THE App SHALL mostrar el mensaje "Aún no tienes zonas favoritas. Explora el mapa y guarda las que más te gusten."
5. THE App SHALL sincronizar la lista de favoritos entre dispositivos del mismo Cliente consultando la base de datos de Supabase al abrir la pantalla de favoritos.

---

### Requerimiento 10: Comunidad — Publicación de Capturas

**User Story:** Como Cliente, quiero compartir fotos de mis capturas con la comunidad, para interactuar con otros pescadores y registrar mis logros.

#### Criterios de Aceptación

1. WHEN un Cliente autenticado abre el formulario de nueva publicación, THE App SHALL requerir los siguientes campos obligatorios antes de habilitar el botón de publicar: fotografía (mínimo 1, máximo 3 imágenes), especie (selección del catálogo), Zona_De_Pesca donde fue capturada (selección del catálogo), peso en kilogramos (número positivo mayor a 0), y fecha de captura (no puede ser fecha futura).
2. THE App SHALL comprimir cada imagen seleccionada a un máximo de 1280×1280 píxeles manteniendo el aspect ratio, antes de calcular su tamaño final para la validación.
3. IF el tamaño de una imagen supera los 5 MB después de la compresión, THEN THE App SHALL mostrar el mensaje "La imagen excede el límite de 5 MB. Selecciona una imagen de menor resolución." y cancelar la carga de esa imagen sin afectar las demás.
4. THE App SHALL mostrar un feed paginado de capturas de la comunidad en la pantalla principal de Comunidad, cargando 20 publicaciones por página ordenadas por fecha de captura descendente.
5. WHEN un Cliente desliza hacia el final del feed y existen más publicaciones por cargar, THE App SHALL cargar automáticamente la siguiente página de 20 publicaciones y añadirlas al feed existente.
6. WHEN el feed ya no tiene más publicaciones por cargar, THE App SHALL mostrar el texto "Has llegado al final del feed." al pie de la lista.
7. WHEN un Cliente autenticado intenta eliminar una publicación propia, THE App SHALL solicitar confirmación con el mensaje "¿Eliminar esta publicación? Esta acción no se puede deshacer." antes de proceder.
8. THE App SHALL garantizar que un Cliente no pueda eliminar publicaciones de otros Clientes, retornando un error 403 ante cualquier intento de eliminación de registros ajenos.

---

### Requerimiento 11: Notificaciones Push al Cliente

**User Story:** Como Cliente, quiero recibir notificaciones relevantes, para estar informado sobre cambios de clima, vedas y avisos del administrador.

#### Criterios de Aceptación

1. WHEN un Cliente autenticado inicia sesión por primera vez en un dispositivo, THE App SHALL solicitar permiso de notificaciones al sistema operativo y, si el permiso es otorgado, registrar el token de Expo Notifications en la tabla `push_tokens` de Supabase vinculado al `user_id` del Cliente.
2. WHEN el Administrador publica un aviso general, THE Edge_Function `send-push-notification` SHALL enviar una Push_Notification a todos los Clientes que tengan un token registrado y la preferencia de "avisos generales" habilitada, en un plazo máximo de 60 segundos desde la publicación.
3. WHEN la Edge_Function de clima detecta una condición climática adversa para Zihuatanejo (viento mayor a 40 km/h o lluvia intensa), THE Edge_Function SHALL enviar una Push_Notification a los Clientes que tengan al menos una Zona_De_Pesca en favoritos y la preferencia de "alertas de clima" habilitada.
4. WHEN el Administrador activa un período de Veda para una especie, THE Edge_Function SHALL enviar una Push_Notification a los Clientes que tengan la preferencia de "vedas" habilitada, con el texto "Veda activa: [nombre de especie] en veda desde [fecha inicio] hasta [fecha fin]."
5. THE App SHALL mostrar una pantalla de preferencias de notificaciones accesible desde el perfil del Cliente, con tres toggles independientes: "Alertas de clima", "Vedas" y "Avisos generales", todos habilitados por defecto.
6. IF el token de Expo Notifications de un Cliente retorna un error `DeviceNotRegistered` al intentar enviar una notificación, THEN THE Edge_Function SHALL eliminar ese token de la tabla `push_tokens` sin interrumpir el envío al resto de destinatarios del lote.

---

### Requerimiento 12: Equipo Recomendado y Tutoriales

**User Story:** Como Cliente, quiero ver recomendaciones de equipo de pesca y tutoriales en video, para mejorar mi técnica según mi nivel de experiencia.

#### Criterios de Aceptación

1. THE App SHALL mostrar una sección de equipo recomendado con un selector de nivel de experiencia (principiante, intermedio, avanzado); al seleccionar un nivel, THE App SHALL filtrar y mostrar únicamente el equipo cuyo campo `level` coincida con el nivel seleccionado, incluyendo nombre, descripción y uso recomendado de cada ítem.
2. WHEN el filtro de nivel no produce resultados para el nivel seleccionado, THE App SHALL mostrar el mensaje "No hay equipo registrado para este nivel aún."
3. THE App SHALL mostrar tutoriales en video embebidos desde YouTube, renderizando la miniatura del video con un ícono de play; la reproducción NO iniciará automáticamente al cargar la pantalla.
4. WHEN un Cliente toca un tutorial, THE App SHALL reproducir el video de YouTube dentro de la App usando un componente WebView o reproductor de video compatible con Expo, sin redirigir a la App de YouTube.
5. WHEN la App solicita la lista de tutoriales y equipos desde Supabase, THE TanStack_Query SHALL cachear la respuesta durante exactamente 24 horas antes de realizar una nueva solicitud.

---

### Requerimiento 13: Panel del Proveedor — Métricas y Gestión de Servicios

**User Story:** Como Proveedor aprobado, quiero ver métricas de mi negocio y gestionar mis servicios, para monitorear mi rendimiento y mantener mi oferta actualizada.

#### Criterios de Aceptación

1. WHEN un Proveedor con estado `approved` accede a su panel, THE App SHALL mostrar: número de Servicios con estado `active`, número de Reservaciones del mes calendario actual, calificación promedio calculada sobre todas las reseñas de sus Servicios activos, y una gráfica de barras con el número de Reservaciones por día durante los últimos 30 días.
2. WHEN un Proveedor con estado distinto a `approved` intenta acceder al panel de métricas o gestión de servicios, THE App SHALL mostrar una pantalla de "Acceso restringido" con el estado actual de la cuenta y el mensaje correspondiente.
3. WHEN un Proveedor crea un nuevo Servicio, THE App SHALL requerir la selección de exactamente uno de los 8 módulos configurables: Pescador de Lancha, Guía de Pesca, Pesca Deportiva, Renta de Embarcaciones, Restaurante de Mariscos, Tienda de Pesca, Pescadería o Transporte Turístico.
4. WHEN un Proveedor crea o edita un Servicio, THE App SHALL validar y requerir: nombre (entre 3 y 100 caracteres), descripción (entre 10 y 500 caracteres), precio en MXN (número positivo mayor a 0), entre 1 y 5 fotografías (cada una máximo 5 MB), disponibilidad horaria (hora de inicio y fin en formato HH:MM), y capacidad máxima (entero entre 1 y 500).
5. WHEN un Proveedor activa o desactiva un Servicio, THE App SHALL actualizar el estado del Servicio entre `active` e `inactive` en Supabase y reflejar el cambio en la lista de servicios del panel dentro de los 2 segundos siguientes.
6. THE App SHALL garantizar que un Proveedor solo pueda ver, crear y modificar sus propios Servicios, retornando un error 403 ante cualquier intento de acceso a Servicios de otros Proveedores.

---

### Requerimiento 14: Calendario de Disponibilidad del Proveedor

**User Story:** Como Proveedor, quiero gestionar mi calendario de disponibilidad, para controlar cuándo puedo recibir reservaciones.

#### Criterios de Aceptación

1. THE App SHALL mostrar un calendario mensual navegable en el panel del Proveedor, con cada Servicio activo como selector independiente para configurar la disponibilidad por separado.
2. WHEN un Proveedor marca un día como no disponible para un Servicio, THE App SHALL persistir el bloqueo en Supabase y bloquear inmediatamente la creación de nuevas Reservaciones para ese Servicio en esa fecha; el cambio SHALL reflejarse en el calendario del Proveedor dentro de los 2 segundos siguientes.
3. WHEN un Proveedor intenta marcar como no disponible un día que ya tiene Reservaciones con estado `confirmed`, THE App SHALL mostrar el mensaje "Este día tiene [N] reservaciones confirmadas. ¿Deseas bloquear igualmente? Las reservaciones existentes no se cancelan automáticamente." y requerir confirmación explícita.
4. WHEN un Cliente intenta reservar un Servicio en una fecha marcada como no disponible, THE App SHALL mostrar el mensaje "Esta fecha no está disponible" y listar las próximas 3 fechas disponibles del mismo Servicio como alternativas seleccionables.
5. THE App SHALL diferenciar visualmente en el calendario tres estados de día: disponible (sin indicador), no disponible por configuración del Proveedor (color gris con etiqueta "Bloqueado"), y lleno por haber alcanzado la capacidad máxima de Reservaciones (color naranja con etiqueta "Lleno").

---

### Requerimiento 15: Gestión de Reservaciones del Proveedor

**User Story:** Como Proveedor, quiero gestionar las solicitudes de reservación de mis Clientes, para confirmar, rechazar o reprogramar servicios de forma eficiente.

#### Criterios de Aceptación

1. THE App SHALL mostrar al Proveedor la lista de Reservaciones filtrable por estado (`pending`, `confirmed`, `rejected`, `rescheduled`), ordenadas por fecha de solicitud descendente dentro de cada estado.
2. WHEN un Proveedor acepta una Reservacion con estado `pending`, THE App SHALL actualizar el estado a `confirmed` en Supabase y THE Push_Notification SHALL enviar al Cliente la notificación "Tu reservación para [Servicio] el [fecha] ha sido confirmada." dentro de los 30 segundos siguientes.
3. WHEN un Proveedor rechaza una Reservacion con estado `pending`, THE App SHALL requerir un motivo de rechazo de entre 10 y 200 caracteres, actualizar el estado a `rejected` y THE Push_Notification SHALL enviar al Cliente la notificación "Tu reservación para [Servicio] el [fecha] fue rechazada: [motivo]." dentro de los 30 segundos siguientes.
4. WHEN un Proveedor propone reprogramar una Reservacion con estado `pending` o `confirmed`, THE App SHALL requerir una nueva fecha y hora que sea posterior a la fecha actual, actualizar el estado a `rescheduled` y THE Push_Notification SHALL enviar al Cliente la nueva propuesta dentro de los 30 segundos siguientes.
5. WHEN un Cliente acepta una reprogramación, THE App SHALL actualizar el estado de la Reservacion de `rescheduled` a `confirmed` y notificar al Proveedor por Push_Notification.
6. WHEN un Cliente rechaza una reprogramación, THE App SHALL actualizar el estado de la Reservacion de `rescheduled` a `rejected` y notificar al Proveedor por Push_Notification.

---

### Requerimiento 16: Chat entre Cliente y Proveedor

**User Story:** Como Cliente o Proveedor, quiero comunicarme en tiempo real a través de un chat asociado a mi reservación, para coordinar los detalles del servicio.

#### Criterios de Aceptación

1. WHEN una Reservacion alcanza el estado `confirmed`, THE App SHALL habilitar automáticamente un canal de Chat entre el Cliente y el Proveedor, accesible desde el detalle de la Reservacion para ambos participantes.
2. WHEN un participante envía un mensaje, THE Chat SHALL entregar el mensaje al otro participante y actualizar la UI del remitente en menos de 2 segundos medidos en condiciones de red con latencia menor a 100ms (4G o WiFi estable).
3. WHEN un participante del Chat envía un mensaje, THE App SHALL persistirlo en Supabase y THE Push_Notification SHALL notificar al otro participante con el texto "Nuevo mensaje en tu reservación de [Servicio]" si la App está en segundo plano o cerrada.
4. WHEN un participante intenta enviar un mensaje vacío o mayor a 500 caracteres, THE App SHALL mostrar un error de validación y no enviar el mensaje.
5. WHEN el envío de un mensaje falla por error de red, THE App SHALL mostrar el mensaje en la UI con un ícono de error y un botón "Reintentar" para reenviar sin duplicar el mensaje en Supabase.
6. THE App SHALL mostrar el historial completo de mensajes del Chat ordenado por timestamp ascendente al abrir la conversación, cargando los últimos 50 mensajes inicialmente.
7. THE App SHALL garantizar mediante RLS que solo el Cliente y el Proveedor de la Reservacion asociada puedan leer y escribir mensajes en ese Chat, retornando un error 403 a cualquier otro usuario.
8. WHEN una Reservacion cambia a estado `rejected` o `completed`, THE Chat SHALL pasar a modo de solo lectura, mostrando el banner "Esta conversación está cerrada." y deshabilitando el campo de entrada de texto.

---

### Requerimiento 17: Pagos del Proveedor con Mercado Pago

**User Story:** Como Proveedor, quiero cobrar por mis servicios a través de Mercado Pago y ver mi historial de pagos, para gestionar mis ingresos de forma segura.

#### Criterios de Aceptación

1. WHEN una Reservacion alcanza el estado `confirmed`, THE App SHALL mostrar al Cliente un botón "Pagar ahora" en la pantalla de detalle de la Reservacion; el cobro NO es automático y requiere la acción explícita del Cliente para iniciar el proceso de pago.
2. WHEN un Cliente toca el botón "Pagar ahora", THE Edge_Function `create-payment-preference` SHALL generar una preferencia de pago en Mercado Pago con el monto del Servicio, el `external_reference` igual al `id` de la Reservacion, y retornar la URL del checkout al Cliente dentro de los 5 segundos siguientes; THE App SHALL abrir esa URL en un WebView interno sin salir de la App.
3. WHEN el webhook de Mercado Pago notifica un pago aprobado, THE Edge_Function `mercadopago-webhook` SHALL: validar la firma HMAC-SHA256 del webhook usando el secret almacenado en variables de entorno, verificar que el `external_reference` corresponde a una Reservacion existente, registrar la transacción en la tabla `payments` y actualizar el estado de pago de la Reservacion a `paid`, todo de forma idempotente (un mismo `payment_id` no debe procesarse dos veces).
4. IF THE Edge_Function `mercadopago-webhook` recibe una notificación con `payment_id` ya registrado en la tabla `payments`, THEN THE Edge_Function SHALL retornar HTTP 200 sin modificar ningún registro.
5. THE App SHALL mostrar al Proveedor un historial de pagos paginado con 20 registros por página, con columnas: fecha, monto en MXN, nombre del Cliente, nombre del Servicio y estado del pago (`paid`, `failed`, `pending`).
6. THE App SHALL mostrar al Proveedor el monto total acumulado de pagos con estado `paid` en el mes calendario actual y en el mes calendario anterior.
7. WHEN el webhook de Mercado Pago notifica un pago fallido o rechazado, THE Edge_Function SHALL actualizar el estado de pago de la Reservacion a `failed`, y THE Push_Notification SHALL notificar tanto al Cliente como al Proveedor con el mensaje "El pago de la reservación [ID] no pudo procesarse. Intenta de nuevo desde el detalle de tu reservación."
8. IF THE Edge_Function `mercadopago-webhook` recibe una notificación con firma inválida, THEN THE Edge_Function SHALL retornar HTTP 401 y registrar el intento en los logs de auditoría sin procesar el evento.

---

### Requerimiento 18: Reseñas y Promociones del Proveedor

**User Story:** Como Proveedor, quiero ver las reseñas de mis servicios y crear promociones, para mejorar mi reputación y atraer más clientes.

#### Criterios de Aceptación

1. THE App SHALL mostrar al Proveedor la lista de reseñas recibidas en todos sus Servicios, ordenadas por fecha descendente, con: calificación (1–5 estrellas), comentario, nombre del Cliente y fecha de publicación.
2. THE App SHALL calcular y mostrar la calificación promedio del Proveedor como el promedio aritmético de todas las reseñas de sus Servicios activos, redondeado a un decimal; si no hay reseñas, THE App SHALL mostrar "Sin calificaciones aún."
3. WHEN un Proveedor crea una Promoción, THE App SHALL validar y requerir: título (entre 3 y 100 caracteres), descripción (entre 10 y 300 caracteres), porcentaje de descuento (entero entre 1 y 100), un Servicio activo del Proveedor al que aplica, fecha de inicio no anterior al día actual, y fecha de fin posterior a la fecha de inicio.
4. WHEN un Proveedor intenta crear una segunda Promoción activa para el mismo Servicio, THE App SHALL mostrar el mensaje "Este servicio ya tiene una promoción activa. Desactiva la promoción actual antes de crear una nueva." y bloquear la creación.
5. WHEN la fecha actual es posterior a la fecha de fin de una Promoción, THE Edge_Function `deactivate-expired-promotions` (ejecutada diariamente a las 00:01 hora CDMX) SHALL actualizar el estado de la Promoción a `inactive` y dejar de incluirla en las consultas de Servicios para Clientes.
6. WHEN un Cliente consulta el detalle de un Servicio que tiene una Promoción con estado `active`, THE App SHALL mostrar el precio original tachado y el precio con descuento calculado como `precio × (1 - descuento/100)` redondeado a 2 decimales en MXN.

---

### Requerimiento 19: Panel de Administración — Dashboard y Métricas

**User Story:** Como Administrador, quiero ver un dashboard con métricas en tiempo real de la plataforma, para tomar decisiones operativas informadas.

#### Criterios de Aceptación

1. WHEN el Administrador accede a su dashboard, THE App SHALL mostrar las siguientes métricas: total de Clientes registrados, total de Proveedores desglosado por estado (`pending`, `approved`, `rejected`), total de Reservaciones creadas en el mes calendario actual, monto total de pagos con estado `paid` procesados por Mercado Pago en el mes calendario actual, y número de Zonas_De_Pesca con estado `active`.
2. WHEN cualquiera de las métricas del dashboard del Administrador cambia en la base de datos, THE Supabase_Realtime SHALL notificar al cliente y THE App SHALL actualizar el valor mostrado en pantalla en menos de 5 segundos sin requerir recarga manual.
3. THE App SHALL mostrar al Administrador una gráfica de líneas con el número de nuevos registros de Clientes por semana y el número de nuevos registros de Proveedores por semana, cubriendo las últimas 12 semanas completas (aproximadamente 3 meses).

---

### Requerimiento 20: Cola de Verificación de Proveedores

**User Story:** Como Administrador, quiero revisar y aprobar o rechazar solicitudes de registro de Proveedores, para garantizar la calidad y autenticidad de los negocios en la plataforma.

#### Criterios de Aceptación

1. THE App SHALL mostrar al Administrador la lista de Proveedores con estado `pending`, ordenada por `created_at` ascendente (el primero en registrarse aparece primero).
2. WHEN el Administrador selecciona un Proveedor de la cola, THE App SHALL mostrar todos los datos del negocio registrados: nombre del negocio, tipo de servicio, RFC, teléfono, correo, dirección y fecha de registro.
3. WHEN el Administrador toca el botón "Aprobar" para un Proveedor, THE App SHALL actualizar el estado del Proveedor a `approved` en Supabase, registrar la acción en la tabla `audit_logs` con el `admin_id`, la acción `approve_provider` y el `provider_id`, y activar el envío de la Push_Notification de aprobación al Proveedor.
4. WHEN el Administrador toca el botón "Rechazar" para un Proveedor, THE App SHALL requerir un motivo de rechazo de entre 10 y 300 caracteres antes de proceder, actualizar el estado a `rejected`, registrar la acción en `audit_logs` con el motivo incluido, y activar el envío de la Push_Notification de rechazo con el motivo al Proveedor.

---

### Requerimiento 21: Gestión de Zonas de Pesca y Temporadas por el Administrador

**User Story:** Como Administrador, quiero gestionar las zonas de pesca y las configuraciones de temporadas, para mantener el contenido de la plataforma actualizado y preciso.

#### Criterios de Aceptación

1. THE App SHALL permitir al Administrador crear y editar Zonas_De_Pesca con todos sus atributos requeridos: nombre (3–100 caracteres), coordenadas GPS (latitud y longitud en formato decimal), descripción (10–1000 caracteres), nivel de dificultad (principiante, intermedio o avanzado), tipo de zona, lista de especies asociadas, señuelos recomendados, carnadas recomendadas, horarios óptimos y fotografías (mínimo 1, máximo 10 imágenes de hasta 5 MB cada una).
2. THE App SHALL permitir al Administrador configurar la Temporada de cada mes seleccionando del catálogo de especies: la lista de "más probables", la lista de "posibles", las Zonas_De_Pesca sugeridas para ese mes, y los períodos de Veda especificando especie, fecha de inicio y fecha de fin (la fecha de fin debe ser posterior a la fecha de inicio).
3. WHEN el Administrador guarda cambios en una Zona_De_Pesca o Temporada, THE App SHALL invalidar la clave de caché de TanStack_Query correspondiente en el cliente, de modo que la próxima consulta del Cliente obtenga los datos actualizados desde Supabase en lugar de la caché.
4. WHEN el Administrador desactiva una Zona_De_Pesca, THE App SHALL actualizar el campo `is_active` a `false` en Supabase, lo que provocará que la Zona_De_Pesca deje de aparecer en el mapa y en cualquier selector de zonas para los Clientes, sin eliminar el registro de la base de datos.

---

### Requerimiento 22: Reportes, Denuncias y Alertas del Administrador

**User Story:** Como Administrador, quiero gestionar reportes de usuarios, denuncias de contenido y enviar alertas a la comunidad, para mantener la seguridad y la calidad de la plataforma.

#### Criterios de Aceptación

1. THE App SHALL mostrar al Administrador la lista de reportes y denuncias enviados por Clientes, ordenados por `created_at` descendente, con: tipo de reporte (`provider`, `post`, `user`), descripción del contenido denunciado, nombre del usuario que reporta, fecha de reporte y estado (`pending`, `resolved`).
2. WHEN el Administrador marca un reporte como resuelto, THE App SHALL actualizar el estado del reporte a `resolved` en Supabase y registrar en `audit_logs` el `admin_id`, la acción `resolve_report` y el `report_id`.
3. THE App SHALL permitir al Administrador crear un aviso general especificando un título de entre 3 y 100 caracteres y un mensaje de entre 10 y 500 caracteres, con un botón "Publicar y Notificar" que active el envío.
4. WHEN el Administrador publica un aviso general, THE Edge_Function `send-push-notification` SHALL enviar una Push_Notification con el título y mensaje del aviso a todos los Clientes y Proveedores que tengan un token de notificación registrado en la tabla `push_tokens`, en un plazo máximo de 60 segundos.
5. THE App SHALL mostrar al Administrador un log de auditoría paginado en grupos de 50 registros por página, ordenado por `created_at` descendente, con las columnas: nombre del Administrador, tipo de acción, entidad afectada, fecha, hora y descripción de la acción.

---

### Requerimiento 23: Flujo de Reservación del Cliente

**User Story:** Como Cliente, quiero reservar un servicio de un Proveedor aprobado, para garantizar mi lugar en una excursión o servicio náutico.

#### Criterios de Aceptación

1. THE App SHALL permitir a un Cliente autenticado crear una Reservacion seleccionando: un Servicio con estado `active` de un Proveedor con estado `approved`, una fecha disponible en el calendario del Proveedor para ese Servicio, y el número de personas (entero entre 1 y la capacidad máxima del Servicio).
2. WHEN un Cliente envía la solicitud de Reservacion, THE App SHALL crear el registro en Supabase con estado `pending` y THE Push_Notification SHALL notificar al Proveedor con el mensaje "Nueva solicitud de reservación para [Servicio] el [fecha]." dentro de los 30 segundos siguientes.
3. THE App SHALL mostrar al Cliente la lista de todas sus Reservaciones, con: estado actual, nombre del Servicio, nombre del Proveedor, fecha del servicio y monto en MXN, ordenadas por fecha de creación descendente.
4. WHEN una Reservacion del Cliente cambia de estado (`pending` → `confirmed`, `rejected` o `rescheduled`), THE Push_Notification SHALL notificar al Cliente con el nuevo estado y los detalles relevantes dentro de los 30 segundos siguientes al cambio.
5. THE App SHALL permitir al Cliente cancelar una Reservacion con estado `pending` o `confirmed` si la fecha del servicio es posterior a las próximas 24 horas desde el momento de la cancelación.
6. IF un Cliente intenta cancelar una Reservacion con menos de 24 horas de anticipación a la fecha del servicio, THEN THE App SHALL mostrar el modal "Cancelación con menos de 24 horas de anticipación. Esta cancelación podría estar sujeta a cargos según la política del Proveedor. ¿Deseas continuar?" con botones "Cancelar reservación" y "Mantener reservación".

---

### Requerimiento 24: Seguridad y Protección de Datos (LFPDPPP)

**User Story:** Como plataforma, quiero implementar medidas de seguridad y cumplir con la LFPDPPP, para proteger los datos personales de los usuarios y operar legalmente en México.

#### Criterios de Aceptación

1. THE App SHALL validar todos los datos de entrada de formularios usando esquemas Zod antes de enviar cualquier dato a Supabase o a las Edge_Functions, mostrando mensajes de error por campo al detectar datos inválidos.
2. THE App SHALL almacenar todas las variables sensibles (claves de API de Supabase, secrets de Mercado Pago, URLs de servicios externos) exclusivamente como variables de entorno de EAS (`eas.json` + Expo secrets), sin incluirlas en el código fuente ni en archivos del repositorio.
3. THE App SHALL mostrar el aviso de privacidad completo conforme a la LFPDPPP durante el flujo de registro, antes de que el usuario cree su cuenta, describiendo: datos recopilados, finalidad del tratamiento, transferencias a terceros (Supabase, Mercado Pago, Expo), y derechos ARCO con correo de contacto.
4. WHEN un usuario abre la App por primera vez y la funcionalidad de ubicación GPS es requerida, THE App SHALL mostrar el diálogo nativo del sistema operativo solicitando el permiso de ubicación, con la opción de denegarlo sin que esto impida el uso de las funciones no dependientes de ubicación.
5. THE Edge_Function SHALL validar el cuerpo de cada request entrante usando un esquema Zod correspondiente al endpoint antes de ejecutar cualquier lógica de negocio, retornando HTTP 422 con el detalle del error si la validación falla.
6. THE App SHALL garantizar que todas las comunicaciones entre la App y Supabase, y entre la App y servicios externos, se realicen exclusivamente sobre HTTPS/TLS.
7. THE Auth_Service SHALL bloquear temporalmente durante 15 minutos el inicio de sesión desde una IP que haya fallado 5 intentos consecutivos, mostrando el mensaje "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos."

---

### Requerimiento 25: Publicación y Actualizaciones OTA

**User Story:** Como equipo de desarrollo, queremos publicar la App en Google Play y App Store y distribuir actualizaciones sin pasar por revisión completa de las tiendas, para lanzar mejoras de forma ágil.

#### Criterios de Aceptación

1. THE EAS SHALL compilar builds separados para iOS y Android usando los perfiles `development`, `preview` y `production` definidos en `eas.json`, con variables de entorno distintas por perfil.
2. THE App SHALL integrar Expo Updates configurado con el canal `production`, de modo que actualizaciones OTA que no modifiquen código nativo puedan distribuirse sin requerir una nueva publicación en las tiendas de aplicaciones.
3. WHEN la App inicia y Expo Updates detecta una nueva versión OTA disponible en el canal `production`, THE App SHALL descargar la actualización en segundo plano sin interrumpir la sesión activa y aplicarla en el siguiente reinicio de la App.
4. IF la descarga de una actualización OTA falla por cualquier motivo (error de red, timeout, corrupción del bundle), THEN THE App SHALL continuar ejecutando la versión instalada actualmente sin mostrar ningún error al usuario ni interrumpir su sesión, y reintentar la descarga en el siguiente inicio de la App.
5. IF Expo Updates no puede verificar la disponibilidad de una actualización OTA (sin conexión o error del servidor de updates), THEN THE App SHALL iniciar normalmente con la versión instalada sin bloquear al usuario ni mostrar pantallas de error relacionadas con updates.
6. THE EAS SHALL generar un build de iOS en formato IPA firmado con el perfil de distribución de App Store Connect, compatible con TestFlight para pruebas internas antes de la publicación en App Store.
7. THE EAS SHALL generar un build de Android en formato AAB firmado con el keystore de producción, listo para subirse directamente a Google Play Console.

---

### Requerimiento 26: Arquitectura de Base de Datos con RLS

**User Story:** Como equipo de desarrollo, queremos una base de datos PostgreSQL bien estructurada con RLS correctamente configurado, para garantizar el aislamiento de datos entre roles y la seguridad en Supabase.

#### Criterios de Aceptación

1. WHEN se crea un nuevo usuario en `auth.users`, THE Auth_Service SHALL crear automáticamente mediante un trigger un registro en la tabla `profiles` con el `user_id` correspondiente y el rol `client` por defecto, a menos que el registro de auth incluya el metadato `role: 'provider'` o `role: 'admin'`.
2. THE App SHALL implementar políticas RLS activas en todas las tablas de datos de usuario, garantizando que: un Cliente solo pueda leer y modificar sus propios registros en `profiles`, `user_favorites`, `zone_reviews` y `community_posts`; un Proveedor solo pueda leer y modificar sus propios registros en `providers`, `provider_services`, `reservations` y `messages`; y un Administrador tenga acceso de lectura y escritura en todas las tablas de gestión de la plataforma.
3. THE Auth_Service SHALL usar la función `auth.uid()` de Supabase como referencia principal en todas las políticas RLS para vincular cada operación al usuario autenticado que la ejecuta.
4. IF una consulta a Supabase viola una política RLS activa, THEN Supabase SHALL retornar un error con código HTTP 403 y un mensaje genérico, sin exponer nombres de tablas, columnas ni detalles del esquema interno de la base de datos.

---

### Requerimiento 27: Infraestructura con Restricción de Presupuesto

**User Story:** Como equipo de desarrollo, queremos que la infraestructura inicial opere dentro de un presupuesto menor a $20 USD/mes, para mantener la viabilidad económica del proyecto en su etapa inicial.

#### Criterios de Aceptación

1. THE App SHALL operar sobre el plan Free de Supabase en etapa inicial (hasta 500 MB de base de datos, 1 GB de Storage, 2 GB de transferencia y 500K de invocaciones de Edge Functions por mes), con un plan de migración documentado al plan Pro cuando cualquiera de los límites alcance el 80% de uso.
2. THE Edge_Function SHALL implementar caché de respuestas en memoria para las consultas frecuentes de clima (TTL: 60 minutos) y de temporadas (TTL: 24 horas), de modo que múltiples Clientes activos en la misma ventana de tiempo no generen invocaciones adicionales de Edge Function para datos idénticos.
3. THE App SHALL usar exclusivamente OpenStreetMap como proveedor de teselas de mapa, sin integrar proveedores de mapas de pago (Google Maps, Mapbox) en la etapa inicial.
4. THE App SHALL comprimir todas las imágenes antes de subirlas a Supabase Storage (máximo 1280×1280 px, máximo 5 MB por imagen) para mantener el uso de almacenamiento dentro del límite de 1 GB del plan Free de Supabase.
