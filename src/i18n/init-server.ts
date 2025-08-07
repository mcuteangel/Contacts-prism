// Server-side i18next init (for RSC/Route Handlers)
import i18next from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import { ensureBackend, getOptions, defaultLocale, type Locale, type Namespace } from "./config";

let initialized = false;

export async function initI18nServer(lng: Locale = defaultLocale, ns?: Namespace | Namespace[]) {
  if (initialized && i18next.isInitialized) return i18next;

  ensureBackend();

  await i18next.use(initReactI18next).init({
    ...getOptions(lng, ns ?? ["common"]),
    // no language detector on server; pass lng explicitly
  });

  initialized = true;
  return i18next;
}