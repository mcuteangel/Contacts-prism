"use client";

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { initI18nClient } from "./init-client";
import { defaultLocale, type Locale } from "./config";

export function I18nProvider({ children, locale = defaultLocale }: { children: React.ReactNode; locale?: Locale }) {
  const [instance, setInstance] = useState(i18next);

  useEffect(() => {
    let mounted = true;
    initI18nClient(locale).then((i) => {
      if (mounted) setInstance(i);
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}