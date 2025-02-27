import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const storedLanguage = sessionStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      ar: { translation: require('./locales/ar.json') },
    },
    lng: storedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    // Add this configuration for RTL support
    react: {
      useSuspense: false,
    },
  });

// Add a language change listener to update the dir attribute
i18n.on('languageChanged', (lng) => {
  const dir = i18n.dir(lng);
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

export default i18n;