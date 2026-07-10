import React, { createContext, useContext, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// ==========================================
// TYPES & CONTEXTS
// ==========================================

export type ScreenName =
  | "Settings"
  | "Login"
  | "Register"
  | "Dashboard"
  | "ProfileEdit"
  | "CRUDList"
  | "CRUDEdit"
  | "PublicSearch"
  | "AICareer"
  | "AISop"
  | "AdminDashboard"
  | "AdminStudents"
  | "AdminNotifications"
  | "Notifications";

export type CRUDType =
  | "Experiences"
  | "Projects"
  | "Skills"
  | "Certifications"
  | "Resumes"
  | "AcademicRecords"
  | "Olympiads"
  | "StartupCompetitions"
  | "NgoActivities"
  | "SportsAchievements"
  | "CommunityServices"
  | "CreativeWorks";

interface AppContextType {
  screen: ScreenName;
  setScreen: (s: ScreenName) => void;
  screenHistory: ScreenName[];
  navigate: (s: ScreenName) => void;
  goBack: () => void;
  token: string | null;
  setToken: (t: string | null) => void;
  user: any | null;
  setUser: (u: any | null) => void;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  selectedCRUD: CRUDType;
  setSelectedCRUD: (type: CRUDType) => void;
  crudItemToEdit: any | null;
  setCrudItemToEdit: (item: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==========================================
// GLOBAL CONFIGS
// ==========================================

const DEPARTMENTS = [
  "Computer Science",
  "Computer Applications (BCA)",
  "Information Technology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Commerce",
  "Business Administration (BBA)",
  "English",
  "Economics"
];

// ==========================================
// CORE APP WRAPPER
// ==========================================

export default function App() {
  const [screen, setScreenState] = useState<ScreenName>("Settings");
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>(["Settings"]);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>("http://10.0.2.2:3001/api");
  const [selectedCRUD, setSelectedCRUD] = useState<CRUDType>("Projects");
  const [crudItemToEdit, setCrudItemToEdit] = useState<any | null>(null);

  useEffect(() => {
    // Load config on mount
    const loadConfig = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem("MCC_API_URL");
        if (savedUrl) setApiUrlState(savedUrl);

        const savedToken = await AsyncStorage.getItem("MCC_AUTH_TOKEN");
        const savedUser = await AsyncStorage.getItem("MCC_USER");
        if (savedToken && savedUser) {
          setTokenState(savedToken);
          setUser(JSON.parse(savedUser));
          setScreenState("Dashboard");
          setScreenHistory(["Dashboard"]);
        }
      } catch (e) {
        console.error("Error loading config", e);
      }
    };
    loadConfig();
  }, []);

  const setApiUrl = async (url: string) => {
    setApiUrlState(url);
    await AsyncStorage.setItem("MCC_API_URL", url);
  };

  const setToken = async (t: string | null) => {
    setTokenState(t);
    if (t) {
      await AsyncStorage.setItem("MCC_AUTH_TOKEN", t);
    } else {
      await AsyncStorage.removeItem("MCC_AUTH_TOKEN");
      await AsyncStorage.removeItem("MCC_USER");
      setUser(null);
      setScreenState("Login");
      setScreenHistory(["Login"]);
    }
  };

  const navigate = (newScreen: ScreenName) => {
    setScreenHistory((prev) => [...prev, newScreen]);
    setScreenState(newScreen);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const nextHistory = [...screenHistory];
      nextHistory.pop(); // Remove current
      const prevScreen = nextHistory[nextHistory.length - 1];
      setScreenHistory(nextHistory);
      setScreenState(prevScreen);
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen: setScreenState,
        screenHistory,
        navigate,
        goBack,
        token,
        setToken,
        user,
        setUser: async (u) => {
          setUser(u);
          if (u) await AsyncStorage.setItem("MCC_USER", JSON.stringify(u));
        },
        apiUrl,
        setApiUrl,
        selectedCRUD,
        setSelectedCRUD,
        crudItemToEdit,
        setCrudItemToEdit
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScreenRenderer />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppContext.Provider>
  );
}

// ==========================================
// NAVIGATION SCREEN RENDERER
// ==========================================

function ScreenRenderer() {
  const context = useContext(AppContext);
  if (!context) return null;

  switch (context.screen) {
    case "Settings":
      return <SettingsScreen />;
    case "Login":
      return <LoginScreen />;
    case "Register":
      return <RegisterScreen />;
    case "Dashboard":
      return <DashboardScreen />;
    case "ProfileEdit":
      return <ProfileEditScreen />;
    case "CRUDList":
      return <CRUDListScreen />;
    case "CRUDEdit":
      return <CRUDEditScreen />;
    case "PublicSearch":
      return <PublicSearchScreen />;
    case "AICareer":
      return <AICareerScreen />;
    case "AISop":
      return <AISopScreen />;
    case "AdminDashboard":
      return <AdminDashboardScreen />;
    case "AdminStudents":
      return <AdminStudentsScreen />;
    case "AdminNotifications":
      return <AdminNotificationsScreen />;
    case "Notifications":
      return <NotificationsScreen />;
    default:
      return <SettingsScreen />;
  }
}

// ==========================================
// SHARED COMPONENTS & HELPERS
// ==========================================

function Header({ title, showBack = true, rightComponent }: { title: string; showBack?: boolean; rightComponent?: React.ReactNode }) {
  const context = useContext(AppContext);
  return (
    <View style={styles.header}>
      {showBack && context?.screenHistory && context.screenHistory.length > 1 ? (
        <TouchableOpacity style={styles.backButton} onPress={() => context.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {rightComponent || (
          context?.token && (
            <TouchableOpacity onPress={() => context.setToken(null)}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

function BottomTabBar() {
  const context = useContext(AppContext);
  if (!context) return null;

  const current = context.screen;
  const isAdminOrMod = context.user?.role === "Admin" || context.user?.role === "Moderator";

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => context.navigate("Dashboard")}>
        <Ionicons name="home" size={22} color={current === "Dashboard" ? "#6366f1" : "#94a3b8"} />
        <Text style={[styles.tabLabel, current === "Dashboard" && styles.tabLabelActive]}>Portal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => context.navigate("PublicSearch")}>
        <Ionicons name="search" size={22} color={current === "PublicSearch" ? "#6366f1" : "#94a3b8"} />
        <Text style={[styles.tabLabel, current === "PublicSearch" && styles.tabLabelActive]}>Search</Text>
      </TouchableOpacity>

      {isAdminOrMod ? (
        <TouchableOpacity style={styles.tabItem} onPress={() => context.navigate("AdminDashboard")}>
          <Ionicons name="shield-checkmark" size={22} color={current.startsWith("Admin") ? "#6366f1" : "#94a3b8"} />
          <Text style={[styles.tabLabel, current.startsWith("Admin") && styles.tabLabelActive]}>Admin</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.tabItem} onPress={() => context.navigate("Notifications")}>
          <Ionicons name="notifications" size={22} color={current === "Notifications" ? "#6366f1" : "#94a3b8"} />
          <Text style={[styles.tabLabel, current === "Notifications" && styles.tabLabelActive]}>Alerts</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

async function requestApi(url: string, method: string, body: any, token: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

// ==========================================
// 1. SETTINGS / SERVER CONFIG SCREEN
// ==========================================

function SettingsScreen() {
  const context = useContext(AppContext);
  const [urlInput, setUrlInput] = useState(context?.apiUrl || "");

  const handleSave = async () => {
    if (!urlInput.trim()) {
      Alert.alert("Error", "Please input a valid URL");
      return;
    }
    await context?.setApiUrl(urlInput.trim());
    Alert.alert("Saved", "API Base URL configured successfully", [
      { text: "Go to Login", onPress: () => context?.navigate("Login") }
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Server Configuration" showBack={false} />
      <View style={styles.contentContainer}>
        <Ionicons name="wifi" size={80} color="#6366f1" style={styles.centerIcon} />
        <Text style={styles.title}>MCC Platform Link</Text>
        <Text style={styles.subtitle}>
          Set the Next.js local server API URL. For Android Emulator, use 10.0.2.2. For physical devices, use your local network IP (e.g. 192.168.x.x).
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Next.js API Host URL</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://10.0.2.2:3001/api"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Connect Server</Text>
        </TouchableOpacity>

        {context?.token && (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => context.navigate("Dashboard")}>
            <Text style={styles.secondaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ==========================================
// 2. LOGIN SCREEN
// ==========================================

function LoginScreen() {
  const context = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please input both email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await requestApi(
        `${context?.apiUrl}/Auth/login`,
        "POST",
        { email: email.trim(), password },
        null
      );
      if (res.token) {
        await context?.setToken(res.token);
        await context?.setUser(res.user);
        
        if (res.user.isTemporaryPassword) {
          Alert.alert("Temporary Password", "Please update your password on the dashboard for account safety.");
        }
        
        context?.navigate("Dashboard");
      } else {
        Alert.alert("Error", "Unable to sign in. Please verify credentials.");
      }
    } catch (e: any) {
      Alert.alert("Authentication Failed", e.message || "Unable to connect to Next.js API server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Madras Christian College" showBack={false} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Ionicons name="school" size={70} color="#6366f1" style={styles.centerIcon} />
        <Text style={styles.title}>Student Portfolio Portal</Text>
        <Text style={styles.subtitle}>Sign in with your campus credentials to access your showcase dashboard.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Campus Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="student@mcc.edu.in"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Security Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => context?.navigate("Register")} style={styles.linkContainer}>
          <Text style={styles.linkLabel}>New student? Register profile here</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => context?.navigate("Settings")} style={[styles.linkContainer, { marginTop: 15 }]}>
          <Text style={[styles.linkLabel, { color: "#94a3b8" }]}><Ionicons name="settings-outline" /> Server Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 3. REGISTER SCREEN
// ==========================================

function RegisterScreen() {
  const context = useContext(AppContext);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [stream, setStream] = useState("Aided");
  const [loading, setLoading] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !registerNumber.trim()) {
      Alert.alert("Error", "Please fill in all mandatory fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        registerNumber: registerNumber.trim(),
        department,
        stream
      };
      const res = await requestApi(
        `${context?.apiUrl}/Auth/register`,
        "POST",
        payload,
        null
      );
      Alert.alert(
        "Registration Sent",
        "A temporary login password has been sent to your email. Check sent-emails.txt in the backend workspace files.",
        [{ text: "Go to Login", onPress: () => context?.navigate("Login") }]
      );
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message || "Please check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Student Registration" showBack={false} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Create Digital Portfolio</Text>
        <Text style={styles.subtitle}>Enter details to initialize your portfolio dashboard account.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@mcc.edu.in"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Register Number</Text>
          <TextInput
            style={styles.input}
            value={registerNumber}
            onChangeText={setRegisterNumber}
            placeholder="21-CS-001"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Academic Stream</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.flexButton, stream === "Aided" ? styles.selectedFlexButton : null]}
              onPress={() => setStream("Aided")}
            >
              <Text style={styles.flexButtonText}>Aided</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flexButton, stream === "SFS" ? styles.selectedFlexButton : null]}
              onPress={() => setStream("SFS")}
            >
              <Text style={styles.flexButtonText}>Self-Financing (SFS)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Department</Text>
          <TouchableOpacity style={styles.pickerSelector} onPress={() => setShowDeptModal(true)}>
            <Text style={{ color: "#f8fafc" }}>{department}</Text>
            <Ionicons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register Account</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => context?.navigate("Login")} style={styles.linkContainer}>
          <Text style={styles.linkLabel}>Back to Account Login</Text>
        </TouchableOpacity>

        {/* Department Picker Modal */}
        <Modal visible={showDeptModal} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Choose Department</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={styles.modalItem}
                    onPress={() => {
                      setDepartment(dept);
                      setShowDeptModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDeptModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 4. STUDENT PORTAL DASHBOARD SCREEN
// ==========================================

function DashboardScreen() {
  const context = useContext(AppContext);
  const [profile, setProfile] = useState<any>(null);
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndCompleteness = async () => {
    if (!context?.token) return;
    try {
      const pData = await requestApi(`${context.apiUrl}/Profiles`, "GET", null, context.token);
      setProfile(pData);
      
      const analysis = await requestApi(`${context.apiUrl}/AI/career-analysis`, "GET", null, context.token);
      setCompleteness(analysis.profileCompleteness || 20);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCompleteness();
  }, [context?.screen]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Loading Showcase" showBack={false} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
        <BottomTabBar />
      </View>
    );
  }

  const items: { label: string; type: CRUDType; icon: string }[] = [
    { label: "My Projects", type: "Projects", icon: "code-working" },
    { label: "Skills Inventory", type: "Skills", icon: "star" },
    { label: "Certifications", type: "Certifications", icon: "ribbon" },
    { label: "Experiences", type: "Experiences", icon: "briefcase" },
    { label: "Academic Records", type: "AcademicRecords", icon: "school" },
    { label: "Scholar Resumes", type: "Resumes", icon: "document-text" },
    { label: "Community Services", type: "CommunityServices", icon: "people" },
    { label: "Olympiad Ranks", type: "Olympiads", icon: "analytics" },
    { label: "Ngo Activities", type: "NgoActivities", icon: "heart" },
    { label: "Creative Works", type: "CreativeWorks", icon: "color-palette" },
    { label: "Sports Medals", type: "SportsAchievements", icon: "football" },
    { label: "Startup Competitions", type: "StartupCompetitions", icon: "rocket" }
  ];

  return (
    <View style={styles.container}>
      <Header title="MCC Portfolio" showBack={false} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Ionicons name="person-circle" size={60} color="#6366f1" />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{context?.user?.fullName}</Text>
            <Text style={styles.profileDept}>{context?.user?.department} • {context?.user?.stream}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons
                name={profile?.IsApproved ? "checkmark-done-circle" : "alert-circle"}
                size={16}
                color={profile?.IsApproved ? "#22c55e" : "#eab308"}
              />
              <Text style={[styles.verificationText, { color: profile?.IsApproved ? "#22c55e" : "#eab308" }]}>
                {profile?.IsApproved ? "Verified Portfolio" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.dashboardCard}>
          <Text style={styles.cardTitle}>Completeness Index</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completeness}%` }]} />
            </View>
            <Text style={styles.progressValue}>{completeness}%</Text>
          </View>
          <Text style={styles.cardDesc}>Maintain a score above 80% to stand out to verified recruiters.</Text>
        </View>

        {/* Navigation Buttons for AI */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.cardButton, styles.aiCard]} onPress={() => context?.navigate("AICareer")}>
            <Ionicons name="sparkles" size={24} color="#a855f7" />
            <Text style={styles.cardButtonText}>Career Analyzer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardButton, styles.aiCard]} onPress={() => context?.navigate("AISop")}>
            <Ionicons name="create" size={24} color="#a855f7" />
            <Text style={styles.cardButtonText}>SOP AI Writer</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Bio Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => context?.navigate("ProfileEdit")}>
          <Text style={styles.buttonText}><Ionicons name="create-outline" /> Edit Profile Details</Text>
        </TouchableOpacity>

        {/* Dynamic CRUD Grids */}
        <Text style={styles.sectionHeader}>Portfolio Sections</Text>
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => {
                context?.setSelectedCRUD(item.type);
                context?.navigate("CRUDList");
              }}
            >
              <Ionicons name={item.icon as any} size={28} color="#6366f1" />
              <Text style={styles.gridText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

// ==========================================
// 5. PROFILE EDIT / SAVE PROFILE SCREEN
// ==========================================

function ProfileEditScreen() {
  const context = useContext(AppContext);
  const [bio, setBio] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [targetCareer, setTargetCareer] = useState("");
  const [personalStory, setPersonalStory] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Academic");
  const [isAlumni, setIsAlumni] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (!context?.token) return;
      try {
        const res = await requestApi(`${context.apiUrl}/Profiles`, "GET", null, context.token);
        if (res) {
          setBio(res.Bio || "");
          setLinkedInUrl(res.LinkedInUrl || "");
          setGitHubUrl(res.GitHubUrl || "");
          setCgpa(res.CGPA ? res.CGPA.toString() : "");
          setTargetCareer(res.TargetCareer || "");
          setPersonalStory(res.PersonalStory || "");
          setSelectedTheme(res.SelectedTheme || "Academic");
          setIsAlumni(!!res.IsAlumni);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCurrentProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        bio,
        linkedInUrl,
        gitHubUrl,
        cgpa: cgpa || "0",
        targetCareer,
        personalStory,
        selectedTheme,
        isAlumni,
        fullName: context?.user?.fullName // preserves user's current full name
      };

      await requestApi(`${context?.apiUrl}/Profiles`, "POST", payload, context?.token || null);
      Alert.alert("Success", "Profile details updated successfully!");
      context?.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Modify Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Short Bio / Tagline</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Aspiring systems engineer..."
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Career Choice</Text>
          <TextInput
            style={styles.input}
            value={targetCareer}
            onChangeText={setTargetCareer}
            placeholder="Full-Stack Developer, Data Scientist..."
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Cumulative CGPA (scale of 10.0)</Text>
          <TextInput
            style={styles.input}
            value={cgpa}
            onChangeText={setCgpa}
            placeholder="8.5"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>LinkedIn Profile URL</Text>
          <TextInput
            style={styles.input}
            value={linkedInUrl}
            onChangeText={setLinkedInUrl}
            placeholder="https://linkedin.com/in/username"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>GitHub Profile URL</Text>
          <TextInput
            style={styles.input}
            value={gitHubUrl}
            onChangeText={setGitHubUrl}
            placeholder="https://github.com/username"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Personal Story / Statement</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={personalStory}
            onChangeText={setPersonalStory}
            placeholder="Explain your goals, background, or major projects in detail..."
            placeholderTextColor="#64748b"
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Portfolio Accent Theme</Text>
          <View style={styles.row}>
            {["Academic", "Professional", "Creative"].map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[styles.flexButton, selectedTheme === theme ? styles.selectedFlexButton : null]}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text style={styles.flexButtonText}>{theme}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, styles.switchGroup]}>
          <Text style={styles.label}>Are you an Alumnus?</Text>
          <Switch value={isAlumni} onValueChange={setIsAlumni} trackColor={{ true: "#6366f1", false: "#334155" }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save Profiles</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// 6. STUDENT CRUD LIST SCREEN
// ==========================================

function CRUDListScreen() {
  const context = useContext(AppContext);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!context?.token || !context?.selectedCRUD) return;
    setLoading(true);
    try {
      const res = await requestApi(
        `${context.apiUrl}/${context.selectedCRUD}`,
        "GET",
        null,
        context.token
      );
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [context?.selectedCRUD, context?.screen]);

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await requestApi(
              `${context?.apiUrl}/${context?.selectedCRUD}/${id}`,
              "DELETE",
              null,
              context?.token || null
            );
            Alert.alert("Deleted", "Record removed successfully");
            fetchItems();
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete record");
          }
        }
      }
    ]);
  };

  const getCRUDDisplayLabel = (type: CRUDType) => {
    return type.replace(/([A-Z])/g, " $1").trim();
  };

  return (
    <View style={styles.container}>
      <Header title={getCRUDDisplayLabel(context?.selectedCRUD || "Projects")} />
      <View style={styles.listHeaderContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            context?.setCrudItemToEdit(null);
            context?.navigate("CRUDEdit");
          }}
        >
          <Text style={styles.buttonText}><Ionicons name="add" /> Create New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.cardDesc}>No records found. Click 'Create New' to add one.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {items.map((item) => {
            const title = item.Title ?? item.Name ?? item.ResumeTitle ?? item.SportName ?? item.CompetitionName ?? item.OrganizationName ?? "Record Details";
            const subtitle = item.Institution ?? item.Company ?? item.Issuer ?? item.SelectedTheme ?? item.Organization ?? "";
            
            return (
              <View key={item.Id} style={styles.crudCard}>
                <View style={styles.crudDetails}>
                  <Text style={styles.crudTitle}>{title}</Text>
                  {subtitle ? <Text style={styles.crudSubtitle}>{subtitle}</Text> : null}
                  {item.Description ? <Text style={styles.crudDesc}>{item.Description}</Text> : null}
                </View>
                <View style={styles.crudActions}>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => {
                      context?.setCrudItemToEdit(item);
                      context?.navigate("CRUDEdit");
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => handleDelete(item.Id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ==========================================
// 7. STUDENT CRUD CREATE/EDIT FORM SCREEN
// ==========================================

function CRUDEditScreen() {
  const context = useContext(AppContext);
  const type = context?.selectedCRUD || "Projects";
  const item = context?.crudItemToEdit;
  const isEditing = !!item;

  const [loading, setLoading] = useState(false);

  // Form states mapping all tables dynamically
  const [title, setTitle] = useState(item?.Title ?? item?.Name ?? item?.ResumeTitle ?? item?.SportName ?? item?.CompetitionName ?? item?.OrganizationName ?? "");
  const [description, setDescription] = useState(item?.Description ?? "");
  const [tag, setTag] = useState(item?.Technologies ?? item?.Level ?? item?.Subject ?? item?.Issuer ?? item?.Category ?? item?.Role ?? "");
  const [extraVal, setExtraVal] = useState(item?.GithubUrl ?? item?.HoursServed?.toString() ?? item?.HoursContributed?.toString() ?? item?.Rank ?? item?.Result ?? item?.Degree ?? "");
  const [optionalVal, setOptionalVal] = useState(item?.LiveUrl ?? item?.AttachmentUrl ?? item?.CertificateUrl ?? item?.PitchDeckUrl ?? item?.ResumeUrl ?? item?.FieldOfStudy ?? "");

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please input a title or name.");
      return;
    }
    setLoading(true);
    try {
      let body: any = {};
      if (type === "Projects") {
        body = { title, description, technologies: tag, githubUrl: extraVal, liveUrl: optionalVal };
      } else if (type === "Skills") {
        body = { name: title, level: tag, category: extraVal };
      } else if (type === "Certifications") {
        body = { title, issuer: tag, certificateUrl: optionalVal, category: extraVal };
      } else if (type === "Experiences") {
        body = { title, company: tag, description, location: extraVal, startDate: "2023", endDate: "2024", isCurrent: false };
      } else if (type === "AcademicRecords") {
        body = { institution: title, degree: extraVal, fieldOfStudy: optionalVal, grade: tag, startYear: "2020", endYear: "2023" };
      } else if (type === "Resumes") {
        body = { resumeTitle: title, resumeUrl: optionalVal };
      } else if (type === "CommunityServices") {
        body = { title, organization: tag, description, hoursServed: extraVal || "0", attachmentUrl: optionalVal };
      } else if (type === "Olympiads") {
        body = { name: title, subject: tag, rank: extraVal, year: "2023", description, certificateUrl: optionalVal };
      } else if (type === "StartupCompetitions") {
        body = { competitionName: title, projectName: tag, role: extraVal, result: optionalVal, description };
      } else if (type === "NgoActivities") {
        body = { organizationName: title, role: tag, description, hoursContributed: extraVal || "0", certificateUrl: optionalVal };
      } else if (type === "SportsAchievements") {
        body = { sportName: title, level: tag, achievement: extraVal, description, certificateUrl: optionalVal };
      }

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `${context?.apiUrl}/${type}/${item.Id}` : `${context?.apiUrl}/${type}`;

      await requestApi(url, method, body, context?.token || null);
      Alert.alert("Success", `Record ${isEditing ? "updated" : "created"} successfully.`);
      context?.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save record.");
    } finally {
      setLoading(false);
    }
  };

  // Compute form placeholders
  const getFieldLabels = () => {
    switch (type) {
      case "Skills":
        return { title: "Skill Name", tag: "Expertise Level (e.g. Expert)", extra: "Category (e.g. Backend)" };
      case "Certifications":
        return { title: "Certificate Title", tag: "Issuer Organization", extra: "Category", optional: "Certificate PDF URL" };
      case "Experiences":
        return { title: "Role Title", tag: "Company Name", extra: "Location / Mode", description: "Duties & Tech Stack" };
      case "AcademicRecords":
        return { title: "Institution Name", tag: "Grade / Percentage / CGPA", extra: "Degree Name", optional: "Field of Study" };
      case "Resumes":
        return { title: "Resume Title", optional: "File Download URL" };
      default:
        return { title: "Title / Name", tag: "Context / Subheading", extra: "Repository / Value", optional: "Demo Link / PDF Link", description: "Details / Bio" };
    }
  };

  const labels = getFieldLabels();

  return (
    <View style={styles.container}>
      <Header title={isEditing ? "Edit Details" : "Create Record"} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{labels.title}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter name" placeholderTextColor="#64748b" />
        </View>

        {labels.tag ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{labels.tag}</Text>
            <TextInput style={styles.input} value={tag} onChangeText={setTag} placeholder="Enter label details" placeholderTextColor="#64748b" />
          </View>
        ) : null}

        {labels.extra ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{labels.extra}</Text>
            <TextInput style={styles.input} value={extraVal} onChangeText={setExtraVal} placeholder="Value" placeholderTextColor="#64748b" />
          </View>
        ) : null}

        {labels.optional ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{labels.optional}</Text>
            <TextInput style={styles.input} value={optionalVal} onChangeText={setOptionalVal} placeholder="https://..." placeholderTextColor="#64748b" autoCapitalize="none" />
          </View>
        ) : null}

        {labels.description ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{labels.description}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe accomplishments, tools, and impacts..."
              placeholderTextColor="#64748b"
              multiline
            />
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Submit Details</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// 8. PUBLIC SEARCH SCREEN
// ==========================================

function PublicSearchScreen() {
  const context = useContext(AppContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await requestApi(
        `${context?.apiUrl}/Search?query=${encodeURIComponent(query.trim())}`,
        "GET",
        null,
        null
      );
      setResults(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      Alert.alert("Search Failed", "Unable to load search results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const viewStudentDetails = async (id: number) => {
    setLoading(true);
    try {
      const details = await requestApi(`${context?.apiUrl}/Public/${id}`, "GET", null, null);
      setSelectedStudent(details);
      setShowDetailModal(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load public student portfolio details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Ecosystem Search" showBack={false} />
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by student, skill, dept..."
          placeholderTextColor="#64748b"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.cardDesc}>No public student profiles match your query.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {results.map((r) => (
            <TouchableOpacity key={r.id} style={styles.crudCard} onPress={() => viewStudentDetails(r.id)}>
              <View style={styles.crudDetails}>
                <Text style={styles.crudTitle}>{r.fullName}</Text>
                <Text style={styles.crudSubtitle}>{r.department}</Text>
                {r.currentLocation ? <Text style={styles.crudDesc}><Ionicons name="location-outline" /> {r.currentLocation}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Public Student Showcase Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { maxHeight: "85%" }]}>
            <Text style={styles.modalTitle}>{selectedStudent?.user?.fullName}</Text>
            <Text style={styles.modalSub}>{selectedStudent?.user?.department} • {selectedStudent?.user?.stream}</Text>
            <ScrollView style={{ marginVertical: 10 }}>
              <View style={styles.dashboardCard}>
                <Text style={styles.cardTitle}>Bio & Career Target</Text>
                <Text style={styles.cardDesc}>{selectedStudent?.profile?.Bio || "No bio published yet."}</Text>
                <Text style={[styles.cardDesc, { marginTop: 10, fontWeight: "bold" }]}>
                  CGPA: {selectedStudent?.profile?.CGPA ? selectedStudent.profile.CGPA.toFixed(2) : "0.00"}
                </Text>
              </View>

              {/* Projects list */}
              {selectedStudent?.projects?.length > 0 && (
                <View style={styles.detailsGroup}>
                  <Text style={styles.sectionHeader}>Projects</Text>
                  {selectedStudent.projects.map((p: any) => (
                    <View key={p.Id} style={styles.subCard}>
                      <Text style={styles.subCardTitle}>{p.Title}</Text>
                      <Text style={styles.subCardDesc}>{p.Description}</Text>
                      <Text style={styles.subCardTags}>Technologies: {p.Technologies}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Skills list */}
              {selectedStudent?.skills?.length > 0 && (
                <View style={styles.detailsGroup}>
                  <Text style={styles.sectionHeader}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {selectedStudent.skills.map((s: any) => (
                      <View key={s.Id} style={styles.skillBadge}>
                        <Text style={styles.skillBadgeText}>{s.Name} • {s.Level}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Certifications list */}
              {selectedStudent?.certifications?.length > 0 && (
                <View style={styles.detailsGroup}>
                  <Text style={styles.sectionHeader}>Certifications</Text>
                  {selectedStudent.certifications.map((c: any) => (
                    <View key={c.Id} style={styles.subCard}>
                      <Text style={styles.subCardTitle}>{c.Title}</Text>
                      <Text style={styles.subCardDesc}>Issued by: {c.Issuer}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowDetailModal(false)}>
              <Text style={styles.buttonText}>Close Showcase</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </View>
  );
}


// ==========================================
// 10. AI CAREER ANALYZER SCREEN
// ==========================================

function AICareerScreen() {
  const context = useContext(AppContext);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!context?.token) return;
      try {
        const res = await requestApi(
          `${context.apiUrl}/AI/career-analysis`,
          "GET",
          null,
          context.token
        );
        setReport(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Career Analyzer" />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : !report ? (
        <View style={styles.centerContainer}>
          <Text style={styles.cardDesc}>Unable to load analysis report.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Student Career Report</Text>
          <Text style={styles.subtitle}>AI evaluation based on current portfolio entries</Text>

          <View style={styles.dashboardCard}>
            <Text style={styles.cardTitle}>Primary Recommendation</Text>
            <Text style={styles.recommendedCareer}>{report.targetCareer}</Text>
            <Text style={styles.cardDesc}>Match Percentage: {report.skillMatchPercentage}%</Text>
          </View>

          {/* Missing Skills */}
          {report.missingSkills?.length > 0 && (
            <View style={styles.dashboardCard}>
              <Text style={[styles.cardTitle, { color: "#ef4444" }]}><Ionicons name="warning-outline" /> Skills Gap</Text>
              <Text style={styles.cardDesc}>Add these skills to match your target job profile:</Text>
              <View style={styles.skillsContainer}>
                {report.missingSkills.map((s: string) => (
                  <View key={s} style={[styles.skillBadge, { backgroundColor: "#ef444422" }]}>
                    <Text style={[styles.skillBadgeText, { color: "#ef4444" }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Internship Matches */}
          <Text style={styles.sectionHeader}>Recommended Placement Pools</Text>
          {report.internships?.map((intern: any, index: number) => (
            <View key={index} style={styles.subCard}>
              <Text style={styles.subCardTitle}>{intern.Company} • {intern.Role}</Text>
              <Text style={styles.subCardDesc}>{intern.Description}</Text>
              <Text style={[styles.subCardTags, { color: "#22c55e" }]}><Ionicons name="sparkles" /> {intern.MatchReason}</Text>
            </View>
          ))}

          {/* Higher study matches */}
          <Text style={styles.sectionHeader}>Academic Career Recommendations</Text>
          {report.universities?.map((uni: any, index: number) => (
            <View key={index} style={styles.subCard}>
              <Text style={styles.subCardTitle}>{uni.Name} ({uni.Country})</Text>
              <Text style={styles.subCardDesc}>{uni.Program}</Text>
              <Text style={styles.subCardTags}>{uni.Details}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ==========================================
// 11. AI STATEMENT OF PURPOSE WRITER
// ==========================================

function AISopScreen() {
  const context = useContext(AppContext);
  const [tone, setTone] = useState("Academic");
  const [targetPath, setTargetPath] = useState("");
  const [sop, setSop] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSop = async () => {
    setLoading(true);
    try {
      const res = await requestApi(
        `${context?.apiUrl}/AI/generate-sop`,
        "POST",
        { tone, targetPath },
        context?.token || null
      );
      setSop(res.sop || "");
    } catch (e: any) {
      Alert.alert("Generation Failed", e.message || "Failed to contact generator AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="SOP AI Writer" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>AI Statement Generator</Text>
        <Text style={styles.subtitle}>Generates a customized Statement of Purpose document incorporating your accomplishments.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Career/Specialization</Text>
          <TextInput
            style={styles.input}
            value={targetPath}
            onChangeText={setTargetPath}
            placeholder="e.g. Master of Software Engineering, Zoho Product Developer"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Document Tone</Text>
          <View style={styles.row}>
            {["Academic", "Corporate", "Startup"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.flexButton, tone === t ? styles.selectedFlexButton : null]}
                onPress={() => setTone(t)}
              >
                <Text style={styles.flexButtonText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={generateSop}>
            <Text style={styles.buttonText}><Ionicons name="sparkles" /> Generate Statement</Text>
          </TouchableOpacity>
        )}

        {sop ? (
          <View style={[styles.dashboardCard, { marginTop: 20 }]}>
            <Text style={styles.cardTitle}>Generated Document</Text>
            <ScrollView style={{ maxHeight: 350, marginTop: 10 }}>
              <Text style={[styles.cardDesc, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#f1f5f9" }]}>{sop}</Text>
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ==========================================
// 12. ADMIN / MODERATOR MAIN SCREEN
// ==========================================

function AdminDashboardScreen() {
  const context = useContext(AppContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!context?.token) return;
    setLoading(true);
    try {
      const res = await requestApi(`${context.apiUrl}/Admin/dashboard`, "GET", null, context.token);
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [context?.screen]);

  const handleBackup = async () => {
    try {
      const res = await requestApi(`${context?.apiUrl}/Admin/backup`, "GET", null, context?.token || null);
      await AsyncStorage.setItem("MCC_SYSTEM_BACKUP", JSON.stringify(res));
      Alert.alert("Backup Success", "Ecosystem data downloaded and saved locally in secure mobile state storage!");
    } catch (e: any) {
      Alert.alert("Backup Failed", e.message || "Failed to download database backup.");
    }
  };

  const handleRestore = async () => {
    Alert.alert("Confirm Restore", "Are you sure you want to trigger database recovery? This will replace all database content with the last backup payload saved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        style: "destructive",
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem("MCC_SYSTEM_BACKUP");
            if (!raw) {
              Alert.alert("Error", "No local system database backup found in mobile state storage.");
              return;
            }
            await requestApi(`${context?.apiUrl}/Admin/restore`, "POST", JSON.parse(raw), context?.token || null);
            Alert.alert("Success", "Ecosystem database successfully restored to the backup snapshot.");
          } catch (e: any) {
            Alert.alert("Restore Failed", e.message || "Unable to parse and write database backup.");
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Campus Management Panel" showBack={false} />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>System Administration</Text>
          <Text style={styles.subtitle}>Welcome back, {context?.user?.fullName} ({context?.user?.role})</Text>

          {/* Quick Metrics */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.statNumber}>{stats?.totalStudents || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.statNumber}>{stats?.totalProjects || 0}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.statNumber}>{stats?.totalSkills || 0}</Text>
              <Text style={styles.statLabel}>Skills</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.statNumber}>{stats?.totalAchievements || 0}</Text>
              <Text style={styles.statLabel}>Awards</Text>
            </View>
          </View>

          {/* Administrative Menus */}
          <Text style={styles.sectionHeader}>Management Tools</Text>
          <TouchableOpacity style={styles.adminMenuLink} onPress={() => context?.navigate("AdminStudents")}>
            <Ionicons name="people" size={22} color="#6366f1" />
            <Text style={styles.adminMenuText}>Student Portfolios & Verification</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminMenuLink} onPress={() => context?.navigate("AdminNotifications")}>
            <Ionicons name="megaphone" size={22} color="#6366f1" />
            <Text style={styles.adminMenuText}>Broadcast Global Announcements</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Backup/Restore controls (Admin role only) */}
          {context?.user?.role === "Admin" && (
            <>
              <Text style={styles.sectionHeader}>Database Maintenance</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.cardButton, styles.flexButton]} onPress={handleBackup}>
                  <Ionicons name="cloud-download-outline" size={24} color="#22c55e" />
                  <Text style={styles.cardButtonText}>System Backup</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cardButton, styles.flexButton]} onPress={handleRestore}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#ef4444" />
                  <Text style={styles.cardButtonText}>Restore Database</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
      <BottomTabBar />
    </View>
  );
}

// ==========================================
// 13. ADMIN STUDENT LIST & APPROVAL SCREEN
// ==========================================

function AdminStudentsScreen() {
  const context = useContext(AppContext);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!context?.token) return;
    setLoading(true);
    try {
      const res = await requestApi(`${context.apiUrl}/Admin/students`, "GET", null, context.token);
      setStudents(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleApproval = async (studentId: number, currentStatus: boolean) => {
    try {
      await requestApi(
        `${context?.apiUrl}/Admin/approve/${studentId}`,
        "POST",
        (!currentStatus).toString(), // sends "true" or "false" raw body
        context?.token || null
      );
      Alert.alert("Updated", "Student verification status updated.");
      fetchStudents();
    } catch (e: any) {
      Alert.alert("Update Failed", e.message || "Failed to update verification status.");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Student Moderation" />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.cardDesc}>No registered students found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {students.map((st) => (
            <View key={st.id} style={styles.crudCard}>
              <View style={styles.crudDetails}>
                <Text style={styles.crudTitle}>{st.fullName}</Text>
                <Text style={styles.crudSubtitle}>{st.department} ({st.registerNumber})</Text>
                <Text style={[styles.verificationText, { color: st.isApproved ? "#22c55e" : "#eab308" }]}>
                  {st.isApproved ? "Approved Showcase" : "Awaiting Verification"}
                </Text>
              </View>
              <Switch
                value={!!st.isApproved}
                onValueChange={() => toggleApproval(st.id, st.isApproved)}
                trackColor={{ true: "#22c55e", false: "#334155" }}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ==========================================
// 14. ADMIN NOTIFICATION BROADCAST SCREEN
// ==========================================

function AdminNotificationsScreen() {
  const context = useContext(AppContext);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Info");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please input both title and message.");
      return;
    }
    setLoading(true);
    try {
      const payload = { title, message, type };
      await requestApi(`${context?.apiUrl}/Admin/notifications`, "POST", payload, context?.token || null);
      Alert.alert("Broadcast Sent", "Announcement broadcasted successfully to all students.");
      setTitle("");
      setMessage("");
    } catch (e: any) {
      Alert.alert("Broadcast Failed", e.message || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Broadcast Alerts" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Send Announcement</Text>
        <Text style={styles.subtitle}>Broadcast system messages or placement alerts to the campus ecosystem.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Announcement Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Placement Drive Alert" placeholderTextColor="#64748b" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Broadcast Body Message</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Important recruitment dates..."
            placeholderTextColor="#64748b"
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority Type</Text>
          <View style={styles.row}>
            {["Info", "Warning", "Placement"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.flexButton, type === t ? styles.selectedFlexButton : null]}
                onPress={() => setType(t)}
              >
                <Text style={styles.flexButtonText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleBroadcast}>
            <Text style={styles.buttonText}><Ionicons name="send" /> Dispatch Message</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// 15. NOTIFICATIONS SCREEN
// ==========================================

function NotificationsScreen() {
  const context = useContext(AppContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!context?.token) return;
    setLoading(true);
    try {
      const res = await requestApi(`${context.apiUrl}/Notifications/student`, "GET", null, context.token);
      setNotifications(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [context?.screen]);

  const markAsRead = async (id: number) => {
    try {
      await requestApi(`${context?.apiUrl}/Notifications/student/${id}/read`, "POST", null, context?.token || null);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Alerts" showBack={false} />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.cardDesc}>No campus notifications received.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {notifications.map((n) => (
            <TouchableOpacity
              key={n.Id}
              style={[styles.crudCard, n.IsRead ? { opacity: 0.6 } : styles.unreadNotif]}
              onPress={() => !n.IsRead && markAsRead(n.Id)}
              disabled={!!n.IsRead}
            >
              <View style={styles.crudDetails}>
                <View style={styles.row}>
                  <Text style={styles.crudTitle}>{n.Title}</Text>
                  {!n.IsRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.crudDesc}>{n.Message}</Text>
                <Text style={styles.crudSubtitle}>{n.Type} • {new Date(n.CreatedAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <BottomTabBar />
    </View>
  );
}

// ==========================================
// CSS STYLING SHEET
// ==========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  keyboardContainer: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f8fafc"
  },
  headerRight: {
    width: 24,
    alignItems: "flex-end"
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80
  },
  centerIcon: {
    alignSelf: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    color: "#f8fafc",
    fontSize: 16
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top"
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold"
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#475569",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15
  },
  secondaryButtonText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600"
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center"
  },
  linkLabel: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  flexButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center"
  },
  selectedFlexButton: {
    borderColor: "#6366f1",
    backgroundColor: "#6366f122"
  },
  flexButtonText: {
    color: "#f8fafc",
    fontWeight: "600"
  },
  pickerSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    padding: 20
  },
  modalContainer: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 15
  },
  modalSub: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 15
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  modalItemText: {
    color: "#f8fafc",
    fontSize: 16
  },
  modalCloseButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f8fafc"
  },
  profileDept: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4
  },
  dashboardCard: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 8
  },
  cardDesc: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#22c55e"
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#22c55e",
    marginLeft: 12
  },
  cardButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 20
  },
  aiCard: {
    borderColor: "#a855f744",
    backgroundColor: "#a855f708"
  },
  cardButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center"
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f8fafc",
    marginVertical: 15
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 15
  },
  gridText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center"
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8
  },
  tabLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "600"
  },
  tabLabelActive: {
    color: "#6366f1"
  },
  listHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  addButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  crudCard: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  crudDetails: {
    flex: 1,
    paddingRight: 10
  },
  crudTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f8fafc"
  },
  crudSubtitle: {
    fontSize: 13,
    color: "#6366f1",
    marginTop: 2
  },
  crudDesc: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    lineHeight: 16
  },
  crudActions: {
    flexDirection: "row"
  },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "#33415544",
    borderRadius: 6
  },
  searchBarContainer: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center"
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 10,
    color: "#f8fafc",
    marginRight: 10
  },
  searchButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  detailsGroup: {
    marginBottom: 15
  },
  subCard: {
    backgroundColor: "#33415544",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#f8fafc"
  },
  subCardDesc: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 4
  },
  subCardTags: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 6
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5
  },
  skillBadge: {
    backgroundColor: "#6366f122",
    borderWidth: 1,
    borderColor: "#6366f144",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4
  },
  skillBadgeText: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "600"
  },
  leaderboardRank: {
    width: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#94a3b8"
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f111",
    padding: 8,
    borderRadius: 8,
    minWidth: 48
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#818cf8"
  },
  scoreLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "600"
  },
  recommendedCareer: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#a855f7",
    marginVertical: 6
  },
  adminMenuLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  adminMenuText: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1"
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "600"
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12
  },
  unreadNotif: {
    borderColor: "#6366f188",
    backgroundColor: "#6366f108"
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
    marginLeft: 8
  }
});
