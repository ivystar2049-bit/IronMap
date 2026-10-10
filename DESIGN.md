# IronMap — Design Reference

A local-first home-gym resistance tracker. Log sets, see which muscles you've actually
worked, close the gaps. No accounts, no backend, no network.

Current release: **v1.4.2** (versionCode 7). ~3,000 lines across `src/`.
This document reflects `main` at `c1df160`.

---

## 1. Product shape

**The problem it solves.** You train at home, you log sets in a notes app or not at all, and
you have no idea whether you've hit your rear delts this month. IronMap turns logged sets
into per-muscle weekly volume, shows it on a body map, and tells you what's cold.

**Core loop:** start a workout → add exercises → log sets → finish. Everything else
(dashboard, body map, history, recommendations) is derived from that one stream of data.

**Deliberately out of scope**, and staying that way:

- Session templates or named workout splits
- Any backend, account system, or sync
- Strava or other integrations
- Cardio, nutrition, bodyweight tracking

**Design principles that have held up:**

1. **Local-first and offline-complete.** Everything is in `localStorage`; the app works in
   aeroplane mode. This is why the native build ships no service worker (see §7).
2. **Nothing blocks logging.** Every suggestion, prompt and panel is ignorable. You can
   always dial the steppers to whatever you actually did.
3. **Derive, don't duplicate.** Sessions are the only source of truth. Volume, trends,
   recency and recommendations are all computed from them at render time.
4. **The user owns their gym.** Equipment, exercises, targets and set weightings are all
   user-editable. Nothing assumes a commercial gym.

---

## 2. Data model

### Storage keys (all `localStorage`, all JSON)

| Key | Shape | Notes |
|---|---|---|
| `ironmap:sessions` | `Session[]` | Completed workouts, **newest first** |
| `ironmap:current` | `Session \| absent` | The in-progress workout; deleted on finish/cancel |
| `ironmap:settings` | `Settings` | Training targets and set weightings |
| `ironmap:customExercises` | `Exercise[]` | User-defined, merged with the built-in library |
| `ironmap:equipment` | `{ owned: string[], custom: Equipment[] }` | Absent = onboarding not done |
| `ironmap:coldPanel` | `boolean` | Collapse state of the cold panel; absent = open |
| `ironmap:schemaVersion` | `number` | Currently `1` |

Access goes through `src/lib/storage.js`, a thin `{get,set,delete}` wrapper that is async in
signature only — so the call sites wouldn't change if a real backend ever appeared.

### Session

```js
{
  date: "2026-08-12T09:14:00.000Z",      // when it started; user-editable in History
  finished: "2026-08-12T10:02:00.000Z",  // set on finish; absent while it's a draft
  entries: [
    { exId: "db_bench", sets: [{ w: 40, r: 10 }, { w: 40, r: 9 }] }
  ]
}
```

`w` is kg (0 for bodyweight). `r` is **reps or seconds** depending on the exercise — the unit
is derived from `logType` at display time, which is why adding timed exercises needed no set
data migration. Entry order is the order you did them, and is user-reorderable mid-session.

Sessions are keyed by `finished || date` (`sessionKey` in `App.jsx`) and sorted newest-first
by parsed `date` on both load and save.

### Exercise

```js
{
  id: "db_bench",
  name: "DB Bench Press",
  equipment: ["dumbbells", "bench"],   // ALL tags required; [] = needs nothing
  load: "external" | "bodyweight",     // drives whether a weight stepper shows
  logType: "reps" | "time",            // drives whether the 2nd stepper is reps or seconds
  secs: 40,                            // default for timed exercises only
  w: 22,                               // starting weight when there's no history
  p: ["chest"],                        // primary muscles
  s: ["front_delts", "triceps"],       // secondary muscles
}
```

**300 exercises** in the built-in library: 43 in `data/exercises.js` (the original core) plus
257 commercial-gym additions in `data/exercisesGym.js` (machines, Smith, landmine, kettlebell,
bands, medicine ball, plyo box, extra barbell/dumbbell/cable variants), spread into `EXERCISES`.
Muscle credit is mapped onto the 18 groups: adductors and glute med/min count as glutes, the
rotator cuff as rear delts, serratus as chest. Note `load` and `logType` are independent — the
loaded carries are both external *and* timed.

`load` is an explicit flag rather than inferred from `w === 0`, because custom exercises are
created with `w: 0` regardless.

### Equipment

```js
{ id: "dumbbells", label: "Dumbbells", group: "free_weights", step: 0.5 }
```

**26 built-in items** in 4 groups, which also own the display colours:

| Group | Colour | Examples |
|---|---|---|
| `free_weights` | `#34D399` | Dumbbells, kettlebell, sandbag, bench |
| `machines` | `#3B82F6` | Cable machine, selectorized/plate-loaded machines, Smith machine |
| `bars` | `#A78BFA` | Barbell, trap bar, EZ bar, pull-up bar, landmine, dip station |
| `conditioning` | `#F472B6` | Battle ropes, plyo box, ab wheel, bands |

`step` is the weight increment, defaulting to `2.5`. Dumbbells are `0.5`, kettlebells `2`.
`weightStepFor(ex)` returns the **smallest** step among an exercise's tags — the limiting
increment. Users can add custom equipment with their own group and step.

### Settings

```js
{ setsLow: 10, setsHigh: 20,       // weekly sets per muscle: target band
  repsLow: 8, repsHigh: 12,        // target rep range; also seeds the reps stepper
  primaryWeight: 1.0,              // set-credit a primary muscle earns per set
  secondaryWeight: 0.5 }           // set-credit a secondary muscle earns per set
```

Clamped by `clampSettings` (`src/lib/settings.js`), which enforces `high > low` and caps the
weightings at 3.

### Muscles

**18 muscles** (`MUSCLES` in `data/exercises.js`) grouped into **6 regions**
(`lib/muscleGroups.js`: chest, back, shoulders, arms, core, legs). Between them the regions
cover every muscle exactly once — no double-counting, nothing dropped.

---

## 3. Derived calculations

All pure, all in `src/lib/`, all recomputed at render time inside one memo in `App.jsx`.

### Volume — `lib/volume.js`

A set on an exercise credits `primaryWeight` to each of its `p` muscles and `secondaryWeight`
to each of its `s`. So one bench set = 1.0 chest + 0.5 front delts + 0.5 triceps.

- `volumesBetween(sessions, exById, weights, from, to)` — per-muscle credit in a date window.
  Buckets by **parsed date**, not array position. Defensive about malformed stored data,
  because it runs during render outside any try/catch.
- `weeklyVolumes` — the last 7 days. `weeklyTrend` — 4 weekly buckets for the Home sparkline.
- `countWorkingSets` — true count of sets performed, where one set counts **once**. Distinct
  from muscle credit, and the two must never be confused (they were, once).
- `completion(vols, muscles, target)` — 0..1, each muscle capped at 100% *before* averaging,
  so hammering one muscle can't mask four untrained ones.
- `ragColor` / `ragLabel` — progress rating. Amber sits at 75% of target, not 50%.
- `heat(v)` — the body map's thermal scale: cold steel → amber → orange → red.
- `suggestFor(muscle, exercises, n)` — `{id, name}[]`, primary movers ranked before secondary.

### Progressive overload — `lib/progression.js`

- `sortSessions` — newest first by parsed date, tie-broken on `finished`. Applied at load and
  in `persistSessions`. This is load-bearing: editing a session's date in History doesn't move
  it in the array, so array order can't be trusted anywhere.
- `bestSet(sets)` — the set to progress from: heaviest, then most reps. Lexicographic, not
  tonnage or e1RM — those rate 40kg×12 above 60kg×5, which isn't how you pick a working weight.
- `lastSessionFor(exId, sessions)` — `{date, sets, best}` of the most recent session containing it.
- `suggestionsFor(ex, best, repsTarget, customEquipment)` — the chips (see §4).
- `plateauFor(exId, sessions, n = 3)` — flags 3 sessions running with no improvement.

### Cold recommender — `lib/recommend.js`

- `lastTrainedDays(sessions, exById, now)` — days since each of the 18 muscles was last
  trained (primary *or* secondary), `Infinity` for never. One pass, early exit.
- `coldScore(vol, days, target)`:

  ```
  deficit   = 1 - min(vol / target, 1)     // 0 at target, 1 untouched
  staleness = min(days / 7, 1)             // 0 today, 1 at a week or never
  score     = deficit * (0.5 + 0.5 * staleness)
  ```

  Multiplying by `deficit` makes "under target **and** stale" a real conjunction: at target
  scores 0 however long ago you trained it. The `0.5` floor is why it isn't a pure product —
  one set this morning shouldn't make a muscle sitting at 1/10 look warm.
- `coldMuscles(vols, lastDays, target, limit)` — coldest first. Ties (common on a sparse
  history, since staleness saturates at 7 days) break on raw days-since, then volume, then
  muscle key — fully deterministic, so the order never jitters between renders.

### Availability — `lib/availability.js`

The single shared rule: an exercise is available if the user owns **every** tag in its
`equipment` array. An empty or absent profile shows everything unfiltered. Used by the
picker, the body screen and the cold panel, so they can never disagree.

---

## 4. Screens

Three tabs (`BottomNav`) plus modal panels.

### Home (`LogScreen.jsx`)

**Dashboard state** — when no session is open:
- *This week*: working sets and muscles-on-target, both tappable (→ History, → Body/Gaps),
  with a RAG-coloured percentage
- *By region · this week*: 6 region rows, tappable to that region's weakest muscle
- *Last 4 weeks*: sparkline plus the same region rollup
- Start / Resume workout

**Session state** — when a workout is open:
- Entry list with per-exercise set summaries; reorder mode when there's more than one
- **Cold panel** (§5) above Add exercise
- Add exercise · Save as draft · Cancel · Finish workout

**Exercise state** (`ExerciseLogger.jsx`) — the logging screen. Scrolling content:
- Name, muscle chips, tutorial search link (an image only renders if the exercise actually
  has an `imageUrl` — no built-in does)
- *Last time*: date and every set of the previous session, best one marked
- **Suggestion chips** — `Repeat`, `+1 rep`, `+2.5kg`, with the recommended one highlighted
- Plateau note, if flagged
- Weight stepper (hidden for bodyweight) and reps-or-seconds stepper, the rep target carried
  in the stepper's own label
- Sets-this-session pills with Undo last

Pinned above the tab bar: **Log set**, plus **Next exercise** / **Finish** side by side (the
latter two only in a live session). Log set is the one control touched on every set, so it's
`position: fixed` rather than in flow — content length, a long exercise name and the system
font scale can then never push it under the fold. `NAV_H` in `lib/theme.js` is the shared
constant tying the bar's offset to `BottomNav`'s height; the logger sets its own bottom
padding from it and both parents drop their nav clearance while it's open.

### Body (`BodyScreen.jsx`)

- Front and back **body map** (`BodyMap.jsx`, SVG with radial-gradient glow), heat-coloured by
  the last 7 days, tappable per muscle
- Selected-muscle card: volume vs target, status, "do more of" suggestions
- **Gaps to close**: every under-target muscle, ordered by the same cold score as the panel,
  each with days-since, suggestions and a progress bar

### History (`HistoryScreen.jsx` / `SessionDetail.jsx`)

- Session list, newest first
- Session detail: editable date, add/edit/remove exercises, delete session
- Reset all data

### Modal panels

`SettingsPanel` (targets, weightings, → Your equipment, → Your exercises, Reset to defaults),
`EquipmentPanel`, `ExerciseManager`, `ExercisePicker`, `EquipmentOnboarding` (one skippable
first-run screen).

---

## 5. Feature behaviours worth knowing

### Progressive overload chips

**Double progression**, using the rep range from Settings:

| Situation | Chips (→ = recommended) |
|---|---|
| Reps, loaded, below `repsHigh` | `Repeat` · →`+1 rep` · `+2.5kg` |
| Reps, loaded, at `repsHigh` | `Repeat` · `+1 rep` · →`42.5kg × 8` (weight up, reps to `repsLow`) |
| Reps, bodyweight | `Repeat` · →`+1 rep` |
| Timed, bodyweight | `Repeat` · →`+5s` |
| Timed, loaded | `Repeat` · →`+5s` · `+2.5kg` |

Weight increments come from `weightStepFor(ex)`, never a flat number. **Chips pre-fill only** —
they set the steppers and never log. No history for an exercise means no chips at all.

Chips appear in the live session only. In History you're editing a past workout, so
"progress from last time" would compare against a *newer* session.

The steppers seed from the current session's own last set if there is one, otherwise from
last time's best set, otherwise from the exercise defaults.

### Plateau flag

Three sessions running where none beats the one before shows one quiet muted line. Because
"better" is weight-then-reps, the app's own `40×12 → 42.5×8` suggestion reads as progress, so
following the advice can never trip the detector.

### Cold panel

Top 3 coldest muscles with up to 2 tappable exercises each, above Add exercise. Collapsible,
state persisted. A cold muscle with **no available exercise** is skipped here and falls through
to the next — a suggestion you can't act on is noise. Gaps to close still lists it as
"Nothing in your kit trains this", because there the point is knowing.

### Equipment filtering

Unavailable exercises are hidden from the picker behind a "Show N needing kit you don't have"
toggle, which reveals them greyed with the missing items named. An empty profile shows
everything. `profile.gym` ("At a commercial gym", Settings > Your equipment, also an At home / At the gym switch on the Log home screen) makes
`ownedSetFrom` return every equipment id without touching the saved `owned` home kit, so
switching it off restores the home profile exactly.

---

## 6. Visual language

Dark, industrial, molten-iron accent. All styling is **inline style objects** — no CSS
modules, no styled-components. Tailwind v4 is present but used only for a handful of flex
utilities.

### Palette (`lib/theme.js`)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#14171C` | Page |
| `surface` | `#1E232B` | Cards |
| `raised` | `#272E38` | Buttons, chips, steppers |
| `line` | `#333B46` | Borders |
| `text` | `#EDEFF2` | Primary text |
| `muted` | `#8A94A3` | Secondary text |
| `accent` | `#FF6B35` | Molten iron — primary actions |
| `accentDim` | `#7A3A1E` | Recommended/selected chip fill |
| `danger` | `#E5484D` | Destructive actions |
| `warn` | `#F08A24` | Reversible but easy-to-miss actions (Undo last) — orange so it never reads as destructive |
| `rag.red/amber/green` | `#E5484D` / `#F59E0B` / `#3DD68C` | Progress rating (dashboard only) |

Three reds exist deliberately and mean different things: `danger` is "this throws work away",
`rag.red` is "neglected", and `heat()`'s red is "hammered". They should not be merged.

### Type

- Display: **Barlow Condensed** (self-hosted woff2, weights 500/600/700), uppercase with
  letter-spacing for headings, numbers and buttons
- Body: system UI stack

### Component conventions

- `card()` and `bigBtn()` in `lib/styleHelpers.js` are the two base treatments
- `dangerBtn()` is the outlined destructive treatment — an outline, not a filled block, so it
  reads as serious without competing with the primary action beside it
- `Chip.jsx` is a **non-interactive** `<span>` for labels. Tappable chips are their own
  components (`SuggestionChips.jsx`, and inline in `ColdPanel`)
- Destructive controls are all `C.danger`: Cancel, Delete session, Reset all data, the
  logger's Delete, and the custom-exercise/equipment trash icons. **"Reset to defaults" in
  Settings is deliberately not** — it only restores training targets and destroys no data;
  making it red would cry wolf.
- Native `confirm()` guards every destructive action

---

## 7. Architecture and build

### Stack

React 19.2 · Vite 8.2 · Tailwind v4 (`@tailwindcss/vite`) · lucide-react ·
vite-plugin-pwa 1.3 · Capacitor 8.5 (Android). **Plain JavaScript, no TypeScript.**

### State

All state lives in `App.jsx` and flows down as props — no context, no reducer, no state
library. At ~3,000 lines this is still comfortable; a state library would be the first thing
to reach for if `App.jsx` keeps growing.

Every persist function follows the same shape: set React state, then write to storage,
catching and logging failures rather than throwing.

### File layout

```
src/
  App.jsx                 all state, all persistence, all wiring
  data/
    exercises.js          MUSCLES, EXERCISES, weightStepFor, isBodyweight, isTimed
    equipment.js          EQUIPMENT, EQUIPMENT_GROUPS, colours
  lib/
    volume.js             muscle credit, completion, RAG, heat, suggestFor
    progression.js        session sorting, bestSet, overload chips, plateau
    recommend.js          recency scan, cold scoring
    availability.js       the one equipment rule
    migrate.js            schema versioning
    settings.js  storage.js  theme.js  styleHelpers.js
    muscleGroups.js  bodyMapShapes.js  bodyOutline.js  color.js  tutorial.js
  components/             ~20 presentational components
```

### Two build targets

```
npm run build          → web/PWA, service worker enabled
npm run build:native   → Capacitor APK assets, NO service worker
```

The service worker is deliberately absent from the native build. Inside a WebView the assets
are already local, so it adds nothing — but its precache **outlives an APK upgrade**, so it
can keep serving the previous JS bundle after the user installs a new version.

`base: './'` so assets resolve against the WebView's local origin.

### Android release

```
npm run build:native && npx cap sync android
cd android && ./gradlew assembleRelease
```

**Two invariants that must never change**, or every existing user loses their logged data:

1. **Signing certificate SHA-256 `90540a88f68ef8950476b7abe0d5c0a02ba097d7e147b422322633cd96ce5263`.**
   Android rejects an APK signed with a different key; users would have to uninstall, which
   wipes `localStorage`. The keystore and `keystore.properties` are gitignored and backed up
   separately — anyone holding them can publish updates impersonating the app.
2. **`androidScheme: "https"`** in `capacitor.config.json`. `localStorage` is keyed to origin;
   changing the scheme silently orphans every saved workout.

Bump `versionCode` and `versionName` in `android/app/build.gradle` on every release.

### Migrations

`ironmap:schemaVersion` is currently `1`. The one migration to date (v0→v1) converted the old
single `equip` string on custom exercises into `equipment[]` + `load` + `logType`, and seeded
an equipment profile for existing users. **Logged sessions have never been migrated** — they
only ever stored `{exId, sets}`, so no schema change has put history at risk. Keep it that way
where possible; deriving units at display time (as `logType` does) avoids touching set data.

### Testing

There is **no test runner**. Verification is:

1. Pure logic asserted in Node — bundle the lib with esbuild and run assertions
   (36 for the cold recommender, 24 for progression). This is where the real coverage is.
2. A browser pass against seeded `localStorage` for anything involving React.
3. APK signing and config checks before shipping.

`npm run build` passing proves very little — undefined variable references are runtime
errors here and only surface when the page actually renders. **Always open the app.**

---

## 8. Known rough edges

- `App.jsx` holds all state and is the largest file by far; it's the natural split point if
  the app grows.
- No test runner, so regressions in React components are caught only by manually opening the app.
- Custom exercises deleted from the library leave old sessions referencing a missing `exId`;
  those entries render as nothing rather than as "deleted exercise".
- On a narrow equipment profile, several muscles have no trainable exercise at all. Gaps to
  close says so, but nothing prompts the user to add kit or a custom exercise.
- The 7-day volume window and the 7-day staleness window are independently defined constants
  that happen to agree; they should probably be one.
