Status: ready-for-agent

# Multi-language support

## Problem Statement

The **Scorekeeper** can only use the app in English. UI strings are hardcoded in the views and dates are formatted with fixed `en-GB`/`en` locales, so a Finnish-speaking Scorekeeper cannot use the app in their own language.

## Solution

The app ships in English and Finnish. On first load it picks the language from the browser locale (English if unsupported). The Scorekeeper can switch language from Home; the choice persists on the device. All UI text, screen-reader labels and date formatting follow the active language. User-entered data (**Course**, **Layout**, **Player** names) is never translated.

## User Stories

1. As a Finnish-speaking Scorekeeper, I want the app in Finnish, so that I can use it in my own language
2. As a Scorekeeper with a Finnish browser, I want the app to start in Finnish automatically, so that I need no setup
3. As a Scorekeeper with an unsupported browser language, I want English as the fallback, so that the app is still usable
4. As a Scorekeeper, I want to switch language from Home, so that I can override the detected language
5. As a Scorekeeper, I want my language choice remembered after closing the app, so that I don't re-select it
6. As a Scorekeeper, I want the switch to apply immediately without reload, so that I see the result at once
7. As a Scorekeeper, I want every screen (Home, Round start, Round, Courses, Course detail, Players, History, History detail, tab bar) translated, so that the language is consistent
8. As a Scorekeeper, I want dates in History and Home formatted for my language, so that they read naturally
9. As a Scorekeeper, I want my Course, Layout and Player names left exactly as typed, so that my data is unchanged
10. As a screen-reader user, I want aria-labels translated, so that assistive tech speaks my language
11. As a screen-reader user, I want `<html lang>` to match the active language, so that pronunciation is correct
12. As a Scorekeeper, I want counts such as holes to read grammatically in each language, so that text looks correct
13. As a Scorekeeper offline, I want language switching to work without network, so that the offline-first guarantee holds
14. As a developer, I want missing Finnish keys to fail typecheck, so that translations never drift
15. As a developer, I want to add another language by adding one dictionary, so that extension is cheap
16. As a Scorekeeper, I want stored data and Rounds unaffected by language changes, so that switching is safe

## Implementation Decisions

- Custom i18n, no library: one typed English dictionary is the source of truth; other languages must satisfy its type, so missing keys fail typecheck.
- A language provider exposes the active language, a translate accessor, a setter and a locale for `Intl`; mounted above the router/app alongside the storage provider.
- Supported languages: English, Finnish. Default resolution order: stored preference, then browser language prefix match, then English.
- Preference stored in `localStorage` (device UI preference, not domain data); the storage port and ADR-0001 are untouched. Reads/writes tolerate unavailable storage.
- Switcher is a small control on Home; no new tab or Settings screen.
- Dictionary values are strings or small template functions (e.g. hole counts); `Intl.PluralRules` only where a language needs it; no ICU.
- Replace hardcoded `en-GB`/`en` date formatting (History, History detail, Home) with the active locale.
- Translate all aria-labels and screen-reader-only labels; set `document.documentElement.lang` on language change.
- User-entered names are rendered as stored.
- Finnish copy drafted by the agent, reviewed by the user.
- Write an ADR: custom i18n and `localStorage` preference. No glossary term (not a domain term).

## Testing Decisions

- Good tests assert visible behaviour through the UI, not dictionary internals.
- Single seam: render the full `<App/>` with storage, router and language providers (same pattern as `App.test.tsx`).
- Cover: detection from `navigator.language` incl. fallback to English, Home switcher changes visible text and `<html lang>`, persistence across remount via `localStorage`, Finnish date format on a History entry, user-entered names unchanged.
- Key parity is enforced by the type; no runtime test.
- Existing tests keep passing with English as default (no stored preference, English browser locale in the test env).

## Out of Scope

- Languages beyond English and Finnish
- Translating user-entered data
- Right-to-left layouts
- Number/unit localisation beyond dates
- A Settings screen or per-device-sync of the preference
- Changes to the storage port or data schema

## Further Notes

- UI strings currently live inline in the views under `src/views/` and the tab bar; dates use fixed locales in History, History detail and Home.
