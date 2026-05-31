# Google Drive Sync — Merge Strategy

## Goal

Keep one user's Seenit data consistent across N devices (A, B, C, …) that may
each go offline for arbitrary periods and reconverge later via Google Drive.

The chosen strategy is an **additive, field-level merge** of local and cloud
snapshots, combined with **soft-delete tombstones** so removals propagate, and
a **pull → merge → push** cycle on every sync so concurrent edits eventually
converge without losing data.

There are no servers besides Drive itself — the merge runs entirely on the
client. All decisions are deterministic; two devices given the same
`(localState, cloudState)` pair produce the same merged result.

---

## Data model

```
PersistedSeriesStore {
  activeSeriesId:     number | null               — UI-only, never reconciled
  seriesData:         Series[] | null             — TVMaze metadata array
  trackingSeriesMap:  Record<seriesId, boolean>   — is this series tracked?
  favoritesSeriesMap: Record<seriesId, boolean>   — favourite flag
  isRewardShownMap:   Record<seriesId, boolean>   — completion reward seen
  trackingSeriesData: Record<seriesId, {
    seasons: Record<seasonId, {
      episodes: Record<episodeId, {
        isWatched: boolean
        timestamp: string | null                  — ISO-8601, set on every toggle
      }>
    }>
  }>
  seriesTombstones:   Record<seriesId, {          — NEW: soft-delete markers
    deletedAt: string                              — ISO-8601, set on removeSeries
  }>
}
```

```
DriveSnapshot extends StorageSchema {
  schemaVersion: 2
  syncedAt:      string         — ISO-8601, set every push
  lastWriter:    string | null  — deviceId of the last writer (diagnostics only)
}
```

```
SyncMeta {                                        — persisted in chromeStorage
  isConnected:           boolean
  fileId:                string | null
  lastSyncedAt:          string | null
  lastSeenModifiedTime:  string | null            — NEW: Drive modifiedTime at last sync
  deviceId:              string | null            — NEW: stable UUID per device
}
```

---

## Use-case matrix

| #   | Scenario                                                   | Local state               | Drive state                         | Result                                                                                   |
| --- | ---------------------------------------------------------- | ------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Fresh install, first ever connect                          | Empty                     | No file                             | Push empty state, create file                                                            |
| 2   | Local has data, Drive has no file                          | Has series                | No file                             | Push local, create file                                                                  |
| 3   | Local empty, Drive has data                                | Empty                     | Has series                          | Merge ≡ cloud                                                                            |
| 4   | Both have data (first connect)                             | Series A                  | Series B                            | Merge → A ∪ B                                                                            |
| 5   | Second device connects after use                           | Watched ep 1–3            | Watched ep 1–5                      | Merge → all 5 watched                                                                    |
| 6   | Episode watched on A, not yet on B                         | `isWatched: true`, ts T2  | `isWatched: false`, ts T1 (T2 > T1) | A wins — watched                                                                         |
| 7   | Un-watched on A with later ts                              | `isWatched: false`, ts T2 | `isWatched: true`, ts T1 (T2 > T1)  | A wins — un-watched                                                                      |
| 8   | Series added on A while B offline                          | Has X                     | No X                                | X appears on B after merge                                                               |
| 9   | **Series deleted on A while B offline, B never touched X** | Tombstone(X)              | Has X (timestamps ≤ tombstone)      | **X is deleted on both**                                                                 |
| 10  | **Series deleted on A, B then watched an episode**         | Tombstone(X), ts T1       | Has X with episode ts T2 (T2 > T1)  | **X resurrected** (B's intent wins)                                                      |
| 11  | Concurrent edits, both online                              | Edit at T1                | Edit at T2                          | Each side pulls before pushing → both converge to merged state within one debounce cycle |
| 12  | Drive file corrupted                                       | Has series                | Unparseable JSON                    | Local wins, file overwritten on next push                                                |
| 13  | Token expired during auto-sync                             | —                         | —                                   | Error surfaced; retried on next change                                                   |

---

## Per-field merge rules

### `trackingSeriesMap` / `favoritesSeriesMap` / `isRewardShownMap`

**Rule:** union — `true` wins over `false` / absent.

Then **filtered** by the final tombstones: any key whose series is tombstoned
in the merged result is removed.

```
merge({ "42": true }, { "42": false })   → { "42": true }
merge({ "42": true }, {})                → { "42": true }
merge({}, { "7": true })                 → { "7": true }
```

Rationale: these maps record positive user intent (tracking, favouriting,
reward seen). They are not a deletion channel — that's the tombstones' job.

### `seriesData`

**Rule:** additive union by series `id`, then filter by tombstones.

If both copies have the same series, keep the one with the higher `updated`
value (TVMaze timestamp — higher = more recently refreshed from the API).

```
merge([A_v1, B], [A_v2, C])  → [A_v2, B, C]   (A_v2 wins; B and C are new on the other side)
```

### `trackingSeriesData`

**Rule:** additive at the episode level, then filter by tombstones.

For an episode present on both sides:

| Local timestamp | Cloud timestamp | Winner                                            |
| --------------- | --------------- | ------------------------------------------------- |
| `null`          | `null`          | tiebreak: `isWatched: true` wins; if equal, local |
| `null`          | `T1`            | Cloud wins (explicit action beats never-set)      |
| `T1`            | `null`          | Local wins                                        |
| `T1`            | `T2` (T2 > T1)  | Cloud wins                                        |
| `T1`            | `T2` (T1 > T2)  | Local wins                                        |
| `T`             | `T` (equal)     | `isWatched: true` wins; if equal, local           |

This is the same rule as v1 and correctly handles un-watch propagation.

### `seriesTombstones`

**Rule:** union by id; for the same id, the later `deletedAt` wins.

After the union, for every tombstoned id, compute
`lastActivityAt(id)` = max episode timestamp across both sides' tracking data
for that series (null if none, treated as `-∞`).

- If `lastActivityAt > deletedAt` → **resurrection**. Drop the tombstone, keep
  the series in the merged result.
- Else → **stays deleted**. Drop the series from `seriesData`, the boolean
  maps, and `trackingSeriesData`. Keep the tombstone.

### Garbage collection

Tombstones older than **60 days** are dropped during merge. Sixty days is
generous enough for any reasonable offline scenario (multi-week vacations,
seasonal device usage) while preventing the tombstone table from growing
without bound.

### `activeSeriesId`

**Rule:** always keep local. UI-navigation state; changing it during a silent
sync would be disorienting. If the active series was tombstoned by another
device, it is cleared to `null`.

---

## Sync algorithm

A **single** unified routine is used by `connect`, manual "Sync now", and the
debounced auto-sync. The only difference between `connect` and the others is
that `connect` performs the initial OAuth handshake and creates the Drive file
if it doesn't exist yet.

```
syncCycle({ interactive }):
  status = Syncing

  token = getGoogleToken(interactive)
  fileId = state.fileId

  ┌─ no fileId yet ──────────────────────────────────────────────┐
  │ existing = findDriveFile(token)                              │
  │ if !existing:                                                │
  │   snapshot = buildSnapshot(localState)                       │
  │   fileId, modifiedTime = createDriveFile(token, snapshot)    │
  │   store({ fileId, lastSyncedAt, lastSeenModifiedTime })       │
  │   return                                                     │
  │ fileId = existing.id                                         │
  └──────────────────────────────────────────────────────────────┘

  ─── PULL phase ─────────────────────────────────────────────────
  meta = getDriveFileMeta(token, fileId)        # tiny: id + modifiedTime
  driveChanged = meta.modifiedTime !== lastSeenModifiedTime

  if driveChanged:
    cloud = readDriveFile(token, fileId)
    cloudParsed = DriveSnapshotSchema.safeParse(cloud)
  else:
    cloudParsed = null                          # we already have the latest

  ─── MERGE phase ────────────────────────────────────────────────
  local = readLocalState()

  if cloudParsed?.success:
    merged = mergeStates(local, cloudParsed.data.state)
  else:
    merged = local

  if not deepEqual(merged, local):
    writeLocalState(merged)
    useSeriesStore.persist.rehydrate()           # UI updates immediately

  ─── PUSH phase ─────────────────────────────────────────────────
  snapshot = {
    schemaVersion: 2,
    version: storageVersion,
    state: merged,
    syncedAt: now(),
    lastWriter: deviceId,
  }
  newMeta = updateDriveFile(token, fileId, snapshot)

  store({
    status: Success,
    lastSyncedAt: snapshot.syncedAt,
    lastSeenModifiedTime: newMeta.modifiedTime,
  })
```

### Why `modifiedTime` instead of `ETag` / `If-Match`?

Drive v3 supports both but `modifiedTime` is simpler, requires no extra
headers, and is already part of every file metadata response. The check is
purely an optimisation to skip the body fetch when nothing changed remotely;
correctness is guaranteed by the merge being idempotent and commutative.

### Concurrent-edit race window

Strict simultaneity (both devices push within a few hundred milliseconds of
each other, both having skipped the pull because each saw the other's older
`modifiedTime`) is the only case where one push can overwrite another's data
in the **single sync cycle**. Because:

1. Every change is also persisted locally.
2. The next sync cycle on the loser will pull the winner's snapshot and
   merge it with the loser's unsynced local state.
3. The merge is additive — no data is lost, only the moment of arrival
   shifts.

the system self-heals within one additional debounce window (~2 s).

For Seenit's traffic profile — a single user, a handful of devices, episodic
clicks — observing this race in the wild is effectively impossible. If
multi-second latency between devices ever becomes a UX issue, Drive's
`If-Match` against `headRevisionId` can be layered in without changing the
merge.

---

## Auth & token flow

Unchanged from v1 — see `src/utils/google-auth.utils.ts`. Both extension
(`chrome.identity`) and web (Google Identity Services) paths return the same
opaque string. `syncCycle` always uses `interactive: false` except for the
explicit `connect` call.

---

## Disconnect semantics

`disconnect()`:

1. Best-effort `revokeGoogleToken(token)`.
2. Clear sync meta (`isConnected`, `fileId`, `lastSyncedAt`,
   `lastSeenModifiedTime` — but keep `deviceId`).
3. Local Seenit data is untouched — disconnecting from Drive does not erase
   tracking progress.

Reconnecting later runs the full `syncCycle` again, including the merge.

---

## What is NOT synced

| Field                              | Reason                                                  |
| ---------------------------------- | ------------------------------------------------------- |
| `activeSeriesId`                   | UI navigation — local only                              |
| Theme                              | Lives in a separate persisted store (`useThemeStore`)   |
| License status                     | Lives in a separate persisted store (`useLicenseStore`) |
| Sidebar / search / filter UI state | Ephemeral UI                                            |
| `sync-meta` itself                 | By definition device-local                              |

Sync the user's content (series + watched state + favourites + tombstones);
do not sync UI state or device-local secrets.

---

## Schema versioning

`DriveSnapshot.schemaVersion`:

- `1` (legacy) — no `seriesTombstones`. On read, treated as v2 with
  `seriesTombstones: {}`. Next push promotes the file to v2.
- `2` (current) — adds `seriesTombstones` and `lastWriter`.

`useSeriesStore` persist `version`:

- `1` → `2` migration adds `seriesTombstones: {}` to the local state.

The migration is purely additive, so old clients reading newer files will
ignore unknown fields (Zod schemas use `.passthrough()` only where forward
compatibility is required; otherwise unknown fields are dropped silently,
which is acceptable because the legacy client will simply continue with the
v1 surface area).

---

## File layout

| File                                 | Role                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `src/utils/merge-snapshots.utils.ts` | Pure `mergeStates(local, cloud)` — handles all per-field rules and tombstone GC |
| `src/utils/google-drive.utils.ts`    | Drive REST — `find`, `read`, `create`, `update`, `getMeta`                      |
| `src/utils/device.utils.ts`          | `getOrCreateDeviceId()` — stable UUID per install                               |
| `src/store/useSyncStore.ts`          | `connect`, `disconnect`, `syncNow` (PMP), `tryReconnect`                        |
| `src/store/useSeriesStore.ts`        | Local state, including `seriesTombstones`; `removeSeries` writes the tombstone  |
| `src/hooks/useGoogleSync.ts`         | App-level wiring: silent reconnect + debounced subscription                     |
| `src/zod-schemas/index.ts`           | `PersistedSeriesStoreSchema` (v2), `DriveSnapshotSchema`                        |

---

## Observability

Every Drive snapshot carries `lastWriter: deviceId`. The Settings dialog can
optionally display "Last written by this device" / "Last written by another
device" by comparing `lastWriter` to the local `deviceId`. This is invaluable
when debugging "why did my data come back?" reports.

For interactive diagnostics — inspecting the cloud snapshot, dumping local
state, and **dry-running the merge** without writing anything — every build
exposes a `window.seenitDebug` console API. See
[`debug-api.md`](./debug-api.md) for the command reference and recipes.
