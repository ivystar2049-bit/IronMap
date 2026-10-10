# IronMap

A local-first resistance-training tracker. Log sets, see which muscles you have
actually trained over the last 7 days and 4 weeks, and get suggestions for what
has gone cold. Works for a home kit or a commercial gym (300 built-in exercises).

All data stays on your device. There are no accounts, no servers and no analytics.
See [PRIVACY.md](PRIVACY.md).

## Stack
React 19, Vite, Tailwind v4, Capacitor 8 (Android). Design notes are in [DESIGN.md](DESIGN.md).

## Develop
```sh
npm install
npm run dev            # web
npm run build:native   # web bundle for the Android shell
npx cap sync android
cd android && ./gradlew assembleRelease   # needs Java 21
```
Release signing reads `android/keystore.properties` (not in this repo). Without it the
release build is produced unsigned.

## Licence
All rights reserved. See [LICENSE](LICENSE).
