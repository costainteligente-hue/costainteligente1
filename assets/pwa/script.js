"use strict";

const STORAGE_KEY = "costa-inteligente-proveedor-pwa-v1";

const COLORS = {
  navy: "#0f172a",
  ocean: "#0f766e",
  aqua: "#14b8a6",
  green: "#16a34a",
  orange: "#ea580c",
  yellow: "#ca8a04",
  red: "#dc2626",
  blue: "#2563eb",
  purple: "#7c3aed",
  brown: "#92400e",
  olive: "#4d7c0f",
  fish: "#118ab2",
};

const COLOR_RGB = {
  "#0f766e": "15, 118, 110",
  "#2563eb": "37, 99, 235",
  "#16a34a": "22, 163, 74",
  "#7c3aed": "124, 58, 237",
  "#ea580c": "234, 88, 12",
  "#92400e": "146, 64, 14",
  "#4d7c0f": "77, 124, 15",
  "#118ab2": "17, 138, 178",
};

const services = [
  {
    id: "boat",
    page: "boat",
    name: "Pescador de lancha",
    icon: "⛵",
    color: COLORS.ocean,
    desc: "Lanchas, salidas, horarios, precios, especies objetivo y licencia de navegación.",
    requiresNavigationLicense: true,
  },
  {
    id: "guide",
    page: "guide",
    name: "Guía de pesca",
    icon: "⌖",
    color: COLORS.green,
    desc: "Acompañamiento, asesoría, clases, zonas de trabajo y experiencia.",
  },
  {
    id: "sport",
    page: "sport",
    name: "Pesca deportiva",
    icon: "★",
    color: COLORS.orange,
    desc: "Paquetes deportivos, torneos, pesca costera, pesca de altura y catch and release.",
    requiresNavigationLicense: true,
  },
  {
    id: "rental",
    page: "rental",
    name: "Renta de embarcaciones",
    icon: "≋",
    color: COLORS.blue,
    desc: "Embarcaciones en renta, disponibilidad, tarifas, punto de salida y licencia.",
    requiresNavigationLicense: true,
  },
  {
    id: "restaurant",
    page: "restaurant",
    name: "Restaurante de mariscos",
    icon: "♨",
    color: COLORS.brown,
    desc: "Menú, especialidades, horarios, reservaciones, promociones y licencia de funcionamiento.",
    hasCatalog: true,
    requiresBusinessLicense: true,
  },
  {
    id: "store",
    page: "store",
    name: "Tienda de pesca",
    icon: "▣",
    color: COLORS.purple,
    desc: "Productos, marcas, accesorios, promociones, horarios y licencia de funcionamiento.",
    hasCatalog: true,
    requiresBusinessLicense: true,
  },
  {
    id: "fishMarket",
    page: "fishMarket",
    name: "Pescadería",
    icon: "◍",
    color: COLORS.fish,
    desc: "Productos frescos, precios, limpieza, fileteado, empaque y licencia de funcionamiento.",
    hasCatalog: true,
    requiresBusinessLicense: true,
  },
  {
    id: "transport",
    page: "transport",
    name: "Transporte turístico",
    icon: "⇄",
    color: COLORS.olive,
    desc: "Traslados, rutas, capacidad, horarios y tarifas.",
  },
];

const fishingTypeOptions = [
  "Pesca de altura",
  "Pesca costera",
  "Pesca de fondo",
  "Curricán",
  "Pesca en playa",
  "Pesca en muelle",
  "Agua dulce",
  "Catch and release",
  "Torneo",
];

const fishingSpeciesByType = {
  "Pesca de altura": ["Pez vela", "Marlín azul", "Marlín rayado", "Marlín negro", "Dorado", "Atún aleta amarilla", "Wahoo", "Barracuda"],
  "Pesca costera": ["Robalo", "Sierra", "Jurel", "Pargo", "Huachinango", "Barracuda", "Pez gallo", "Lisa"],
  "Pesca de fondo": ["Huachinango", "Pargo", "Cabrilla", "Mero", "Mojarra", "Besugo", "Ronco"],
  Curricán: ["Dorado", "Atún", "Sierra", "Wahoo", "Barracuda", "Jurel", "Pez vela"],
  "Pesca en playa": ["Robalo", "Sierra", "Jurel", "Pargo", "Lisa", "Corvina", "Pez gallo"],
  "Pesca en muelle": ["Jurel", "Sierra", "Mojarra", "Pargo", "Ronco", "Lisa", "Barracuda"],
  "Agua dulce": ["Lobina", "Tilapia", "Carpa", "Bagre", "Mojarra", "Trucha"],
  "Catch and release": ["Pez vela", "Marlín", "Pez gallo", "Sábalo", "Robalo", "Dorado"],
  Torneo: ["Pez vela", "Marlín", "Dorado", "Pez gallo", "Sábalo"],
};

const conapescaGuidance = [
  "El permiso de pesca deportivo-recreativa es individual y aplica para la persona que realizará la actividad.",
  "Los servicios de pesca deben capturar y mostrar nombre completo de cada participante antes de confirmar la salida.",
  "Las especies como marlín, pez vela, pez espada, sábalo o chiro, pez gallo y dorado se tratan como especies reservadas para pesca deportivo-recreativa en la franja aplicable.",
  "Las capturas de pesca deportivo-recreativa no deben registrarse como producto comercial dentro de la app.",
  "La app debe dejar evidencia de permiso, fecha, hora, zona, embarcación y responsable para facilitar revisión administrativa.",
];

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const recordStatusLabels = { saved: "Guardado", pending: "Pendiente", verified: "Aceptado", rejected: "Rechazado" };

let state = loadState();
let routeStack = [{ page: "dashboard", params: {} }];
let draftForm = null;
let transient = {};
let toastTimer = 0;

const $ = (selector, root = document) => root.querySelector(selector);

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const ICON_PATHS = {
  "menu": "<path d='M4 7h16M4 12h16M4 17h16'/>",
  "settings": "<path d='M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z'/><path d='M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.07a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.07A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.7 1.7 0 0 0 1.88.34H9A1.7 1.7 0 0 0 10 3.07V3a2 2 0 0 1 4 0v.07a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1.7 1.7 0 0 0-.34 1.88v.04A1.7 1.7 0 0 0 20.93 10H21a2 2 0 0 1 0 4h-.07A1.7 1.7 0 0 0 19.4 15Z'/>",
  "help": "<circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.7 2.7 0 0 1 5.1 1.2c0 1.8-2.6 2.3-2.6 4'/><path d='M12 18h.01'/>",
  "dashboard": "<rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/>",
  "store": "<path d='M4 10h16l-1.2-5.2A2.2 2.2 0 0 0 16.65 3h-9.3A2.2 2.2 0 0 0 5.2 4.8L4 10Z'/><path d='M6 10v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9'/><path d='M9 21v-6h6v6'/><path d='M4 10c.5 1.3 2.5 1.3 3 0 .5 1.3 2.5 1.3 3 0 .5 1.3 2.5 1.3 3 0 .5 1.3 2.5 1.3 3 0 .5 1.3 2.5 1.3 3 0'/>",
  "calendar": "<rect x='3' y='4' width='18' height='17' rx='3'/><path d='M8 2v4M16 2v4M3 10h18'/>",
  "calendar-check": "<rect x='3' y='4' width='18' height='17' rx='3'/><path d='M8 2v4M16 2v4M3 10h18M8 15l2.2 2.2L16 12'/>",
  "wifi-off": "<path d='m2 2 20 20'/><path d='M8.5 16.5a5 5 0 0 1 7 0'/><path d='M5 13a10 10 0 0 1 3.1-2.3'/><path d='M10.8 8.2A14 14 0 0 1 21 12'/><path d='M3 8a18 18 0 0 1 4-2.5'/><path d='M12 20h.01'/>",
  "back": "<path d='M15 18 9 12l6-6'/>",
  "chevron-right": "<path d='m9 18 6-6-6-6'/>",
  "check": "<path d='M20 6 9 17l-5-5'/>",
  "x": "<path d='M18 6 6 18M6 6l12 12'/>",
  "plus": "<path d='M12 5v14M5 12h14'/>",
  "edit": "<path d='M12 20h9'/><path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z'/>",
  "trash": "<path d='M3 6h18'/><path d='M8 6V4h8v2'/><path d='M6 6l1 15h10l1-15'/><path d='M10 11v6M14 11v6'/>",
  "dollar": "<path d='M12 2v20'/><path d='M17 6.5c-1.2-.9-3-1.4-4.7-1.1-2 .3-3.3 1.3-3.3 2.9 0 3.7 8 2 8 6 0 1.9-1.8 3.2-4.2 3.3-1.9.1-3.8-.5-5.1-1.6'/>",
  "mail": "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='m4 7 8 6 8-6'/>",
  "star": "<path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z'/>",
  "tag": "<path d='M20 13 13 20 4 11V4h7l9 9Z'/><path d='M7.5 7.5h.01'/>",
  "boat": "<path d='M4 17h16l-2 4H6l-2-4Z'/><path d='M12 3v14'/><path d='M12 5 6 15h6'/><path d='M14 7v8h5l-5-8Z'/>",
  "compass": "<circle cx='12' cy='12' r='9'/><path d='m15 9-2 5-5 2 2-5 5-2Z'/>",
  "waves": "<path d='M3 16c3-2 6-2 9 0s6 2 9 0'/><path d='M3 20c3-2 6-2 9 0s6 2 9 0'/><path d='M8 4h8l3 8H5l3-8Z'/>",
  "restaurant": "<path d='M7 2v20'/><path d='M4 2v6a3 3 0 0 0 6 0V2'/><path d='M17 2v20'/><path d='M14 2h3a3 3 0 0 1 3 3v6h-6V2Z'/>",
  "fish": "<path d='M4 12c3.5-5 10.5-5 14 0-3.5 5-10.5 5-14 0Z'/><path d='m18 12 3-3v6l-3-3Z'/><path d='M8.5 10.5h.01'/>",
  "bus": "<rect x='4' y='4' width='16' height='14' rx='3'/><path d='M4 10h16M8 18v2M16 18v2M8 14h.01M16 14h.01'/>",
  "info": "<circle cx='12' cy='12' r='9'/><path d='M12 10v6M12 7h.01'/>",
  "warning": "<path d='M12 3 2 20h20L12 3Z'/><path d='M12 9v5M12 17h.01'/>",
  "eye": "<path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z'/><circle cx='12' cy='12' r='3'/>",
  "eye-off": "<path d='m2 2 20 20'/><path d='M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-3 4.2'/><path d='M6.6 6.6C3.6 8.7 2 12 2 12s3.5 8 10 8c1.5 0 2.8-.4 4-.9'/><path d='M9.9 9.9a3 3 0 0 0 4.2 4.2'/>",
  "users": "<path d='M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2'/><circle cx='9.5' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.9'/><path d='M16 3.1a4 4 0 0 1 0 7.8'/>",
  "map-pin": "<path d='M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11Z'/><circle cx='12' cy='10' r='2.5'/>",
  "clock": "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>",
  "document": "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z'/><path d='M14 2v6h6M8 13h8M8 17h6'/>",
  "image": "<rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='8' cy='10' r='1.5'/><path d='m21 16-5-5L5 19'/>",
  "upload": "<path d='M12 16V4'/><path d='m7 9 5-5 5 5'/><path d='M4 20h16'/>",
  "lock": "<rect x='4' y='11' width='16' height='10' rx='2'/><path d='M8 11V7a4 4 0 0 1 8 0v4'/>",
  "shield": "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'/>",
  "search": "<circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5'/>",
  "refresh": "<path d='M21 12a9 9 0 0 1-15.3 6.4L3 16'/><path d='M3 21v-5h5'/><path d='M3 12A9 9 0 0 1 18.3 5.6L21 8'/><path d='M21 3v5h-5'/>",
  "send": "<path d='M22 2 11 13'/><path d='m22 2-7 20-4-9-9-4 20-7Z'/>",
  "pause": "<path d='M8 5v14M16 5v14'/>",
  "play": "<path d='m8 5 12 7-12 7V5Z'/>",
  "reply": "<path d='m9 17-6-5 6-5'/><path d='M3 12h12a6 6 0 0 1 6 6v1'/>",
  "percent": "<path d='M19 5 5 19'/><circle cx='7' cy='7' r='2'/><circle cx='17' cy='17' r='2'/>"
};

const ICON_ALIASES = {
  "☰": "menu", "⚙": "settings", "?": "help", "i": "info", "▦": "dashboard", "◆": "store",
  "✓": "check", "□": "calendar", "$": "dollar", "✉": "mail", "★": "star", "%": "percent",
  "⛵": "boat", "⌖": "compass", "≋": "waves", "♨": "restaurant", "▣": "store", "◍": "fish",
  "⇄": "bus", "◎": "users", "◉": "shield", "◇": "shield", "▧": "image", "▤": "document",
  "◌": "eye-off", "✎": "edit", "×": "x", "+": "plus", "‹": "back", "›": "chevron-right",
  "…": "clock", "!": "warning", "Ⅱ": "pause", "▶": "play", "↩": "reply", "§": "document",
  "☎": "phone", "⌕": "lock", "✦": "bell", "○": "circle", "●": "check", "▢": "image",
  "dashboard": "dashboard", "store": "store", "calendar-check": "calendar-check", "calendar": "calendar",
  "settings": "settings", "help": "help", "menu": "menu", "wifi-off": "wifi-off"
};

Object.assign(ICON_ALIASES, {
  "\u2630": "menu",
  "\u2699": "settings",
  "\u25a6": "dashboard",
  "\u25c6": "store",
  "\u2713": "check",
  "\u25a1": "calendar",
  "\u2709": "mail",
  "\u2605": "star",
  "\u26f5": "boat",
  "\u2316": "compass",
  "\u224b": "waves",
  "\u2668": "restaurant",
  "\u25a3": "store",
  "\u25cd": "fish",
  "\u21c4": "bus",
  "\u25ce": "users",
  "\u25c9": "shield",
  "\u25c7": "shield",
  "\u25a7": "image",
  "\u25a4": "document",
  "\u25cc": "eye-off",
  "\u270e": "edit",
  "\u00d7": "x",
  "\u2039": "back",
  "\u203a": "chevron-right",
  "\u2026": "clock",
  "\u2161": "pause",
  "\u25b6": "play",
  "\u21a9": "reply",
  "\u00a7": "document",
  "\u260e": "phone",
  "\u2315": "lock",
  "\u2726": "bell",
  "\u25cb": "circle",
  "\u25cf": "check",
  "\u25a2": "image"
});

ICON_PATHS.phone = "<path d='M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z'/>";
ICON_PATHS.bell = "<path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z'/><path d='M10 21h4'/>";
ICON_PATHS.circle = "<circle cx='12' cy='12' r='8'/>";

function iconSvg(token) {
  const key = ICON_ALIASES[String(token || "").trim()] || String(token || "").trim();
  const paths = ICON_PATHS[key];
  if (!paths) return esc(token);
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
}

function upgradeIcons(root = document) {
  root.querySelectorAll(".icon").forEach((node) => {
    if (node.dataset.iconReady === "true") return;
    const token = node.textContent.trim();
    const svg = iconSvg(token);
    if (svg !== esc(token)) {
      node.innerHTML = svg;
      node.dataset.iconReady = "true";
    }
  });
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function serviceById(id) {
  return services.find((service) => service.id === id || service.page === id);
}

function recordById(serviceId, recordId) {
  return (state.records[serviceId] || []).find((record) => record.id === recordId);
}

function colorVars(color) {
  return `--accent:${color};--accent-rgb:${COLOR_RGB[color] || COLOR_RGB[COLORS.ocean]};`;
}

function currencyLabel(value) {
  return value === "usd" ? "USD" : "MXN";
}

function speciesForFishingType(type) {
  return fishingSpeciesByType[type] || fishingSpeciesByType[fishingTypeOptions[0]];
}

function speciesForFishingTypes(types) {
  const values = new Set();
  types.forEach((type) => speciesForFishingType(type).forEach((item) => values.add(item)));
  if (!values.size) speciesForFishingType(fishingTypeOptions[0]).forEach((item) => values.add(item));
  return [...values].sort((a, b) => a.localeCompare(b, "es"));
}

function serviceRequiresVesselDocuments(service) {
  return service.requiresNavigationLicense || service.id === "transport";
}

function serviceRequiresFishingPermit(service) {
  return ["boat", "sport", "guide"].includes(service.id);
}

function serviceRequiresNauticalTourismDocuments(service) {
  return ["rental", "transport", "sport"].includes(service.id);
}

function serviceRequiresCaptain(service) {
  return ["boat", "rental", "sport"].includes(service.id);
}

function serviceNeedsFishingConfig(service) {
  return ["boat", "sport", "guide"].includes(service.id);
}

function serviceSupportsPricingOptions(service) {
  return ["boat", "rental", "sport", "guide", "transport"].includes(service.id);
}

function documentRequirementsFor(service) {
  const items = [
    {
      title: "Fotografía principal del servicio",
      subtitle: "Foto real obligatoria del negocio, embarcación, equipo o punto de salida. Esta imagen se usa para revisar y mostrar el servicio a usuarios.",
      icon: "▧",
      isRequired: true,
    },
  ];

  if (serviceRequiresVesselDocuments(service)) {
    items.push(
      {
        title: "Certificado de seguridad vigente",
        subtitle: "Imagen del certificado emitido o validado por Capitanía de Puerto.",
        icon: "✓",
        isRequired: true,
      },
      {
        title: "Certificado de matrícula",
        subtitle: "Imagen del certificado de matrícula de la embarcación emitido por Capitanía de Puerto.",
        icon: "□",
        isRequired: true,
      },
      {
        title: "Fotografía de la embarcación",
        subtitle: "Foto frontal, lateral o evidencia clara de la unidad que se dará de alta.",
        icon: "⛵",
        isRequired: true,
      },
    );
  }

  if (serviceRequiresFishingPermit(service)) {
    items.push({
      title: "Permiso de pesca CONAPESCA",
      subtitle: "Imagen del permiso vigente cuando el servicio implique pesca o captura deportiva/recreativa.",
      icon: "◍",
      isRequired: true,
    });
  }

  if (serviceRequiresNauticalTourismDocuments(service)) {
    items.push(
      {
        title: "Permiso de turismo náutico",
        subtitle: "Imagen del permiso correspondiente cuando la actividad sea turística o recreativa en embarcación.",
        icon: "≋",
        isRequired: true,
      },
      {
        title: "Póliza de seguro para pasajeros",
        subtitle: "Cobertura vigente para las personas usuarias que tomarán el servicio.",
        icon: "◎",
        isRequired: true,
      },
      {
        title: "Póliza de seguro para tripulación",
        subtitle: "Cobertura vigente para capitán, guía, marinero o personal operativo.",
        icon: "◉",
        isRequired: true,
      },
      {
        title: "Póliza de seguro para terceros",
        subtitle: "Cobertura ante daños a terceros durante la operación del servicio.",
        icon: "◇",
        isRequired: true,
      },
    );
  }

  if (service.requiresBusinessLicense) {
    items.push(
      {
        title: "Licencia de funcionamiento",
        subtitle: "Imagen de la licencia municipal o permiso de operación del negocio físico.",
        icon: "▣",
        isRequired: true,
      },
      {
        title: "Fotografía del local",
        subtitle: "Evidencia visual del establecimiento, fachada, área de atención o punto de venta.",
        icon: "▤",
        isRequired: false,
      },
    );
  }

  if (items.length === 1) {
    items.push({
      title: "Evidencia operativa del servicio",
      subtitle: "Imagen del equipo, herramienta, vehículo o documentación que compruebe que el servicio existe.",
      icon: "✓",
      isRequired: true,
    });
  }

  return items;
}

function scheduleTitleFor(service) {
  if (["restaurant", "store", "fishMarket"].includes(service.id)) return "Horarios de atención";
  if (service.id === "guide") return "Horarios disponibles";
  return "Horarios de salida";
}

function scheduleSubtitleFor(service) {
  if (["restaurant", "store", "fishMarket"].includes(service.id)) return "Define los horarios en los que el negocio atiende a usuarios.";
  if (service.id === "guide") return "Define los horarios en los que el guía puede atender citas.";
  return "Define horarios de salida, operación o servicio.";
}

function optionManagerTitleFor(service) {
  const labels = {
    boat: "Recorridos y precios",
    rental: "Recorridos y precios",
    sport: "Paquetes deportivos",
    guide: "Paquetes y asesorías",
    transport: "Rutas y tarifas",
  };
  return labels[service.id] || "Opciones y precios";
}

function optionManagerSubtitleFor(service) {
  const labels = {
    boat: "Agrega recorridos, horas, cupo y precios por embarcación.",
    rental: "Agrega recorridos, horas, cupo y precios por embarcación.",
    sport: "Agrega paquetes de pesca deportiva con duración, cupo y precio.",
    guide: "Agrega asesorías, acompañamientos o clases con duración y precio.",
    transport: "Agrega rutas, traslados, duración, cupo y tarifa.",
  };
  return labels[service.id] || "Agrega opciones con precio y disponibilidad.";
}

function optionAddLabelFor(service) {
  const labels = { boat: "Agregar recorrido", rental: "Agregar recorrido", sport: "Agregar paquete", guide: "Agregar asesoría", transport: "Agregar ruta" };
  return labels[service.id] || "Agregar opción";
}

function optionEmptyTextFor(service) {
  const labels = {
    boat: "Sin recorridos registrados.",
    rental: "Sin recorridos registrados.",
    sport: "Sin paquetes deportivos registrados.",
    guide: "Sin paquetes o asesorías registradas.",
    transport: "Sin rutas o tarifas registradas.",
  };
  return labels[service.id] || "Sin opciones registradas.";
}

function optionNameLabelFor(service) {
  const labels = {
    boat: "Nombre del recorrido",
    rental: "Nombre del recorrido",
    sport: "Nombre del paquete deportivo",
    guide: "Nombre de la asesoría o clase",
    transport: "Nombre de la ruta o traslado",
  };
  return labels[service.id] || "Nombre de la opción";
}

function optionDescriptionLabelFor(service) {
  const labels = {
    boat: "Descripción / ruta",
    rental: "Descripción / ruta",
    sport: "Descripción del paquete",
    guide: "Descripción de la asesoría",
    transport: "Ruta o descripción del traslado",
  };
  return labels[service.id] || "Descripción";
}

function capacityLabelFor(service) {
  if (service.id === "guide") return "Cupo de personas";
  if (service.id === "transport") return "Capacidad de pasajeros";
  return "Cupo / capacidad";
}

function catalogTitleFor(service) {
  const labels = {
    restaurant: "Menú visual y platillos",
    store: "Menú visual de productos",
    fishMarket: "Menú visual de productos frescos",
  };
  return labels[service.id] || "Catálogo";
}

function catalogSubtitleFor(service) {
  const labels = {
    restaurant: "Platillos con imagen opcional, descripción, precio y disponibilidad del menú.",
    store: "Productos con imagen opcional, marca, descripción, precio y existencia.",
    fishMarket: "Productos frescos con imagen opcional, presentación, precio por kilo o pieza y existencia.",
  };
  return labels[service.id] || "Productos visibles para usuarios.";
}

function reservationTitleFor(service) {
  const labels = {
    restaurant: "Reservas de mesa",
    store: "Pedidos de productos",
    fishMarket: "Pedidos de pescadería",
    guide: "Citas de guía",
    transport: "Reservas de traslado",
  };
  return labels[service.id] || "Reservas";
}

function reservationSubtitleFor(service) {
  const labels = {
    restaurant: "Solicitudes de mesa, horario y número de personas.",
    store: "Solicitudes de compra, apartado o entrega de productos.",
    fishMarket: "Solicitudes de producto fresco, cantidad y entrega.",
    guide: "Solicitudes de asesoría, acompañamiento o clase.",
    transport: "Solicitudes de ruta, horario y pasajeros.",
  };
  return labels[service.id] || "Solicitudes, cupos y calendario.";
}

function bookingOptionsTitleFor(service) {
  return service.hasCatalog ? catalogTitleFor(service) : optionManagerTitleFor(service);
}

function bookingOptionsSubtitleFor(service) {
  return service.hasCatalog ? "Lo que el usuario podrá elegir al pedir o consultar." : "Lo que el usuario podrá seleccionar al reservar.";
}

function formHeaderSubtitleFor(service) {
  if (service.hasCatalog) return "Primero registra los datos principales. Los productos, menú y precios se configuran después en Administrar.";
  if (serviceSupportsPricingOptions(service)) return `Primero registra los datos principales. ${optionManagerTitleFor(service).toLowerCase()} se configuran después en Administrar.`;
  return "Primero registra los datos principales. La información comercial se configura después en Administrar.";
}

function bookingAmountForRecord(record) {
  if (record.catalog?.length) return `${Number(record.catalog[0].price || 0).toFixed(0)} ${currencyLabel(record.catalog[0].currency)}`;
  if (record.routeOptions?.length) return routePriceText(record.routeOptions[0]);
  return priceText(record);
}

function priceText(item) {
  const price = Number(item.price || 0);
  if (price <= 0) return "Sin precio";
  return `${price.toFixed(0)} ${currencyLabel(item.currency)}`;
}

function durationText(item) {
  return `${Number(item.durationHours || 0)}h ${String(Number(item.durationMinutes || 0)).padStart(2, "0")}min`;
}

function routePriceText(item) {
  const price = Number(item.price || 0);
  return price <= 0 ? "Sin precio" : `${price.toFixed(0)} ${currencyLabel(item.currency)}`;
}

function routeDurationText(item) {
  return `${Number(item.durationHours || 0)}h ${String(Number(item.durationMinutes || 0)).padStart(2, "0")}min`;
}

function recordCanAppearInUsers(record) {
  return Boolean(record.visibleToUsers && record.status === "verified" && String(record.servicePhotoUrl || "").trim());
}

function fishingTypesText(record) {
  const types = record.fishingTypes?.length ? record.fishingTypes : record.fishingType ? [record.fishingType] : [];
  return types.length ? types.join(", ") : "Sin tipos registrados";
}

function tagsText(record) {
  if (!record.tags?.length) return "Sin etiquetas registradas";
  return record.tags.map((tag) => (tag.includes(":") ? tag.split(":").at(-1) : tag)).join(", ");
}

function seedRecords() {
  const defaultSchedules = [
    { start: "08:00", end: "10:00" },
    { start: "12:00", end: "14:00" },
  ];

  const makeItem = ({ serviceId, title, subtitle, serviceType, price, catalog = [], routeOptions = null, gallery = null }) => {
    const service = serviceById(serviceId);
    const supports = serviceSupportsPricingOptions(service);
    const routes =
      routeOptions ||
      (supports
        ? [
            {
              id: `${serviceId}-option-1`,
              name: serviceId === "guide" ? "Asesoría básica" : serviceId === "sport" ? "Paquete deportivo inicial" : serviceId === "transport" ? "Ruta local" : "Recorrido corto",
              description:
                serviceId === "guide"
                  ? "Acompañamiento o clase inicial para usuarios."
                  : serviceId === "sport"
                    ? "Paquete base de pesca deportiva con cupo y duración definidos."
                    : serviceId === "transport"
                      ? "Traslado o ruta base con punto de salida registrado."
                      : "Ruta base con punto de salida registrado.",
              price,
              currency: "mxn",
              durationHours: 2,
              durationMinutes: 0,
              capacity: 4,
              isAvailable: true,
            },
            ...(serviceId === "boat" || serviceId === "rental" || serviceId === "sport" || serviceId === "transport"
              ? [
                  {
                    id: `${serviceId}-option-2`,
                    name: serviceId === "sport" ? "Paquete premium" : serviceId === "transport" ? "Ruta extendida" : "Recorrido premium",
                    description:
                      serviceId === "sport"
                        ? "Paquete extendido con mayor tiempo de pesca y precio independiente."
                        : serviceId === "transport"
                          ? "Ruta extendida con mayor distancia, cupo y tarifa."
                          : "Ruta extendida con mayor tiempo de servicio y precio independiente.",
                    price: price > 0 ? price + 1500 : 1500,
                    currency: "mxn",
                    durationHours: 4,
                    durationMinutes: 0,
                    capacity: 6,
                    isAvailable: true,
                  },
                ]
              : []),
          ]
        : []);

    const photos =
      gallery ||
      [
        { id: `${serviceId}-photo-1`, title: "Foto principal", description: "Imagen visible en la portada del servicio.", icon: "▧", color: COLORS.ocean, featured: true },
        { id: `${serviceId}-photo-2`, title: "Evidencia del servicio", description: "Foto secundaria para mostrar confianza al usuario.", icon: "▤", color: COLORS.blue, featured: false },
      ];

    return {
      id: `${serviceId}-aceptado`,
      serviceId,
      title,
      subtitle,
      location: "Ubicación registrada",
      serviceType,
      price,
      currency: "mxn",
      durationHours: 2,
      durationMinutes: 0,
      status: "verified",
      isAvailable: true,
      availabilityNote: "",
      unavailableDateKeys: [],
      schedules: clone(defaultSchedules),
      catalog,
      routeOptions: routes,
      gallery: photos,
      captainName: serviceRequiresCaptain(service) ? "Cap. José Ramírez" : "",
      fishingTypes: serviceNeedsFishingConfig(service) ? ["Pesca de altura", "Curricán"] : [],
      fishingType: serviceNeedsFishingConfig(service) ? "Pesca de altura" : "",
      targetSpecies: serviceNeedsFishingConfig(service) ? speciesForFishingTypes(["Pesca de altura", "Curricán"]).slice(0, 6) : [],
      servicePhotoUrl: "assets/images/service-cover.svg",
      uploadedDocumentPhotos: documentRequirementsFor(service).map((doc) => doc.title),
      visibleToUsers: true,
      publicContact: "+52 755 000 0000",
      capacity: serviceId === "restaurant" ? 30 : serviceId === "store" || serviceId === "fishMarket" ? 0 : 4,
      experienceYears: serviceId === "guide" ? 5 : 0,
      tags: serviceNeedsFishingConfig(service) ? ["Servicios incluidos:Equipo de pesca", "Servicios incluidos:Chalecos", "Servicios incluidos:Capitán"] : [],
      extraDetails: ["Registro local listo para operar en el panel"],
      meetingPoint: "Punto de atención registrado",
    };
  };

  return {
    boat: [makeItem({ serviceId: "boat", title: "Embarcación aceptada", subtitle: "Lancha panga · servicio aceptado", serviceType: "Lancha panga", price: 4500 })],
    guide: [makeItem({ serviceId: "guide", title: "Guía aceptado", subtitle: "Acompañamiento de pesca · servicio aceptado", serviceType: "Guía local", price: 1200 })],
    sport: [makeItem({ serviceId: "sport", title: "Paquete aceptado", subtitle: "Pesca deportiva · servicio aceptado", serviceType: "Pesca de altura", price: 6500 })],
    rental: [makeItem({ serviceId: "rental", title: "Embarcación en renta aceptada", subtitle: "Renta con capitán · servicio aceptado", serviceType: "Lancha rápida", price: 1800 })],
    restaurant: [
      makeItem({
        serviceId: "restaurant",
        title: "Restaurante aceptado",
        subtitle: "Mariscos · negocio aceptado",
        serviceType: "Restaurante",
        price: 0,
        catalog: [{ id: "restaurant-item-1", name: "Platillo registrado", description: "Elemento visible en el menú del restaurante.", price: 180, currency: "mxn", imageUrl: "" }],
      }),
    ],
    store: [
      makeItem({
        serviceId: "store",
        title: "Tienda aceptada",
        subtitle: "Productos de pesca · negocio aceptado",
        serviceType: "Tienda",
        price: 0,
        catalog: [{ id: "store-item-1", name: "Producto registrado", description: "Artículo visible para usuarios.", price: 250, currency: "mxn", imageUrl: "" }],
      }),
    ],
    fishMarket: [
      makeItem({
        serviceId: "fishMarket",
        title: "Pescadería aceptada",
        subtitle: "Productos frescos · negocio aceptado",
        serviceType: "Pescadería",
        price: 0,
        catalog: [{ id: "fish-item-1", name: "Producto registrado", description: "Producto visible para usuarios.", price: 160, currency: "mxn", imageUrl: "" }],
      }),
    ],
    transport: [makeItem({ serviceId: "transport", title: "Transporte aceptado", subtitle: "Traslado turístico · servicio aceptado", serviceType: "Terrestre", price: 700 })],
  };
}

function seedReservations() {
  return [
    {
      id: "r1",
      user: "María Fernanda López",
      userPhone: "+52 755 100 2201",
      userEmail: "maria.lopez@correo.com",
      service: "Embarcación aceptada",
      requestedOption: "Recorrido corto · pesca costera",
      captainName: "Cap. José Ramírez",
      date: "15/07/2026",
      hour: "08:00 - 10:00",
      people: 4,
      participantNames: ["María Fernanda López", "Carlos Medina Ruiz", "Sofía Medina López", "Luis Hernández Ríos"],
      amount: "4500 MXN",
      paymentStatus: "Anticipo pendiente",
      paymentMethod: "Transferencia",
      meetingPoint: "Muelle principal de Zihuatanejo",
      comment: "Solicita apoyo para principiantes y equipo básico.",
      message: "Solicita salida de pesca por la mañana.",
      status: "Solicitud",
      createdAt: "23/06/2026 13:20",
      acceptedAt: "",
      completedAt: "",
      finalizationNote: "",
    },
    {
      id: "r2",
      user: "Jorge Ramírez Ávila",
      userPhone: "+52 755 100 2202",
      userEmail: "jorge.ramirez@correo.com",
      service: "Restaurante aceptado",
      requestedOption: "Mesa familiar · comida de mariscos",
      captainName: "No aplica",
      date: "16/07/2026",
      hour: "14:00 - 16:00",
      people: 6,
      participantNames: ["Jorge Ramírez Ávila", "Ana Torres Molina", "Diego Ramírez Torres", "Valeria Ramírez Torres", "Elena Molina Cruz", "Raúl Torres Díaz"],
      amount: "Pendiente",
      paymentStatus: "Pago en sitio",
      paymentMethod: "Efectivo o tarjeta",
      meetingPoint: "Recepción del restaurante",
      comment: "Una persona alérgica al camarón.",
      message: "Pregunta por disponibilidad para comida familiar.",
      status: "Confirmada",
      createdAt: "23/06/2026 12:40",
      acceptedAt: "Aceptada por el proveedor",
      completedAt: "",
      finalizationNote: "",
    },
    {
      id: "r3",
      user: "Pedro Castillo Vega",
      userPhone: "+52 755 100 2203",
      userEmail: "pedro.castillo@correo.com",
      service: "Guía aceptado",
      requestedOption: "Asesoría básica · pesca en playa",
      captainName: "Guía Pedro Prado",
      date: "10/07/2026",
      hour: "07:00 - 09:00",
      people: 2,
      participantNames: ["Pedro Castillo Vega", "Miguel Ángel Prado"],
      amount: "1200 MXN",
      paymentStatus: "Pagado",
      paymentMethod: "Tarjeta",
      meetingPoint: "Acceso principal de playa La Ropa",
      comment: "Llevar caña para principiante.",
      message: "Servicio finalizado.",
      status: "Finalizada",
      createdAt: "08/07/2026 18:15",
      acceptedAt: "Aceptada por el proveedor",
      completedAt: "Recorrido finalizado por el proveedor",
      finalizationNote: "Servicio cerrado con asistencia confirmada.",
    },
  ];
}

function seedChats() {
  return [
    {
      id: "c1",
      user: "Usuario con reserva",
      service: "Embarcación aceptada",
      lastMessage: "¿El punto de salida es el muelle principal?",
      status: "Reserva activa",
      time: "08:30",
      messages: [
        { text: "Buenas tardes, me interesa confirmar el servicio.", mine: false, time: "08:12" },
        { text: "Claro, puedo ayudarte con la información de horarios y punto de salida.", mine: true, time: "08:15" },
        { text: "¿El punto de salida es el muelle principal?", mine: false, time: "08:30" },
      ],
    },
    {
      id: "c2",
      user: "Cliente interesado",
      service: "Pesca deportiva",
      lastMessage: "Quiero confirmar disponibilidad para 4 personas.",
      status: "Consulta activa",
      time: "12:10",
      messages: [
        { text: "Hola, quiero confirmar disponibilidad para 4 personas.", mine: false, time: "12:10" },
        { text: "Tenemos horarios por la mañana y por la tarde.", mine: true, time: "12:12" },
      ],
    },
  ];
}

function seedReviews() {
  return [
    { id: "rv1", service: "Embarcación aceptada", comment: "Muy buen servicio y puntualidad.", rating: "5.0", replyStatus: "Sin responder", reply: "", reported: false },
    { id: "rv2", service: "Restaurante aceptado", comment: "Buena atención y menú claro.", rating: "4.5", replyStatus: "Respondida", reply: "Gracias por tu visita. Seguimos mejorando el servicio.", reported: false },
  ];
}

function seedPromos() {
  return [{ id: "pr1", title: "Descuento registrado · Embarcación aceptada", discount: "10%", conditions: "Válido de lunes a jueves con anticipo confirmado.", active: true }];
}

function defaultServiceAvailability() {
  const result = {};
  services.forEach((service) => {
    result[service.id] = {
      days: ["Lun", "Mié", "Vie", "Sáb"],
      slots: [
        { start: "08:00", end: "10:00" },
        { start: "12:00", end: "14:00" },
      ],
    };
  });
  return result;
}

function defaultState() {
  return {
    selectedServices: services.map((service) => service.id),
    records: seedRecords(),
    calendarState: {},
    serviceAvailability: defaultServiceAvailability(),
    settings: {
      themeMode: "system",
      accentColor: COLORS.ocean,
      confirmBeforeDelete: true,
      notifications: true,
      reservationAlerts: true,
      paymentAlerts: true,
      chatAlerts: true,
      hideSensitiveInfo: false,
      twoStepVerification: false,
      loginAlerts: true,
      biometricAccess: false,
      protectCriticalActions: true,
      hideFinancialData: false,
      showPhoneToUsers: true,
      showExactLocation: true,
      allowUserMessages: true,
      showBusinessStats: false,
      allowReviewReplies: true,
    },
    reservations: seedReservations(),
    serviceReservations: {},
    chats: seedChats(),
    reviews: seedReviews(),
    promos: seedPromos(),
    paymentConfig: {
      bank: "",
      clabe: "",
      instructions: "Enviar comprobante desde la reservación para validar el anticipo.",
    },
    supportDraft: { category: "Error en la aplicación", priority: "Media", subject: "", message: "" },
    supportTickets: [],
  };
}

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      settings: { ...base.settings, ...(saved.settings || {}) },
      records: { ...base.records, ...(saved.records || {}) },
      serviceAvailability: { ...base.serviceAvailability, ...(saved.serviceAvailability || {}) },
      paymentConfig: { ...base.paymentConfig, ...(saved.paymentConfig || {}) },
      supportDraft: { ...base.supportDraft, ...(saved.supportDraft || {}) },
    };
  } catch {
    return base;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentRoute() {
  return routeStack[routeStack.length - 1];
}

function navigate(page, params = {}, options = {}) {
  closeDrawer();
  closeModal(false);
  if (options.root) {
    routeStack = [{ page, params }];
  } else {
    routeStack.push({ page, params });
  }
  render();
}

function goRoot(page, params = {}) {
  draftForm = null;
  navigate(page, params, { root: true });
}

function goBack() {
  closeModal(false);
  if (routeStack.length > 1) {
    routeStack.pop();
    render();
  } else {
    goRoot("dashboard");
  }
}

function titleOf(route = currentRoute()) {
  const { page, params } = route;
  const labels = {
    dashboard: "Panel del proveedor",
    config: "Configurar servicios",
    verification: "Verificación",
    reservations: "Reservaciones",
    calendar: "Calendario",
    payments: "Pagos",
    chat: "Chat interno",
    reviews: "Reseñas",
    promos: "Promociones",
    settings: "Ajustes",
    support: "Soporte",
    security: "Seguridad de cuenta",
    privacy: "Privacidad del panel",
    serviceForm: params.recordId ? "Modificar información" : "Añadir servicio",
    routeManager: params.serviceId ? optionManagerTitleFor(serviceById(params.serviceId)) : "Opciones y precios",
    catalogManager: params.serviceId ? catalogTitleFor(serviceById(params.serviceId)) : "Catálogo",
    galleryManager: "Galería",
    serviceReservations: params.serviceId ? reservationTitleFor(serviceById(params.serviceId)) : "Reservas",
    chatDetail: "Conversación",
    serviceAdmin: params.recordId ? recordById(params.serviceId, params.recordId)?.title || "Administrar" : "Administrar",
  };
  const service = serviceById(page);
  return service ? service.name : labels[page] || "Costa Inteligente";
}

function bottomIndexFor(page) {
  if (page === "dashboard") return "dashboard";
  if (["config", "boat", "guide", "sport", "rental", "restaurant", "store", "fishMarket", "transport", "serviceForm", "serviceAdmin", "routeManager", "catalogManager", "galleryManager", "serviceReservations"].includes(page)) return "config";
  if (page === "reservations") return "reservations";
  if (page === "calendar") return "calendar";
  return "settings";
}

function applyTheme() {
  const mode = state.settings.themeMode;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = mode === "dark" || (mode === "system" && prefersDark) ? "dark" : "light";
  document.documentElement.style.setProperty("--accent", state.settings.accentColor);
  document.documentElement.style.setProperty("--accent-rgb", COLOR_RGB[state.settings.accentColor] || COLOR_RGB[COLORS.ocean]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", state.settings.accentColor);
}

function render() {
  applyTheme();
  const route = currentRoute();
  $("#appTitle").textContent = titleOf(route);
  const menuButton = $("#menuButton");
  menuButton.dataset.action = routeStack.length > 1 ? "back" : "drawer";
  menuButton.innerHTML = `<span class="icon">${routeStack.length > 1 ? "‹" : "☰"}</span>`;
  menuButton.setAttribute("aria-label", routeStack.length > 1 ? "Regresar" : "Abrir menu");
  renderDrawer();
  renderBottomNav();
  $("#app").innerHTML = renderScreen(route);
  upgradeIcons(document);
  updateConnectivity();
  restoreTransientFocus();
  $("#app").scrollTop = 0;
  persist();
}

function restoreTransientFocus() {
  const focus = transient.focusSearch;
  if (!focus) return;
  const input = document.querySelector(focus.selector);
  if (input) {
    input.focus({ preventScroll: true });
    const end = input.value.length;
    input.setSelectionRange?.(end, end);
  }
  transient.focusSearch = null;
}

function renderDrawer() {
  const enabledServices = services.filter((service) => state.selectedServices.includes(service.id));
  const section = (label) => `<div class="drawer-label">${esc(label)}</div>`;
  const item = (icon, label, page) => `
    <button type="button" class="drawer-item ${currentRoute().page === page ? "active" : ""}" data-go="${esc(page)}">
      <span class="icon">${esc(icon)}</span><span>${esc(label)}</span>
    </button>
  `;

  $("#drawerNav").innerHTML = [
    item("▦", "Panel principal", "dashboard"),
    item("◆", "Configurar servicios", "config"),
    item("✓", "Verificación", "verification"),
    section("Mis servicios aceptados"),
    ...enabledServices.map((service) => item(service.icon, service.name, service.page)),
    section("Operación"),
    item("✓", "Reservaciones", "reservations"),
    item("□", "Calendario", "calendar"),
    item("$", "Pagos", "payments"),
    item("✉", "Chat interno", "chat"),
    item("★", "Reseñas", "reviews"),
    item("%", "Promociones", "promos"),
    item("⚙", "Ajustes", "settings"),
    item("?", "Soporte", "support"),
  ].join("");
}

function renderBottomNav() {
  const active = bottomIndexFor(currentRoute().page);
  $$("#bottomNav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.go === active);
  });
}

function $$(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function renderScreen(route) {
  const { page, params } = route;
  if (page === "dashboard") return screenWrap(screenDashboard());
  if (page === "config") return screenWrap(screenConfig());
  if (page === "verification") return screenWrap(screenVerification());
  if (page === "reservations") return screenWrap(screenReservations());
  if (page === "calendar") return screenWrap(screenCalendar());
  if (page === "payments") return screenWrap(screenPayments());
  if (page === "chat") return screenWrap(screenChatList());
  if (page === "reviews") return screenWrap(screenReviews());
  if (page === "promos") return screenWrap(screenPromotions());
  if (page === "settings") return screenWrap(screenSettings());
  if (page === "support") return screenWrap(screenSupport());
  if (page === "security") return screenWrap(screenSecurity());
  if (page === "privacy") return screenWrap(screenPrivacy());
  if (page === "serviceForm") return screenWrap(screenServiceForm(params.serviceId, params.recordId));
  if (page === "serviceAdmin") return screenWrap(screenServiceAdmin(params.serviceId, params.recordId));
  if (page === "routeManager") return screenWrap(screenRouteManager(params.serviceId, params.recordId));
  if (page === "catalogManager") return screenWrap(screenCatalogManager(params.serviceId, params.recordId));
  if (page === "galleryManager") return screenWrap(screenGalleryManager(params.serviceId, params.recordId));
  if (page === "serviceReservations") return screenWrap(screenServiceReservations(params.serviceId, params.recordId));
  if (page === "chatDetail") return screenWrap(screenChatDetail(params.chatId));
  const service = serviceById(page);
  if (service) return screenWrap(screenServiceRegistry(service.id));
  return screenWrap(emptyState("?", "Pantalla no disponible", "La sección solicitada no existe.", "Volver al inicio", "dashboard"));
}

function screenWrap(html) {
  return `<section class="screen">${html}</section>`;
}

function avatar(icon, color = state.settings.accentColor, extra = "") {
  return `<div class="avatar ${extra}" style="${colorVars(color)}"><span class="icon">${esc(icon)}</span></div>`;
}

function headerCard(title, subtitle, icon, color = state.settings.accentColor) {
  return `
    <div class="header-card" style="${colorVars(color)}">
      ${avatar(icon, color)}
      <div>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle)}</p>
      </div>
    </div>
  `;
}

function sectionTitle(title, subtitle = "") {
  return `<div class="section-title"><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>`;
}

function sectionHeader(title, subtitle, actionLabel, action, icon = "+", color = state.settings.accentColor) {
  return `
    <div class="section-header" style="${colorVars(color)}">
      ${sectionTitle(title, subtitle)}
      ${actionLabel ? `<button type="button" class="text-action" ${action}><span class="icon">${esc(icon)}</span>${esc(actionLabel)}</button>` : ""}
    </div>
  `;
}

function card(content, className = "") {
  return `<div class="card ${className}">${content}</div>`;
}

function infoBox(text) {
  return card(`<div class="info-box"><span class="icon" style="color:var(--accent)">i</span><p>${esc(text)}</p></div>`);
}

function pill(status) {
  const text = String(status || "").toLowerCase();
  let color = COLORS.ocean;
  const rating = Number.parseFloat(text);
  if (!Number.isNaN(rating)) color = rating >= 4.5 ? COLORS.yellow : rating >= 3.5 ? COLORS.green : rating >= 2.5 ? COLORS.orange : COLORS.red;
  else if (/(verificado|aceptado|aprobado|activo|confirmad|completad|pagado|respondida|foto recibida|foto cargada|visible|principal|listo)/.test(text)) color = COLORS.green;
  else if (/(pendiente|solicitud|solicitad|sin responder|espera|revisión|revision|obligatorio|comprobante)/.test(text)) color = COLORS.orange;
  else if (/(no disponible|pausad|bloquead|rechaz|cancel|error|conflicto|report|vencid)/.test(text)) color = COLORS.red;
  else if (/(guardado|programad|configurad)/.test(text)) color = COLORS.blue;
  else if (/(promoción|promocion|descuento|destacado)/.test(text)) color = COLORS.purple;
  return `<span class="pill" style="--pill-color:${color}">${esc(status)}</span>`;
}

function infoChip(icon, text) {
  return `<span class="chip"><span class="icon">${esc(icon)}</span>${esc(text)}</span>`;
}

function emptyState(icon, title, message, button, pageOrAction) {
  const attr = pageOrAction?.startsWith?.("data-") ? pageOrAction : `data-go="${esc(pageOrAction || "dashboard")}"`;
  return card(`
    <div class="empty-state">
      ${avatar(icon)}
      <h3>${esc(title)}</h3>
      <p class="muted">${esc(message)}</p>
      <button type="button" class="primary" ${attr}><span class="icon">+</span>${esc(button)}</button>
    </div>
  `);
}

function metricCard(title, value, subtitle, icon, color) {
  return `
    <div class="metric-card" style="${colorVars(color)}">
      ${avatar(icon, color, "round")}
      <div>
        <strong>${esc(value)}</strong>
        <h3>${esc(title)}</h3>
        <span>${esc(subtitle)}</span>
      </div>
    </div>
  `;
}

function operationCard(title, subtitle, icon, color, attrs) {
  return `
    <button type="button" class="operation-card" style="${colorVars(color)}" ${attrs}>
      ${avatar(icon, color, "round")}
      <div>
        <h3>${esc(title)}</h3>
        <p>${esc(subtitle)}</p>
      </div>
    </button>
  `;
}

function chartBar(label, value, maxValue, color) {
  const width = Math.max(4, maxValue <= 0 ? 4 : Math.round((value / maxValue) * 100));
  return `
    <div class="chart-row">
      <div class="chart-label"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="--bar:${color};width:${width}%"></div></div>
    </div>
  `;
}

function screenDashboard() {
  const enabledServices = services.filter((service) => state.selectedServices.includes(service.id));
  const allRecords = Object.values(state.records).flat();
  const totalRecords = allRecords.length;
  const available = allRecords.filter((item) => item.isAvailable).length;
  const unavailable = totalRecords - available;
  const totalOptions = allRecords.reduce((total, item) => total + (serviceSupportsPricingOptions(serviceById(item.serviceId)) ? item.routeOptions.length : 0), 0);
  const totalCatalogItems = allRecords.reduce((total, item) => total + item.catalog.length, 0);
  const totalPhotos = allRecords.reduce((total, item) => total + item.gallery.length, 0);
  const counts = enabledServices.map((service) => ({ label: service.name, value: (state.records[service.id] || []).length, color: service.color }));
  const max = counts.reduce((value, item) => Math.max(value, item.value), 1);

  return `
    <div class="hero-panel">
      <span class="hero-tag"><span class="icon">▣</span>Panel profesional</span>
      <h2>Panel comercial</h2>
      <p>Administra servicios, horarios, precios, catálogos, reservaciones, pagos y comunicación desde una experiencia clara y centralizada.</p>
      <div class="hero-tag-row">
        <span class="hero-tag"><span class="icon">✓</span>Servicios verificados</span>
        <span class="hero-tag"><span class="icon">□</span>Operación diaria</span>
        <span class="hero-tag"><span class="icon">$</span>Control comercial</span>
      </div>
    </div>

    <div class="metric-grid">
      ${metricCard("Servicios", state.selectedServices.length, "Seleccionados", "◆", COLORS.ocean)}
      ${metricCard("Aceptados", totalRecords, "Registros activos", "✓", COLORS.green)}
      ${metricCard("Reservas", "3", "Actividad actual", "□", COLORS.blue)}
      ${metricCard("Pagos", "3", "Movimientos", "$", COLORS.orange)}
    </div>

    <div class="grid-auto" style="margin-top:16px">
      ${card(`${sectionTitle("Actividad por servicio", "Vista rápida de registros administrados.")}${counts.map((entry) => chartBar(entry.label, entry.value, max, entry.color)).join("")}`)}
      ${card(`
        ${sectionTitle("Indicadores comerciales", "Disponibilidad, opciones comerciales y galería.")}
        ${miniStat("✓", "Disponibles", available, COLORS.green)}
        ${miniStat("×", "No disponibles", unavailable, COLORS.red)}
        ${miniStat("⇄", "Rutas / paquetes", totalOptions, COLORS.blue)}
        ${miniStat("▣", "Productos / menú", totalCatalogItems, COLORS.purple)}
        ${miniStat("▧", "Fotos publicadas", totalPhotos, COLORS.ocean)}
      `)}
    </div>

    <div style="margin-top:16px">
      ${sectionHeader("Servicios para administrar", "Cada servicio cuenta con registros aceptados para operar pantallas.", "Configurar", 'data-go="config"', "◆")}
      ${enabledServices.map((service) => serviceSummaryCard(service)).join("")}
    </div>

    <div style="margin-top:16px">
      ${sectionTitle("Centro de operación", "Herramientas preparadas para administrar actividad diaria.")}
      <div class="operation-grid">
        ${operationCard("Reservaciones", "Solicitudes, cupos y confirmaciones.", "✓", COLORS.green, 'data-go="reservations"')}
        ${operationCard("Calendario", "Disponibilidad, bloqueos y temporadas.", "□", COLORS.blue, 'data-go="calendar"')}
        ${operationCard("Pagos", "Cobros, comprobantes e historial.", "$", COLORS.orange, 'data-go="payments"')}
        ${operationCard("Mensajes", "Comunicación con usuarios.", "✉", COLORS.ocean, 'data-go="chat"')}
      </div>
    </div>
  `;
}

function miniStat(icon, label, value, color) {
  return `
    <div class="list-item" style="${colorVars(color)};margin-bottom:10px">
      ${avatar(icon, color, "round")}
      <strong>${esc(label)}</strong>
      <strong style="font-size:18px">${esc(value)}</strong>
    </div>
  `;
}

function serviceSummaryCard(service) {
  const count = (state.records[service.id] || []).length;
  return card(`
    <button type="button" class="list-item" data-go="${esc(service.page)}" style="${colorVars(service.color)}">
      ${avatar(service.icon, service.color, "large")}
      <div>
        <h3>${esc(service.name)}</h3>
        <p>${count === 0 ? "Sin registros" : `${count} registro aceptado activo`}</p>
      </div>
      <span class="icon">›</span>
    </button>
  `);
}

function screenConfig() {
  return `
    ${headerCard("Configurar servicios", "Activa o desactiva las categorías que administra el proveedor.", "◆")}
    ${services
      .map((service) => {
        const active = state.selectedServices.includes(service.id);
        return card(`
          <button type="button" class="list-item" data-action="toggle-service" data-service-id="${esc(service.id)}" style="${colorVars(service.color)}">
            ${avatar(service.icon, service.color)}
            <div>
              <h3>${esc(service.name)}</h3>
              <p>${esc(service.desc)}</p>
            </div>
            <span class="icon" style="color:${active ? service.color : "var(--muted)"}">${active ? "●" : "○"}</span>
          </button>
        `);
      })
      .join("")}
    <button type="button" class="primary full" data-action="save-config"><span class="icon">✓</span>Guardar configuración</button>
  `;
}

function screenServiceRegistry(serviceId) {
  const service = serviceById(serviceId);
  const allRecords = state.records[service.id] || [];
  const query = transient.serviceSearch?.[service.id] || "";
  const normalizedQuery = query.trim().toLowerCase();
  const records = normalizedQuery
    ? allRecords.filter((record) =>
        [record.title, record.subtitle, record.location, record.serviceType, record.publicContact]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : allRecords;
  const listTitle = {
    boat: "Embarcaciones registradas",
    rental: "Embarcaciones en renta",
    restaurant: "Restaurantes registrados",
    store: "Tiendas registradas",
    fishMarket: "Pescaderías registradas",
    transport: "Servicios de transporte",
    sport: "Paquetes de pesca deportiva",
    guide: "Servicios de guía",
  }[service.id] || "Registros";
  return `
    ${headerCard(service.name, service.desc, service.icon, service.color)}
    ${sectionHeader(listTitle, "Administra registros aceptados, pendientes o guardados.", addLabelForService(service), `data-action="open-form" data-service-id="${esc(service.id)}"`, "+", service.color)}
    ${searchBox("Buscar registros por nombre, tipo o ubicación", query, "service-search", service.id)}
    ${
      records.length
        ? records.map((record) => businessRecordCard(service, record)).join("")
        : allRecords.length
          ? searchEmptyState("Sin resultados", "No hay registros que coincidan con tu búsqueda.", `data-action="clear-service-search" data-service-id="${esc(service.id)}"`)
          : emptyState(service.icon, "Sin registros", "Agrega un registro para capturar información del servicio.", addLabelForService(service), `data-action="open-form" data-service-id="${esc(service.id)}"`)
    }
    ${infoBox(licenseNote(service))}
  `;
}

function searchBox(placeholder, value, action, context = "") {
  return `
    <div class="search-box">
      <span class="icon">search</span>
      <input type="search" value="${esc(value)}" placeholder="${esc(placeholder)}" data-action="${esc(action)}" data-context="${esc(context)}" />
    </div>
  `;
}

function searchEmptyState(title, message, actionAttr) {
  return card(`
    <div class="state-panel">
      ${avatar("search", state.settings.accentColor, "round")}
      <h3>${esc(title)}</h3>
      <p>${esc(message)}</p>
      <button type="button" class="secondary" ${actionAttr}><span class="icon">refresh</span>Limpiar búsqueda</button>
    </div>
  `);
}

function addLabelForService(service) {
  const labels = {
    boat: "Añadir embarcación",
    rental: "Añadir embarcación",
    restaurant: "Añadir restaurante",
    store: "Añadir tienda",
    fishMarket: "Añadir pescadería",
    transport: "Añadir transporte",
    sport: "Añadir paquete",
    guide: "Añadir guía",
  };
  return labels[service.id] || "Añadir";
}

function licenseNote(service) {
  if (service.requiresNavigationLicense) return "Servicios con embarcación: certificado de seguridad, certificado de matrícula de Capitanía, fotos de la embarcación y permiso CONAPESCA si el servicio es de pesca.";
  if (service.requiresBusinessLicense) return "Negocios físicos: licencia de funcionamiento, fotografías del local, ubicación real y evidencia comercial enviada en imagen.";
  return "Este servicio requiere datos del responsable, ubicación real, fotografías y evidencia operativa.";
}

function businessRecordCard(service, record) {
  const status = record.isAvailable ? recordStatusLabels[record.status] : "No disponible";
  return card(`
    <button type="button" class="record-card" data-action="open-admin" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" style="${colorVars(service.color)}">
      ${avatar(service.icon, service.color, "large")}
      <div>
        <h3>${esc(record.title)}</h3>
        <p>${esc(record.subtitle)} · ${record.isAvailable ? "Disponible" : "No disponible"}</p>
      </div>
      ${pill(status)}
    </button>
    <div class="divider"></div>
    <div class="inline-actions">
      <button type="button" class="secondary" data-action="open-form" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"><span class="icon">✎</span>Modificar</button>
      <button type="button" class="secondary" data-action="delete-record" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"><span class="icon">×</span>Eliminar</button>
      <button type="button" class="primary" style="${colorVars(service.color)}" data-action="open-admin" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"><span class="icon">▦</span>Administrar</button>
    </div>
  `);
}

function screenServiceAdmin(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return emptyState(service.icon, "Registro no encontrado", "Este registro ya no está disponible.", "Volver", service.page);
  return `
    ${headerCard(record.title, `${record.serviceType} · ${recordStatusLabels[record.status]}`, service.icon, service.color)}
    ${recordInfoPanel(service, record)}
    ${descriptionPanel(service, record)}
    ${userListingPreview(service, record)}
    ${completenessPanel(service, record)}
    ${documentsAdminPanel(service, record)}
    ${serviceNeedsFishingConfig(service) ? fishingAdminPanel(record) : ""}
    ${sectionHeader("Administración del servicio", "Modifica información variable después de pasar revisión.", "Modificar", `data-action="open-form" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`, "✎", service.color)}
    <div class="operation-grid">
      ${managementCard("Información", "Datos principales y descripción pública", "✎", service.color, `data-action="open-form" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard(scheduleTitleFor(service), scheduleSubtitleFor(service), "□", COLORS.green, `data-action="edit-schedules" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${serviceSupportsPricingOptions(service) ? managementCard(optionManagerTitleFor(service), optionManagerSubtitleFor(service), "⇄", COLORS.blue, `data-action="open-route-manager" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`) : ""}
      ${service.hasCatalog ? managementCard(catalogTitleFor(service), catalogSubtitleFor(service), "▣", COLORS.purple, `data-action="open-catalog-manager" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`) : ""}
      ${managementCard("Disponibilidad", "Marca días no disponibles", "□", record.isAvailable ? COLORS.green : COLORS.red, `data-action="edit-availability" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard("Galería", "Subir, borrar y destacar fotos", "▧", COLORS.ocean, `data-action="open-gallery-manager" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard("Publicación en usuarios", "Foto principal, contacto y visibilidad pública", "◎", COLORS.purple, `data-action="open-form" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard("Documentos", "Requisitos y evidencias en foto", "✓", COLORS.orange, `data-action="open-form" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard(reservationTitleFor(service), reservationSubtitleFor(service), "✓", COLORS.green, `data-action="open-service-reservations" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`)}
      ${managementCard("Reseñas", "Opiniones, promedio y confianza", "★", COLORS.yellow, 'data-go="reviews"')}
    </div>
    ${serviceSupportsPricingOptions(service) ? routeOptionsPreview(service, record) : ""}
    ${schedulePreview(service, record)}
    ${availabilityPreview(record)}
    ${galleryPreview(record)}
    ${reservationPreview(service, record)}
    ${service.hasCatalog ? catalogPreview(service, record) : ""}
    ${card(`<div class="danger-card"><span class="icon" style="color:${COLORS.red}">!</span><p>Eliminar este registro del panel.</p><button type="button" class="secondary" data-action="delete-record" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"><span class="icon">×</span>Eliminar</button></div>`)}
  `;
}

function recordInfoPanel(service, record) {
  const optionCount = service.hasCatalog ? record.catalog.length : record.routeOptions.length;
  const optionLabel = service.hasCatalog ? catalogTitleFor(service).toLowerCase() : optionManagerTitleFor(service).toLowerCase();
  return card(`
    <div class="chip-row">
      ${infoChip("⌖", record.location)}
      ${infoChip("□", `${record.schedules.length} horarios`)}
      ${infoChip(record.isAvailable ? "✓" : "×", record.isAvailable ? "Disponible" : "Servicio pausado")}
      ${infoChip("□", `${record.unavailableDateKeys.length} días no disponibles`)}
      ${infoChip(service.hasCatalog ? "▣" : "⇄", `${optionCount} ${optionLabel}`)}
      ${record.capacity > 0 ? infoChip("◎", `${record.capacity} personas`) : ""}
      ${record.experienceYears > 0 ? infoChip("★", `${record.experienceYears} años de experiencia`) : ""}
      ${record.meetingPoint ? infoChip("⌖", record.meetingPoint) : ""}
      ${serviceRequiresCaptain(service) && record.captainName ? infoChip("◉", `Capitán: ${record.captainName}`) : ""}
      ${serviceNeedsFishingConfig(service) ? infoChip("◍", fishingTypesText(record)) : ""}
      ${serviceNeedsFishingConfig(service) && record.targetSpecies.length ? infoChip("✓", `${record.targetSpecies.length} especies activas`) : ""}
      ${infoChip(recordCanAppearInUsers(record) ? "◎" : "◌", recordCanAppearInUsers(record) ? "Visible en usuarios" : "No visible en usuarios")}
      ${infoChip("▧", `${record.gallery.length} fotos`)}
    </div>
  `);
}

function descriptionPanel(service, record) {
  const description = record.subtitle || service.desc;
  return card(`
    <div class="list-item" style="${colorVars(service.color)}">
      ${avatar("≡", service.color, "round")}
      <div><h3>Descripción pública</h3><p>${esc(description)}</p></div>
    </div>
  `);
}

function userListingPreview(service, record) {
  const ready = recordCanAppearInUsers(record);
  return card(`
    ${sectionHeader("Vista para usuarios", "El servicio se muestra al público solo si está aceptado, visible y con fotografía principal.", ready ? "Publicado" : "Revisar", `data-action="listing-check" data-ready="${ready}"`, ready ? "◎" : "◌", ready ? COLORS.green : COLORS.orange)}
    <div class="list-item" style="${colorVars(service.color)};align-items:start">
      <div class="image-box" style="width:88px;height:88px;min-height:88px">
        ${record.servicePhotoUrl ? `<img alt="" src="${esc(record.servicePhotoUrl)}" />` : `<span class="icon" style="font-size:34px">▧</span>`}
      </div>
      <div>
        <h3>${esc(record.title)}</h3>
        <p>${esc(record.subtitle)}</p>
        <div class="chip-row" style="margin-top:8px">
          ${pill(recordStatusLabels[record.status])}
          ${infoChip("⌖", record.location)}
          ${record.publicContact ? infoChip("☎", record.publicContact) : ""}
          ${record.capacity > 0 ? infoChip("◎", `${record.capacity} personas`) : ""}
          ${record.tags.length ? infoChip("%", tagsText(record)) : ""}
          ${serviceNeedsFishingConfig(service) ? infoChip("◍", fishingTypesText(record)) : ""}
        </div>
      </div>
    </div>
  `);
}

function completenessPanel(service, record) {
  const checks = [
    ["Fotografía principal", Boolean(record.servicePhotoUrl), "▧"],
    ["Documentos obligatorios", documentRequirementsFor(service).filter((doc) => doc.isRequired).every((doc) => record.uploadedDocumentPhotos.includes(doc.title)), "✓"],
    ["Horarios configurados", Boolean(record.schedules.length), "□"],
    ["Visible para usuarios", Boolean(record.visibleToUsers), "◎"],
    ["Servicio aceptado", record.status === "verified", "✓"],
  ];
  if (record.capacity > 0 || serviceSupportsPricingOptions(service)) checks.push(["Capacidad registrada", record.capacity > 0 || record.routeOptions.some((item) => item.capacity > 0), "◎"]);
  if (serviceRequiresCaptain(service)) checks.push(["Capitán registrado", Boolean(record.captainName), "◉"]);
  if (serviceSupportsPricingOptions(service)) checks.push(["Recorridos / tarifas", Boolean(record.routeOptions.length), "⇄"]);
  if (service.hasCatalog) checks.push(["Catálogo / menú", Boolean(record.catalog.length), "▣"]);
  if (serviceNeedsFishingConfig(service)) checks.push(["Tipos de pesca", Boolean(record.fishingTypes.length), "◍"], ["Especies activas", Boolean(record.targetSpecies.length), "✓"]);
  const complete = checks.filter((item) => item[1]).length;
  return card(`
    ${sectionTitle("Estado funcional del servicio", "Elementos necesarios para operar y mostrarse correctamente en usuarios.")}
    <div class="bar-track" style="height:9px;margin-bottom:10px"><div class="bar-fill" style="width:${Math.round((complete / checks.length) * 100)}%"></div></div>
    <div class="chip-row">${checks.map(([title, ok, icon]) => infoChip(ok ? "✓" : "!", `${title}: ${ok ? "listo" : "pendiente"}`)).join("")}</div>
  `);
}

function documentsAdminPanel(service, record) {
  const docs = documentRequirementsFor(service);
  return card(`
    ${sectionHeader("Documentos y evidencias del servicio", "Cada documento se recibe como foto y queda disponible para revisión administrativa.", `${docs.length} requisitos`, `data-action="docs-ready"`, "✓", service.color)}
    ${docs
      .map(
        (doc) => `
          <div class="list-item" style="${colorVars(service.color)};align-items:start;margin-bottom:10px">
            ${avatar(doc.icon, service.color, "round")}
            <div><h3>${esc(doc.title)}</h3><p>${esc(doc.subtitle)}</p></div>
            ${pill(record.uploadedDocumentPhotos.includes(doc.title) ? "Foto recibida" : doc.isRequired ? "Pendiente" : "Opcional")}
          </div>
        `,
      )
      .join("")}
  `);
}

function fishingAdminPanel(record) {
  return card(`
    ${sectionTitle("Pesca publicada", "Tipos de pesca seleccionados y especies que este proveedor sí captura.")}
    <div class="chip-row">${record.fishingTypes.length ? record.fishingTypes.map((type) => infoChip("◍", type)).join("") : infoChip("!", "Sin tipos registrados")}</div>
    <div class="chip-row" style="margin-top:10px">${record.targetSpecies.length ? record.targetSpecies.map((specie) => infoChip("✓", specie)).join("") : infoChip("!", "Sin especies activas")}</div>
  `);
}

function managementCard(title, subtitle, icon, color, attrs) {
  return `
    <button type="button" class="management-card" style="${colorVars(color)}" ${attrs}>
      ${avatar(icon, color, "round")}
      <div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>
    </button>
  `;
}

function routeOptionsPreview(service, record) {
  return card(`
    ${sectionHeader(optionManagerTitleFor(service), optionManagerSubtitleFor(service), "Administrar", `data-action="open-route-manager" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`, "⇄", COLORS.blue)}
    ${
      record.routeOptions.length
        ? record.routeOptions
            .slice(0, 3)
            .map(
              (item) => `
                <div class="list-item" style="margin-bottom:8px">
                  ${avatar(item.isAvailable ? "⇄" : "×", item.isAvailable ? COLORS.blue : COLORS.red, "round")}
                  <div><h3>${esc(item.name)}</h3><p>${esc(routeDurationText(item))} · ${esc(item.capacity)} personas · ${item.isAvailable ? "Disponible" : "No disponible"}</p></div>
                  <strong>${esc(routePriceText(item))}</strong>
                </div>
              `,
            )
            .join("")
        : `<p class="muted">${esc(optionEmptyTextFor(service))}</p>`
    }
  `);
}

function schedulePreview(service, record) {
  return card(`
    ${sectionHeader(scheduleTitleFor(service), scheduleSubtitleFor(service), "Editar", `data-action="edit-schedules" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`, "□")}
    ${record.schedules.length ? `<div class="chip-row">${record.schedules.map((slot) => infoChip("□", `${slot.start} - ${slot.end}`)).join("")}</div>` : `<p class="muted">Sin horarios registrados.</p>`}
  `);
}

function availabilityPreview(record) {
  return card(`
    ${sectionHeader("Disponibilidad del servicio", "Marca en calendario los días en los que no estará disponible.", "Editar", `data-action="edit-availability" data-service-id="${esc(record.serviceId)}" data-record-id="${esc(record.id)}"`, "□", record.isAvailable ? COLORS.green : COLORS.red)}
    <div class="chip-row">
      ${infoChip(record.isAvailable ? "✓" : "×", record.isAvailable ? "Disponible para reservar" : "Servicio pausado")}
      ${infoChip("□", `${record.unavailableDateKeys.length} días marcados`)}
      ${record.availabilityNote ? infoChip("≡", record.availabilityNote) : ""}
    </div>
  `);
}

function galleryPreview(record) {
  return card(`
    ${sectionHeader("Galería del servicio", "Fotos visibles para usuarios. Se pueden agregar, borrar y destacar.", "Administrar", `data-action="open-gallery-manager" data-service-id="${esc(record.serviceId)}" data-record-id="${esc(record.id)}"`, "▧", COLORS.ocean)}
    ${
      record.gallery.length
        ? `<div class="horizontal-scroll">${record.gallery.map((item) => `<div class="photo-tile" style="${colorVars(item.color || COLORS.ocean)}"><span class="icon" style="font-size:24px;color:var(--accent)">${esc(item.icon || "▧")}</span><strong>${esc(item.title)}</strong><span>${item.featured ? "Principal" : "Galería"}</span></div>`).join("")}</div>`
        : `<p class="muted">Sin fotos agregadas.</p>`
    }
  `);
}

function reservationPreview(service, record) {
  const availableOptions = service.hasCatalog ? record.catalog.length : record.routeOptions.filter((item) => item.isAvailable).length;
  return card(`
    ${sectionHeader(reservationTitleFor(service), reservationSubtitleFor(service), "Abrir", `data-action="open-service-reservations" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`, "✓", COLORS.green)}
    <div class="chip-row">
      ${infoChip(service.hasCatalog ? "▣" : "⇄", `${availableOptions} opciones disponibles`)}
      ${infoChip("□", `${record.schedules.length} horarios`)}
      ${infoChip(record.isAvailable ? "✓" : "×", record.isAvailable ? "Activo" : "Pausado")}
    </div>
  `);
}

function catalogPreview(service, record) {
  const emptyText = { restaurant: "Sin platillos registrados.", store: "Sin productos de pesca registrados.", fishMarket: "Sin productos frescos registrados." }[service.id] || "Sin productos registrados.";
  return card(`
    ${sectionHeader(catalogTitleFor(service), catalogSubtitleFor(service), "Administrar", `data-action="open-catalog-manager" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}"`, "▣", COLORS.purple)}
    ${
      record.catalog.length
        ? record.catalog
            .slice(0, 3)
            .map(
              (item) => `
                <div class="list-item" style="${colorVars(service.color)};align-items:start;margin-bottom:10px">
                  ${catalogThumb(service, item, 58)}
                  <div><h3>${esc(item.name)}</h3><p>${esc(item.description || "Sin descripción registrada.")}</p><p style="color:${item.imageUrl ? COLORS.green : "var(--muted)"};font-size:12px;font-weight:800">${item.imageUrl ? "Imagen agregada" : "Imagen opcional pendiente"}</p></div>
                  <strong>${Number(item.price || 0).toFixed(0)} ${currencyLabel(item.currency)}</strong>
                </div>
              `,
            )
            .join("")
        : `<p class="muted">${esc(emptyText)}</p>`
    }
  `);
}

function catalogThumb(service, item, size = 64) {
  const style = `style="width:${size}px;height:${size}px;min-height:${size}px;${colorVars(service.color)}"`;
  return `<div class="image-box" ${style}>${item.imageUrl ? `<img alt="" src="${esc(item.imageUrl)}" />` : `<span><span class="icon">▧</span><br><small>Imagen</small></span>`}</div>`;
}

function screenVerification() {
  const steps = [
    ["Correo electrónico", "Confirmación de correo de la cuenta responsable.", "✉"],
    ["Número telefónico", "Confirmación por teléfono o WhatsApp para avisos de reservas.", "☎"],
    ["Identificación oficial", "INE o identificación del responsable legal del servicio.", "◉"],
    ["Capitanía de Puerto", "Certificado de seguridad y certificado de matrícula cuando exista embarcación.", "⛵"],
    ["CONAPESCA", "Permiso de pesca vigente para servicios que ofrecen captura o pesca deportivo-recreativa.", "◍"],
    ["Turismo náutico y seguros", "Permiso de turismo náutico y pólizas para pasajeros, tripulación y terceros.", "≋"],
    ["Licencia de funcionamiento", "Licencia del negocio para restaurante, tienda de pesca o pescadería.", "▣"],
    ["Ubicación real", "Ubicación del negocio, muelle, punto de salida o punto de reunión.", "⌖"],
  ];
  return `
    ${headerCard("Verificación del proveedor", "Revisión previa para publicar embarcaciones, pesca, turismo náutico y negocios físicos.", "✓")}
    ${steps.map(([title, subtitle, icon]) => card(`<div class="list-item">${avatar(icon, COLORS.yellow, "round")}<div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>${pill("Pendiente")}</div>`)).join("")}
    ${conapescaBox()}
    ${infoBox("Los documentos deben subirse en foto. Administración debe validar que el documento corresponda al proveedor, servicio, embarcación o negocio registrado antes de publicarlo al usuario.")}
  `;
}

function conapescaBox() {
  return card(`
    <div class="list-item" style="${colorVars(COLORS.ocean)};align-items:start">
      ${avatar("§", COLORS.ocean, "round")}
      <div><h3>Puntos CONAPESCA para revisión</h3>${conapescaGuidance.map((item) => `<p style="margin-top:6px">✓ ${esc(item)}</p>`).join("")}</div>
    </div>
  `);
}

function screenReservations() {
  const tab = transient.reservationTab || 0;
  const query = transient.reservationSearch || "";
  const baseFiltered = state.reservations.filter((item) => (tab === 0 ? item.status === "Solicitud" : tab === 1 ? item.status === "Confirmada" : ["Finalizada", "Completada", "Rechazada"].includes(item.status)));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? baseFiltered.filter((item) => [item.user, item.service, item.requestedOption, item.date, item.paymentStatus].join(" ").toLowerCase().includes(normalizedQuery))
    : baseFiltered;
  return `
    ${headerCard("Reservaciones", "Solicitudes con servicio, usuario, fecha, hora, personas, monto y acciones de confirmación.", "✓", COLORS.green)}
    ${reservationStats(state.reservations)}
    ${segment(["Solicitudes", "Confirmadas", "Historial"], tab, "reservation-tab")}
    ${searchBox("Buscar por usuario, servicio, fecha o pago", query, "reservation-search")}
    <div style="margin-top:14px">
      ${
        filtered.length
          ? filtered.map((item) => reservationCard(item, "global")).join("")
          : baseFiltered.length
            ? searchEmptyState("Sin resultados", "No hay reservaciones que coincidan con tu búsqueda.", 'data-action="clear-reservation-search"')
            : emptyState("□", "Sin reservaciones", "No hay registros en esta sección.", "Actualizar", 'data-action="refresh-reservations"')
      }
    </div>
  `;
}

function reservationStats(reservations, service = null) {
  const requested = reservations.filter((item) => item.status === "Solicitud").length;
  const confirmed = reservations.filter((item) => item.status === "Confirmada").length;
  const history = reservations.filter((item) => ["Finalizada", "Completada", "Rechazada"].includes(item.status)).length;
  const entries = [
    ["Solicitudes", requested, COLORS.orange],
    ["Confirmadas", confirmed, COLORS.green],
    ["Historial", history, COLORS.blue],
  ];
  const max = entries.reduce((value, item) => Math.max(value, item[1]), 1);
  return card(`${sectionTitle(service ? `Resumen de ${reservationTitleFor(service).toLowerCase()}` : "Resumen de reservaciones", "Gráfica rápida del estado de las solicitudes.")}${entries.map((entry) => chartBar(entry[0], entry[1], max, entry[2])).join("")}`);
}

function segment(labels, activeIndex, action) {
  return `<div class="segment">${labels.map((label, index) => `<button type="button" class="${index === activeIndex ? "active" : ""}" data-action="${esc(action)}" data-index="${index}">${esc(label)}</button>`).join("")}</div>`;
}

function participantStatusText(item) {
  return item.participantNames?.length >= item.people && item.people > 0 ? "Nombres completos" : `${item.participantNames?.length || 0}/${item.people} nombres capturados`;
}

function reservationCard(item, scope) {
  const attrs = `data-scope="${esc(scope)}" data-reservation-id="${esc(item.id)}"`;
  return card(`
    <div class="list-item">
      ${avatar("✓", COLORS.green, "round")}
      <div><h3>${esc(item.service)}</h3><p>${esc(item.user)} · ${esc(item.date)} · ${esc(item.hour)}</p></div>
      ${pill(item.status)}
    </div>
    <div class="divider"></div>
    <div class="chip-row">
      ${infoChip("◎", `${item.people} personas`)}
      ${infoChip("✓", participantStatusText(item))}
      ${infoChip("⇄", item.requestedOption)}
      ${infoChip("◉", item.captainName)}
      ${infoChip("$", item.amount)}
      ${infoChip("▤", item.paymentStatus)}
    </div>
    <div class="inline-actions" style="margin-top:10px">
      <button type="button" class="secondary" data-action="reservation-detail" ${attrs}><span class="icon">◎</span>Ver completo</button>
      ${item.status === "Solicitud" ? `<button type="button" class="primary" data-action="reservation-status" data-status="Confirmada" ${attrs}><span class="icon">✓</span>Aceptar</button><button type="button" class="secondary" data-action="reservation-status" data-status="Rechazada" ${attrs}><span class="icon">×</span>Rechazar</button>` : ""}
      ${item.status === "Confirmada" ? `<button type="button" class="primary" data-action="reservation-status" data-status="Finalizada" ${attrs}><span class="icon">✓</span>Finalizar recorrido</button>` : ""}
    </div>
  `);
}

function reservationList(scope) {
  return scope === "global" ? state.reservations : state.serviceReservations[scope] || [];
}

function updateReservationStatus(scope, reservationId, status) {
  const list = reservationList(scope);
  const item = list.find((entry) => entry.id === reservationId);
  if (!item) return;
  item.status = status;
  if (status === "Confirmada") item.acceptedAt = "Aceptada por el proveedor";
  if (status === "Finalizada") {
    item.completedAt = "Recorrido finalizado por el proveedor";
    item.finalizationNote = "Servicio cerrado: asistencia, horario y participantes revisados.";
  }
  persist();
  render();
}

function showReservationDetail(scope, reservationId) {
  const item = reservationList(scope).find((entry) => entry.id === reservationId);
  if (!item) return;
  const participants = item.participantNames?.length ? item.participantNames : Array.from({ length: item.people }, (_, index) => `Persona ${index + 1}: nombre pendiente`);
  openSheet(`
    <h2>${esc(item.service)}</h2>
    <p class="muted">Detalle completo de la solicitud recibida</p>
    <div style="margin-top:12px">
      ${detailRow("◎", "Solicitante", item.user)}
      ${detailRow("☎", "Teléfono", item.userPhone)}
      ${detailRow("✉", "Correo", item.userEmail)}
      ${detailRow("⇄", "Servicio solicitado", item.requestedOption)}
      ${detailRow("◉", "Capitán / responsable", item.captainName)}
      ${detailRow("□", "Fecha", item.date)}
      ${detailRow("□", "Hora", item.hour)}
      ${detailRow("⌖", "Punto de encuentro", item.meetingPoint)}
      ${detailRow("◎", "Total de personas", item.people)}
      ${card(`<div class="chip-row" style="margin-bottom:8px">${pill(participantStatusText(item))}</div><h3>Personas que estarán en el servicio</h3>${participants.map((name, index) => `<p class="muted">${index + 1}. ${esc(name)}</p>`).join("")}`)}
      ${detailRow("$", "Monto", item.amount)}
      ${detailRow("▤", "Estado de pago", item.paymentStatus)}
      ${detailRow("$", "Método de pago", item.paymentMethod)}
      ${detailRow("✉", "Comentario del usuario", item.comment)}
      ${detailRow("≡", "Mensaje de solicitud", item.message)}
      ${detailRow("□", "Recibida", item.createdAt)}
      ${item.acceptedAt ? detailRow("✓", "Aceptada", item.acceptedAt) : ""}
      ${item.completedAt ? detailRow("✓", "Finalizada", item.completedAt) : ""}
      ${item.finalizationNote ? detailRow("✓", "Cierre del recorrido", item.finalizationNote) : ""}
    </div>
    <div class="action-row" style="margin-top:14px">
      ${item.status === "Solicitud" ? `<button type="button" class="primary" data-action="reservation-status" data-status="Confirmada" data-scope="${esc(scope)}" data-reservation-id="${esc(item.id)}"><span class="icon">✓</span>Aceptar solicitud</button><button type="button" class="secondary" data-action="reservation-status" data-status="Rechazada" data-scope="${esc(scope)}" data-reservation-id="${esc(item.id)}"><span class="icon">×</span>Rechazar</button>` : ""}
      ${item.status === "Confirmada" ? `<button type="button" class="primary" data-action="reservation-status" data-status="Finalizada" data-scope="${esc(scope)}" data-reservation-id="${esc(item.id)}"><span class="icon">✓</span>Finalizar recorrido</button>` : ""}
    </div>
  `);
}

function detailRow(icon, label, value) {
  return `<div class="detail-row" style="grid-template-columns:24px 1fr;margin-bottom:8px"><span class="icon" style="color:var(--accent)">${esc(icon)}</span><p class="muted"><strong style="color:var(--text)">${esc(label)}: </strong>${esc(value)}</p></div>`;
}

function screenPayments() {
  const payments = [
    ["p1", "Reserva embarcación aceptada", "Usuario con solicitud", "4500 MXN", "Pendiente", "15/07/2026"],
    ["p2", "Paquete pesca deportiva", "Cliente interesado", "6500 MXN", "Pagado", "12/07/2026"],
    ["p3", "Guía de pesca", "Usuario anterior", "1200 MXN", "Comprobante", "10/07/2026"],
  ];
  return `
    ${headerCard("Pagos", "Resumen de cobros, pagos pendientes, comprobantes, historial y configuración de métodos de cobro.", "$", COLORS.orange)}
    <div class="grid-auto">
      ${metricCard("Pendientes", "1", "Por confirmar", "…", COLORS.orange)}
      ${metricCard("Pagados", "1", "Confirmados", "✓", COLORS.green)}
      ${metricCard("Comprobantes", "1", "Disponibles", "▤", COLORS.blue)}
    </div>
    <div style="margin-top:14px">
      ${sectionHeader("Movimientos", "Historial preparado para backend y pasarela de pago.", "Configurar cobro", 'data-action="payment-config"', "◆")}
      ${payments
        .map(
          (item) => card(`
            <div class="payment-row">
              ${avatar("$", COLORS.orange, "round")}
              <div><h3>${esc(item[1])}</h3><p>${esc(item[2])} · ${esc(item[5])}</p></div>
              <div style="text-align:right"><strong>${esc(item[3])}</strong><br>${pill(item[4])}</div>
            </div>
          `),
        )
        .join("")}
      ${infoBox("Para producción se debe conectar una pasarela como Mercado Pago o Stripe. No se deben guardar tarjetas directamente en la app.")}
    </div>
  `;
}

function showPaymentConfig() {
  openSheet(`
    <h2>Configurar cobro</h2>
    ${fieldHtml("payment-bank", "Banco o método de cobro", state.paymentConfig.bank)}
    ${fieldHtml("payment-clabe", "CLABE / cuenta / referencia", state.paymentConfig.clabe, "number")}
    ${fieldHtml("payment-instructions", "Instrucciones para el usuario", state.paymentConfig.instructions, "textarea")}
    <button type="button" class="primary full" data-action="save-payment-config"><span class="icon">✓</span>Guardar configuración</button>
  `);
}

function screenChatList() {
  const query = transient.chatSearch || "";
  const normalizedQuery = query.trim().toLowerCase();
  const chats = normalizedQuery
    ? state.chats.filter((chat) => [chat.user, chat.service, chat.lastMessage, chat.status].join(" ").toLowerCase().includes(normalizedQuery))
    : state.chats;
  return `
    ${headerCard("Chat interno", "Solo conversaciones relacionadas con usuarios que reservaron o quieren comunicarse por un servicio.", "✉", COLORS.ocean)}
    ${searchBox("Buscar conversación o servicio", query, "chat-search")}
    ${
      chats.length
        ? chats
      .map(
        (chat) => card(`
          <button type="button" class="list-item" data-action="open-chat" data-chat-id="${esc(chat.id)}">
            ${avatar("◎", COLORS.ocean, "round")}
            <div><h3>${esc(chat.user)}</h3><p>${esc(chat.service)}<br>${esc(chat.lastMessage)}</p></div>
            <div style="text-align:right"><strong>${esc(chat.time)}</strong><br>${pill(chat.status)}</div>
          </button>
        `),
      )
      .join("")
        : searchEmptyState("Sin conversaciones", "No hay chats que coincidan con tu búsqueda.", 'data-action="clear-chat-search"')
    }
  `;
}

function screenChatDetail(chatId) {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return emptyState("✉", "Conversación no encontrada", "El chat ya no está disponible.", "Volver", "chat");
  return `
    <div class="chat-screen">
      ${headerCard(chat.service, chat.status, "✉", COLORS.ocean)}
      <div id="messages" class="messages">
        ${chat.messages.map((message) => `<div class="bubble ${message.mine ? "mine" : ""}">${esc(message.text)}<time>${esc(message.time)}</time></div>`).join("")}
      </div>
      <div class="message-input">
        <input id="chatMessage" type="text" placeholder="Mensaje" />
        <button type="button" class="primary" data-action="send-chat" data-chat-id="${esc(chat.id)}" aria-label="Enviar"><span class="icon">›</span></button>
      </div>
    </div>
  `;
}

function sendChat(chatId) {
  const input = $("#chatMessage");
  const text = input?.value.trim();
  if (!text) {
    showToast("Escribe un mensaje antes de enviarlo.", true);
    return;
  }
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  chat.messages.push({ text, mine: true, time });
  chat.lastMessage = text;
  chat.time = time;
  input.value = "";
  persist();
  render();
  setTimeout(() => $("#messages")?.scrollIntoView({ block: "end" }), 50);
}

function screenReviews() {
  return `
    ${headerCard("Reseñas", "Calificaciones, comentarios, respuesta pública y reportes para moderación.", "★", COLORS.yellow)}
    ${card(`<div class="list-item">${avatar("★", COLORS.yellow, "round")}<div>${sectionTitle("4.8 promedio", "Calificación basada en reseñas registradas.")}</div>${pill("Verificado")}</div>`)}
    ${state.reviews
      .map(
        (review) => card(`
          <div class="section-header"><h3>${esc(review.service)}</h3>${pill(review.rating)}</div>
          <p class="muted">${esc(review.comment)}</p>
          ${review.reply ? `<div class="card" style="margin-top:10px;background:rgba(var(--accent-rgb),0.08)"><p class="muted"><strong>Respuesta:</strong> ${esc(review.reply)}</p></div>` : ""}
          <div class="divider"></div>
          <div class="action-row">
            <button type="button" class="secondary" data-action="review-reply" data-review-id="${esc(review.id)}"><span class="icon">↩</span>${review.reply ? "Editar respuesta" : "Responder"}</button>
            <button type="button" class="secondary" data-action="review-report" data-review-id="${esc(review.id)}"><span class="icon">!</span>${review.reported ? "Reportada" : "Reportar"}</button>
            ${pill(review.reported ? "Reporte enviado" : review.replyStatus)}
          </div>
        `),
      )
      .join("")}
  `;
}

function showReviewReply(reviewId) {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review) return;
  openSheet(`
    <h2>Responder reseña</h2>
    ${fieldHtml("review-reply", "Respuesta pública", review.reply, "textarea")}
    <button type="button" class="primary full" data-action="save-review-reply" data-review-id="${esc(reviewId)}"><span class="icon">✓</span>Publicar respuesta</button>
  `);
}

function showReviewReport(reviewId) {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review) return;
  openSheet(`
    <h2>Reportar reseña</h2>
    <p class="muted">El reporte se enviará al equipo administrador para revisión.</p>
    <button type="button" class="primary full" data-action="save-review-report" data-review-id="${esc(reviewId)}"><span class="icon">!</span>Enviar reporte</button>
  `);
}

function screenPromotions() {
  return `
    ${headerCard("Promociones", "Campañas por servicio con fecha, descuento, cupos y condiciones.", "%", COLORS.purple)}
    <button type="button" class="primary full" style="${colorVars(COLORS.purple)}" data-action="promo-modal"><span class="icon">+</span>Crear promoción</button>
    <div style="margin-top:12px">
      ${
        state.promos.length
          ? state.promos
              .map(
                (promo) => card(`
                  <div class="list-item">
                    ${avatar("%", COLORS.purple, "round")}
                    <div><h3>${esc(promo.title)}</h3><p>${esc(promo.discount)} · ${esc(promo.conditions)}<br>${promo.active ? "Visible para usuarios cuando el servicio esté activo." : "Pausada"}</p></div>
                    <div class="inline-actions">
                      <button type="button" class="mini-icon-button" data-action="promo-toggle" data-promo-id="${esc(promo.id)}" aria-label="${promo.active ? "Pausar" : "Activar"}"><span class="icon">${promo.active ? "Ⅱ" : "▶"}</span></button>
                      <button type="button" class="mini-icon-button" data-action="promo-modal" data-promo-id="${esc(promo.id)}" aria-label="Editar"><span class="icon">✎</span></button>
                      <button type="button" class="mini-icon-button" data-action="promo-delete" data-promo-id="${esc(promo.id)}" aria-label="Eliminar"><span class="icon">×</span></button>
                    </div>
                  </div>
                `),
              )
              .join("")
          : emptyState("%", "Sin promociones", "Agrega descuentos o campañas visibles para usuarios.", "Crear promoción", 'data-action="promo-modal"')
      }
    </div>
  `;
}

function showPromoModal(promoId = "") {
  const promo = state.promos.find((item) => item.id === promoId);
  openSheet(`
    <h2>${promo ? "Editar promoción" : "Nueva promoción"}</h2>
    ${fieldHtml("promo-title", "Nombre o descripción", promo?.title || "")}
    ${fieldHtml("promo-discount", "Descuento (%)", promo?.discount?.replace("%", "") || "", "number")}
    ${fieldHtml("promo-conditions", "Condiciones", promo?.conditions || "")}
    <button type="button" class="primary full" data-action="promo-save" data-promo-id="${esc(promoId)}"><span class="icon">✓</span>Guardar promoción</button>
  `);
}

function screenSettings() {
  const settings = state.settings;
  return `
    ${headerCard("Centro de ajustes", "Controla la apariencia, alertas, seguridad, privacidad y soporte del panel comercial.", "⚙", settings.accentColor)}
    ${card(`
      ${sectionTitle("Apariencia", "Cambia entre modo claro, oscuro o automático según el sistema.")}
      <div class="segment">
        ${["light", "dark", "system"].map((mode) => `<button type="button" class="${settings.themeMode === mode ? "active" : ""}" data-action="theme-mode" data-mode="${mode}">${mode === "light" ? "Claro" : mode === "dark" ? "Oscuro" : "Auto"}</button>`).join("")}
      </div>
    `)}
    ${card(`
      ${sectionTitle("Color principal", "Selecciona una paleta visual para botones, iconos y acentos.")}
      <div class="chip-row">
        ${[COLORS.ocean, COLORS.blue, COLORS.green, COLORS.purple, COLORS.orange].map((color) => `<button type="button" class="color-dot ${settings.accentColor === color ? "active" : ""}" style="--dot:${color};background:${color}" data-action="accent-color" data-color="${color}" aria-label="Cambiar color"></button>`).join("")}
      </div>
    `)}
    ${settingsGroup("Notificaciones", [
      switchRow("notifications", "✦", "Notificaciones generales", "Alertas de actividad en la cuenta."),
      switchRow("reservationAlerts", "✓", "Alertas de reservaciones", "Solicitudes, cambios, cancelaciones y confirmaciones.", settings.notifications),
      switchRow("paymentAlerts", "$", "Alertas de pagos", "Cobros, comprobantes y pagos pendientes.", settings.notifications),
      switchRow("chatAlerts", "✉", "Mensajes de usuarios", "Conversaciones con usuarios con reserva o consulta activa.", settings.notifications),
    ])}
    ${settingsGroup("Seguridad y privacidad", [
      switchRow("confirmBeforeDelete", "×", "Confirmar antes de eliminar", "Solicitar confirmación antes de borrar servicios, embarcaciones, promociones o productos."),
      switchRow("hideSensitiveInfo", "◌", "Ocultar información sensible", "Oculta datos comerciales internos dentro del panel."),
      actionTile("security", "⌕", "Seguridad de cuenta", "Correo, teléfono, contraseña y verificación."),
      actionTile("privacy", "◇", "Privacidad del panel", "Control de datos visibles, permisos y protección de información."),
    ])}
    ${settingsGroup("Soporte", [
      actionTile("support", "?", "Contactar encargados de la app", "Reportar errores, dudas, pagos o conflictos con usuarios."),
      `<button type="button" class="list-item" data-action="system-info">${avatar("i", settings.accentColor, "round")}<div><h3>Información del sistema</h3><p>Estado del frontend y módulos preparados para backend.</p></div><span class="icon">›</span></button>`,
    ])}
    <p class="muted" style="text-align:center;font-size:12px">Los cambios de apariencia se aplican al instante y no modifican los datos comerciales.</p>
  `;
}

function settingsGroup(title, children) {
  return card(`<div class="settings-group"><h3>${esc(title)}</h3>${children.join("")}</div>`);
}

function switchRow(key, icon, title, subtitle, enabled = true) {
  const value = Boolean(state.settings[key]);
  return `
    <label class="switch-row">
      <span class="icon" style="color:${enabled ? "var(--accent)" : "var(--muted)"}">${esc(icon)}</span>
      <span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></span>
      <span class="switch">
        <input type="checkbox" data-action="settings-switch" data-key="${esc(key)}" ${value ? "checked" : ""} ${enabled ? "" : "disabled"} />
        <span class="slider"></span>
      </span>
    </label>
  `;
}

function actionTile(page, icon, title, subtitle) {
  return `<button type="button" class="list-item" data-action="push-page" data-page="${esc(page)}">${avatar(icon, state.settings.accentColor, "round")}<div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><span class="icon">›</span></button>`;
}

function screenSupport() {
  const draft = state.supportDraft;
  return `
    ${headerCard("Soporte Costa Inteligente", "Comunícate con los encargados de la aplicación para reportar errores, dudas, pagos o conflictos.", "?", COLORS.blue)}
    ${card(`
      ${selectHtml("support-category", "Tipo de reporte", draft.category, ["Error en la aplicación", "Duda de funcionamiento", "Conflicto con usuario", "Problema con pago", "Problema con reservación", "Otro"])}
      ${selectHtml("support-priority", "Prioridad", draft.priority, ["Baja", "Media", "Alta"])}
      ${fieldHtml("support-subject", "Asunto", draft.subject)}
      ${fieldHtml("support-message", "Describe el problema o duda", draft.message, "textarea")}
      <button type="button" class="primary full" data-action="support-submit"><span class="icon">›</span>Enviar reporte</button>
    `)}
    ${infoBox("En producción esta sección debe conectarse a un sistema de tickets, correo administrativo o base de datos de soporte.")}
  `;
}

function screenSecurity() {
  return `
    ${headerCard("Seguridad de cuenta", "Configuraciones preparadas para proteger el acceso y las acciones críticas del panel.", "⌕", COLORS.orange)}
    ${settingsGroup("Acceso", [
      switchRow("twoStepVerification", "✓", "Verificación en dos pasos", "Solicitar una verificación adicional al iniciar sesión."),
      switchRow("loginAlerts", "✦", "Alertas de inicio de sesión", "Notificar cuando se detecte un acceso nuevo."),
      switchRow("biometricAccess", "◎", "Acceso biométrico", "Preparado para desbloqueo con huella o rostro en el dispositivo."),
    ])}
    ${settingsGroup("Protección del panel", [
      switchRow("protectCriticalActions", "◇", "Confirmar acciones críticas", "Pedir confirmación antes de eliminar servicios, productos o promociones."),
      switchRow("hideFinancialData", "◌", "Ocultar información financiera", "Ocultar montos internos cuando el panel esté en espacios públicos."),
    ])}
    ${infoBox("Estas opciones son funcionales a nivel frontend. Al conectar Firebase deben sincronizarse por usuario en Firestore y reforzarse con reglas de seguridad.")}
  `;
}

function screenPrivacy() {
  return `
    ${headerCard("Privacidad del panel", "Controla qué información del negocio puede mostrarse a usuarios y qué datos quedan solo para administración.", "◇", COLORS.purple)}
    ${settingsGroup("Datos visibles para usuarios", [
      switchRow("showPhoneToUsers", "☎", "Mostrar teléfono o WhatsApp", "Permite que usuarios interesados contacten al proveedor."),
      switchRow("showExactLocation", "⌖", "Mostrar ubicación exacta", "Muestra la ubicación real del negocio o punto de salida."),
      switchRow("allowUserMessages", "✉", "Permitir mensajes de usuarios", "Usuarios con reserva o consulta activa pueden comunicarse."),
    ])}
    ${settingsGroup("Datos internos", [
      switchRow("showBusinessStats", "▦", "Mostrar estadísticas comerciales", "Visitas, ingresos, conversiones y rendimiento del negocio."),
      switchRow("allowReviewReplies", "★", "Permitir respuestas a reseñas", "El proveedor puede responder públicamente reseñas de usuarios."),
    ])}
    ${infoBox("Estas opciones preparan la lógica del frontend. En producción deben aplicarse también desde backend para evitar exposición de datos sensibles.")}
  `;
}

function showSystemInfo() {
  openDialog(`
    <h2>Información del sistema</h2>
    ${systemRow("Estado", "Frontend funcional")}
    ${systemRow("Backend", "Pendiente de conexión")}
    ${systemRow("Autenticación", "Preparada para Firebase Auth")}
    ${systemRow("Base de datos", "Preparada para Firestore")}
    ${systemRow("Archivos", "Preparado para Storage")}
    <button type="button" class="primary full" data-close="modal">Cerrar</button>
  `);
}

function systemRow(label, value) {
  return `<div class="system-row"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`;
}

function screenCalendar() {
  if (!transient.calendarMonth) {
    const now = new Date();
    transient.calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  const month = new Date(transient.calendarMonth);
  return `
    ${headerCard("Calendario", "Controla disponibilidad general, días ocupados y bloqueos por temporada.", "□", COLORS.blue)}
    ${card(`
      <div class="calendar-head">
        <button type="button" class="icon-button" data-action="calendar-month" data-dir="-1" aria-label="Mes anterior"><span class="icon">‹</span></button>
        <h3>${monthNames[month.getMonth()]} ${month.getFullYear()}</h3>
        <button type="button" class="icon-button" data-action="calendar-month" data-dir="1" aria-label="Mes siguiente"><span class="icon">›</span></button>
      </div>
      <div class="calendar-week">${dayLabels.map((day) => `<span>${esc(day)}</span>`).join("")}</div>
      ${calendarGrid(month, "global-calendar")}
      <div class="chip-row" style="margin-top:12px">
        <span class="legend" style="--legend:${COLORS.green}">Disponible</span>
        <span class="legend" style="--legend:${COLORS.orange}">Ocupado</span>
        <span class="legend" style="--legend:${COLORS.red}">Bloqueado</span>
      </div>
    `)}
    ${sectionTitle("Disponibilidad por servicio", "Días y horarios visibles para usuarios.")}
    ${services.map((service) => serviceAvailabilityCard(service)).join("")}
  `;
}

function calendarGrid(monthDate, action) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(`<button type="button" class="calendar-day empty" tabindex="-1"></button>`);
  for (let day = 1; day <= days; day += 1) {
    const key = dateKey(year, month + 1, day);
    const status = state.calendarState[key] || "available";
    cells.push(`<button type="button" class="calendar-day ${status}" data-action="${esc(action)}" data-date-key="${key}" data-day="${day}">${day}</button>`);
  }
  return `<div class="calendar-grid">${cells.join("")}</div>`;
}

function dateKey(year, month, day) {
  return year * 10000 + month * 100 + day;
}

function serviceAvailabilityCard(service) {
  const data = state.serviceAvailability[service.id] || { days: [], slots: [] };
  return card(`
    <div class="list-item" style="${colorVars(service.color)}">
      ${avatar(service.icon, service.color, "round")}
      <div><h3>${esc(service.name)}</h3><p>Días y horarios visibles para usuarios.</p></div>
      <button type="button" class="mini-icon-button" data-action="service-availability" data-service-id="${esc(service.id)}" aria-label="Editar disponibilidad"><span class="icon">□</span></button>
    </div>
    <div class="chip-row" style="margin-top:10px">
      ${data.days.map((day) => infoChip("□", day)).join("")}
      ${data.slots.map((slot) => infoChip("□", `${slot.start} - ${slot.end}`)).join("")}
    </div>
  `);
}

function showDayStatusSheet(dateKeyValue, day) {
  openSheet(`
    <h2>Día ${esc(day)}</h2>
    <button type="button" class="list-item" data-action="set-day-status" data-date-key="${esc(dateKeyValue)}" data-status="available">${avatar("✓", COLORS.green, "round")}<div><h3>Disponible</h3><p>Se pueden recibir reservas</p></div></button>
    <button type="button" class="list-item" data-action="set-day-status" data-date-key="${esc(dateKeyValue)}" data-status="busy">${avatar("!", COLORS.orange, "round")}<div><h3>Ocupado</h3><p>Reservas o compromisos existentes</p></div></button>
    <button type="button" class="list-item" data-action="set-day-status" data-date-key="${esc(dateKeyValue)}" data-status="blocked">${avatar("×", COLORS.red, "round")}<div><h3>Bloqueado</h3><p>No ofrecer ningún servicio</p></div></button>
  `);
}

function showServiceAvailabilitySheet(serviceId) {
  const service = serviceById(serviceId);
  const current = state.serviceAvailability[serviceId] || { days: [], slots: [] };
  transient.serviceAvailability = { serviceId, days: [...current.days], slots: clone(current.slots), startHour: 8, startMinute: 0, endHour: 10, endMinute: 0 };
  renderServiceAvailabilitySheet(service);
}

function renderServiceAvailabilitySheet(service) {
  const data = transient.serviceAvailability;
  openSheet(`
    <h2>Disponibilidad: ${esc(service.name)}</h2>
    <p class="muted">Días disponibles</p>
    <div class="chip-row" style="margin:8px 0 14px">
      ${dayLabels.map((day) => `<button type="button" class="chip-button ${data.days.includes(day) ? "selected" : ""}" data-action="toggle-service-day" data-day="${esc(day)}">${esc(day)}</button>`).join("")}
    </div>
    <p class="muted">Horarios disponibles</p>
    <div class="field-row" style="margin-top:8px">
      ${numberSelect("sa-start-hour", "Inicio hora", data.startHour, 24)}
      ${numberSelect("sa-start-minute", "Inicio min", data.startMinute, 12, 5)}
      ${numberSelect("sa-end-hour", "Fin hora", data.endHour, 24)}
      ${numberSelect("sa-end-minute", "Fin min", data.endMinute, 12, 5)}
    </div>
    <button type="button" class="secondary full" data-action="sa-add-slot"><span class="icon">+</span>Añadir horario</button>
    <div class="chip-row" style="margin:10px 0 14px">
      ${data.slots.map((slot, index) => `<button type="button" class="chip-button selected" data-action="sa-remove-slot" data-index="${index}">${esc(slot.start)} - ${esc(slot.end)} ×</button>`).join("") || `<span class="muted">Sin horarios añadidos.</span>`}
    </div>
    <button type="button" class="primary full" data-action="sa-save"><span class="icon">✓</span>Guardar disponibilidad</button>
  `);
}

function numberSelect(id, label, value, count, step = 1) {
  const options = Array.from({ length: count }, (_, index) => index * step);
  return `<label class="field">${esc(label)}<select id="${esc(id)}">${options.map((item) => `<option value="${item}" ${Number(value) === item ? "selected" : ""}>${String(item).padStart(2, "0")}</option>`).join("")}</select></label>`;
}

function fieldHtml(id, label, value = "", type = "text") {
  if (type === "textarea") return `<label class="field">${esc(label)}<textarea id="${esc(id)}">${esc(value)}</textarea></label>`;
  return `<label class="field">${esc(label)}<input id="${esc(id)}" type="${esc(type)}" value="${esc(value)}" /></label>`;
}

function selectHtml(id, label, value, options) {
  return `<label class="field">${esc(label)}<select id="${esc(id)}">${options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
}

function screenServiceForm(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordId ? recordById(serviceId, recordId) : null;
  if (!draftForm || draftForm.serviceId !== serviceId || draftForm.recordId !== (recordId || "")) draftForm = initDraftForm(service, record);
  return `
    ${headerCard(record ? `Modificar ${service.name}` : formTitle(service.id), formHeaderSubtitleFor(service), service.icon, service.color)}
    ${serviceFields(service)}
    ${publicationFields(service)}
    ${descriptionNotice(service)}
    ${scheduleEditor(draftForm.schedules, `data-action="edit-form-schedules"`)}
    ${documentUploadFields(service)}
    <div class="field-row">
      <button type="button" class="secondary" data-action="save-service-form" data-status="saved"><span class="icon">✓</span>Guardar</button>
      <button type="button" class="primary" style="${colorVars(service.color)}" data-action="save-service-form" data-status="pending"><span class="icon">›</span>Enviar</button>
    </div>
  `;
}

function initDraftForm(service, record) {
  const fishingTypes = record?.fishingTypes?.length ? [...record.fishingTypes] : serviceNeedsFishingConfig(service) ? [fishingTypeOptions[0]] : [];
  return {
    recordId: record?.id || "",
    serviceId: service.id,
    name: record?.title || "",
    location: record?.location || "",
    description: record?.subtitle || "",
    captainName: record?.captainName || "",
    servicePhotoUrl: record?.servicePhotoUrl || "",
    publicContact: record?.publicContact || "",
    capacity: record?.capacity > 0 ? String(record.capacity) : "",
    experienceYears: record?.experienceYears > 0 ? String(record.experienceYears) : "",
    unitDetail: record?.extraDetails?.[0] || "",
    meetingPoint: record?.meetingPoint || "",
    boatType: record?.serviceType || "",
    transportType: record?.serviceType || "Terrestre",
    selectedFishingTypes: fishingTypes,
    selectedCaptureSpecies: record?.targetSpecies?.length ? [...record.targetSpecies] : speciesForFishingTypes(fishingTypes),
    uploadedDocumentPhotos: record?.uploadedDocumentPhotos ? [...record.uploadedDocumentPhotos] : [],
    visibleToUsers: record?.visibleToUsers ?? true,
    schedules: record?.schedules ? clone(record.schedules) : [],
    chips: record?.tags ? [...record.tags] : [],
  };
}

function inputField(name, label, type = "text", maxLines = 1) {
  const value = draftForm[name] || "";
  if (maxLines > 1) return `<label class="field">${esc(label)}<textarea data-field="${esc(name)}" rows="${maxLines}">${esc(value)}</textarea></label>`;
  return `<label class="field">${esc(label)}<input data-field="${esc(name)}" type="${esc(type)}" value="${esc(value)}" /></label>`;
}

function dropdownField(name, label, options) {
  const value = draftForm[name] || "";
  return `<label class="field">${esc(label)}<select data-field="${esc(name)}"><option value="">Selecciona una opción</option>${options.map((option) => `<option value="${esc(option)}" ${value === option ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
}

function formSection(title, children) {
  return card(`<h3>${esc(title)}</h3><div style="margin-top:12px">${children.join("")}</div>`);
}

function serviceFields(service) {
  const boatTypes = ["Lancha panga", "Lancha deportiva", "Lancha rápida", "Lancha cabinada", "Yate de pesca deportiva", "Catamarán", "Embarcación artesanal", "Embarcación turística"];
  if (service.id === "boat") {
    return formSection("Datos de embarcación", [
      inputField("name", "Nombre de la embarcación"),
      inputField("captainName", "Nombre completo del capitán"),
      dropdownField("boatType", "Tipo de embarcación", boatTypes),
      inputField("capacity", "Capacidad de pasajeros", "number"),
      inputField("location", "Ubicación de salida"),
      multiChips("Servicios incluidos", ["Capitán", "Equipo de pesca", "Chalecos", "Hielera", "Combustible", "GPS", "Radio", "Sombra", "Bebidas", "Alimentos"]),
      fishingTypeSpeciesSelector(),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "rental") {
    return formSection("Datos de renta de embarcación", [
      inputField("name", "Nombre de la embarcación"),
      inputField("captainName", "Nombre completo del capitán responsable"),
      dropdownField("boatType", "Tipo de embarcación", boatTypes),
      inputField("capacity", "Capacidad de pasajeros", "number"),
      inputField("location", "Ubicación de salida"),
      multiChips("Modalidad", ["Con capitán", "Sin capitán"]),
      multiChips("Servicios incluidos", ["Chalecos", "GPS", "Hielera", "Equipo de pesca", "Combustible", "Radio"]),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "sport") {
    return formSection("Datos de pesca deportiva", [
      inputField("name", "Nombre del paquete"),
      inputField("captainName", "Nombre completo del capitán responsable"),
      fishingTypeSpeciesSelector(),
      inputField("capacity", "Capacidad de clientes", "number"),
      inputField("location", "Punto de salida"),
      multiChips("Servicios incluidos", ["Equipo", "Capitán", "Combustible", "Bebidas", "Alimentos", "Fotografía"]),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "restaurant") {
    return formSection("Datos del restaurante", [
      inputField("name", "Nombre del restaurante"),
      inputField("location", "Dirección / ubicación"),
      multiChips("Especialidades", ["Mariscos frescos", "Ceviches", "Cocteles", "Pescado zarandeado", "Cocina regional", "Comida para llevar"]),
      multiChips("Servicios", ["Consumo en restaurante", "Reservaciones", "Eventos privados", "Para llevar"]),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "store") {
    return formSection("Datos de tienda de pesca", [
      inputField("name", "Nombre de la tienda"),
      inputField("location", "Dirección / ubicación"),
      multiChips("Productos", ["Cañas", "Carretes", "Señuelos", "Anzuelos", "Líneas", "Plomos", "Redes", "Accesorios", "Equipo de seguridad", "Hieleras"]),
      multiChips("Marcas", ["Shimano", "Penn", "Daiwa", "Rapala", "Berkley", "Otras"]),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "fishMarket") {
    return formSection("Datos de pescadería", [
      inputField("name", "Nombre de la pescadería"),
      inputField("location", "Dirección / ubicación"),
      multiChips("Productos", ["Pescado fresco", "Mariscos frescos", "Camarón", "Pulpo", "Calamar", "Filetes", "Producto congelado"]),
      multiChips("Servicios", ["Limpieza", "Fileteado", "Empaque", "Mayoreo", "Menudeo"]),
      inputField("description", "Descripción breve del servicio", "text", 4),
    ]);
  }
  if (service.id === "transport") return transportFields();
  return formSection("Datos del guía de pesca", [
    inputField("name", "Nombre del guía o servicio"),
    inputField("experienceYears", "Años de experiencia", "number"),
    inputField("location", "Zona donde trabaja"),
    multiChips("Especialidad", ["Playa", "Muelle", "Escolleras", "Embarcación", "Agua dulce", "Pesca deportiva"]),
    fishingTypeSpeciesSelector(),
    multiChips("Servicios", ["Guía individual", "Guía grupal", "Clases básicas", "Asesoría de equipo", "Acompañamiento en torneos"]),
    inputField("description", "Descripción breve del servicio", "text", 4),
  ]);
}

function transportFields() {
  const type = draftForm.transportType || "Terrestre";
  const fields = [inputField("name", "Nombre del servicio"), dropdownField("transportType", "Tipo de transporte", ["Terrestre", "Marítimo", "Privado", "Grupal"]), inputField("capacity", "Capacidad de pasajeros", "number")];
  if (type === "Marítimo") fields.push(inputField("location", "Muelle o punto de salida"), multiChips("Servicios marítimos", ["Traslado marítimo", "Tour costero", "Recorrido turístico", "Traslado a playa", "Servicio privado"]), inputField("unitDetail", "Nombre de embarcación"), inputField("captainName", "Nombre completo del capitán responsable"));
  else if (type === "Privado") fields.push(inputField("location", "Rutas privadas"), multiChips("Servicios privados", ["Traslado personalizado", "Traslado hotel-playa", "Traslado al muelle", "Traslado aeropuerto", "Servicio ejecutivo"]), inputField("unitDetail", "Tipo de vehículo"));
  else if (type === "Grupal") fields.push(inputField("location", "Rutas grupales"), multiChips("Servicios grupales", ["Tour turístico", "Traslado a torneos", "Viaje por horarios", "Viaje redondo"]), inputField("meetingPoint", "Punto de reunión"));
  else fields.push(inputField("location", "Rutas principales"), multiChips("Servicios terrestres", ["Traslado hotel-playa", "Traslado al muelle", "Traslado a torneos", "Tours turísticos", "Transporte personalizado"]), inputField("unitDetail", "Tipo de unidad"));
  fields.push(inputField("description", "Descripción breve del servicio", "text", 4));
  return formSection("Datos de transporte turístico", fields);
}

function multiChips(title, options) {
  return `<div class="field"><label>${esc(title)}</label><div class="chip-row">${options.map((option) => {
    const key = `${title}:${option}`;
    const selected = draftForm.chips.includes(key);
    return `<button type="button" class="chip-button ${selected ? "selected" : ""}" data-action="form-chip" data-key="${esc(key)}">${esc(option)}</button>`;
  }).join("")}</div></div>`;
}

function fishingTypeSpeciesSelector() {
  const species = speciesForFishingTypes(draftForm.selectedFishingTypes);
  return `
    <div class="field">
      <label>Tipos de pesca y especies</label>
      <p class="muted">Selecciona uno o varios tipos de pesca. Estos servicios se mostrarán en usuarios cuando el registro esté aceptado, tenga foto principal y esté visible.</p>
      <div class="chip-row" style="margin-top:8px">${fishingTypeOptions.map((type) => `<button type="button" class="chip-button ${draftForm.selectedFishingTypes.includes(type) ? "selected" : ""}" data-action="fishing-type" data-type="${esc(type)}">${esc(type)}</button>`).join("")}</div>
      <p class="muted" style="margin-top:12px">Especies activas para los tipos seleccionados. Despalome las especies que este proveedor no capture.</p>
      <div class="chip-row" style="margin-top:8px">${species.map((specie) => `<button type="button" class="chip-button ${draftForm.selectedCaptureSpecies.includes(specie) ? "selected" : ""}" data-action="capture-specie" data-specie="${esc(specie)}">${esc(specie)}</button>`).join("")}</div>
    </div>
  `;
}

function publicationFields(service) {
  return card(`
    <div class="list-item" style="${colorVars(service.color)};align-items:start">
      ${avatar("◎", service.color, "round")}
      <div><h3>Publicación para usuarios</h3><p>Controla si el servicio aparecerá para usuarios cuando administración lo acepte.</p></div>
    </div>
    <div style="margin-top:12px">
      ${inputField("servicePhotoUrl", "Fotografía principal del servicio (obligatoria)")}
      ${inputField("publicContact", "Teléfono público de contacto", "tel")}
      ${draftSwitch("visibleToUsers", "Mostrar este servicio a usuarios al ser aceptado", "Si se apaga, el servicio queda guardado para el proveedor pero no se publica.")}
    </div>
  `);
}

function draftSwitch(key, title, subtitle) {
  const checked = Boolean(draftForm[key]);
  return `
    <label class="switch-row">
      <span class="icon" style="color:var(--accent)">◎</span>
      <span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></span>
      <span class="switch"><input type="checkbox" data-draft-switch="${esc(key)}" ${checked ? "checked" : ""}/><span class="slider"></span></span>
    </label>
  `;
}

function descriptionNotice(service) {
  const detailText = service.hasCatalog
    ? `La descripción breve explica al usuario de qué se trata el negocio. Los productos, menú y precios se agregan después desde Administrar > ${catalogTitleFor(service)}.`
    : `La descripción breve explica al usuario de qué se trata el servicio. ${optionManagerTitleFor(service)} se configuran después desde Administrar.`;
  return card(`<div class="list-item" style="${colorVars(service.color)};align-items:start">${avatar("i", service.color, "round")}<div><h3>Descripción del servicio</h3><p>${esc(detailText)}</p></div></div>`);
}

function scheduleEditor(slots, actionAttr) {
  return card(`
    ${sectionHeader("Horarios", "Puedes registrar varios horarios en el mismo día.", "Seleccionar", actionAttr, "□")}
    ${slots.length ? `<div class="chip-row">${slots.map((slot) => infoChip("□", `${slot.start} - ${slot.end}`)).join("")}</div>` : `<p class="muted">Sin horarios registrados.</p>`}
  `);
}

function documentUploadFields(service) {
  const docs = documentRequirementsFor(service);
  return card(`
    <h3>Documentos enviados en foto</h3>
    <p class="muted">Marca cada requisito cuando el proveedor suba la imagen correspondiente. Los obligatorios se validan antes de enviar a administración.</p>
    <div style="margin-top:12px">
      ${docs
        .map((doc) => {
          const selected = draftForm.uploadedDocumentPhotos.includes(doc.title);
          return `
            <button type="button" class="list-item card" style="${colorVars(service.color)};margin-bottom:10px;background:${selected ? "rgba(var(--accent-rgb),0.10)" : "var(--surface)"}" data-action="toggle-doc" data-doc="${esc(doc.title)}">
              ${avatar(selected ? "✓" : doc.icon, service.color, "round")}
              <div><h3>${esc(doc.title)}</h3><p>${esc(doc.subtitle)}</p></div>
              ${pill(selected ? "Foto cargada" : doc.isRequired ? "Obligatorio" : "Opcional")}
            </button>
          `;
        })
        .join("")}
    </div>
  `);
}

function formTitle(id) {
  return {
    boat: "Añadir embarcación",
    rental: "Añadir embarcación en renta",
    restaurant: "Añadir restaurante",
    store: "Añadir tienda de pesca",
    fishMarket: "Añadir pescadería",
    transport: "Añadir transporte turístico",
    guide: "Añadir guía de pesca",
    sport: "Añadir pesca deportiva",
  }[id] || "Añadir servicio";
}

function selectedType(service) {
  if (["boat", "rental"].includes(service.id)) return draftForm.boatType || "Embarcación";
  if (service.id === "transport") return draftForm.transportType || "Transporte";
  if (service.id === "restaurant") return "Restaurante";
  if (service.id === "store") return "Tienda";
  if (service.id === "fishMarket") return "Pescadería";
  if (service.id === "sport") return "Pesca deportiva";
  return "Guía de pesca";
}

function subtitleFor(service, type) {
  if (["boat", "rental"].includes(service.id)) return `${type} · ${draftForm.schedules.length} horarios registrados`;
  if (service.id === "restaurant") return `Restaurante · ${draftForm.location || "Ubicación pendiente"}`;
  if (service.id === "store") return "Tienda · productos de pesca";
  if (service.id === "fishMarket") return "Pescadería · productos frescos";
  if (service.id === "transport") return `${type} · rutas turísticas`;
  if (service.id === "guide") return "Guía local · asesoría de pesca";
  if (service.id === "sport") return "Paquete deportivo · revisión administrativa";
  return "Servicio registrado";
}

function saveServiceForm(status) {
  const service = serviceById(draftForm.serviceId);
  if (!draftForm.name.trim()) return showToast("Campo obligatorio: nombre.", true);
  if (!draftForm.servicePhotoUrl.trim()) return showToast("Agrega la fotografía principal del servicio.", true);
  if (status === "pending" && !draftForm.schedules.length) return showToast("Agrega al menos un horario antes de enviar.", true);
  if (status === "pending" && serviceRequiresCaptain(service) && !draftForm.captainName.trim()) return showToast("Registra el nombre completo del capitán responsable.", true);
  const requiredDocs = documentRequirementsFor(service).filter((doc) => doc.isRequired).map((doc) => doc.title);
  const missingDocs = requiredDocs.filter((doc) => !draftForm.uploadedDocumentPhotos.includes(doc));
  if (status === "pending" && missingDocs.length) return showToast(`Faltan fotos obligatorias: ${missingDocs.slice(0, 2).join(", ")}.`, true);
  if (status === "pending" && serviceNeedsFishingConfig(service) && !draftForm.selectedFishingTypes.length) return showToast("Selecciona al menos un tipo de pesca que puede realizar el proveedor.", true);
  if (status === "pending" && serviceNeedsFishingConfig(service) && !draftForm.selectedCaptureSpecies.length) return showToast("Selecciona al menos una especie que el proveedor sí captura.", true);
  const needsCapacity = ["boat", "rental", "sport", "transport"].includes(service.id);
  if (status === "pending" && needsCapacity && Number(draftForm.capacity || 0) <= 0) return showToast("Registra la capacidad de personas o pasajeros.", true);
  if (draftForm.publicContact.trim() && draftForm.publicContact.replace(/\D/g, "").length < 10) return showToast("El teléfono público debe tener al menos 10 dígitos.", true);

  const existing = draftForm.recordId ? recordById(service.id, draftForm.recordId) : null;
  const type = selectedType(service);
  const photoUrl = draftForm.servicePhotoUrl.trim();
  const baseGallery = existing?.gallery || [];
  const gallery =
    baseGallery.length || !photoUrl
      ? baseGallery
      : [{ id: uid(`${service.id}-main-photo`), title: "Foto principal del servicio", description: "Fotografía obligatoria enviada para revisión y publicación.", icon: "▧", color: service.color, featured: true }];
  const record = {
    id: existing?.id || uid(service.id),
    serviceId: service.id,
    title: draftForm.name.trim(),
    subtitle: draftForm.description.trim() || subtitleFor(service, type),
    location: draftForm.location.trim() || "Sin ubicación registrada",
    serviceType: type,
    price: existing?.price || 0,
    currency: existing?.currency || "mxn",
    durationHours: existing?.durationHours || 0,
    durationMinutes: existing?.durationMinutes || 0,
    status,
    isAvailable: existing?.isAvailable ?? true,
    availabilityNote: existing?.availabilityNote || "",
    unavailableDateKeys: existing?.unavailableDateKeys || [],
    schedules: clone(draftForm.schedules),
    catalog: existing?.catalog || [],
    routeOptions: existing?.routeOptions || [],
    gallery,
    captainName: serviceRequiresCaptain(service) || (service.id === "transport" && draftForm.transportType === "Marítimo") ? draftForm.captainName.trim() : "",
    fishingTypes: serviceNeedsFishingConfig(service) ? [...draftForm.selectedFishingTypes].sort() : [],
    fishingType: serviceNeedsFishingConfig(service) ? draftForm.selectedFishingTypes[0] || "" : "",
    targetSpecies: serviceNeedsFishingConfig(service) ? [...draftForm.selectedCaptureSpecies].sort() : [],
    servicePhotoUrl: photoUrl,
    uploadedDocumentPhotos: [...draftForm.uploadedDocumentPhotos].sort(),
    visibleToUsers: Boolean(draftForm.visibleToUsers),
    publicContact: draftForm.publicContact.trim(),
    capacity: Number.parseInt(draftForm.capacity || "0", 10) || existing?.capacity || 0,
    experienceYears: Number.parseInt(draftForm.experienceYears || "0", 10) || existing?.experienceYears || 0,
    tags: [...draftForm.chips].sort(),
    extraDetails: draftForm.unitDetail.trim() ? [draftForm.unitDetail.trim()] : existing?.extraDetails || [],
    meetingPoint: draftForm.meetingPoint.trim() || existing?.meetingPoint || "",
  };

  const list = state.records[service.id] || (state.records[service.id] = []);
  const index = list.findIndex((item) => item.id === record.id);
  if (index >= 0) list[index] = record;
  else list.push(record);
  draftForm = null;
  persist();
  showToast(status === "pending" ? "Registro enviado a revisión administrativa." : "Registro guardado correctamente.");
  goBack();
}

function showScheduleModal(target, serviceId = "", recordId = "") {
  const slots = target === "form" ? draftForm.schedules : clone(recordById(serviceId, recordId)?.schedules || []);
  transient.schedule = { target, serviceId, recordId, slots, startHour: 8, startMinute: 0, endHour: 10, endMinute: 0 };
  renderScheduleSheet();
}

function renderScheduleSheet() {
  const data = transient.schedule;
  openSheet(`
    <h2>Seleccionar horarios</h2>
    <div class="field-row">
      ${numberSelect("sch-start-hour", "Inicio hora", data.startHour, 24)}
      ${numberSelect("sch-start-minute", "Inicio min", data.startMinute, 12, 5)}
      ${numberSelect("sch-end-hour", "Fin hora", data.endHour, 24)}
      ${numberSelect("sch-end-minute", "Fin min", data.endMinute, 12, 5)}
    </div>
    <button type="button" class="secondary full" data-action="schedule-add"><span class="icon">+</span>Añadir horario</button>
    <div class="chip-row" style="margin:10px 0 14px">
      ${data.slots.length ? data.slots.map((slot, index) => `<button type="button" class="chip-button selected" data-action="schedule-remove" data-index="${index}">${esc(slot.start)} - ${esc(slot.end)} ×</button>`).join("") : `<span class="muted">Sin horarios añadidos.</span>`}
    </div>
    <button type="button" class="primary full" data-action="schedule-save"><span class="icon">✓</span>Guardar horarios</button>
  `);
}

function addScheduleSlot(data, prefix) {
  const startHour = Number($(`#${prefix}-start-hour`).value);
  const startMinute = Number($(`#${prefix}-start-minute`).value);
  const endHour = Number($(`#${prefix}-end-hour`).value);
  const endMinute = Number($(`#${prefix}-end-minute`).value);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  if (endTotal <= startTotal) return showToast("La hora final debe ser mayor que la hora inicial.", true);
  const start = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
  const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
  if (data.slots.some((slot) => slot.start === start && slot.end === end)) return showToast("Ese horario ya está agregado.", true);
  data.startHour = startHour;
  data.startMinute = startMinute;
  data.endHour = endHour;
  data.endMinute = endMinute;
  data.slots.push({ start, end });
  return true;
}

function saveScheduleSlots() {
  const data = transient.schedule;
  if (data.target === "form") {
    draftForm.schedules = clone(data.slots);
  } else {
    const record = recordById(data.serviceId, data.recordId);
    if (record) record.schedules = clone(data.slots);
  }
  persist();
  closeModal();
  render();
}

function showAvailabilityModal(serviceId, recordId) {
  const record = recordById(serviceId, recordId);
  if (!record) return;
  const now = new Date();
  transient.availability = {
    serviceId,
    recordId,
    isAvailable: record.isAvailable,
    note: record.availabilityNote || "",
    unavailableDateKeys: [...(record.unavailableDateKeys || [])],
    month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
  };
  renderAvailabilitySheet();
}

function renderAvailabilitySheet() {
  const data = transient.availability;
  const record = recordById(data.serviceId, data.recordId);
  const service = serviceById(data.serviceId);
  const month = new Date(data.month);
  openSheet(`
    <h2>Editar disponibilidad</h2>
    <p class="muted">Marca en el calendario los días en los que esta embarcación, negocio o servicio no estará disponible para reservas.</p>
    <div class="segment" style="margin:14px 0">
      <button type="button" class="${data.isAvailable ? "active" : ""}" data-action="availability-active" data-value="true">Activo</button>
      <button type="button" class="${!data.isAvailable ? "active" : ""}" data-action="availability-active" data-value="false">Pausado</button>
    </div>
    ${card(`
      <div class="calendar-head">
        <button type="button" class="icon-button" data-action="availability-month" data-dir="-1"><span class="icon">‹</span></button>
        <h3>${monthNames[month.getMonth()]} ${month.getFullYear()}</h3>
        <button type="button" class="icon-button" data-action="availability-month" data-dir="1"><span class="icon">›</span></button>
      </div>
      <div class="calendar-week">${dayLabels.map((day) => `<span>${esc(day)}</span>`).join("")}</div>
      ${availabilityCalendarGrid(month)}
      <div class="chip-row" style="margin-top:12px"><span class="legend" style="--legend:${COLORS.green}">Disponible</span><span class="legend" style="--legend:${COLORS.red}">No disponible</span></div>
    `)}
    ${fieldHtml("availability-note", "Nota visible o interna", data.note, "textarea")}
    <button type="button" class="primary full" style="${colorVars(data.isAvailable ? service.color : COLORS.red)}" data-action="availability-save"><span class="icon">✓</span>Guardar disponibilidad</button>
  `);
}

function availabilityCalendarGrid(monthDate) {
  const data = transient.availability;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(`<button type="button" class="calendar-day empty" tabindex="-1"></button>`);
  for (let day = 1; day <= days; day += 1) {
    const key = dateKey(year, month + 1, day);
    const blocked = data.unavailableDateKeys.includes(key);
    cells.push(`<button type="button" class="calendar-day ${blocked ? "blocked" : ""}" data-action="availability-day" data-date-key="${key}">${day}</button>`);
  }
  return `<div class="calendar-grid">${cells.join("")}</div>`;
}

function saveAvailability() {
  const data = transient.availability;
  const record = recordById(data.serviceId, data.recordId);
  if (!record) return;
  record.isAvailable = data.isAvailable;
  record.availabilityNote = $("#availability-note")?.value.trim() || "";
  record.unavailableDateKeys = [...data.unavailableDateKeys].sort((a, b) => a - b);
  persist();
  closeModal();
  render();
  showToast("Disponibilidad guardada correctamente.");
}

function screenRouteManager(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return emptyState("⇄", "Registro no encontrado", "No fue posible abrir las opciones.", "Volver", service.page);
  return `
    ${headerCard(optionManagerTitleFor(service), optionManagerSubtitleFor(service), "⇄", service.color)}
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="route-option-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"><span class="icon">+</span>${esc(optionAddLabelFor(service))}</button>
    <div style="margin-top:12px">
      ${
        record.routeOptions.length
          ? record.routeOptions.map((item) => routeOptionCard(service, record, item)).join("")
          : emptyState("⇄", optionEmptyTextFor(service), optionManagerSubtitleFor(service), optionAddLabelFor(service), `data-action="route-option-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"`)
      }
    </div>
    <button type="button" class="primary full" data-action="back"><span class="icon">✓</span>Guardar ${esc(optionManagerTitleFor(service).toLowerCase())}</button>
  `;
}

function routeOptionCard(service, record, item) {
  return card(`
    <div class="list-item" style="${colorVars(item.isAvailable ? service.color : COLORS.red)};align-items:start">
      ${avatar(item.isAvailable ? "⇄" : "×", item.isAvailable ? service.color : COLORS.red, "round")}
      <div><h3>${esc(item.name)}</h3><p>${esc(item.description)}<br>${routeDurationText(item)} · ${esc(item.capacity)} personas · ${item.isAvailable ? "Disponible" : "No disponible"}</p></div>
      <strong>${esc(routePriceText(item))}</strong>
    </div>
    <div class="divider"></div>
    <div class="action-row">
      <button type="button" class="secondary" data-action="route-option-modal" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-option-id="${esc(item.id)}"><span class="icon">✎</span>Editar</button>
      <button type="button" class="secondary" data-action="route-option-toggle" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-option-id="${esc(item.id)}"><span class="icon">${item.isAvailable ? "×" : "✓"}</span>${item.isAvailable ? "No disponible" : "Disponible"}</button>
      <button type="button" class="secondary" data-action="route-option-delete" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-option-id="${esc(item.id)}"><span class="icon">×</span>Eliminar</button>
    </div>
  `);
}

function showRouteOptionModal(serviceId, recordId, optionId = "") {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  const item = record?.routeOptions.find((option) => option.id === optionId);
  openSheet(`
    <h2>${esc(optionManagerTitleFor(service))}</h2>
    ${fieldHtml("route-name", optionNameLabelFor(service), item?.name || "")}
    ${fieldHtml("route-description", optionDescriptionLabelFor(service), item?.description || "", "textarea")}
    <div class="field-row">${fieldHtml("route-price", "Precio", item?.price || "", "number")}${selectHtml("route-currency", "Moneda", item?.currency || "mxn", ["mxn", "usd"].map(currencyLabel))}</div>
    <div class="field-row">${numberSelect("route-hours", "Horas", item?.durationHours ?? 2, 25)}${numberSelect("route-minutes", "Minutos", item?.durationMinutes ?? 0, 12, 5)}</div>
    ${fieldHtml("route-capacity", capacityLabelFor(service), item?.capacity || "4", "number")}
    <label class="switch-row"><span class="icon">✓</span><span><h3>Disponible para reservar</h3><p>Desactívalo si esta opción no debe aparecer disponible.</p></span><span class="switch"><input id="route-available" type="checkbox" ${item?.isAvailable ?? true ? "checked" : ""}/><span class="slider"></span></span></label>
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="route-option-save" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}" data-option-id="${esc(optionId)}"><span class="icon">✓</span>Guardar ${esc(optionAddLabelFor(service).replace("Agregar ", "").toLowerCase())}</button>
  `);
  const currencySelect = $("#route-currency");
  if (currencySelect) currencySelect.value = item?.currency === "usd" ? "USD" : "MXN";
}

function saveRouteOption(serviceId, recordId, optionId = "") {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return;
  const name = $("#route-name").value.trim();
  const price = Number($("#route-price").value || 0);
  const capacity = Number($("#route-capacity").value || 0);
  const hours = Number($("#route-hours").value || 0);
  const minutes = Number($("#route-minutes").value || 0);
  if (!name) return showToast("Campo obligatorio: nombre.", true);
  if (price <= 0) return showToast("Agrega un precio mayor a cero.", true);
  if (hours === 0 && minutes === 0) return showToast("Agrega una duración válida.", true);
  if (capacity <= 0) return showToast("Agrega una capacidad mayor a cero.", true);
  const item = {
    id: optionId || uid("route"),
    name,
    description: $("#route-description").value.trim(),
    price,
    currency: $("#route-currency").value === "USD" ? "usd" : "mxn",
    durationHours: hours,
    durationMinutes: minutes,
    capacity,
    isAvailable: $("#route-available").checked,
  };
  const index = record.routeOptions.findIndex((option) => option.id === item.id);
  if (index >= 0) record.routeOptions[index] = item;
  else record.routeOptions.push(item);
  persist();
  closeModal();
  render();
  showToast(`${optionManagerTitleFor(service)} guardado correctamente.`);
}

function screenCatalogManager(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return emptyState("▣", "Registro no encontrado", "No fue posible abrir el catálogo.", "Volver", service.page);
  return `
    ${headerCard(catalogTitleFor(service), catalogSubtitleFor(service), "▣", service.color)}
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="catalog-item-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"><span class="icon">+</span>${esc(catalogAddLabel(service))}</button>
    <div style="margin-top:12px">
      ${
        record.catalog.length
          ? record.catalog.map((item) => catalogItemCard(service, record, item)).join("")
          : emptyState("▣", catalogEmptyTitle(service), catalogEmptyMessage(service), catalogAddLabel(service), `data-action="catalog-item-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"`)
      }
    </div>
    <button type="button" class="primary full" data-action="back"><span class="icon">✓</span>Guardar ${esc(catalogTitleFor(service).toLowerCase())}</button>
  `;
}

function catalogAddLabel(service) {
  return service.id === "restaurant" ? "Añadir platillo" : service.id === "store" ? "Añadir producto" : service.id === "fishMarket" ? "Añadir producto fresco" : "Añadir elemento";
}

function catalogEmptyTitle(service) {
  return service.id === "restaurant" ? "Sin platillos registrados" : service.id === "store" ? "Sin productos de pesca" : service.id === "fishMarket" ? "Sin productos frescos" : "Sin elementos registrados";
}

function catalogEmptyMessage(service) {
  return service.id === "restaurant" ? "Agrega platillos, especialidades, precio y descripción para el menú." : service.id === "store" ? "Agrega artículos de pesca, accesorios, precio y descripción." : service.id === "fishMarket" ? "Agrega pescados, mariscos, cortes, precio por kilo o pieza y descripción." : "Agrega elementos visibles para los usuarios.";
}

function catalogItemCard(service, record, item) {
  return card(`
    <div class="list-item" style="${colorVars(service.color)};align-items:start">
      ${catalogThumb(service, item, 86)}
      <div><h3>${esc(item.name)}</h3><p>${esc(item.description || "Sin descripción registrada.")}</p><div class="chip-row" style="margin-top:8px">${infoChip("$", `${Number(item.price || 0).toFixed(0)} ${currencyLabel(item.currency)}`)}${infoChip(item.imageUrl ? "▧" : "▢", item.imageUrl ? "Con imagen" : "Imagen pendiente")}</div></div>
    </div>
    <div class="divider"></div>
    <div class="inline-actions">
      <p class="muted" style="flex:1">${item.imageUrl ? "Imagen lista para mostrarse al usuario." : "La imagen no es obligatoria, pero mejora la presentación del producto."}</p>
      <button type="button" class="mini-icon-button" data-action="catalog-item-modal" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-item-id="${esc(item.id)}" aria-label="Editar"><span class="icon">✎</span></button>
      <button type="button" class="mini-icon-button" data-action="catalog-item-delete" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-item-id="${esc(item.id)}" aria-label="Eliminar"><span class="icon">×</span></button>
    </div>
  `);
}

function showCatalogItemModal(serviceId, recordId, itemId = "") {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  const item = record?.catalog.find((entry) => entry.id === itemId);
  const title = service.id === "restaurant" ? "Platillo del menú" : service.id === "store" ? "Producto de pesca" : service.id === "fishMarket" ? "Producto fresco" : "Elemento del catálogo";
  openSheet(`
    <h2>${esc(title)}</h2>
    <p class="muted">Agrega la información principal. La imagen es opcional, pero ayuda a que el producto se vea más profesional.</p>
    <div id="catalog-preview" class="image-box" style="height:150px;${colorVars(service.color)};margin:12px 0">${item?.imageUrl ? `<img alt="" src="${esc(item.imageUrl)}" />` : `<span><span class="icon" style="font-size:42px">▧</span><br>Imagen opcional del producto</span>`}</div>
    ${fieldHtml("catalog-image", catalogImageLabel(service), item?.imageUrl || "")}
    ${fieldHtml("catalog-name", catalogNameLabel(service), item?.name || "")}
    ${fieldHtml("catalog-description", catalogDescriptionLabel(service), item?.description || "", "textarea")}
    <div class="field-row">${fieldHtml("catalog-price", "Precio", item?.price || "", "number")}${selectHtml("catalog-currency", "Moneda", item?.currency === "usd" ? "USD" : "MXN", ["MXN", "USD"])}</div>
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="catalog-item-save" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}" data-item-id="${esc(itemId)}"><span class="icon">✓</span>Guardar ${esc(catalogSaveName(service))}</button>
  `);
}

function catalogImageLabel(service) {
  return service.id === "restaurant" ? "Imagen del platillo (opcional)" : service.id === "store" ? "Imagen del producto (opcional)" : service.id === "fishMarket" ? "Imagen del producto fresco (opcional)" : "Imagen (opcional)";
}

function catalogNameLabel(service) {
  return service.id === "restaurant" ? "Nombre del platillo" : service.id === "store" ? "Nombre del producto" : service.id === "fishMarket" ? "Nombre del pescado, marisco o corte" : "Nombre";
}

function catalogDescriptionLabel(service) {
  return service.id === "restaurant" ? "Descripción / ingredientes / presentación" : service.id === "store" ? "Descripción / marca / modelo / presentación" : service.id === "fishMarket" ? "Descripción / kilo / pieza / corte / presentación" : "Descripción";
}

function catalogSaveName(service) {
  return service.id === "restaurant" ? "platillo" : service.id === "store" ? "producto" : service.id === "fishMarket" ? "producto fresco" : "elemento";
}

function saveCatalogItem(serviceId, recordId, itemId = "") {
  const record = recordById(serviceId, recordId);
  if (!record) return;
  const name = $("#catalog-name").value.trim();
  if (!name) return showToast("Campo obligatorio: nombre.", true);
  const item = {
    id: itemId || uid("cat"),
    name,
    description: $("#catalog-description").value.trim(),
    price: Number($("#catalog-price").value || 0),
    currency: $("#catalog-currency").value === "USD" ? "usd" : "mxn",
    imageUrl: $("#catalog-image").value.trim(),
  };
  const index = record.catalog.findIndex((entry) => entry.id === item.id);
  if (index >= 0) record.catalog[index] = item;
  else record.catalog.push(item);
  persist();
  closeModal();
  render();
  showToast("Catálogo guardado correctamente.");
}

function screenGalleryManager(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return emptyState("▧", "Registro no encontrado", "No fue posible abrir la galería.", "Volver", service.page);
  return `
    ${headerCard("Galería de fotos", "Interfaz visual para subir fotos, editarlas, marcarlas como principal o eliminarlas.", "▧", service.color)}
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="gallery-photo-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"><span class="icon">+</span>Subir foto</button>
    <div class="grid-2" style="margin-top:12px">
      ${
        record.gallery.length
          ? record.gallery.map((item) => galleryPhotoCard(service, record, item)).join("")
          : emptyState("▧", "Sin fotos en galería", "Agrega fotos de la embarcación, local, productos, platillos o punto de salida.", "Subir foto", `data-action="gallery-photo-modal" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"`)
      }
    </div>
    <button type="button" class="primary full" data-action="back" style="margin-top:12px"><span class="icon">✓</span>Guardar galería</button>
  `;
}

function galleryPhotoCard(service, record, item) {
  return `
    <div class="card" style="${colorVars(item.color || service.color)};margin-bottom:0">
      <div class="photo-tile" style="min-height:132px">
        <span class="icon" style="font-size:42px;color:var(--accent)">${esc(item.icon || "▧")}</span>
      </div>
      <h3>${esc(item.title)}</h3>
      <p class="muted">${esc(item.description)}</p>
      <div class="action-row" style="margin-top:8px">
        ${item.featured ? pill("Principal") : ""}
        <button type="button" class="mini-icon-button" data-action="gallery-feature" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-photo-id="${esc(item.id)}" aria-label="Hacer principal"><span class="icon">★</span></button>
        <button type="button" class="mini-icon-button" data-action="gallery-photo-modal" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-photo-id="${esc(item.id)}" aria-label="Editar"><span class="icon">✎</span></button>
        <button type="button" class="mini-icon-button" data-action="gallery-photo-delete" data-service-id="${esc(service.id)}" data-record-id="${esc(record.id)}" data-photo-id="${esc(item.id)}" aria-label="Eliminar"><span class="icon">×</span></button>
      </div>
    </div>
  `;
}

function showGalleryPhotoModal(serviceId, recordId, photoId = "") {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  const photo = record?.gallery.find((item) => item.id === photoId);
  const icons = ["▧", "▤", "⛵", "♨", "▣", "◍"];
  openSheet(`
    <h2>Subir foto</h2>
    ${fieldHtml("photo-title", "Título de la foto", photo?.title || "")}
    ${fieldHtml("photo-description", "Descripción", photo?.description || "", "textarea")}
    ${selectHtml("photo-icon", "Tipo de imagen", photo?.icon || icons[0], icons)}
    <label class="switch-row"><span class="icon">★</span><span><h3>Usar como foto principal</h3><p>Ideal para portada del servicio.</p></span><span class="switch"><input id="photo-featured" type="checkbox" ${photo?.featured || (!photo && !record?.gallery.length) ? "checked" : ""}/><span class="slider"></span></span></label>
    <button type="button" class="primary full" style="${colorVars(service.color)}" data-action="gallery-photo-save" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}" data-photo-id="${esc(photoId)}"><span class="icon">✓</span>Guardar foto</button>
  `);
}

function saveGalleryPhoto(serviceId, recordId, photoId = "") {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return;
  const title = $("#photo-title").value.trim();
  if (!title) return showToast("Campo obligatorio: título de la foto.", true);
  const item = {
    id: photoId || uid("photo"),
    title,
    description: $("#photo-description").value.trim(),
    icon: $("#photo-icon").value,
    color: service.color,
    featured: $("#photo-featured").checked,
  };
  if (item.featured) record.gallery = record.gallery.map((photo) => ({ ...photo, featured: false }));
  const index = record.gallery.findIndex((photo) => photo.id === item.id);
  if (index >= 0) record.gallery[index] = item;
  else record.gallery.push(item);
  persist();
  closeModal();
  render();
  showToast("Foto guardada correctamente.");
}

function ensureServiceReservations(service, record) {
  const key = record.id;
  if (state.serviceReservations[key]) return;
  const amount = bookingAmountForRecord(record);
  state.serviceReservations[key] = [
    {
      id: `srv-${record.id}-1`,
      user: "Daniela Sánchez Moreno",
      userPhone: "+52 755 100 3301",
      userEmail: "daniela.sanchez@correo.com",
      service: record.title,
      requestedOption: record.routeOptions.length ? record.routeOptions[0].name : bookingOptionsTitleFor(service),
      captainName: record.captainName || "Capitán por asignar",
      date: "18/07/2026",
      hour: record.schedules.length ? `${record.schedules[0].start} - ${record.schedules[0].end}` : "Horario por confirmar",
      people: 4,
      participantNames: ["Daniela Sánchez Moreno", "Roberto Salgado Pérez", "Andrea Salgado Sánchez", "Emilio Torres Díaz"],
      amount,
      paymentStatus: "Anticipo pendiente",
      paymentMethod: "Transferencia",
      meetingPoint: record.location,
      comment: "Solicitan confirmación de equipo y punto exacto de salida.",
      message: `${reservationTitleFor(service)} generada para revisar cupo, disponibilidad y opción solicitada.`,
      status: "Solicitud",
      createdAt: "23/06/2026 13:35",
      acceptedAt: "",
      completedAt: "",
      finalizationNote: "",
    },
    {
      id: `srv-${record.id}-2`,
      user: "Héctor Aguilar Flores",
      userPhone: "+52 755 100 3302",
      userEmail: "hector.aguilar@correo.com",
      service: record.title,
      requestedOption: record.routeOptions.length > 1 ? record.routeOptions[1].name : bookingOptionsTitleFor(service),
      captainName: record.captainName || "Capitán por asignar",
      date: "20/07/2026",
      hour: record.schedules.length > 1 ? `${record.schedules[1].start} - ${record.schedules[1].end}` : "12:00 - 14:00",
      people: 2,
      participantNames: ["Héctor Aguilar Flores", "Raúl Aguilar Flores"],
      amount,
      paymentStatus: "Pagado parcialmente",
      paymentMethod: "Transferencia",
      meetingPoint: record.location,
      comment: "Llegarán 15 minutos antes.",
      message: "Solicitud confirmada lista para operación.",
      status: "Confirmada",
      createdAt: "23/06/2026 11:10",
      acceptedAt: "Aceptada por el proveedor",
      completedAt: "",
      finalizationNote: "",
    },
  ];
}

function screenServiceReservations(serviceId, recordId) {
  const service = serviceById(serviceId);
  const record = recordById(serviceId, recordId);
  if (!record) return emptyState("✓", "Registro no encontrado", "No fue posible abrir reservas.", "Volver", service.page);
  ensureServiceReservations(service, record);
  const scope = record.id;
  const tab = transient.serviceReservationTab || 0;
  const reservations = state.serviceReservations[scope] || [];
  const filtered = reservations.filter((item) => (tab === 0 ? item.status === "Solicitud" : tab === 1 ? item.status === "Confirmada" : ["Finalizada", "Completada", "Rechazada"].includes(item.status)));
  const visibleOptions = service.hasCatalog ? record.catalog.length : record.routeOptions.filter((item) => item.isAvailable).length;
  return `
    ${headerCard(reservationTitleFor(service), reservationSubtitleFor(service), "✓", service.color)}
    ${reservationStats(reservations, service)}
    ${card(`
      ${sectionTitle(bookingOptionsTitleFor(service), bookingOptionsSubtitleFor(service))}
      <div class="chip-row">
        ${infoChip(record.isAvailable ? "✓" : "×", record.isAvailable ? "Servicio activo" : "Servicio pausado")}
        ${infoChip("□", `${record.schedules.length} horarios`)}
        ${infoChip(service.hasCatalog ? "▣" : "⇄", `${visibleOptions} opciones disponibles`)}
      </div>
      <div style="margin-top:10px">
        ${(service.hasCatalog ? record.catalog : record.routeOptions).slice(0, 4).map((item) => `<div class="list-item" style="margin-bottom:8px">${avatar(service.hasCatalog ? "▣" : "⇄", service.color, "round")}<div><h3>${esc(item.name)}</h3><p>${esc(item.description || `${routeDurationText(item)} · ${item.capacity} personas`)}</p></div><strong>${esc(service.hasCatalog ? `${Number(item.price || 0).toFixed(0)} ${currencyLabel(item.currency)}` : routePriceText(item))}</strong></div>`).join("") || `<p class="muted">${service.hasCatalog ? `Sin elementos configurados en ${catalogTitleFor(service).toLowerCase()}.` : optionEmptyTextFor(service)}</p>`}
      </div>
    `)}
    ${segment(["Solicitudes", "Confirmadas", "Historial"], tab, "service-reservation-tab")}
    <div style="margin-top:12px">
      ${filtered.length ? filtered.map((item) => reservationCard(item, scope)).join("") : emptyState("□", "Sin registros", "No hay solicitudes en esta pestaña.", "Actualizar", 'data-action="refresh-reservations"')}
    </div>
  `;
}

function openSheet(content) {
  const root = $("#modalRoot");
  root.className = "modal-root open";
  root.innerHTML = `<div class="modal-backdrop" data-close="modal"></div><div class="sheet">${content}</div>`;
  upgradeIcons(root);
}

function openDialog(content) {
  const root = $("#modalRoot");
  root.className = "modal-root open";
  root.innerHTML = `<div class="modal-backdrop" data-close="modal"></div><div class="dialog">${content}</div>`;
  upgradeIcons(root);
}

function closeModal(renderAfter = false) {
  const root = $("#modalRoot");
  root.className = "modal-root";
  root.innerHTML = "";
  if (renderAfter) render();
}

function showToast(message, error = false) {
  const toast = $("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${error ? "error" : ""}`;
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

function updateConnectivity() {
  const banner = $("#offlineBanner");
  if (!banner) return;
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  banner.classList.toggle("show", offline);
  upgradeIcons(banner);
}

function openDrawer() {
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
}

function confirmDelete(serviceId, recordId) {
  const record = recordById(serviceId, recordId);
  if (!record) return;
  if (!state.settings.confirmBeforeDelete) {
    deleteRecord(serviceId, recordId);
    return;
  }
  openDialog(`
    <h2>Eliminar ${esc(record.title)}</h2>
    <p class="muted">Esta acción quitará este registro del panel comercial. Puedes cancelar si deseas revisar la información antes de eliminar.</p>
    <div class="action-row" style="margin-top:14px">
      <button type="button" class="secondary" data-close="modal">Cancelar</button>
      <button type="button" class="danger" data-action="delete-confirmed" data-service-id="${esc(serviceId)}" data-record-id="${esc(recordId)}"><span class="icon">×</span>Eliminar</button>
    </div>
  `);
}

function deleteRecord(serviceId, recordId) {
  const list = state.records[serviceId] || [];
  const record = list.find((item) => item.id === recordId);
  state.records[serviceId] = list.filter((item) => item.id !== recordId);
  persist();
  closeModal();
  if (currentRoute().page === "serviceAdmin") goBack();
  else render();
  showToast(`${record?.title || "Registro"} eliminado correctamente.`);
}

function handleClick(event) {
  const closeTarget = event.target.closest("[data-close]");
  if (closeTarget) {
    closeModal();
    return;
  }

  const goTarget = event.target.closest("[data-go]");
  if (goTarget) {
    goRoot(goTarget.dataset.go);
    return;
  }

  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "retry-connection") {
    updateConnectivity();
    showToast(navigator.onLine ? "Conexión activa. La app está sincronizada localmente." : "Sigues sin conexión. Puedes continuar con datos guardados.", !navigator.onLine);
    return;
  }
  if (action === "drawer") return openDrawer();
  if (action === "back") return goBack();
  if (action === "push-page") return navigate(target.dataset.page);
  if (action === "toggle-service") {
    const id = target.dataset.serviceId;
    if (state.selectedServices.includes(id)) state.selectedServices = state.selectedServices.filter((item) => item !== id);
    else state.selectedServices.push(id);
    persist();
    render();
    return;
  }
  if (action === "save-config") {
    showToast("Configuración guardada correctamente.");
    goRoot("dashboard");
    return;
  }
  if (action === "clear-service-search") {
    transient.serviceSearch = transient.serviceSearch || {};
    transient.serviceSearch[target.dataset.serviceId] = "";
    render();
    return;
  }
  if (action === "clear-reservation-search") {
    transient.reservationSearch = "";
    render();
    return;
  }
  if (action === "clear-chat-search") {
    transient.chatSearch = "";
    render();
    return;
  }
  if (action === "open-form") {
    const serviceId = target.dataset.serviceId;
    const recordId = target.dataset.recordId || "";
    draftForm = initDraftForm(serviceById(serviceId), recordId ? recordById(serviceId, recordId) : null);
    navigate("serviceForm", { serviceId, recordId });
    return;
  }
  if (action === "open-admin") return navigate("serviceAdmin", { serviceId: target.dataset.serviceId, recordId: target.dataset.recordId });
  if (action === "delete-record") return confirmDelete(target.dataset.serviceId, target.dataset.recordId);
  if (action === "delete-confirmed") return deleteRecord(target.dataset.serviceId, target.dataset.recordId);
  if (action === "listing-check") return showToast(target.dataset.ready === "true" ? "Este servicio cumple los requisitos para mostrarse a usuarios." : "Faltan requisitos para publicarlo a usuarios.", target.dataset.ready !== "true");
  if (action === "docs-ready") return showToast("Requisitos documentales listos para revisión administrativa.");

  if (action === "form-chip") {
    const key = target.dataset.key;
    draftForm.chips = draftForm.chips.includes(key) ? draftForm.chips.filter((item) => item !== key) : [...draftForm.chips, key];
    render();
    return;
  }
  if (action === "fishing-type") {
    const type = target.dataset.type;
    if (draftForm.selectedFishingTypes.includes(type)) draftForm.selectedFishingTypes = draftForm.selectedFishingTypes.filter((item) => item !== type);
    else {
      draftForm.selectedFishingTypes.push(type);
      speciesForFishingType(type).forEach((specie) => {
        if (!draftForm.selectedCaptureSpecies.includes(specie)) draftForm.selectedCaptureSpecies.push(specie);
      });
    }
    const valid = new Set(speciesForFishingTypes(draftForm.selectedFishingTypes));
    draftForm.selectedCaptureSpecies = draftForm.selectedCaptureSpecies.filter((specie) => valid.has(specie));
    render();
    return;
  }
  if (action === "capture-specie") {
    const specie = target.dataset.specie;
    draftForm.selectedCaptureSpecies = draftForm.selectedCaptureSpecies.includes(specie) ? draftForm.selectedCaptureSpecies.filter((item) => item !== specie) : [...draftForm.selectedCaptureSpecies, specie];
    render();
    return;
  }
  if (action === "toggle-doc") {
    const doc = target.dataset.doc;
    draftForm.uploadedDocumentPhotos = draftForm.uploadedDocumentPhotos.includes(doc) ? draftForm.uploadedDocumentPhotos.filter((item) => item !== doc) : [...draftForm.uploadedDocumentPhotos, doc];
    render();
    return;
  }
  if (action === "edit-form-schedules") return showScheduleModal("form");
  if (action === "save-service-form") return saveServiceForm(target.dataset.status);
  if (action === "edit-schedules") return showScheduleModal("record", target.dataset.serviceId, target.dataset.recordId);
  if (action === "schedule-add") {
    if (addScheduleSlot(transient.schedule, "sch")) renderScheduleSheet();
    return;
  }
  if (action === "schedule-remove") {
    transient.schedule.slots.splice(Number(target.dataset.index), 1);
    renderScheduleSheet();
    return;
  }
  if (action === "schedule-save") return saveScheduleSlots();

  if (action === "edit-availability") return showAvailabilityModal(target.dataset.serviceId, target.dataset.recordId);
  if (action === "availability-active") {
    transient.availability.isAvailable = target.dataset.value === "true";
    renderAvailabilitySheet();
    return;
  }
  if (action === "availability-month") {
    const date = new Date(transient.availability.month);
    transient.availability.month = new Date(date.getFullYear(), date.getMonth() + Number(target.dataset.dir), 1).toISOString();
    renderAvailabilitySheet();
    return;
  }
  if (action === "availability-day") {
    const key = Number(target.dataset.dateKey);
    const list = transient.availability.unavailableDateKeys;
    transient.availability.unavailableDateKeys = list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
    renderAvailabilitySheet();
    return;
  }
  if (action === "availability-save") return saveAvailability();

  if (action === "open-route-manager") return navigate("routeManager", { serviceId: target.dataset.serviceId, recordId: target.dataset.recordId });
  if (action === "route-option-modal") return showRouteOptionModal(target.dataset.serviceId, target.dataset.recordId, target.dataset.optionId || "");
  if (action === "route-option-save") return saveRouteOption(target.dataset.serviceId, target.dataset.recordId, target.dataset.optionId || "");
  if (action === "route-option-toggle") {
    const record = recordById(target.dataset.serviceId, target.dataset.recordId);
    const item = record?.routeOptions.find((option) => option.id === target.dataset.optionId);
    if (item) item.isAvailable = !item.isAvailable;
    persist();
    render();
    return;
  }
  if (action === "route-option-delete") {
    const record = recordById(target.dataset.serviceId, target.dataset.recordId);
    if (record) record.routeOptions = record.routeOptions.filter((option) => option.id !== target.dataset.optionId);
    persist();
    render();
    showToast("Opción eliminada correctamente.");
    return;
  }

  if (action === "open-catalog-manager") return navigate("catalogManager", { serviceId: target.dataset.serviceId, recordId: target.dataset.recordId });
  if (action === "catalog-item-modal") return showCatalogItemModal(target.dataset.serviceId, target.dataset.recordId, target.dataset.itemId || "");
  if (action === "catalog-item-save") return saveCatalogItem(target.dataset.serviceId, target.dataset.recordId, target.dataset.itemId || "");
  if (action === "catalog-item-delete") {
    const record = recordById(target.dataset.serviceId, target.dataset.recordId);
    if (record) record.catalog = record.catalog.filter((item) => item.id !== target.dataset.itemId);
    persist();
    render();
    showToast("Elemento eliminado correctamente.");
    return;
  }

  if (action === "open-gallery-manager") return navigate("galleryManager", { serviceId: target.dataset.serviceId, recordId: target.dataset.recordId });
  if (action === "gallery-photo-modal") return showGalleryPhotoModal(target.dataset.serviceId, target.dataset.recordId, target.dataset.photoId || "");
  if (action === "gallery-photo-save") return saveGalleryPhoto(target.dataset.serviceId, target.dataset.recordId, target.dataset.photoId || "");
  if (action === "gallery-feature") {
    const record = recordById(target.dataset.serviceId, target.dataset.recordId);
    if (record) record.gallery = record.gallery.map((photo) => ({ ...photo, featured: photo.id === target.dataset.photoId }));
    persist();
    render();
    return;
  }
  if (action === "gallery-photo-delete") {
    const record = recordById(target.dataset.serviceId, target.dataset.recordId);
    if (record) record.gallery = record.gallery.filter((photo) => photo.id !== target.dataset.photoId);
    persist();
    render();
    showToast("Foto eliminada correctamente.");
    return;
  }

  if (action === "open-service-reservations") return navigate("serviceReservations", { serviceId: target.dataset.serviceId, recordId: target.dataset.recordId });
  if (action === "reservation-tab") {
    transient.reservationTab = Number(target.dataset.index);
    render();
    return;
  }
  if (action === "service-reservation-tab") {
    transient.serviceReservationTab = Number(target.dataset.index);
    render();
    return;
  }
  if (action === "reservation-status") {
    updateReservationStatus(target.dataset.scope, target.dataset.reservationId, target.dataset.status);
    closeModal();
    showToast(`Reserva actualizada: ${target.dataset.status}.`);
    return;
  }
  if (action === "reservation-detail") return showReservationDetail(target.dataset.scope, target.dataset.reservationId);
  if (action === "refresh-reservations") return showToast("Reservaciones actualizadas. No hay registros en esta sección.");

  if (action === "payment-config") return showPaymentConfig();
  if (action === "save-payment-config") {
    state.paymentConfig.bank = $("#payment-bank").value.trim();
    state.paymentConfig.clabe = $("#payment-clabe").value.trim();
    state.paymentConfig.instructions = $("#payment-instructions").value.trim();
    persist();
    closeModal();
    showToast("Configuración de cobro guardada localmente.");
    return;
  }

  if (action === "open-chat") return navigate("chatDetail", { chatId: target.dataset.chatId });
  if (action === "send-chat") return sendChat(target.dataset.chatId);
  if (action === "review-reply") return showReviewReply(target.dataset.reviewId);
  if (action === "save-review-reply") {
    const review = state.reviews.find((item) => item.id === target.dataset.reviewId);
    const text = $("#review-reply").value.trim();
    if (!text) return showToast("Escribe una respuesta antes de publicar.", true);
    review.reply = text;
    review.replyStatus = "Respondida";
    persist();
    closeModal();
    render();
    showToast("Respuesta publicada en la reseña.");
    return;
  }
  if (action === "review-report") return showReviewReport(target.dataset.reviewId);
  if (action === "save-review-report") {
    const review = state.reviews.find((item) => item.id === target.dataset.reviewId);
    if (review) review.reported = true;
    persist();
    closeModal();
    render();
    showToast("Reporte enviado a administración.");
    return;
  }

  if (action === "promo-modal") return showPromoModal(target.dataset.promoId || "");
  if (action === "promo-save") {
    const title = $("#promo-title").value.trim();
    const discount = $("#promo-discount").value.trim();
    const conditions = $("#promo-conditions").value.trim();
    if (!title || !discount) return showToast("Agrega nombre y descuento de la promoción.", true);
    const item = { id: target.dataset.promoId || uid("promo"), title, discount: `${discount}%`, conditions: conditions || "Sin condiciones registradas.", active: true };
    const index = state.promos.findIndex((promo) => promo.id === item.id);
    if (index >= 0) item.active = state.promos[index].active;
    if (index >= 0) state.promos[index] = item;
    else state.promos.push(item);
    persist();
    closeModal();
    render();
    showToast("Promoción guardada correctamente.");
    return;
  }
  if (action === "promo-toggle") {
    const promo = state.promos.find((item) => item.id === target.dataset.promoId);
    if (promo) promo.active = !promo.active;
    persist();
    render();
    return;
  }
  if (action === "promo-delete") {
    state.promos = state.promos.filter((item) => item.id !== target.dataset.promoId);
    persist();
    render();
    showToast("Promoción eliminada correctamente.");
    return;
  }

  if (action === "theme-mode") {
    state.settings.themeMode = target.dataset.mode;
    render();
    return;
  }
  if (action === "accent-color") {
    state.settings.accentColor = target.dataset.color;
    render();
    return;
  }
  if (action === "system-info") return showSystemInfo();
  if (action === "support-submit") return submitSupport();

  if (action === "calendar-month") {
    const date = new Date(transient.calendarMonth);
    transient.calendarMonth = new Date(date.getFullYear(), date.getMonth() + Number(target.dataset.dir), 1).toISOString();
    render();
    return;
  }
  if (action === "global-calendar") return showDayStatusSheet(target.dataset.dateKey, target.dataset.day);
  if (action === "set-day-status") {
    state.calendarState[target.dataset.dateKey] = target.dataset.status;
    persist();
    closeModal();
    render();
    return;
  }
  if (action === "service-availability") return showServiceAvailabilitySheet(target.dataset.serviceId);
  if (action === "toggle-service-day") {
    const day = target.dataset.day;
    const data = transient.serviceAvailability;
    data.days = data.days.includes(day) ? data.days.filter((item) => item !== day) : [...data.days, day];
    renderServiceAvailabilitySheet(serviceById(data.serviceId));
    return;
  }
  if (action === "sa-add-slot") {
    if (addScheduleSlot(transient.serviceAvailability, "sa")) renderServiceAvailabilitySheet(serviceById(transient.serviceAvailability.serviceId));
    return;
  }
  if (action === "sa-remove-slot") {
    transient.serviceAvailability.slots.splice(Number(target.dataset.index), 1);
    renderServiceAvailabilitySheet(serviceById(transient.serviceAvailability.serviceId));
    return;
  }
  if (action === "sa-save") {
    const data = transient.serviceAvailability;
    state.serviceAvailability[data.serviceId] = { days: [...data.days], slots: clone(data.slots) };
    persist();
    closeModal();
    render();
    showToast("Disponibilidad guardada correctamente.");
  }
}

function handleInput(event) {
  const input = event.target;
  if (input.matches("[data-action='service-search']")) {
    transient.serviceSearch = transient.serviceSearch || {};
    transient.serviceSearch[input.dataset.context] = input.value;
    transient.focusSearch = { selector: `[data-action="service-search"][data-context="${input.dataset.context}"]` };
    render();
    return;
  }
  if (input.matches("[data-action='reservation-search']")) {
    transient.reservationSearch = input.value;
    transient.focusSearch = { selector: `[data-action="reservation-search"]` };
    render();
    return;
  }
  if (input.matches("[data-action='chat-search']")) {
    transient.chatSearch = input.value;
    transient.focusSearch = { selector: `[data-action="chat-search"]` };
    render();
    return;
  }
  if (input.matches("[data-field]") && draftForm) {
    draftForm[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
  }
  if (input.matches("[data-draft-switch]") && draftForm) {
    draftForm[input.dataset.draftSwitch] = input.checked;
  }
  if (input.matches("[data-action='settings-switch']")) {
    state.settings[input.dataset.key] = input.checked;
    persist();
    render();
  }
  if (input.id?.startsWith("support-")) {
    state.supportDraft.category = $("#support-category")?.value || state.supportDraft.category;
    state.supportDraft.priority = $("#support-priority")?.value || state.supportDraft.priority;
    state.supportDraft.subject = $("#support-subject")?.value || state.supportDraft.subject;
    state.supportDraft.message = $("#support-message")?.value || state.supportDraft.message;
    persist();
  }
}

function submitSupport() {
  const category = $("#support-category").value;
  const priority = $("#support-priority").value;
  const subject = $("#support-subject").value.trim();
  const message = $("#support-message").value.trim();
  if (!subject || subject.length < 4) return showToast("El asunto es demasiado corto.", true);
  if (!message || message.length < 10) return showToast("Agrega más detalles para que el equipo pueda ayudarte.", true);
  state.supportTickets.push({ id: uid("ticket"), category, priority, subject, message, createdAt: new Date().toISOString() });
  state.supportDraft = { category: "Error en la aplicación", priority: "Media", subject: "", message: "" };
  persist();
  render();
  showToast(`Reporte de ${category} registrado. Prioridad: ${priority}.`);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleInput);
window.addEventListener("online", () => {
  updateConnectivity();
  showToast("Conexión restaurada.");
});
window.addEventListener("offline", updateConnectivity);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
  if (event.key === "Enter" && currentRoute().page === "chatDetail" && document.activeElement?.id === "chatMessage") {
    event.preventDefault();
    sendChat(currentRoute().params.chatId);
  }
});
$("#drawer").addEventListener("click", (event) => {
  if (event.target.id === "drawer") closeDrawer();
});

registerServiceWorker();
render();
