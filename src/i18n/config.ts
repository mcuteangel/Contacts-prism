// i18next base config for Next.js App Router (client + server)
import i18next, { InitOptions } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export const namespaces = ["common", "analytics", "settings"] as const;
export type Namespace = (typeof namespaces)[number];

export function getOptions(lng: Locale = defaultLocale, ns: Namespace | Namespace[] = "common"): InitOptions {
  return {
    supportedLngs: locales as unknown as string[],
    fallbackLng: defaultLocale,
    lng,
    ns,
    defaultNS: "common",
    fallbackNS: "common",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  };
}

// Shared loader for both client and server
export const backend = resourcesToBackend(
  (lng: string, ns: string) => import(`../../public/locales/${lng}/${ns}.json`)
);

// Singleton pattern to avoid multi-init in the same runtime
let isBackendAdded = false;
export function ensureBackend() {
  if (!isBackendAdded) {
    i18next.use(backend);
    isBackendAdded = true;
  }
  return i18next;
}