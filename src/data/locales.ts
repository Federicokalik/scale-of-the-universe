export interface Locale {
  code: string;
  /** The language's own name, shown on the landing page. */
  name: string;
  dir: 'ltr' | 'rtl';
  /** A locale is enabled once its translation file is complete. */
  enabled: boolean;
}

export const LOCALES: readonly Locale[] = [
  { code: 'it', name: 'Italiano', dir: 'ltr', enabled: true },
  { code: 'en', name: 'English', dir: 'ltr', enabled: false },
  { code: 'de', name: 'Deutsch', dir: 'ltr', enabled: false },
  { code: 'nl-BE', name: 'Nederlands (België)', dir: 'ltr', enabled: false },
  { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr', enabled: false },
  { code: 'es', name: 'Español', dir: 'ltr', enabled: false },
  { code: 'fr', name: 'Français', dir: 'ltr', enabled: false },
  { code: 'ru', name: 'Русский', dir: 'ltr', enabled: false },
  { code: 'zh-Hans', name: '简体中文', dir: 'ltr', enabled: false },
  { code: 'ar', name: 'العربية', dir: 'rtl', enabled: false },
  { code: 'ja', name: '日本語', dir: 'ltr', enabled: false },
];

export const ENABLED_LOCALES = LOCALES.filter((l) => l.enabled);
