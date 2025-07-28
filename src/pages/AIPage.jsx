// src/pages/AIPage.jsx (NUEVO ARCHIVO)
import { FaBrain } from 'react-icons/fa';

const AIPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div 
        className="
          p-10 sm:p-16 
          bg-gradient-to-br from-primary via-secondary to-accent 
          rounded-2xl 
          shadow-2xl 
          flex flex-col items-center 
          text-text-accent"
      >
        <FaBrain size={64} className="mb-6 opacity-80" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Próximamente
        </h1>
        <p className="max-w-md text-lg opacity-90">
          Estamos trabajando en potentes herramientas de Inteligencia Artificial para ayudarte a resumir textos, generar guías de estudio y mucho más. ¡Prepárate para llevar tu aprendizaje al siguiente nivel!
        </p>
      </div>
    </div>
  );
};

export default AIPage;