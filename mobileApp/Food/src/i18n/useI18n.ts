import { useEffect } from 'react';
import { translate, type TranslationKey } from './translations';
import { useLanguageStore, type AppLanguage } from '../store/languageStore';

export function useI18n() {
  const language = useLanguageStore((s) => s.language);
  const isReady = useLanguageStore((s) => s.isReady);
  const hydrate = useLanguageStore((s) => s.hydrate);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  useEffect(() => {
    if (!isReady) {
      void hydrate();
    }
  }, [hydrate, isReady]);

  const t = (key: TranslationKey) => translate(language, key);
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';

  return {
    language,
    setLanguage: (next: AppLanguage) => void setLanguage(next),
    t,
    locale,
    isVietnamese: language === 'vi',
  };
}
