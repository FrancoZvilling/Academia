// src/contexts/AuthContext.jsx (Código COMPLETO)

import { createContext, useContext, useEffect, useState } from 'react';
import {
  // Importaciones existentes
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, onAuthStateChanged,
  // --- NUEVAS IMPORTACIONES ---
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { auth } from '../config/firebase-config';

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

  // Funciones existentes (signup, login, etc.)
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const loginWithGoogle = () => {
    const googleProvider = new GoogleAuthProvider();
    return signInWithPopup(auth, googleProvider);
  };
  const logout = () => signOut(auth);
  
  // --- NUEVAS FUNCIONES PARA EL PERFIL ---

  /**
   * Actualiza el nombre y/o la foto de perfil del usuario actual.
   * @param {object} profileData - Objeto con { displayName, photoURL }
   */
  const updateUserProfile = (profileData) => {
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, profileData);
    }
    return Promise.reject(new Error("No hay usuario autenticado."));
  };

  /**
   * Cambia la contraseña del usuario actual.
   * Requiere re-autenticación por seguridad.
   * @param {string} oldPassword - La contraseña actual.
   * @param {string} newPassword - La nueva contraseña.
   */
  const changeUserPassword = async (oldPassword, newPassword) => {
    if (auth.currentUser) {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      // Primero, re-autenticamos al usuario para confirmar su identidad
      await reauthenticateWithCredential(auth.currentUser, credential);
      // Si la re-autenticación es exitosa, actualizamos la contraseña
      return updatePassword(auth.currentUser, newPassword);
    }
    return Promise.reject(new Error("No hay usuario autenticado."));
  };
  
  /**
   * Elimina la cuenta del usuario actual.
   * También requiere re-autenticación.
   * @param {string} password - La contraseña actual para confirmar.
   */
  const deleteCurrentUserAccount = async (password) => {
    if (auth.currentUser) {
      // Solo es necesario para proveedores de email/contraseña
      if (auth.currentUser.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      return deleteUser(auth.currentUser);
    }
    return Promise.reject(new Error("No hay usuario autenticado."));
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