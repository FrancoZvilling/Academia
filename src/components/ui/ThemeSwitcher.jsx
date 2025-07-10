// src/components/ui/ThemeSwitcher.jsx (NUEVO O MODIFICADO)
import { useTheme, themes } from '../../contexts/ThemeContext';
import { FaPalette } from 'react-icons/fa';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <FaPalette className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-secondary">Tema de Color</span>
        </div>
        <div className="flex justify-around items-center bg-surface-200 p-1 rounded-full">
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`w-8 h-8 rounded-full transition-all duration-300 transform ${
                        theme === t.name ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-100' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: t.color }}
                    aria-label={`Cambiar a tema ${t.name}`}
                />
            ))}
        </div>
    </div>
  );
};

export default ThemeSwitcher;