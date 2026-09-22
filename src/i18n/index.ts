import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import pt from './locales/pt'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

// Detecção automática (navigator.language) na primeira visita, com a escolha do usuário
// persistida em localStorage a partir daí — reconhecimento automático só serve como palpite
// inicial, nunca sobrescreve uma escolha manual já feita (no onboarding ou em Configurações).
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: 'pt',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true, // 'en-US' detectado no navegador cai em 'en', etc.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'aurora-language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React já escapa por padrão
    },
  })

export default i18n
