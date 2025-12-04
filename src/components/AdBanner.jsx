import { useEffect } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';

const AdBanner = () => {
  useEffect(() => {
    const showBanner = async () => {
      try {
        const options = {
          adId: 'ca-app-pub-3940256099942544/6300978111', // TEST ID oficial de Android
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
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
