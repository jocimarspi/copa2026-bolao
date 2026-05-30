import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  OAuthProvider, 
  signInWithPopup,
  updateProfile,
  User
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  increment 
} from "firebase/firestore";
import { auth, db } from "../firebase";

export interface UserProfile {
  name: string;
  emoji: string;
  unit: string;
  pts: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  admins: string[];
  isAdmin: boolean;
  loading: boolean;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (name: string, unit: string, emoji: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMINS = [
  "luigi.gonzaga@db1.com.br",
  "bruno.rossmann@db1.com.br",
  "jocimar.huss@db1.com.br"
];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>("");

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen for user profile in Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Erro ao escutar perfil:", err);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  // Listen for admins list in Firestore
  useEffect(() => {
    const unsubscribeAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
      const adminList = snapshot.docs.map(doc => doc.id.toLowerCase());
      setAdmins(adminList);
    }, (err) => {
      console.error("Erro ao escutar administradores:", err);
    });

    return () => unsubscribeAdmins();
  }, []);

  // Compute isAdmin state
  useEffect(() => {
    if (!user || !user.email) {
      setIsAdmin(false);
      return;
    }
    const email = user.email.toLowerCase();
    const isSystemAdmin = BOOTSTRAP_ADMINS.includes(email) || admins.includes(email);
    setIsAdmin(isSystemAdmin);
  }, [user, admins]);

  const loginWithMicrosoft = async () => {
    setAuthError("");
    const provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({
      tenant: "ea47001a-3428-40f3-8ea1-86bdb1a3bc84",
      prompt: "select_account"
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Erro no Auth:", err);
      let errorMsg = err.message || "Unknown error";
      if (err.customData && err.customData.serverResponse) {
        try {
          const serverResp = typeof err.customData.serverResponse === "string"
            ? JSON.parse(err.customData.serverResponse)
            : err.customData.serverResponse;
          errorMsg += " | Detalhes: " + JSON.stringify(serverResp);
        } catch (e) {
          errorMsg += " | Detalhes: " + err.customData.serverResponse;
        }
      }
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("auth_login_cancelled");
      } else {
        setAuthError(errorMsg);
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const saveProfile = async (name: string, unit: string, emoji: string) => {
    if (!user) throw new Error("Usuário não logado");
    
    const currentPoints = userProfile?.pts || 0;
    
    await updateProfile(user, { displayName: name, photoURL: emoji || "⚽" });
    
    await setDoc(doc(db, "users", user.uid), { 
      name, 
      emoji: emoji || "⚽", 
      unit, 
      pts: currentPoints 
    }, { merge: true });

    const oldUnit = userProfile?.unit;
    const newUnit = unit;

    if (oldUnit !== newUnit) {
      if (oldUnit) {
        await setDoc(doc(db, "businessUnits", oldUnit), {
          totalPts: increment(-currentPoints),
          memberCount: increment(-1)
        }, { merge: true });
      }
      if (newUnit) {
        await setDoc(doc(db, "businessUnits", newUnit), {
          totalPts: increment(currentPoints),
          memberCount: increment(1)
        }, { merge: true });
      }
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    admins,
    isAdmin,
    loading,
    authError,
    setAuthError,
    loginWithMicrosoft,
    logout,
    saveProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}
