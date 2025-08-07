# راهنمای جامع ترجمه‌سازی (i18n) برای Prism Contacts

این سند استانداردهای نام‌گذاری کلیدها، ساختار فایل‌های ترجمه، الگوی استفاده در کد، فرآیند افزودن زبان جدید، و چک‌لیست کیفیت را برای هماهنگی کامل ترجمه‌ها در پروژه تعریف می‌کند.

- نسخه: 1.0
- محدوده: Next.js 15 + React 19 + i18next/react-i18next
- مسیر منابع: public/locales/{lang}/{namespace}.json
- فضای نام (پیشنهادی فعلی): common (در آینده می‌توان به چند namespace شکسته شود)


## 1) اصول نام‌گذاری کلیدها

- ساختار سه‌سطحی توصیه‌شده:
  domain.section.item
  - مثال: analytics.trends.trendChart
  - مثال: settings.admin.actions.push.label

- قواعد:
  - از camelCase برای پارامترها و کلیدهای داخلی استفاده کنید.
  - از واژگان ثابت و روشن برای actionها: label, loading, aria, title, desc, badge, statusLabel, empty, error
  - برای کلیدهای بخش امنیت/تنظیمات از ساختار settings.<area>.<feature>.<key> استفاده کنید.
  - برای متن‌های Accessibility از aria یا title استفاده کنید و سعی کنید همواره معنا محور باشد نه تزئینی.


## 2) ساختار فایل‌های ترجمه

فعلاً از یک namespace به نام common استفاده می‌کنیم. در آینده امکان شکستن به analytics.json, settings.json پیشنهاد می‌شود.

- مسیر فایل‌ها:
  - public/locales/fa/common.json
  - public/locales/en/common.json (در صورت نبود باید ایجاد شود)

- ساختار پیشنهادی common.json:

{
  "sync": {
    "logs": { ... }
  },
  "analytics": {
    "tabs": { ... },
    "overview": {
      "cards": { ... },
      "charts": { ... }
    },
    "demographics": { ... },
    "trends": { ... },
    "activity": { ... },
    "groups": { ... }
  },
  "settings": {
    "admin": {
      "title": "...",
      "statusLabel": "...",
      "lastSync": "...",
      "never": "...",
      "clearConfirm": "...",
      "badge": {
        "conflicts": "...",
        "errors": "...",
        "pending": "...",
        "upToDate": "..."
      },
      "actions": {
        "push": { "label": "...", "loading": "...", "aria": "..." },
        "pull": { "label": "...", "loading": "...", "aria": "..." },
        "clear": { "label": "...", "loading": "...", "aria": "..." }
      }
    },
    "security": {
      "offline": {
        "title": "...",
        "desc": "...",
        "inactivityLabel": "...",
        "inactivityAria": "...",
        "apply": "...",
        "applyAria": "...",
        "currentValue": "...",
        "offlineWindow": "...",
        "until": "...",
        "wrapMethod": "...",
        "extend": "...",
        "extendAria": "...",
        "extendTitleOnline": "...",
        "extendTitleOffline": "..."
      }
    },
    "common": {
      "unknown": "...",
      "extending": "..."
    }
  }
}

- قواعد پارامترها:
  - از {{name}} برای جایگذاری پارامتر استفاده کنید.
  - مثال: "currentValue": "مقدار فعلی: {{minutes}} دقیقه"


## 3) الگوی استفاده در کد

- Client components:
  - از hook زیر استفاده کنید:
    import { useTranslation } from "react-i18next";
    const { t } = useTranslation("common");

- Server components/route handlers:
  - از init-server و getOptions استفاده کنید (مطابق src/i18n/init-server.ts).

- موارد A11y:
  - برای اسکلت‌های لودینگ، از aria-label های پایدار استفاده کنید (loading-...).
  - وقتی نیاز به متن کاربر-محور دارید، از t(...) استفاده کنید و کلید متنی بسازید.

- مثال‌ها:
  - لیبل سکشن:
    <section aria-label={t("analytics.trends.trendChart")}> ... </section>

  - دکمه با حالت لودینگ:
    <Button>{busy ? t("settings.admin.actions.push.loading") : t("settings.admin.actions.push.label")}</Button>

  - پیام وضعیت با پارامتر:
    t("settings.admin.lastSync", { value: ... })


## 4) افزودن زبان جدید

1) مسیر زبان را بسازید:
   public/locales/<lang>/common.json

2) از فایل زبان مبنا (fa/common.json یا en/common.json) یک کپی بگیرید و ترجمه‌ها را تکمیل کنید.

3) در src/i18n/config.ts بررسی کنید که locales شامل زبان جدید باشد:
   export const locales = ["fa", "en", "de"]; // مثال

4) در صورت نیاز LanguageDetector را پیکربندی کنید (init-client).

5) تست کنید:
   - سوییچ زبان (اگر UI دارد) یا با تغییر preferred language مرورگر
   - بررسی رندر SSR/CSR در صفحات اصلی


## 5) فرآیند افزودن کلید ترجمه جدید

- مراحل:
  1) کلید را طبق استاندارد نام‌گذاری مشخص کنید (domain.section.item).
  2) کلید را ابتدا به en/common.json اضافه کنید (زبان مرجع/پایه).
  3) معادل fa/common.json را اضافه کنید.
  4) در کد از t("...") استفاده کنید.
  5) ESLint/TypeScript را اجرا کنید و صفحه مربوطه را دستی تست کنید.
  6) اگر کلید برای aria یا title است، مطمئن شوید معنای قابل دسترس دارد.

- نکته:
  - از قرار دادن متن مستقیم (hard-coded) در JSX اجتناب کنید.


## 6) نگهداری و هم‌ترازی منابع (fa/en)

- وظیفه:
  - هر زمان کلیدی به fa اضافه می‌شود، باید متناظر آن در en نیز افزوده شود.
  - ابزارهای پیشنهادی: diff در IDE، اسکریپت lint سفارشی برای بررسی keys mismatch (اختیاری).

- پیشنهاد ساخت en/common.json (نمونه حداقلی برای parity):
{
  "sync": {
    "logs": {
      "title": "Sync Logs",
      "filter": { "all": "All", "success": "Success", "error": "Error" },
      "exportCsv": "Export CSV",
      "limit": "Limit",
      "refresh": "Refresh",
      "refreshLoading": "Loading...",
      "clear": "Clear Logs",
      "summary": "Showing {{count}} rows • OK: {{ok}} • ERR: {{err}}",
      "table": {
        "id": "ID",
        "started": "Start",
        "ended": "End",
        "duration": "Duration (ms)",
        "status": "Status",
        "endpoint": "Endpoint",
        "window": "Sync Window",
        "push": "Push (attempted/sent/applied/conflicts/errors)",
        "pull": "Pull (contacts up/deletes • groups up/deletes • total)",
        "error": "Error",
        "empty": "No logs found."
      },
      "badge": {
        "ok": "Last sync: OK",
        "warn": "Last sync: OK with warnings • Conflicts: {{conflicts}} • Errors: {{errors}}",
        "err": "Last sync: Error{{detail}}",
        "errDetail": " • Conflicts: {{conflicts}} • Errors: {{errors}}"
      },
      "clearConfirm": "Clear all sync logs?"
    }
  },
  "analytics": {
    "tabs": {
      "overview": "Overview",
      "demographics": "Demographics",
      "groups": "Groups",
      "trends": "Trends",
      "activity": "Activity"
    },
    "overview": {
      "cards": {
        "totalContacts": "Total Contacts",
        "totalGroups": "Total Groups",
        "totalPhones": "Total Phones",
        "withAddress": "With Address",
        "withPosition": "With Position",
        "withNotes": "With Notes",
        "withCustom": "With Custom Field",
        "totalGrowth": "Total Growth",
        "monthlyGrowth": "Monthly Growth"
      },
      "charts": {
        "gender": "Gender Distribution",
        "position": "Position Distribution",
        "customFields": "Custom Fields Usage",
        "phoneType": "Phone Types",
        "noData": "No data to display."
      }
    },
    "demographics": {
      "ageDistribution": "Age Distribution",
      "interactionAnalysis": "Interaction Analysis",
      "loadingAge": "Loading age distribution...",
      "loadingInteraction": "Loading interaction analysis..."
    },
    "trends": {
      "trendChart": "Trend Chart",
      "growthMetrics": "Growth Metrics",
      "loadingTrend": "Loading trend chart...",
      "loadingGrowth": "Loading growth metrics..."
    },
    "activity": {
      "chart": "Hourly Activity",
      "loading": "Loading activity chart..."
    },
    "groups": {
      "distribution": "Groups Distribution",
      "cards": "Group Cards",
      "loadingDistribution": "Loading groups distribution...",
      "loadingCards": "Loading group cards..."
    }
  },
  "settings": {
    "admin": {
      "title": "Advanced Settings",
      "statusLabel": "Status:",
      "lastSync": "Last sync: {{value}}",
      "never": "Never",
      "clearConfirm": "Delete all sync logs?",
      "badge": {
        "conflicts": "Conflicts: {{count}}",
        "errors": "Errors: {{count}}",
        "pending": "Pending: {{count}}",
        "upToDate": "Up to date"
      },
      "actions": {
        "push": { "label": "Push Now", "loading": "Pushing...", "aria": "Run outbox push" },
        "pull": { "label": "Pull Now", "loading": "Pulling...", "aria": "Run delta pull" },
        "clear": { "label": "Clear Logs", "loading": "Clearing...", "aria": "Clear sync logs" }
      }
    },
    "security": {
      "offline": {
        "title": "Offline Security",
        "desc": "Configure inactivity lock and view/extend offline window",
        "inactivityLabel": "Inactivity time to lock (minutes)",
        "inactivityAria": "Inactivity time input",
        "apply": "Apply",
        "applyAria": "Apply inactivity",
        "currentValue": "Current value: {{minutes}} minutes",
        "offlineWindow": "Offline Window",
        "until": "Until: {{value}}",
        "wrapMethod": "Auth Method: {{method}}",
        "extend": "Extend Offline Window",
        "extendAria": "Extend offline window",
        "extendTitleOnline": "Extend offline window (requires online)",
        "extendTitleOffline": "You must be online to extend"
      }
    },
    "common": {
      "unknown": "Unknown",
      "extending": "Extending..."
    }
  }
}

نکته: اگر در پروژه از LanguageDetector استفاده می‌کنید و زبان مرورگر کاربر انگلیسی باشد، لازم است en/common.json وجود داشته باشد تا رشته‌ها خالی نشوند.


## 7) چک‌لیست کیفیت و تست

- هم‌ترازی کلیدها بین fa و en بررسی شود (بدون orphan keys).
- پارامترها ({{count}}, {{value}}, {{minutes}}) در هر دو زبان وجود داشته و نوع/نام یکسان باشد.
- عناوین و aria-label ها معنی‌دار و مرتبط باشند.
- صفحات اصلی تست شوند:
  - Analytics: overview, demographics, trends, activity, groups
  - Settings: admin-sync-panel, report-sync-logs
- در حالت آفلاین/آنلاین، متن‌ها درست باشد (به‌خصوص در Settings).
- رندر SSR/CSR مشکلی نداشته باشد.


## 8) برنامه آینده (Namespace Splitting - پیشنهادی)

برای کاهش حجم منابع و لود پویا:
- analytics.json
- settings.json
- common.json (برای shared/cross-page)

تغییرات موردنیاز:
- src/i18n/config.ts: افزودن namespaces و resourcesToBackend مطابق.
- در useTranslation از namespace مربوطه استفاده شود:
  const { t } = useTranslation("analytics");


## 9) نکات اجرایی

- از هرگونه متن هاردکدشده در JSX پرهیز کنید؛ همه متن‌ها باید به i18n منتقل شوند.
- برای متن‌های ثابت a11y (loading-... IDs) که قرار است توسط ابزارها/تست‌ها استفاده شوند، از شناسه ثابت استفاده کنید. در صورت نیاز به متن قابل ترجمه، کلید متنی نیز اضافه کنید.
- قبل از Merge، فایل en/common.json را با fa/common.json همگام کنید.


## 10) مرجع فایل‌های کلیدی

- Provider و init:
  - ['src/i18n/I18nProvider.tsx'](src/i18n/I18nProvider.tsx)
  - ['src/i18n/init-client.ts'](src/i18n/init-client.ts)
  - ['src/i18n/init-server.ts'](src/i18n/init-server.ts)
  - ['src/i18n/config.ts'](src/i18n/config.ts)

- نمونه‌های استفاده:
  - Analytics:
    - ['src/components/analytics/overview-tab.tsx'](src/components/analytics/overview-tab.tsx)
    - ['src/components/analytics/trends-tab.tsx'](src/components/analytics/trends-tab.tsx)
    - ['src/components/analytics/activity-tab.tsx'](src/components/analytics/activity-tab.tsx)
    - ['src/components/analytics/groups-tab.tsx'](src/components/analytics/groups-tab.tsx)
    - ['src/components/analytics/demographics-tab.tsx'](src/components/analytics/demographics-tab.tsx)
  - Settings:
    - ['src/components/settings/admin-sync-panel.tsx'](src/components/settings/admin-sync-panel.tsx)
    - ['src/components/settings/report-sync-logs.tsx'](src/components/settings/report-sync-logs.tsx)