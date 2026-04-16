import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type AuthContextType = {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = async (currentUser: User) => {
    try {
      await setDoc(doc(db, 'profiles', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        full_name: currentUser.displayName || currentUser.email?.split('@')[0],
        avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`
      }, { merge: true });
    } catch (error) {
      console.error("Error upserting profile", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        updateProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to profile changes
  useEffect(() => {
    if (!user) return;
    const unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      }
    });
    return () => unsubscribeProfile();
  }, [user]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
