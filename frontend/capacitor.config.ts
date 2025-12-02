import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.veyronparis.app',
  appName: 'Veyron Paris',
  webDir: 'dist',
  server: {
    // En développement, vous pouvez pointer vers votre serveur local
    // url: 'http://192.168.1.X:5173', // Remplacez par votre IP locale pour tester
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
  },
};

export default config;
