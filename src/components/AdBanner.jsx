import { useEffect } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';

const AdBanner = ({ position = BannerAdPosition.BOTTOM_CENTER }) => {
  useEffect(() => {
    const showBanner = async () => {
      // Esperar 2 segundos para asegurar que AdMob.initialize() en App.jsx haya terminado
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const options = {
          adId: 'ca-app-pub-3940256099942544/6300978111', // TEST ID oficial de Android
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: position,
          margin: 0,
          isTesting: true
        };

        await AdMob.showBanner(options);
      } catch (error) {
        console.error('Error al mostrar el banner:', error);
      }
    };

    showBanner();

    // Limpieza al desmontar (opcional, pero recomendado si el componente se destruye)
    return () => {
      AdMob.hideBanner().catch(err => console.error('Error ocultando banner', err));
    };
  }, []);

  return null; // El banner es nativo, no renderiza nada en el DOM de React
};

export default AdBanner;
