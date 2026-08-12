import { createContext, useContext, useEffect, useState } from "react";

const AppSettingsContext = createContext();

const translations = {
  en: {
    // Navigation
    home: "Home",
    dashboard: "Dashboard",
    analysis: "Analysis",
    notifications: "Notifications",
    history: "History",
    profile: "Profile",
    settings: "Settings",
    systems: "Systems",
    help: "Help Center",
    plans: "Plans",
    logout: "Logout",

    // General
    welcome: "Welcome",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    refresh: "Refresh",
    manage: "Manage",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    update: "Update",
    continue: "Continue",
    back: "Back",
    next: "Next",
    submit: "Submit",
    search: "Search",
    loading: "Loading",
    saving: "Saving...",
    success: "Success",
    error: "Error",
    noData: "No data available",
    retry: "Retry",

    // Settings
    preferences: "Preferences",
    language: "Language",
    languageDesc: "Choose your preferred language",
    theme: "Theme",
    mode: "Appearance",
    modeDesc: "Choose how ANTIMATE looks",
    dark: "Dark",
    light: "Light",
    systemDefault: "System Default",

    // Account
    account: "Account",
    accountSettings: "Account Settings",
    personalInformation: "Personal Information",
    editProfile: "Edit Profile",
    editProfileDesc: "Update your personal information",
    changePassword: "Change Password",
    changePasswordDesc: "Update account security",
    email: "Email",
    phone: "Phone",
    username: "Username",
    password: "Password",

    // Dashboard
    liveBrooderStatus: "Live brooder status",
    temperature: "Temperature",
    humidity: "Humidity",
    heater: "Heater",
    fan: "Fan",
    condition: "Condition",
    connection: "Connection",
    online: "Online",
    offline: "Offline",
    live: "Live",
    disconnected: "Disconnected",
    heating: "Heating",
    standby: "Standby",
    running: "Running",
    off: "Off",
    on: "ON",
    autoMode: "Auto Mode",
    autoModeText:
      "System controlling the environment automatically",
    normal: "Normal",
    temperatureTrend: "Temperature trend",
    lastReadings: "Last readings",
    points: "points",
    waiting: "Waiting",
    openDashboard: "Open Dashboard",

    // Analysis
    brooderAnalysis: "Brooder Analysis",
    environmentalPerformance:
      "Environmental performance from your telemetry data",
    environmentTrend: "Environment Trend",
    latestTelemetry: "Latest telemetry readings",
    maxTemperature: "Max Temperature",
    minTemperature: "Min Temperature",
    averageTemperature: "Average Temperature",
    averageHumidity: "Average Humidity",
    totalRecords: "Total Records",
    noTelemetryData: "No telemetry data available yet.",
    analysisLocked: "Analysis is locked",
    analysisLockedText:
      "Environmental analysis, statistics and telemetry trends are available on Pro and Premium plans.",
    currentPlan: "Current plan",
    refreshAnalysis: "Refresh Analysis",

    // Time ranges
    oneDay: "1 Day",
    oneWeek: "1 Week",
    oneMonth: "1 Month",
    threeMonths: "3 Months",
    sixMonths: "6 Months",
    oneYear: "1 Year",
    customRange: "Custom Range",
    today: "Today",
    yesterday: "Yesterday",

    // Systems
    mySystems: "My Systems",
    manageSystems: "Manage your ANTIMATE systems",
    addSystem: "Add System",
    addSystemDesc: "Register a new system to your account.",
    systemName: "System Name",
    serialNumber: "Serial Number",
    firmwareVersion: "Firmware Version",
    noSystems: "No systems yet",
    noSystemsText: "Add your first ANTIMATE system above.",
    systemsCount: "Systems",
    systemAdded: "System added successfully",
    systemUpdated: "System updated successfully",
    systemDeleted: "System deleted successfully",
    failedLoadSystems: "Failed to load systems",
    failedAddSystem: "Failed to add system",

    // Notifications
    refreshNotifications: "Refresh Notifications",
    noNotifications: "No notifications yet",
    notificationsDesc:
      "You will see important alerts and updates here.",

    // History
    refreshHistory: "Refresh History",
    noHistory: "No history data yet",
    historyDesc:
      "Your system activity and telemetry history will appear here.",

    // Plans
    package: "Package",
    plansTitle: "Plans",
    pay: "Pay",
    popular: "Popular",
    current: "Current",
    free: "Free",
    basic: "Basic",
    pro: "Pro",
    premium: "Premium",
    monthly: "Monthly",
    subscription: "Subscription",
    upgrade: "Upgrade",
    activePlan: "Active Plan",

    // Help
    commonProblems: "Common Problems",
    commonProblemsText:
      "Find quick answers to common Smart Brooder problems.",
    needMoreHelp: "Need more help?",
    needMoreHelpText:
      "Talk to support or join live farmer discussions.",
    whatsappSupport: "WhatsApp Support",
    liveChatCommunity: "Live Chat Community",

    // Profile
    profileInformation: "Profile Information",
    personalDetails: "Personal Details",
    firstName: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    updateProfile: "Update Profile",
    profileUpdated: "Profile updated successfully",

    // Security
    security: "Security",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordUpdated: "Password updated successfully",

    // Support
    support: "Support",
    helpDesc: "Common problems and support",
    plansDesc: "Manage subscription package",
    notificationDesc: "View alerts and warnings",

    // Login
    login: "Login",
    signIn: "Sign In",
    signUp: "Sign Up",
    welcomeBack: "Welcome Back",
    emailUsernamePhone: "Email, Username, or Phone",
    enterPassword: "Enter your password",
    forgotPassword: "Forgot password?",
    signInDashboard: "Sign In to Dashboard",
    loginFailed:
      "Login failed. Please check your credentials.",
    createAccount: "Create Account",
    joinAntimate: "Join ANTIMATE",
    getStarted: "Get Started",

    // Smart Brooder
    smartBrooder: "Smart Brooder",
    smartFarming: "Smart Farming",
    farmManagement: "Farm Management",
    intelligentAgriculture: "Intelligent Agriculture",
    farmProductivity: "Farm Productivity",
    realTimeMonitoring: "Real-time Monitoring",
    intelligentControl: "Intelligent Control",
    dataDrivenFarming: "Data-driven Farming",

    liveBrooderStatus: "Live brooder status",
offline: "Offline",
chicksAge: "Chicks age",
deviceActive: "Device active",
deviceOffline: "Device offline",
last120Minutes: "Last 120 minutes",
readings: "readings",
now: "Now",
time: "Time",
deviceStatus: "Device status",
dataReceived: "data received",
last: "last",
noData: "no data",
on: "ON",
off: "OFF",
heating: "heating",
standby: "standby",
running: "running",
deviceHeartbeat: "Device heartbeat",
receivingData: "Receiving data normally",
noRecentHeartbeat: "No recent heartbeat or telemetry",
noDataReceived: "No data received",
justNow: "Just now",
ago: "ago",
days: "days",
viewDetailedAnalysis: "View detailed analysis",
  },

  rw: {
    // Navigation
    home: "Ahabanza",
    dashboard: "Imbonerahamwe",
    analysis: "Isesengura",
    notifications: "Amamenyesha",
    history: "Amateka",
    profile: "Umwirondoro",
    settings: "Igenamiterere",
    systems: "Systems",
    help: "Ubufasha",
    plans: "Gahunda",
    logout: "Sohoka",

    // General
    welcome: "Murakaza neza",
    save: "Bika",
    cancel: "Hagarika",
    confirm: "Emeza",
    close: "Funga",
    refresh: "Ongera usubiremo",
    manage: "Genzura",
    add: "Ongeramo",
    edit: "Hindura",
    delete: "Siba",
    update: "Kuvugurura",
    continue: "Komeza",
    back: "Subira inyuma",
    next: "Komeza",
    submit: "Ohereza",
    search: "Shakisha",
    loading: "Birimo gutegurwa",
    saving: "Birimo kubikwa...",
    success: "Byagenze neza",
    error: "Ikibazo",
    noData: "Nta makuru ahari",
    retry: "Ongera ugerageze",

    // Settings
    preferences: "Ibyifuzo",
    language: "Ururimi",
    languageDesc: "Hitamo ururimi wifuza gukoresha",
    theme: "Theme",
    mode: "Uko bigaragara",
    modeDesc: "Hitamo uko ANTIMATE igaragara",
    dark: "Umwijima",
    light: "Urumuri",
    systemDefault: "Uko system yabiteganyije",

    // Account
    account: "Konti",
    accountSettings: "Igenamiterere rya konti",
    personalInformation: "Amakuru bwite",
    editProfile: "Hindura umwirondoro",
    editProfileDesc: "Hindura amakuru yawe bwite",
    changePassword: "Hindura ijambo ry'ibanga",
    changePasswordDesc:
      "Hindura umutekano wa konti yawe",
    email: "Email",
    phone: "Telefone",
    username: "Izina ukoresha",
    password: "Ijambo ry'ibanga",

    // Dashboard
    liveBrooderStatus: "Imiterere ya brooder ubu",
    temperature: "Ubushyuhe",
    humidity: "Ububobere",
    heater: "Icyuma gishyushya",
    fan: "Umufana",
    condition: "Imiterere",
    connection: "Uko ihagaze kuri system",
    online: "Iri gukora",
    offline: "Ntabwo iri gukora",
    live: "Iri gukora ubu",
    disconnected: "Ntaho ihuriye",
    heating: "Irimo gushyushya",
    standby: "Itegereje",
    running: "Irimo gukora",
    off: "Yazimye",
    on: "YAKA",
    autoMode: "Uburyo bwikora",
    autoModeText:
      "System igenzura ibidukikije by'inkoko mu buryo bwikora",
    normal: "Bisanzwe",
    temperatureTrend: "Imigendekere y'ubushyuhe",
    lastReadings: "Amakuru aheruka",
    points: "amakuru",
    waiting: "Gutegereza",
    openDashboard: "Fungura imbonerahamwe",

    // Analysis
    brooderAnalysis: "Isesengura rya Brooder",
    environmentalPerformance:
      "Isesengura ry'ibidukikije rishingiye ku makuru yakusanyijwe",
    environmentTrend: "Imigendekere y'ibidukikije",
    latestTelemetry: "Amakuru ya telemetry aheruka",
    maxTemperature: "Ubushyuhe bwo hejuru",
    minTemperature: "Ubushyuhe bwo hasi",
    averageTemperature: "Impuzandengo y'ubushyuhe",
    averageHumidity: "Impuzandengo y'ububobere",
    totalRecords: "Umubare w'amakuru",
    noTelemetryData:
      "Nta makuru ya telemetry arahari.",
    analysisLocked: "Isesengura rifunze",
    analysisLockedText:
      "Isesengura ry'ibidukikije, imibare n'imigendekere y'amakuru biboneka kuri gahunda za Pro na Premium.",
    currentPlan: "Gahunda ukoresha ubu",
    refreshAnalysis: "Ongera ufate amakuru",

    // Time ranges
    oneDay: "Umunsi 1",
    oneWeek: "Icyumweru 1",
    oneMonth: "Ukwezi 1",
    threeMonths: "Amezi 3",
    sixMonths: "Amezi 6",
    oneYear: "Umwaka 1",
    customRange: "Igihe wahisemo",
    today: "Uyu munsi",
    yesterday: "Ejo hashize",

    // Systems
    mySystems: "Systems zanjye",
    manageSystems: "Genzura systems za ANTIMATE",
    addSystem: "Ongeramo System",
    addSystemDesc:
      "Shyira system nshya kuri konti yawe.",
    systemName: "Izina rya System",
    serialNumber: "Nomero ya System",
    firmwareVersion: "Verisiyo ya Firmware",
    noSystems: "Nta system irahari",
    noSystemsText:
      "Ongeraho system yawe ya mbere ya ANTIMATE hejuru.",
    systemsCount: "Systems",
    systemAdded: "System yongeweho neza",
    systemUpdated: "System yavuguruwe neza",
    systemDeleted: "System yasibwe neza",
    failedLoadSystems:
      "Ntibyashobotse kubona systems",
    failedAddSystem:
      "Ntibyashobotse kongeramo system",

    // Notifications
    refreshNotifications:
      "Ongera ufate amamenyesha",
    noNotifications: "Nta menyesha ririmo",
    notificationsDesc:
      "Amakuru y'ingenzi n'imbuzi bizajya bigaragara hano.",

    // History
    refreshHistory: "Ongera ufate amateka",
    noHistory: "Nta mateka arahari",
    historyDesc:
      "Ibikorwa bya system n'amakuru ya telemetry bizajya bigaragara hano.",

    // Plans
    package: "Gahunda",
    plansTitle: "Gahunda",
    pay: "Kwishyura",
    popular: "Ikunzwe",
    current: "Ikoreshwa ubu",
    free: "Ubuntu",
    basic: "Basic",
    pro: "Pro",
    premium: "Premium",
    monthly: "Buri kwezi",
    subscription: "Kwiyandikisha",
    upgrade: "Kuzamura gahunda",
    activePlan: "Gahunda iri gukora",

    // Help
    commonProblems: "Ibibazo bikunze kubaho",
    commonProblemsText:
      "Bona ibisubizo byihuse ku bibazo bikunze kubaho muri Smart Brooder.",
    needMoreHelp: "Ukeneye ubundi bufasha?",
    needMoreHelpText:
      "Vugana n'abagufasha cyangwa winjire mu biganiro by'aborozi.",
    whatsappSupport: "Ubufasha kuri WhatsApp",
    liveChatCommunity: "Ikiganiro cy'aborozi",

    // Profile
    profileInformation: "Amakuru y'umwirondoro",
    personalDetails: "Amakuru yawe bwite",
    firstName: "Izina",
    lastName: "Izina ry'umuryango",
    fullName: "Amazina",
    updateProfile: "Vugurura umwirondoro",
    profileUpdated: "Umwirondoro wavuguruwe neza",

    // Security
    security: "Umutekano",
    currentPassword: "Ijambo ry'ibanga risanzwe",
    newPassword: "Ijambo ry'ibanga rishya",
    confirmPassword:
      "Emeza ijambo ry'ibanga",
    passwordUpdated:
      "Ijambo ry'ibanga ryavuguruwe neza",

    // Support
    support: "Ubufasha",
    helpDesc:
      "Ibibazo bikunze kubazwa n'ubufasha",
    plansDesc:
      "Genzura gahunda yawe yo kwishyura",
    notificationDesc:
      "Reba amamenyesha n'imbuzi",

    // Login
    login: "Kwinjira",
    signIn: "Injira",
    signUp: "Iyandikishe",
    welcomeBack: "Murakaza neza",
    emailUsernamePhone:
      "Email, izina ukoresha cyangwa telefone",
    enterPassword:
      "Andika ijambo ry'ibanga",
    forgotPassword:
      "Wibagiwe ijambo ry'ibanga?",
    signInDashboard:
      "Injira kuri Dashboard",
    loginFailed:
      "Kwinjira ntibyashobotse. Reba amakuru winjije.",
    createAccount: "Fungura konti",
    joinAntimate: "Injira muri ANTIMATE",
    getStarted: "Tangira",

    // Smart Brooder
    smartBrooder: "Smart Brooder",
    smartFarming: "Ubuhinzi bw'ikoranabuhanga",
    farmManagement: "Imicungire y'ubworozi",
    intelligentAgriculture:
      "Ubuhinzi bukoresha ubwenge buhangano",
    farmProductivity:
      "Umusaruro w'ubworozi",
    realTimeMonitoring:
      "Gukurikirana amakuru ako kanya",
    intelligentControl:
      "Igenzura ry'ubwenge",
    dataDrivenFarming:
      "Ubuhinzi bushingiye ku makuru",


      liveBrooderStatus: "Imiterere ya brooder iriho ubu",
offline: "Ntabwo iri kuri murandasi",
chicksAge: "Iminsi imishwi imaze",
deviceActive: "System iri gukora",
deviceOffline: "System ntabwo iri gukora",
last120Minutes: "Iminota 120 ishize",
readings: "ibipimo",
now: "Ubu",
time: "Igihe",
deviceStatus: "Imiterere ya system",
dataReceived: "amakuru yakiriwe",
last: "hashize",
noData: "nta makuru",
on: "YAKA",
off: "ZIMA",
heating: "iri gushyushya",
standby: "itegereje",
running: "iri gukora",
deviceHeartbeat: "Heartbeat ya system",
receivingData: "System iri kwakira amakuru neza",
noRecentHeartbeat: "Nta heartbeat cyangwa telemetry nshya",
noDataReceived: "Nta makuru yakiriwe",
justNow: "Ubu ngubu",
ago: "ashize",
days: "iminsi",
viewDetailedAnalysis: "Reba isesengura rirambuye",
  },
};

export function AppSettingsProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "rw";
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("language", language);

    document.documentElement.lang = language;

    document.body.setAttribute(
      "data-language",
      language
    );
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);

    const isDark = theme === "dark";

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    document.body.setAttribute(
      "data-theme",
      theme
    );

    document.body.style.backgroundColor = isDark
      ? "#0f172a"
      : "#f8fafc";

    document.body.style.color = isDark
      ? "#ffffff"
      : "#0f172a";
  }, [theme]);

  const isDark = theme === "dark";

  const text =
    translations[language] || translations.rw;

  return (
    <AppSettingsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        isDark,
        text,
        translations,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}