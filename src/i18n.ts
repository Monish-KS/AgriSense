import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; // Import Backend

i18n
  .use(Backend) // loads translations from your server
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en', // fallback language is English
    lng: 'en', // default language
    debug: true, // enable debug mode

    interpolation: {
      escapeValue: false // react already safes from xss
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // path to your translation files
    }
  });

export default i18n;