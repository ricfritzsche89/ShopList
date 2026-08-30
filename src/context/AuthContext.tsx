import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  runTransaction
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../services/firebase';
import { auth } from '../services/firebase';
import { User, Household } from '../models/types';

interface AuthContextType {
  user: User | null;
  household: Household | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeHousehold: () => void = () => {};
    let unsubscribeUser: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      unsubscribeHousehold();
      unsubscribeUser();

      if (fUser) {
        const userRef = doc(db, 'users', fUser.uid);
        unsubscribeUser = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);

            if (userData.householdId) {
              const householdRef = doc(db, 'households', userData.householdId);
              unsubscribeHousehold = onSnapshot(
                householdRef,
                (householdDoc) => {
                  if (householdDoc.exists()) {
                    setHousehold({ id: householdDoc.id, ...householdDoc.data() } as Household);
                  } else {
                    setHousehold(null);
                  }
                },
                (error) => {
                  console.error('Fehler beim Laden des Haushalts:', error);
                  setHousehold(null);
                }
              );
            } else {
              setHousehold(null);
              unsubscribeHousehold();
            }
          } else {
            setUser(null);
            setHousehold(null);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setHousehold(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeHousehold();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fUser = userCredential.user;
      await updateProfile(fUser, { displayName: name });
      const newUser: User = {
        id: fUser.uid,
        email,
        displayName: name,
        householdId: null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', fUser.uid), newUser);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const { GoogleAuthProvider, signInWithPopup } = require('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fUser = result.user;

        const userRef = doc(db, 'users', fUser.uid);
        const { getDoc } = require('firebase/firestore');
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser: User = {
            id: fUser.uid,
            email: fUser.email || '',
            displayName: fUser.displayName || 'Google-User',
            householdId: null,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUser);
        }
      } else {
        throw new Error('Google Login ist in der App-Version noch nicht konfiguriert. Bitte nutze E-Mail/Passwort.');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  const createHousehold = async (name: string) => {
    if (!firebaseUser) throw new Error('Nicht authentifiziert');
    setLoading(true);
    try {
      const householdRef = doc(collection(db, 'households'));
      const householdId = householdRef.id;
      const newHousehold: Household = {
        id: householdId,
        name,
        createdBy: firebaseUser.uid,
        members: {
          [firebaseUser.uid]: {
            role: 'admin',
            name: firebaseUser.displayName || 'Unbenannt',
          },
        },
        createdAt: new Date().toISOString(),
      };
      await runTransaction(db, async (transaction) => {
        transaction.set(householdRef, newHousehold);
        const userRef = doc(db, 'users', firebaseUser.uid);
        transaction.update(userRef, { householdId });
      });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const joinHousehold = async (householdId: string) => {
    if (!firebaseUser) throw new Error('Nicht authentifiziert');
    setLoading(true);
    try {
      const householdRef = doc(db, 'households', householdId);
      await runTransaction(db, async (transaction) => {
        const householdDoc = await transaction.get(householdRef);
        if (!householdDoc.exists()) throw new Error('Haushalt existiert nicht');
        const data = householdDoc.data() as Household;
        const updatedMembers = {
          ...data.members,
          [firebaseUser.uid]: { role: 'member' as const, name: firebaseUser.displayName || 'Unbenannt' },
        };
        transaction.update(householdRef, { members: updatedMembers });
        const userRef = doc(db, 'users', firebaseUser.uid);
        transaction.update(userRef, { householdId });
      });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const leaveHousehold = async () => {
    if (!firebaseUser || !user || !user.householdId) throw new Error('Kein Haushalt vorhanden');
    setLoading(true);
    try {
      const householdRef = doc(db, 'households', user.householdId);
      await runTransaction(db, async (transaction) => {
        const householdDoc = await transaction.get(householdRef);
        const userRef = doc(db, 'users', firebaseUser.uid);
        if (!householdDoc.exists()) {
          transaction.update(userRef, { householdId: null });
          return;
        }
        const data = householdDoc.data() as Household;
        const updatedMembers = { ...data.members };
        delete updatedMembers[firebaseUser.uid];
        if (Object.keys(updatedMembers).length === 0) {
          transaction.delete(householdRef);
        } else {
          if (data.members[firebaseUser.uid].role === 'admin') {
            const keys = Object.keys(updatedMembers);
            if (keys.length > 0) updatedMembers[keys[0]].role = 'admin';
          }
          transaction.update(householdRef, { members: updatedMembers });
        }
        transaction.update(userRef, { householdId: null });
      });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, household, loading, login, register, loginWithGoogle, logout, createHousehold, joinHousehold, leaveHousehold }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return context;
};
