import { createContext, useContext, useEffect, useState } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor'; // Removed PurchasesPackage
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error("useSubscription debe ser usado dentro de un SubscriptionProvider");
    }
    return context;
};

export const SubscriptionProvider = ({ children }) => {
    const { currentUser, loadingAuth } = useAuth(); // Usamos loadingAuth para esperar la autenticación
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [offerings, setOfferings] = useState(null);
    const [isConfigured, setIsConfigured] = useState(false);

    // 1. Configuración Inicial de RevenueCat (Solo una vez)
    useEffect(() => {
        const configureRevenueCat = async () => {
            if (!Capacitor.isNativePlatform()) {
                console.log("Web Mode: RevenueCat skipped.");
                setLoading(false);
                return;
            }

            try {
                // Configurar API Key
                await Purchases.configure({ apiKey: "goog_MWIGTKxrfEjbMdprqkamauCGuIf" });

                // Configuración de Debug (Opcional, útil para desarrollo)
                // await Purchases.setLogLevel({ level: "DEBUG" });

                setIsConfigured(true);

                // Escuchar cambios en tiempo real (mientras la app está abierta)
                Purchases.addCustomerInfoUpdateListener((info) => {
                    updatePremiumStatus(info);
                });

                await loadOfferings();
            } catch (error) {
                console.error("Error config RevenueCat:", error);
                setLoading(false);
            }
        };

        if (!isConfigured) {
            configureRevenueCat();
        }
    }, []); // Run once on mount

    // 2. Manejo de Identidad (Login/Logout)
    useEffect(() => {
        const handleIdentity = async () => {
            if (!isConfigured || !Capacitor.isNativePlatform() || loadingAuth) return;

            setLoading(true);
            try {
                if (currentUser) {
                    // Usuario Logueado: Identificar en RevenueCat
                    const { customerInfo } = await Purchases.logIn({ appUserID: currentUser.uid });
                    updatePremiumStatus(customerInfo);
                } else {
                    // Usuario Logout: Resetear o comprobar estado anónimo
                    // await Purchases.logOut(); // Opcional, dependiendo de si quieres mantener el anónimo
                    const info = await Purchases.getCustomerInfo();
                    updatePremiumStatus(info);
                }
            } catch (error) {
                console.error("Error identity RevenueCat:", error);
            } finally {
                setLoading(false);
            }
        };

        handleIdentity();
    }, [currentUser, isConfigured, loadingAuth]);

    // Función auxiliar para actualizar estado
    const updatePremiumStatus = (customerInfo) => {
        if (!customerInfo || !customerInfo.entitlements) return;

        const premiumEntitlement = customerInfo.entitlements.active['premium'];
        const isActive = !!premiumEntitlement;

        console.log(`Subscription Status Check: ${isActive ? 'PREMIUM' : 'FREE'}`);
        setIsPremium(isActive);
    };

    const checkSubscriptionStatus = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            updatePremiumStatus(customerInfo);
        } catch (error) {
            console.error("Error checking status:", error);
        }
    };

    const loadOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current) {
                setOfferings(offerings.current);
            }
        } catch (error) {
            console.error("Error offerings:", error);
        }
    };

    const purchasePremium = async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.info("No disponible en web.");
            return;
        }

        if (!offerings || !offerings.monthly) {
            toast.error("Paquetes no disponibles.");
            return;
        }

        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: offerings.monthly });
            updatePremiumStatus(customerInfo);

            if (customerInfo.entitlements.active['premium']) {
                toast.success("¡Bienvenido a Premium! 🚀");
            }
        } catch (error) {
            if (!error.userCancelled) {
                console.error("Purchase error:", error);
                toast.error("Error en la compra.");
            }
        }
    };

    const restorePurchases = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const customerInfo = await Purchases.restorePurchases();
            updatePremiumStatus(customerInfo);

            if (customerInfo.entitlements.active['premium']) {
                toast.success("Compras restauradas.");
            } else {
                toast.info("No se encontraron compras activas.");
            }
        } catch (error) {
            console.error("Restore error:", error);
            toast.error("Error al restaurar.");
        }
    };

    const value = {
        isPremium,
        checkSubscriptionStatus,
        purchasePremium,
        restorePurchases,
        loading,
        offerings
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext;
