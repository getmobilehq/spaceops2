import type { Dictionary } from "./en"

const fr: Dictionary = {
  // ─── Common / shared ───
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.delete": "Supprimer",
  "common.edit": "Modifier",
  "common.create": "Créer",
  "common.back": "Retour",
  "common.loading": "Chargement...",
  "common.error": "Erreur",
  "common.success": "Succès",
  "common.confirm": "Confirmer",
  "common.search": "Rechercher",
  "common.noResults": "Aucun résultat trouvé",
  "common.welcome": "Bienvenue, {name}",
  "common.na": "N/D",
  "common.unknown": "Inconnu",
  "common.floors": "{count} étages",
  "common.rooms": "{count} pièces",
  "common.roomsDone": "pièces terminées",
  "common.passed": "{count} réussies",
  "common.failed": "{count} échouées",
  "common.passRate": "{rate}% taux de réussite",
  "common.onTrack": "{count} dans les délais",
  "common.atRisk": "{count} à risque",
  "common.breached": "{count} en dépassement",
  "common.clockedIn": "{count} pointés",

  // ─── Navigation labels ───
  "nav.dashboard": "Tableau de bord",
  "nav.buildings": "Bâtiments",
  "nav.clients": "Clients",
  "nav.users": "Utilisateurs",
  "nav.checklists": "Listes de contrôle",
  "nav.settings": "Paramètres",
  "nav.reports": "Rapports",
  "nav.billing": "Facturation",
  "nav.activities": "Activités",
  "nav.inspections": "Inspections",
  "nav.templates": "Modèles",
  "nav.attendance": "Présence",
  "nav.issues": "Incidents",
  "nav.tasks": "Tâches ponctuelles",
  "nav.today": "Aujourd'hui",
  "nav.history": "Historique",
  "nav.overview": "Aperçu",

  // ─── Sidebar ───
  "sidebar.collapse": "Réduire",
  "sidebar.expand": "Développer",
  "sidebar.signOut": "Déconnexion",

  // ─── Header ───
  "header.toggleMenu": "Basculer le menu",
  "header.profileAndSettings": "Profil et paramètres",
  "header.signOut": "Déconnexion",

  // ─── Auth ───
  "auth.signIn": "Se connecter",
  "auth.signingIn": "Connexion en cours...",
  "auth.signOut": "Déconnexion",
  "auth.email": "E-mail",
  "auth.emailPlaceholder": "vous@entreprise.com",
  "auth.password": "Mot de passe",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.createAccount": "Créer un compte",
  "auth.alreadyHaveAccount": "Vous avez déjà un compte ? Connectez-vous",
  "auth.resetPassword": "Réinitialiser le mot de passe",
  "auth.resetPasswordDescription": "Entrez votre e-mail et nous vous enverrons un lien de réinitialisation",
  "auth.sendResetLink": "Envoyer le lien de réinitialisation",
  "auth.sending": "Envoi en cours...",
  "auth.checkYourEmail": "Vérifiez votre e-mail",
  "auth.resetEmailSent": "Si un compte existe avec cet e-mail, nous avons envoyé un lien de réinitialisation du mot de passe. Vérifiez votre boîte de réception et votre dossier de spam.",
  "auth.backToSignIn": "Retour à la connexion",

  // ─── Register ───
  "register.title": "Créer un compte",
  "register.orgName": "Nom de l'organisation",
  "register.orgNamePlaceholder": "Nettoyage Acme SARL",
  "register.firstName": "Prénom",
  "register.firstNamePlaceholder": "Jean",
  "register.lastName": "Nom de famille",
  "register.lastNamePlaceholder": "Dupont",
  "register.submit": "Créer le compte",
  "register.creating": "Création du compte...",
  "register.loginFailed": "Compte créé mais la connexion a échoué. Veuillez vous connecter manuellement.",

  // ─── Admin Dashboard ───
  "admin.dashboard.title": "Tableau de bord administrateur",
  "admin.dashboard.activeBuildings": "Bâtiments actifs",
  "admin.dashboard.openIssues": "Incidents ouverts",
  "admin.dashboard.activitiesThisWeek": "Activités cette semaine",
  "admin.dashboard.avgPassRate": "Taux de réussite moyen",
  "admin.dashboard.recentActivity": "Activité récente",
  "admin.dashboard.noActivity": "Aucune activité pour le moment. Commencez par créer un bâtiment.",
  "admin.dashboard.activity": "Activité",
  "admin.dashboard.issue": "Incident",

  // ─── Admin Buildings ───
  "admin.buildings.title": "Bâtiments",
  "admin.buildings.subtitle": "Gérez vos bâtiments et étages",
  "admin.buildings.newBuilding": "Nouveau bâtiment",
  "admin.buildings.empty": "Aucun bâtiment pour le moment. Créez votre premier bâtiment pour commencer.",

  // ─── Admin Users ───
  "admin.users.title": "Utilisateurs",
  "admin.users.subtitle": "Gérez les membres de votre équipe",
  "admin.users.inviteUser": "Inviter un utilisateur",
  "admin.users.empty": "Aucun membre d'équipe pour le moment. Invitez votre premier utilisateur pour commencer.",

  // ─── Admin Clients ───
  "admin.clients.title": "Clients",
  "admin.clients.subtitle": "Gérez vos clients propriétaires d'immeubles",
  "admin.clients.addClient": "Ajouter un client",
  "admin.clients.empty": "Aucun client pour le moment. Ajoutez votre premier client pour commencer.",

  // ─── Admin Settings ───
  "admin.settings.title": "Paramètres",
  "admin.settings.subtitle": "Gérez les paramètres de votre organisation",
  "admin.settings.orgLogo": "Logo de l'organisation",
  "admin.settings.orgLogoDescription": "Téléchargez un logo pour votre organisation. Max 2 Mo, JPEG/PNG/WebP/SVG.",
  "admin.settings.uploadLogo": "Télécharger le logo",
  "admin.settings.uploading": "Téléchargement...",
  "admin.settings.logoUploaded": "Logo téléchargé",
  "admin.settings.logoUploadedDescription": "Le logo de votre organisation a été mis à jour.",
  "admin.settings.general": "Général",
  "admin.settings.orgName": "Nom de l'organisation",
  "admin.settings.passThreshold": "Seuil de réussite",
  "admin.settings.passThresholdDescription": "Les pièces atteignant ou dépassant ce seuil réussiront l'inspection.",
  "admin.settings.saveSettings": "Enregistrer les paramètres",
  "admin.settings.saving": "Enregistrement...",
  "admin.settings.settingsSaved": "Paramètres enregistrés",
  "admin.settings.settingsSavedDescription": "Les paramètres de l'organisation ont été mis à jour.",

  // ─── Supervisor Dashboard ───
  "supervisor.dashboard.title": "Tableau de bord superviseur",
  "supervisor.dashboard.todaysActivities": "Activités du jour",
  "supervisor.dashboard.inspections": "Inspections",
  "supervisor.dashboard.openIssues": "Incidents ouverts",
  "supervisor.dashboard.roomsDone": "pièces terminées",
  "supervisor.dashboard.pendingInspection": "{count} pièce en attente d'inspection",
  "supervisor.dashboard.pendingInspectionPlural": "{count} pièces en attente d'inspection",
  "supervisor.dashboard.attendanceToday": "Présence aujourd'hui",
  "supervisor.dashboard.noClockIns": "Aucun agent d'entretien n'a pointé aujourd'hui.",
  "supervisor.dashboard.verified": "Vérifié",
  "supervisor.dashboard.unverified": "Non vérifié",
  "supervisor.dashboard.assignedBuildings": "Bâtiments assignés",
  "supervisor.dashboard.noBuildingsAssigned": "Aucun bâtiment assigné pour le moment. Les bâtiments seront assignés par votre administrateur.",
  "supervisor.dashboard.unknownBuilding": "Bâtiment inconnu",

  // ─── Janitor Today ───
  "janitor.today.title": "Aujourd'hui",
  "janitor.today.assignedRooms": "Pièces assignées",
  "janitor.today.noRooms": "Aucune pièce assignée pour aujourd'hui. Revenez quand votre superviseur aura créé une activité.",
  "janitor.today.unknownRoom": "Pièce inconnue",
  "janitor.today.scanToStart": "Scanner pour commencer",

  // ─── Client Overview ───
  "client.overview.title": "Aperçu des bâtiments",
  "client.overview.subtitle": "Votre tableau de bord des services de nettoyage",
  "client.overview.activities": "Activités",
  "client.overview.passRate": "Taux de réussite",
  "client.overview.inspectionsPassed": "Inspections réussies",
  "client.overview.openIssues": "Incidents ouverts",
  "client.overview.sla": "Accord de niveau de service",
  "client.overview.passRateCompliance": "Conformité du taux de réussite",
  "client.overview.passRateTarget": "Activités atteignant l'objectif de {target}% de réussite",
  "client.overview.avgCompletionRate": "Taux de complétion moyen",
  "client.overview.roomsCleanedPerActivity": "Pièces nettoyées par activité",
  "client.overview.avgResolutionTime": "Temps de résolution moyen",
  "client.overview.issueResolutionTime": "Temps de résolution des incidents",
  "client.overview.issueSlaStatus": "Statut SLA des incidents",
  "client.overview.yourBuildings": "Vos bâtiments",
  "client.overview.noBuildingsConfigured": "Aucun bâtiment configuré pour le moment. Votre prestataire de services s'en chargera pour vous.",
  "client.overview.recentActivities": "Activités récentes",
  "client.overview.noActivities": "Aucune activité de nettoyage pour le moment.",

  // ─── Issue Status ───
  "status.open": "Ouvert",
  "status.inProgress": "En cours",
  "status.resolved": "Résolu",

  // ─── Issue Severity ───
  "severity.low": "Faible",
  "severity.medium": "Moyen",
  "severity.high": "Élevé",

  // ─── Activity Status ───
  "activityStatus.draft": "Brouillon",
  "activityStatus.active": "Active",
  "activityStatus.closed": "Clôturée",
  "activityStatus.cancelled": "Annulée",

  // ─── Task Status ───
  "taskStatus.notStarted": "Non commencée",
  "taskStatus.inProgress": "En cours",
  "taskStatus.done": "Terminée",
  "taskStatus.hasIssues": "Avec incidents",

  // ─── Inspection Status ───
  "inspectionStatus.awaitingInspection": "En attente d'inspection",
  "inspectionStatus.passed": "Réussie",
  "inspectionStatus.failed": "Échouée",

  // ─── Building Status ───
  "buildingStatus.setup": "Configuration",
  "buildingStatus.active": "Actif",
  "buildingStatus.inactive": "Inactif",

  // ─── Locale Switcher ───
  "localeSwitcher.label": "Langue",
}

export default fr
