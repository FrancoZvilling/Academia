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
import { auth } from '../config/firebase-config';
import { createUserDocument } from '../services/firestoreService'; // Asegúrate de que esta importación esté presente

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
  const [loading, setLoading] = useState(true);

  // --- FUNCIÓN SIGNUP MODIFICADA ---
  const signup = async (email, password) => {
    // 1. Creamos el usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Creamos su documento correspondiente en Firestore
    await createUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName // Será null al principio
    });

    // 3. Actualizamos su perfil de Auth con el avatar por defecto
    await updateProfile(user, {
      photoURL: '/defaults/default-avatar.png'
    });

    return userCredential;
  };
  
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  // --- FUNCIÓN LOGINWITHGOOGLE MODIFICADA ---
  const loginWithGoogle = async () => {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Al iniciar sesión/registrarse con Google, nos aseguramos de que su documento exista
    await createUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    return result;
  };
  
  const logout = () => signOut(auth);

  const updateUserProfile = (profileData) => {
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, profileData);
    }
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
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
      {!loading && children}
    </AuthContext.Provider>
  );
};