import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const AVATARS = Array.from({ length: 10 }, (_, i) => `/avatars/avatar${i + 1}.png`);

const ProfilePage = () => {
    const { currentUser, updateUserProfile, changeUserPassword, deleteCurrentUserAccount } = useAuth();
    const navigate = useNavigate();

    // --- Usamos UNA SOLA instancia de useForm ---
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            displayName: currentUser?.displayName || '',
            // Inicializamos también los campos de contraseña vacíos
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });
    
    const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.photoURL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const onSubmitProfile = async (data) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await updateUserProfile({
                displayName: data.displayName,
                photoURL: selectedAvatar
            });
            setSuccess('¡Perfil actualizado con éxito!');
        } catch (err) {
            setError('No se pudo actualizar el perfil.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onSubmitPassword = async (data) => {
        setLoading(true);
        setError('');
        setSuccess('');
        if (data.newPassword !== data.confirmPassword) {
            setError('Las nuevas contraseñas no coinciden.');
            setLoading(false);
            return;
        }
        try {
            await changeUserPassword(data.oldPassword, data.newPassword);
            setSuccess('¡Contraseña cambiada con éxito!');
            // Reseteamos solo los campos de contraseña
            reset({
                ...watch(), // Mantenemos los otros valores del formulario
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err) {
            setError('No se pudo cambiar la contraseña. Asegúrate de que tu contraseña actual es correcta.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
      const password = prompt("Esta acción es irreversible. Para confirmar, por favor, introduce tu contraseña:");
      if (password) {
        setLoading(true);
        try {
          await deleteCurrentUserAccount(password);
          alert("Tu cuenta ha sido eliminada.");
          navigate('/login');
        } catch (error) {
          setError("No se pudo eliminar la cuenta. La contraseña podría ser incorrecta.");
          console.error(error);
          setLoading(false);
        }
      }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Columna de Perfil y Avatar */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Información Personal</h2>
                    {/* Usamos handleSubmit para el formulario de perfil */}
                    <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre y Apellido</label>
                            <input {...register('displayName', { required: true })} className="input input-bordered w-full dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (no se puede cambiar)</label>
                            <input type="email" value={currentUser?.email} disabled className="input input-bordered w-full dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Elegir Avatar</label>
                            <div className="flex flex-wrap gap-2">
                                {AVATARS.map(avatarUrl => (
                                    <img
                                        key={avatarUrl}
                                        src={avatarUrl}
                                        alt="Avatar"
                                        onClick={() => setSelectedAvatar(avatarUrl)}
                                        className={`w-16 h-16 rounded-full object-cover cursor-pointer transition-all duration-200 ${selectedAvatar === avatarUrl ? 'ring-4 ring-blue-500' : 'hover:scale-110'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary w-full" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                    </form>
                </div>

                {/* Columna de Seguridad */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
                        {/* Usamos handleSubmit para el formulario de contraseña */}
                        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña Actual</label>
                                <input type="password" {...register('oldPassword')} className="input input-bordered w-full dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                                <input type="password" {...register('newPassword', { minLength: 6 })} className="input input-bordered w-full dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nueva Contraseña</label>
                                <input type="password" {...register('confirmPassword')} className="input input-bordered w-full dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                            </div>
                            <button type="submit" className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary hover:border-primary w-full" disabled={loading}>{loading ? 'Cambiando...' : 'Cambiar Contraseña'}</button>
                        </form>
                    </div>
                     <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-500/30 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-200">Zona de Peligro</h2>
                        <p className="text-sm text-red-600 dark:text-red-300 mb-4">Esta acción no se puede deshacer. Perderás todos tus datos permanentemente.</p>
                        <button type="button" onClick={handleDeleteAccount} className="btn bg-red-600 hover:bg-red-700 text-white w-full" disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar mi Cuenta'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;