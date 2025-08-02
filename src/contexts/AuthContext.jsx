import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../config/firebase-config';
import { createUserDocument } from '../services/firestoreService';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  // --- Renombramos 'loading' para que sea más específico ---
  const [loadingAuth, setLoadingAuth] = useState(true);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserDocument(user.uid, { email: user.email, displayName: user.displayName });
    await updateProfile(user, { photoURL: '/defaults/default-avatar.png' });
    return userCredential;
  };
  
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const loginWithGoogle = async () => {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await createUserDocument(user.uid, { email: user.email, displayName: user.displayName, photoURL: user.photoURL });
    return result;
  };
  
  const logout = () => signOut(auth);

  const updateUserProfile = (profileData) => {
    if (auth.currentUser) return updateProfile(auth.currentUser, profileData);
    return Promise.reject(new Error("No hay usuario autenticado."));
  };

  const changeUserPassword = async (oldPassword, newPassword) => {
    if (auth.currentUser) {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return updatePassword(auth.currentUser, newPassword);
    }
    return Promise.reject(new Error("No hay usuario autenticado."));
  };
  
  const deleteCurrentUserAccount = async (password) => {
    if (auth.currentUser) {
      if (auth.currentUser.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      return deleteUser(auth.currentUser);
    }
    return Promise.reject(new Error("No hay usuario autenticado."));
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
          // La carga termina DESPUÉS de intentar obtener los datos de Firestore
          setLoadingAuth(false);
        }, (error) => {
            console.error("Error al obtener datos del usuario:", error);
            setLoadingAuth(false);
        });
        
        return () => unsubscribeSnapshot();
      } else {
        setUserData(null);
        setLoadingAuth(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  const value = {
    currentUser,
    userData,
    loadingAuth, // <-- Exportamos el estado de carga renombrado
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    changeUserPassword,
    deleteCurrentUserAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {/* --- Condición para esperar la carga --- */}
      {/* No renderizamos el resto de la app hasta que la verificación inicial de Auth haya terminado */}
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};