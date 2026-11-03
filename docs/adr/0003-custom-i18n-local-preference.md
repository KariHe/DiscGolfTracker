# Custom i18n with a localStorage language preference

The app supports English and Finnish, with few strings and little pluralisation. We use a typed English dictionary plus a React context (no i18n library): other languages must satisfy the English dictionary's type, so a missing key fails typecheck. Counts and similar are template functions in the dictionary. The language is resolved from the stored preference, then the browser language, then English, and the choice is stored in `localStorage`, not through the Storage port.

## Considered Options

- `react-i18next` — rejected: dependency and runtime key lookup for ~2 languages; revisit if ICU plurals or many languages arrive
- Preference via the Storage port — rejected: it is a device UI preference, not domain data, and would touch ADR-0001's port for no gain

## Consequences

- Adding a language means adding one dictionary, a display name and a locale
- User-entered names (courses, layouts, players) are never translated
- Dates use `Intl` with the active language as locale
