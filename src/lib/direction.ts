/**
 * Utility: map language code to text direction.
 * Persian/Arabic/Hebrew and similar scripts → rtl, others → ltr
 */
export function getDirFromLang(lang?: string): "rtl" | "ltr" {
  if (!lang) return "ltr";
  const code = lang.toLowerCase();
  return /(fa|ar|he|ur|ckb|ps)/.test(code) ? "rtl" : "ltr";
}

/**
 * Guess language code from navigator or default to 'fa'
 * This is safe on server (Next.js) because it only reads when window exists.
 */
export function getPreferredLang(defaultLang: string = "fa"): string {
  if (typeof window === "undefined") return defaultLang;
  const navLang =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    defaultLang;
  return navLang || defaultLang;
}