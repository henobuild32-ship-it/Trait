'use client';

import { useAppStore } from '@/lib/store';
import { I18nProvider } from '@/lib/i18n';

export function I18nProviderWrapper({ children }: { children: React.ReactNode }) {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <I18nProvider language={language} setLanguage={setLanguage}>
      {children}
    </I18nProvider>
  );
}
