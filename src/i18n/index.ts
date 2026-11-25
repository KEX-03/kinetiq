import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';

export const resources = {
  en: { translation: en },
} as const;

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: getLocales()[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
