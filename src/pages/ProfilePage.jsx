import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useConfirm from '../hooks/useConfirm';
import { toast } from 'react-toastify';
import { FaSignOutAlt } from 'react-icons/fa';

const AVATARS = Array.from({ length: 14 }, (_, i) => `/avatars/avatar${i + 1}.png`);

const ProfilePage = () => {
    // CORRECCIÓN: Añadimos 'logout' a la desestructuración de useAuth
    const { currentUser, updateUserProfile, changeUserPassword, deleteCurrentUserAccount, logout } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            displayName: currentUser?.displayName || '',
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });
    
    const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.photoURL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // CORRECCIÓN: Inicializamos el hook de confirmación
    const [ConfirmationDialog, confirm] = useConfirm();

    const handleLogout = async () => {
        const result = await confirm(
          'Cerrar Sesión',
          '¿Estás seguro de que quieres cerrar tu sesión?'
        );
        if (result) {
          try {
            await logout();
            navigate("/login");
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            toast.error("No se pudo cerrar la sesión.");
          }
        }
    };

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
            toast.success('¡Perfil actualizado con éxito!');
        } catch (err) {
            setError('No se pudo actualizar el perfil.');
            toast.error('No se pudo actualizar el perfil.');
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
            toast.error('Las nuevas contraseñas no coinciden.');
            setLoading(false);
            return;
        }
        try {
            await changeUserPassword(data.oldPassword, data.newPassword);
            setSuccess('¡Contraseña cambiada con éxito!');
            toast.success('¡Contraseña cambiada con éxito!');
            reset({
                ...watch(),
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err) {
            setError('No se pudo cambiar la contraseña. Asegúrate de que tu contraseña actual es correcta.');
            toast.error('No se pudo cambiar la contraseña. Revisa tu contraseña actual.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
      const result = await confirm('¿Eliminar Cuenta Permanentemente?', 'Esta acción es irreversible y borrará TODOS tus datos. Para confirmar, haz clic en "Sí, Confirmar" y luego introduce tu contraseña.');
      if (result) {
        const password = prompt("ÚLTIMO PASO: Introduce tu contraseña para confirmar la eliminación definitiva de tu cuenta.");
        if (password) {
          setLoading(true);
          try {
            await deleteCurrentUserAccount(password);
            toast.success("Tu cuenta ha sido eliminada.");
            navigate('/login');
          } catch (error) {
            setError("No se pudo eliminar la cuenta. La contraseña podría ser incorrecta.");
            toast.error("No se pudo eliminar la cuenta. La contraseña podría ser incorrecta.");
            console.error(error);
            setLoading(false);
          }
        }
      }
    };

    return (
        <div>
            {/* CORRECCIÓN: Renderizamos el componente del diálogo de confirmación */}
            <ConfirmationDialog />

            <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

            {/* Reemplazamos los mensajes de error/éxito por toasts, que son más modernos */}
            {/* {error && <div className="...">{error}</div>} */}
            {/* {success && <div className="...">{success}</div>} */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Columna de Perfil y Avatar */}
                <div className="bg-surface-100 p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Información Personal</h2>
                    <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Nombre y Apellido</label>
                            <input {...register('displayName', { required: true })} className="input input-bordered w-full mt-1 bg-surface-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Email (no se puede cambiar)</label>
                            <input type="email" value={currentUser?.email} disabled className="input input-bordered w-full mt-1 bg-surface-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Elegir Avatar</label>
                            <div className="flex flex-wrap gap-2">
                                {AVATARS.map(avatarUrl => (
                                    <img
                                        key={avatarUrl}
                                        src={avatarUrl}
                                        alt="Avatar"
                                        onClick={() => setSelectedAvatar(avatarUrl)}
                                        className={`w-16 h-16 rounded-full object-cover cursor-pointer transition-all duration-200 ${selectedAvatar === avatarUrl ? 'ring-4 ring-primary ring-offset-2 ring-offset-surface-100' : 'hover:scale-110'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary w-full" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>

                    </form>

                    <div className="border-t border-surface-200 mt-6 pt-6">
                        <button 
                            onClick={handleLogout} 
                            className="btn btn-outline w-full"
                        >
                            <FaSignOutAlt className="mr-2" />
                            Cerrar Sesión
                        </button>
                    </div>

                </div>

                {/* Columna de Seguridad */}
                <div className="space-y-8">
                    <div className="bg-surface-100 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
                        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Contraseña Actual</label>
                                <input type="password" {...register('oldPassword')} className="input input-bordered w-full mt-1 bg-surface-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Nueva Contraseña</label>
                                <input type="password" {...register('newPassword', { minLength: 6 })} className="input input-bordered w-full mt-1 bg-surface-100" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary">Confirmar Nueva Contraseña</label>
                                <input type="password" {...register('confirmPassword')} className="input input-bordered w-full mt-1 bg-surface-100" />
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