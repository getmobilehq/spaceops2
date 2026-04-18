import type { Dictionary } from "./en"

const es: Dictionary = {
  // ─── Common / shared ───
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.delete": "Eliminar",
  "common.edit": "Editar",
  "common.create": "Crear",
  "common.back": "Volver",
  "common.loading": "Cargando...",
  "common.error": "Error",
  "common.success": "Éxito",
  "common.confirm": "Confirmar",
  "common.search": "Buscar",
  "common.noResults": "No se encontraron resultados",
  "common.welcome": "Bienvenido, {name}",
  "common.na": "N/D",
  "common.unknown": "Desconocido",
  "common.floors": "{count} pisos",
  "common.rooms": "{count} habitaciones",
  "common.roomsDone": "habitaciones completadas",
  "common.passed": "{count} aprobadas",
  "common.failed": "{count} reprobadas",
  "common.passRate": "{rate}% tasa de aprobación",
  "common.onTrack": "{count} en tiempo",
  "common.atRisk": "{count} en riesgo",
  "common.breached": "{count} incumplidos",
  "common.clockedIn": "{count} registrados",

  // ─── Navigation labels ───
  "nav.dashboard": "Panel",
  "nav.buildings": "Edificios",
  "nav.clients": "Clientes",
  "nav.users": "Usuarios",
  "nav.checklists": "Listas de verificación",
  "nav.settings": "Configuración",
  "nav.reports": "Informes",
  "nav.billing": "Facturación",
  "nav.activities": "Actividades",
  "nav.inspections": "Inspecciones",
  "nav.templates": "Plantillas",
  "nav.attendance": "Asistencia",
  "nav.issues": "Incidencias",
  "nav.tasks": "Tareas puntuales",
  "nav.today": "Hoy",
  "nav.history": "Historial",
  "nav.overview": "Resumen",
  "nav.payroll": "Nómina",

  // ─── Sidebar ───
  "sidebar.collapse": "Contraer",
  "sidebar.expand": "Expandir",
  "sidebar.signOut": "Cerrar sesión",

  // ─── Header ───
  "header.toggleMenu": "Alternar menú",
  "header.profileAndSettings": "Perfil y configuración",
  "header.signOut": "Cerrar sesión",

  // ─── Auth ───
  "auth.signIn": "Iniciar sesión",
  "auth.signingIn": "Iniciando sesión...",
  "auth.signOut": "Cerrar sesión",
  "auth.email": "Correo electrónico",
  "auth.emailPlaceholder": "tu@empresa.com",
  "auth.password": "Contraseña",
  "auth.forgotPassword": "¿Olvidaste tu contraseña?",
  "auth.createAccount": "Crear una cuenta",
  "auth.alreadyHaveAccount": "¿Ya tienes una cuenta? Inicia sesión",
  "auth.resetPassword": "Restablecer contraseña",
  "auth.resetPasswordDescription": "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña",
  "auth.sendResetLink": "Enviar enlace de restablecimiento",
  "auth.sending": "Enviando...",
  "auth.checkYourEmail": "Revisa tu correo electrónico",
  "auth.resetEmailSent": "Si existe una cuenta con ese correo electrónico, hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada y la carpeta de spam.",
  "auth.backToSignIn": "Volver a iniciar sesión",

  // ─── Register ───
  "register.title": "Crear cuenta",
  "register.orgName": "Nombre de la organización",
  "register.orgNamePlaceholder": "Limpieza Acme S.A.",
  "register.firstName": "Nombre",
  "register.firstNamePlaceholder": "Juan",
  "register.lastName": "Apellido",
  "register.lastNamePlaceholder": "Pérez",
  "register.submit": "Crear cuenta",
  "register.creating": "Creando cuenta...",
  "register.loginFailed": "Cuenta creada pero el inicio de sesión falló. Por favor, inicia sesión manualmente.",

  // ─── Admin Dashboard ───
  "admin.dashboard.title": "Panel de administración",
  "admin.dashboard.activeBuildings": "Edificios activos",
  "admin.dashboard.openIssues": "Incidencias abiertas",
  "admin.dashboard.activitiesThisWeek": "Actividades esta semana",
  "admin.dashboard.avgPassRate": "Tasa de aprobación promedio",
  "admin.dashboard.recentActivity": "Actividad reciente",
  "admin.dashboard.noActivity": "Sin actividad aún. Comienza creando un edificio.",
  "admin.dashboard.activity": "Actividad",
  "admin.dashboard.issue": "Incidencia",

  // ─── Admin Buildings ───
  "admin.buildings.title": "Edificios",
  "admin.buildings.subtitle": "Gestiona tus edificios y pisos",
  "admin.buildings.newBuilding": "Nuevo edificio",
  "admin.buildings.empty": "Aún no hay edificios. Crea tu primer edificio para comenzar.",

  // ─── Admin Users ───
  "admin.users.title": "Usuarios",
  "admin.users.subtitle": "Gestiona tu equipo",
  "admin.users.inviteUser": "Invitar usuario",
  "admin.users.empty": "Aún no hay miembros del equipo. Invita a tu primer usuario para comenzar.",

  // ─── Admin Clients ───
  "admin.clients.title": "Clientes",
  "admin.clients.subtitle": "Gestiona tus clientes propietarios de edificios",
  "admin.clients.addClient": "Agregar cliente",
  "admin.clients.empty": "Aún no hay clientes. Agrega tu primer cliente para comenzar.",

  // ─── Admin Settings ───
  "admin.settings.title": "Configuración",
  "admin.settings.subtitle": "Gestiona la configuración de tu organización",
  "admin.settings.orgLogo": "Logo de la organización",
  "admin.settings.orgLogoDescription": "Sube un logo para tu organización. Máximo 2MB, JPEG/PNG/WebP/SVG.",
  "admin.settings.uploadLogo": "Subir logo",
  "admin.settings.uploading": "Subiendo...",
  "admin.settings.logoUploaded": "Logo subido",
  "admin.settings.logoUploadedDescription": "El logo de tu organización ha sido actualizado.",
  "admin.settings.general": "General",
  "admin.settings.orgName": "Nombre de la organización",
  "admin.settings.passThreshold": "Umbral de aprobación",
  "admin.settings.passThresholdDescription": "Las habitaciones con puntaje igual o superior a este umbral aprobarán la inspección.",
  "admin.settings.saveSettings": "Guardar configuración",
  "admin.settings.saving": "Guardando...",
  "admin.settings.settingsSaved": "Configuración guardada",
  "admin.settings.settingsSavedDescription": "La configuración de la organización ha sido actualizada.",

  // ─── Supervisor Dashboard ───
  "supervisor.dashboard.title": "Panel del supervisor",
  "supervisor.dashboard.todaysActivities": "Actividades de hoy",
  "supervisor.dashboard.inspections": "Inspecciones",
  "supervisor.dashboard.openIssues": "Incidencias abiertas",
  "supervisor.dashboard.roomsDone": "habitaciones completadas",
  "supervisor.dashboard.pendingInspection": "{count} habitación pendiente de inspección",
  "supervisor.dashboard.pendingInspectionPlural": "{count} habitaciones pendientes de inspección",
  "supervisor.dashboard.attendanceToday": "Asistencia de hoy",
  "supervisor.dashboard.noClockIns": "Ningún conserje ha registrado entrada hoy.",
  "supervisor.dashboard.verified": "Verificado",
  "supervisor.dashboard.unverified": "No verificado",
  "supervisor.dashboard.assignedBuildings": "Edificios asignados",
  "supervisor.dashboard.noBuildingsAssigned": "Aún no hay edificios asignados. Los edificios serán asignados por tu administrador.",
  "supervisor.dashboard.unknownBuilding": "Edificio desconocido",

  // ─── Janitor Today ───
  "janitor.today.title": "Hoy",
  "janitor.today.assignedRooms": "Habitaciones asignadas",
  "janitor.today.noRooms": "No hay habitaciones asignadas para hoy. Vuelve cuando tu supervisor cree una actividad.",
  "janitor.today.unknownRoom": "Habitación desconocida",
  "janitor.today.scanToStart": "Escanear para iniciar",

  // ─── Client Overview ───
  "client.overview.title": "Resumen de edificios",
  "client.overview.subtitle": "Tu panel de servicios de limpieza",
  "client.overview.activities": "Actividades",
  "client.overview.passRate": "Tasa de aprobación",
  "client.overview.inspectionsPassed": "Inspecciones aprobadas",
  "client.overview.openIssues": "Incidencias abiertas",
  "client.overview.sla": "Acuerdo de nivel de servicio",
  "client.overview.passRateCompliance": "Cumplimiento de tasa de aprobación",
  "client.overview.passRateTarget": "Actividades que cumplen el objetivo del {target}% de aprobación",
  "client.overview.avgCompletionRate": "Tasa de completitud promedio",
  "client.overview.roomsCleanedPerActivity": "Habitaciones limpiadas por actividad",
  "client.overview.avgResolutionTime": "Tiempo de resolución promedio",
  "client.overview.issueResolutionTime": "Tiempo de resolución de incidencias",
  "client.overview.issueSlaStatus": "Estado SLA de incidencias",
  "client.overview.yourBuildings": "Tus edificios",
  "client.overview.noBuildingsConfigured": "Aún no hay edificios configurados. Tu proveedor de servicios los configurará por ti.",
  "client.overview.recentActivities": "Actividades recientes",
  "client.overview.noActivities": "Aún no hay actividades de limpieza.",

  // ─── Issue Status ───
  "status.open": "Abierta",
  "status.inProgress": "En progreso",
  "status.resolved": "Resuelta",

  // ─── Issue Severity ───
  "severity.low": "Baja",
  "severity.medium": "Media",
  "severity.high": "Alta",

  // ─── Activity Status ───
  "activityStatus.draft": "Borrador",
  "activityStatus.active": "Activa",
  "activityStatus.closed": "Cerrada",
  "activityStatus.cancelled": "Cancelada",

  // ─── Task Status ───
  "taskStatus.notStarted": "No iniciada",
  "taskStatus.inProgress": "En progreso",
  "taskStatus.done": "Hecha",
  "taskStatus.hasIssues": "Con incidencias",

  // ─── Inspection Status ───
  "inspectionStatus.awaitingInspection": "Pendiente de inspección",
  "inspectionStatus.passed": "Aprobada",
  "inspectionStatus.failed": "Reprobada",

  // ─── Building Status ───
  "buildingStatus.setup": "Configuración",
  "buildingStatus.active": "Activo",
  "buildingStatus.inactive": "Inactivo",

  // ─── Locale Switcher ───
  "localeSwitcher.label": "Idioma",
}

export default es
