import { createContext, useContext, useEffect, useState } from "react";

const AppSettingsContext = createContext();

export function AppSettingsProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);

    document.body.style.background =
      theme === "dark" ? "#0f172a" : "#f8fafc";

    document.body.style.color =
      theme === "dark" ? "white" : "#0f172a";
  }, [theme]);

  const isDark = theme === "dark";

  const t = {
  en: {
    home: "Home",
    dashboard: "Dashboard",
    notifications: "Notifications",
    history: "History",
    profile: "Profile",
    settings: "Settings",
    help: "Help Center",
    plans: "Plans",
    preferences: "Preferences",
    language: "Language",
    mode: "Mode",
    dark: "Dark",
    light: "Light",
    logout: "Logout",

    welcome: "Welcome",
    online: "Online",
    serialNumber: "Serial Number",
    firmwareVersion: "Firmware Version",
    openDashboard: "Open Dashboard",

    temperature: "Temperature",
    humidity: "Humidity",
    heater: "Heater",
    fan: "Fan",
    condition: "Condition",
    autoMode: "Auto Mode",
    autoModeText: "System controlling environment automatically",

    refreshNotifications: "Refresh Notifications",
    noNotifications: "No notifications yet",

    openAnalysis: "Open Analysis",
    refreshHistory: "Refresh History",
    noHistory: "No history data yet",
    loading: "Loading",

    package: "Package",
    pay: "Pay",
    popular: "Popular",

    commonProblems: "Common Problems",
    commonProblemsText: "Find quick answers to common Smart Brooder problems.",
    needMoreHelp: "Need more help?",
    needMoreHelpText: "Talk to support or join live farmer discussions.",
    whatsappSupport: "WhatsApp Support",
    liveChatCommunity: "Live Chat Community",

    account: "Account",
    support: "Support",
    editProfile: "Edit Profile",
    editProfileDesc: "Update your personal information",
    changePassword: "Change Password",
    changePasswordDesc: "Update account security",
    notificationDesc: "View alerts and warnings",
    helpDesc: "Common problems and support",
    plansDesc: "Manage subscription package",
  },

  rw: {
    home: "Ahabanza",
    dashboard: "Imbonerahamwe",
    notifications: "Amamenyesha",
    history: "Amateka",
    profile: "Umwirondoro",
    settings: "Igenamiterere",
    help: "Ubufasha",
    plans: "Gahunda",
    preferences: "Ibyifuzo",
    language: "Ururimi",
    mode: "Uko bigaragara",
    dark: "Umwijima",
    light: "Urumuri",
    logout: "Sohoka",

    welcome: "Murakaza neza",
    online: "Iri kuri murandasi",
    serialNumber: "Nomero ya system",
    firmwareVersion: "Verisiyo ya firmware",
    openDashboard: "Fungura imbonerahamwe",

    temperature: "Ubushyuhe",
    humidity: "Ububobere",
    heater: "Icyuma gishyushya",
    fan: "Umufana",
    condition: "Imiterere",
    autoMode: "Uburyo bwa Automatic",
    autoModeText: "System iri kugenzura ibidukikije by’inkoko mu buryo bwa automatic",

    refreshNotifications: "Kongera gufata amamenyesha",
    noNotifications: "Nta menyesha ririmo",

    openAnalysis: "Fungura isesengura",
    refreshHistory: "Kongera gufata amateka",
    noHistory: "Nta mateka arahari",
    loading: "Birimo gufunguka",

    package: "Ibikubiyemo",
    pay: "Kwishyura",
    popular: "Ikunzwe",

    commonProblems: "Ibibazo bikunze kubazwa",
    commonProblemsText: "Bona ibisubizo byihuse ku bibazo bikunze kubaho muri Smart Brooder.",
    needMoreHelp: "Ukeneye ubundi bufasha?",
    needMoreHelpText: "Vugana n’abagufasha cyangwa winjire mu kiganiro cy’aborozi.",
    whatsappSupport: "Ubufasha kuri WhatsApp",
    liveChatCommunity: "Ikiganiro cy’aborozi",

    account: "Konti",
    support: "Ubufasha",
    editProfile: "Hindura umwirondoro",
    editProfileDesc: "Hindura amakuru yawe bwite",
    changePassword: "Hindura ijambo ry’ibanga",
    changePasswordDesc: "Kongera umutekano wa konti",
    notificationDesc: "Reba amamenyesha n’imbuzi",
    helpDesc: "Ibibazo bikunze kubazwa n’ubufasha",
    plansDesc: "Genzura gahunda yo kwishyura",
  },
};

  return (
    <AppSettingsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        isDark,
        text: t[language],
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}