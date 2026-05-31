# `window.seenitDebug` — Debug API

A small set of console-only diagnostic helpers exposed as a global. Ships in
every build (dev and prod, web and extension popup). Hidden from users by
default — there is no UI surface — and discoverable only by knowing the name.

Source: [`src/utils/debug.utils.ts`](../src/utils/debug.utils.ts). Registered
at app boot via a side-effect import in [`src/main.tsx`](../src/main.tsx).

---

## Quick start

Open DevTools → Console on the running app (extension popup or web tab) and
run:

```js
seenitDebug.help();
```

That prints the full command table. From there, every helper is a single call.

---

## Command reference

| Command          | Returns                                      | Purpose                                                                                                                |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `help()`         | `void`                                       | Prints this table via `console.table`                                                                                  |
| `getSyncMeta()`  | `SyncMetaSnapshot`                           | Snapshot of `useSyncStore` (no actions) — status, phase, connection, fileId, lastSyncedAt, lastSeenModifiedTime, error |
| `getDeviceId()`  | `Promise<string>`                            | Stable per-install UUID. Same value embedded as `lastWriter` in every Drive snapshot this device pushes                |
| `getLocalData()` | `Promise<PersistedSeriesStore \| null>`      | Persisted local series state, Zod-validated. `null` on fresh install                                                   |
| `getCloudData()` | `Promise<unknown>`                           | Downloads and returns the raw Drive snapshot (validated downstream)                                                    |
| `dryRunMerge()`  | `Promise<{ local, cloud, merged, changed }>` | Preview what the next sync would produce — runs `mergeStates()` in memory, **never writes**                            |

### Type shapes

```ts
SyncMetaSnapshot {
  status:               'Idle' | 'Syncing' | 'Success' | 'Error'
  phase:                'Idle' | 'Pulling' | 'Pushing'
  isConnected:          boolean
  fileId:               string | null
  lastSyncedAt:         string | null   // ISO-8601
  lastSeenModifiedTime: string | null   // ISO-8601, Drive's modifiedTime at last sync
  error:                string | null
}

DryRunMergeResult {
  local:   PersistedSeriesStore | null
  cloud:   PersistedSeriesStore | null
  merged:  PersistedSeriesStore | null
  changed: boolean   // true when merged !== local — i.e. applying would actually update local
}
```

`PersistedSeriesStore` is defined in
[`src/zod-schemas/index.ts`](../src/zod-schemas/index.ts).

---

## Recipes

### "Where am I right now?"

```js
seenitDebug.getSyncMeta();
// → { status: 'Idle', phase: 'Idle', isConnected: true,
//     fileId: '1AbC…', lastSyncedAt: '2026-05-28T15:42:01.000Z',
//     lastSeenModifiedTime: '2026-05-28T15:42:01.123Z', error: null }
```

### "Which device wrote this?"

```js
const [mine, snapshot] = await Promise.all([seenitDebug.getDeviceId(), seenitDebug.getCloudData()]);
console.log('I am:        ', mine);
console.log('Last writer: ', snapshot.lastWriter);
console.log(mine === snapshot.lastWriter ? 'me' : 'another device');
```

### "User says X reappeared after I deleted it — what would the next sync do?"

```js
const r = await seenitDebug.dryRunMerge();

console.log('Would the next sync change local state?', r.changed);
console.log('Local tombstones: ', r.local?.seriesTombstones);
console.log('Cloud tombstones: ', r.cloud?.seriesTombstones);
console.log('Merged tombstones:', r.merged?.seriesTombstones);
```

If `merged` contains the series but `local` doesn't, the cloud is resurrecting
it — check whether some `episode.timestamp` in `cloud` is newer than the
matching `seriesTombstones[id].deletedAt`. See
[sync-merge-strategy.md](./sync-merge-strategy.md) for the full resurrection
rule.

### "Why is the cloud snapshot rejected?"

```js
const raw = await seenitDebug.getCloudData();
const { DriveSnapshotSchema } = await import('/src/zod-schemas/index.ts');
DriveSnapshotSchema.safeParse(raw);
// → { success: false, error: ZodError { issues: [...] } }
```

The dynamic import only works in dev (Vite serves source); in prod use
`getCloudData()` and inspect the raw object manually.

### "Compare local vs cloud at a glance"

```js
const { local, cloud } = await seenitDebug.dryRunMerge();
console.log({
  localSeries: local?.seriesData?.length ?? 0,
  cloudSeries: cloud?.seriesData?.length ?? 0,
  localTombs: Object.keys(local?.seriesTombstones ?? {}).length,
  cloudTombs: Object.keys(cloud?.seriesTombstones ?? {}).length,
});
```

---

## Behaviour notes

### Drive-dependent helpers throw friendly errors when not connected

`getCloudData()` and `dryRunMerge()` both call an internal `assertConnected()`
guard. When the user has not connected Google Drive, the promise rejects with:

```
Cloud sync is not connected. Connect Google Drive in Settings first.
```

### `dryRunMerge()` is strictly read-only

It pulls the cloud body and runs `mergeStates(local, cloud)` in memory.
Nothing is written to `chromeStorage`, nothing is pushed back to Drive, and
the Zustand store is not rehydrated. Safe to call from any state, including
mid-sync.

### Helpers don't trigger sync cycles

None of the helpers in v1 of the Debug API force a sync. To actually push the
result of an inspection, call the regular UI Sync button or wait for the next
debounced auto-sync (~2 s after any change). A future helper could add an
explicit `forceSync()` — see "Future helpers" below.

---

## Safety

Every helper here ships in the **production bundle**. The global is intended
for the developer/owner, but anyone who runs `window.seenitDebug.<x>()` in
their own console will get a result.

That is acceptable for the current six helpers because they all operate
**solely on the caller's own data**:

- `getCloudData()` reads the user's own Drive file (requires their own OAuth)
- `getLocalData()` reads the user's own `chrome.storage.local`
- `getSyncMeta()` reads the user's own in-memory store
- `getDeviceId()` reads / creates the user's own device UUID
- `dryRunMerge()` does both reads in memory
- `help()` prints a static table

**Do not add helpers that affect or read other users' data** — there are
none, but it's worth saying out loud. If a future helper would mutate state,
delete the Drive file, or otherwise be destructive, put it under an
`unsafe.*` sub-namespace (see "Future helpers" → Tier 4).

---

## Adding new helpers

Four-step checklist — the same list lives at the top of `debug.utils.ts`:

1. **Define** the function in `src/utils/debug.utils.ts`.
2. **Add it to the `SeenitDebug` interface** so TypeScript catches drift.
3. **Add a row in `help()`** — `help()` is the single source of truth for
   discoverability; keep it accurate.
4. **Wire it into the `window.seenitDebug = { … }` assignment** at the bottom.

Then update this doc — at minimum the command-reference table.

### Suggested future helpers

Roughly ordered by payoff vs effort. Implement on demand, not preemptively.

**Sync diagnostics**

- `forceSync({ forceFullPull? })` — invoke `syncNow()` with options, bypass the
  modifiedTime fast-path
- `listTombstones()` — `seriesTombstones` map with relative ages
- `previewLocalDiff(otherLocal)` — diff two `PersistedSeriesStore`s field by
  field

**Event log / true observability**

- `enableTrace()` / `disableTrace()` — subscribe to every Zustand store and
  push `{ ts, store, action, prevState, nextState }` to a ring buffer
- `getTrace(n=50)` / `clearTrace()`

Adding these would justify renaming the namespace from `seenitDebug` to
something like `seenit.debug` and growing peer namespaces `seenit.trace` and
`seenit.metrics`. Today the surface is too small to warrant that.

**Destructive (Tier 4 — gate carefully)**

Put any of these under `seenitDebug.unsafe.*` to add a typo-resistant
namespace boundary:

- `unsafe.clearLocal()` — wipe `series-storage`
- `unsafe.deleteCloudData()` — delete the Drive file
- `unsafe.setCloudData(snapshot)` — overwrite Drive (e.g. paste a backup back in)

---

## Why not a build-time flag?

Earlier iterations of this feature were gated behind `import.meta.env.DEV` or
a `localStorage` flag. Both have downsides:

- `import.meta.env.DEV` strips the helpers from the prod bundle, which defeats
  the purpose — production is where you need diagnostics most.
- `localStorage` flag is reactive but adds a UI gate (or required toggle
  helpers), which is overhead for something the user never sees by default.

The current model — globals always-on, no UI, namespaced under `seenitDebug` —
is the simplest viable surface. The helpers are invisible to users unless they
already know they exist, and safe to invoke for users who go looking.

---

## Related

- [`sync-merge-strategy.md`](./sync-merge-strategy.md) — the algorithm
  `dryRunMerge()` is exercising
- [`../README.md`](../README.md) — high-level Cloud Sync overview
