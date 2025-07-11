// src/components/ui/InstallPWAButton.jsx
import usePWAInstall from '../../hooks/usePWAInstall';
import { FaDownload } from 'react-icons/fa';

const InstallPWAButton = () => {
  const { canInstall, onInstall } = usePWAInstall();

  // Si no se puede instalar, no renderizamos nada
  if (!canInstall) {
    return null;
  }

  // Si se puede, mostramos el botón
  return (
    <button onClick={onInstall} className="btn btn-sm btn-primary ml-auto">
      <FaDownload className="mr-2" />
      Instalar App
    </button>
  );
};

export default InstallPWAButton;