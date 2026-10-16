import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, AdminEmailDoc } from '../types';

export const SUPER_ADMIN_EMAIL = 'meuangphun_s@silpakorn.edu';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  adminEmails: AdminEmailDoc[];
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addAdminEmail: (email: string) => Promise<void>;
  removeAdminEmail: (id: string) => Promise<void>;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminEmails, setAdminEmails] = useState<AdminEmailDoc[]>([]);

  // Listen to admin_emails collection when user is logged in
  useEffect(() => {
    if (!currentUser) {
      setAdminEmails([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'admin_emails'),
      (snapshot) => {
        const list: AdminEmailDoc[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as AdminEmailDoc);
        });
        setAdminEmails(list);

        // Check if current user is admin either via SUPER_ADMIN_EMAIL or admin_emails list
        const email = currentUser.email?.toLowerCase();
        const isMaster = email === SUPER_ADMIN_EMAIL.toLowerCase();
        const isInAdminList = list.some((a) => a.email.toLowerCase() === email);
        setIsAdmin(isMaster || isInAdminList);
      },
      (error) => {
        console.warn('Admin emails subscription error (non-fatal):', error.message);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);

      if (user) {
        const email = user.email?.toLowerCase();
        const isMaster = email === SUPER_ADMIN_EMAIL.toLowerCase();

        // Check admin status immediately for master
        if (isMaster) {
          setIsAdmin(true);
        }

        // Fetch or create user profile
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
          } else {
            // First time login - auto create profile
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ผู้ใช้งาน',
              photoURL: user.photoURL || '',
              studentId: '',
              department: 'ภาควิชาเทคโนโลยีการศึกษา',
              phone: '',
              role: isMaster ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
          // Fallback in-memory profile so user is not blocked
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'ผู้ใช้งาน',
            photoURL: user.photoURL || '',
            studentId: '',
            department: 'ภาควิชาเทคโนโลยีการศึกษา',
            phone: '',
            role: isMaster ? 'admin' : 'user',
          });
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Gracefully handle user closing or cancelling the popup window without throwing fatal errors
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        console.info('User cancelled or closed the Google Sign-In popup window.');
        return;
      }
      if (error?.code === 'auth/popup-blocked') {
        console.warn('Google Sign-In popup was blocked by browser.');
        alert('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปในเบราว์เซอร์เพื่อเข้าสู่ระบบด้วย Google');
        return;
      }
      console.error('Sign in error:', error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatePayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userDocRef, updatePayload);
      setUserProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addAdminEmail = async (email: string) => {
    if (!currentUser) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    const path = `admin_emails/${cleanEmail}`;
    try {
      const adminDocRef = doc(db, 'admin_emails', cleanEmail);
      await setDoc(adminDocRef, {
        email: cleanEmail,
        addedBy: currentUser.email || 'Admin',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const removeAdminEmail = async (id: string) => {
    if (!currentUser) return;
    const path = `admin_emails/${id}`;
    try {
      const adminDocRef = doc(db, 'admin_emails', id);
      await deleteDoc(adminDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const isSuperAdmin = currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // Prompt profile completion if user hasn't filled in phone or studentId
  const needsProfileCompletion = Boolean(
    currentUser && userProfile && (!userProfile.phone || !userProfile.studentId)
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isSuperAdmin,
        loading,
        adminEmails,
        signInWithGoogle,
        logOut,
        updateProfile,
        addAdminEmail,
        removeAdminEmail,
        needsProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
