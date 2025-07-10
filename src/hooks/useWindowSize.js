// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler para llamar en el resize de la ventana
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Añadimos el event listener
    window.addEventListener("resize", handleResize);
    
    // Llamamos al handler inmediatamente para tener el tamaño inicial
    handleResize();
    
    // Limpiamos el listener al desmontar el componente
    return () => window.removeEventListener("resize", handleResize);
  }, []); // El array vacío asegura que este efecto solo se ejecute al montar/desmontar

  return windowSize;
}

export default useWindowSize;