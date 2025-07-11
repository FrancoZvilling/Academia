/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Mantenemos el modo oscuro basado en clases
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Definimos colores personalizados que serán controlados por variables CSS
      colors: {
        // El prefijo `var()` le dice a Tailwind que use una variable CSS
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        
        // Colores de fondo
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'surface-100': 'rgb(var(--color-surface-100) / <alpha-value>)',
        'surface-200': 'rgb(var(--color-surface-200) / <alpha-value>)',

        // Colores de texto
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-accent': 'rgb(var(--color-text-accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Usaremos una fuente más moderna como Inter
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Plugin para mejorar estilos de formularios
    require('daisyui'), // Plugin para componentes de UI pre-estilizados
    require('@tailwindcss/typography'), // Plugin para mejorar la tipografía
  ],

  // Configuración de DaisyUI (opcional pero muy útil)
  daisyui: {
    themes: false, // Desactivamos los temas por defecto de DaisyUI, usaremos los nuestros
    base: true,
    styled: true,
    utils: true,
  },
};
