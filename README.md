# Kinetiq

**A free, open-source gym app that works offline.** Log workouts, rest between sets with a lock-screen timer, track personal records and progress charts, and log your body weight. No account, no ads, no internet needed.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020.svg?logo=expo)](https://docs.expo.dev)
![Platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS-lightgrey.svg)

> **Status:** early development. The core workout tracker (Phase 1) is complete and runs as a standalone Android app. iOS works in development and will ship later.

## Features

### Workout logging

- Start a workout, add exercises and log sets in a few taps.
- Each set shows what you did last time, so you know what to beat.
- Bodyweight exercises log reps only, with optional added weight.
- Edit or delete any set. Unfinished workouts survive the app being closed and can be resumed.
- Large tap targets for sweaty hands, and the screen stays awake during a workout.

### Exercise library

- 56 built-in exercises, searchable and filterable by muscle group and equipment.
- Create your own custom exercises.

### Rest timer

- Starts automatically after each set, using your default rest time.
- Add or remove 15 seconds, or skip it.
- A beep and vibration when rest is over, plus an on-time lock-screen notification.
- Keeps running even if the app is closed.

### Progress and records

- Estimated one-rep max (Epley formula) and most-reps charts for every exercise.
- Personal records:
  - heaviest weight
  - best estimated 1RM
  - most reps at each weight
  - best session volume
- New PRs are celebrated as you log them.
- Workout history with duration, sets and volume.

### Body weight

- Log your weight once per day, for today or any past day.
- A daily chart with a 7-day average trend line.

### Your data stays yours

- Everything is stored on your phone in a local database and works fully offline.
- Export all your data to a JSON backup file and import it on another phone.
- No account, no tracking, no ads.

### Settings

- kg or lb: weights are stored in kg and converted for display.
- Default rest time.
- Light, dark or system theme.

## Getting started

### Requirements

- [Node.js](https://nodejs.org) (LTS version)
- A phone with [Expo Go](https://expo.dev/go) installed, or an Android emulator or iOS simulator

### Run it

```bash
git clone https://github.com/KEX-03/kinetiq.git
cd kinetiq
npm install
npm run go
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

- If your phone isn't on the same Wi-Fi as your computer, use `npm run go:tunnel`.
- `npm start` (without `go`) expects a [development build](https://docs.expo.dev/develop/development-builds/introduction/) instead of Expo Go.

### Build a standalone Android app

Builds use [EAS Build](https://docs.expo.dev/build/introduction/) and need a free Expo account:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Open the link EAS gives you on your Android phone to install the APK.

Installing a build on an iPhone requires a paid Apple Developer account.

### Check your changes

```bash
npx tsc --noEmit   # type check
npm run lint       # lint
```

## Tech stack

| Area | Library |
| --- | --- |
| App framework | [Expo](https://expo.dev) (React Native) with TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routes) |
| Storage | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| Translations | [i18next](https://www.i18next.com) + [expo-localization](https://docs.expo.dev/versions/latest/sdk/localization/) |
| Charts | [react-native-gifted-charts](https://gifted-charts.web.app) |
| Rest timer | expo-notifications, expo-audio, expo-haptics, expo-keep-awake |
| Backups | expo-file-system, expo-sharing, expo-document-picker |

## Project structure

```text
src/
├── app/           Screens and navigation (Expo Router: one file per route)
├── components/    Small reusable UI pieces (buttons, cards, inputs, charts)
├── features/      Logic and data access, one folder per feature
│   ├── backup/        Export and import
│   ├── bodyweight/    Body weight log
│   ├── exercises/     Exercise library
│   ├── progress/      Charts and personal records
│   ├── settings/      User preferences
│   ├── timer/         Rest timer and notifications
│   └── workouts/      Workout logging
├── db/            Database client, migrations and built-in exercise data
├── i18n/          Translations (en.json holds every visible string)
└── utils/         Unit conversion, time formatting, 1RM math
```

### Data model

The app is offline-first and is designed so that optional cloud sync can be added later without changing existing data:

- Every table has a UUID `id`, an `updated_at` timestamp (ms) and a `deleted` flag.
- Rows are never removed; they are marked deleted.
- Weights are always stored in kilograms.
- Schema changes are append-only migrations in [`src/db/migrate.ts`](src/db/migrate.ts).

## Roadmap

- [x] **Phase 1: core tracker.** Workouts, exercise library, rest timer, PRs and charts, body weight, backups, standalone Android build.
- [ ] **Phase 2: optional account and cloud sync** across devices.
- [ ] **Later**
  - nutrition tracking and recipes
  - an AI workout buddy
  - more languages
  - iOS release

## Contributing

Bug reports and ideas are welcome. Please [open an issue](https://github.com/KEX-03/kinetiq/issues) first to discuss larger changes. If you send a pull request:

- Run `npx tsc --noEmit` and `npm run lint` before submitting.
- Add every visible text to [`src/i18n/en.json`](src/i18n/en.json) and use `t('...')` instead of hardcoding strings.
- Store weights in kg and use parameterized SQL queries.

**Translations** are a great first contribution: copy `src/i18n/en.json` and translate the values.

## License

[MIT](LICENSE) © 2026 KEX-03
