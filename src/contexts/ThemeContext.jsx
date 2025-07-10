// src/contexts/ThemeContext.jsx (COMPLETO Y MEJORADO)
import { createContext, useState, useEffect, useMemo, useContext } from 'react';

// Lista de temas disponibles
export const themes = [
  { name: 'celeste', color: '#3B82F6' },
  { name: 'verde', color: '#22C55E' },
  { name: 'rosa', color: '#EC4899' },
  { name: 'blanco', color: '#6B7280' },
  { name: 'oscuro', color: '#374151' },
];

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Leemos el tema guardado en localStorage, o usamos 'celeste' por defecto
    return localStorage.getItem('theme') || 'celeste';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Limpiamos clases de temas anteriores
    themes.forEach(t => root.classList.remove(`theme-${t.name}`));
    root.classList.remove('dark');
    
    // Añadimos la clase del tema actual
    root.classList.add(`theme-${theme}`);
    
    // Si es el tema oscuro, añadimos también la clase 'dark' para compatibilidad
    if (theme === 'oscuro') {
      root.classList.add('dark');
    }
    
    // Guardamos la selección en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};