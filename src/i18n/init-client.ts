// Client-side i18next init for React components (CSR)
"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { ensureBackend, getOptions, defaultLocale, type Locale } from "./config";

// Initialize i18next on client once
let initialized = false;

export async function initI18nClient(lng: Locale = defaultLocale) {
  if (initialized && i18next.isInitialized) return i18next;

  ensureBackend();

  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      ...getOptions(lng),
      detection: {
        // detect from html lang or navigator
        order: ["htmlTag", "navigator", "cookie", "localStorage"],
      },
    });

  initialized = true;
  return i18next;
}