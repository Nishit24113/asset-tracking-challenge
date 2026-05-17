# Asset Tracking System — Nishit Patel

A full-stack asset tracking application built for the Cerebras AI Builder Challenge. Lab techs scan equipment through mobile-first workflows; managers monitor assets and reconcile data across three systems.

**Live:** [deployed URL TBD after deploy]
**Repo:** [this repository]

## Quick start

```bash
# Install dependencies
pnpm install

# Start the API (from the api/ directory)
cd api && pnpm install && pnpm dev
# → runs on :8080

# Start the frontend (from root)
cp .env.example .env
pnpm dev
# → runs on :3000
```

Open http://localhost:3000.

## Environment variables

| Variable | Notes |
|---|---|
| `API_BASE_URL` | Upstream API including `/v1`, e.g. `http://localhost:8080/v1` |
| `API_TOKEN` | Server-only. The proxy at `/api/upstream/*` attaches it. Never exposed to the browser. |

## Architecture decisions

### Where the facilities/finance writes live

Write-backs to facilities and finance happen **client-side** in the scan workflow pages (deploy and store). Rationale:
- The writes are fire-and-forget side effects of a successful scan
- They don't need transactional guarantees (the API is the source of truth)
- Keeping them visible in the component makes the data flow obvious to reviewers
- If the write fails, the reconciliation report will catch the drift on next run

### Three calls I nearly made the other way

1. **Server-side scan submission vs. client-side fetch.** I nearly used Next.js Server Actions for the scan POSTs to keep all API calls server-side. I chose client-side `fetch` through the proxy instead because the scan UX needs immediate, step-by-step feedback (loading states between steps, instant error display) that server actions make awkward. The proxy already keeps the token safe.

2. **Heap-based priority merge for reconciliation vs. linear scan.** I considered building a more sophisticated reconciliation engine that scores and ranks discrepancies by "cost to investigate." I went with category + severity instead because a manager running this on Monday morning needs *actionable buckets* ("these 3 are definitely wrong, these 8 might just be naming drift"), not a ranked list. Categories let them triage by type, which matches how they'd actually delegate follow-ups.

3. **Camera barcode scanning via `@zxing/browser` vs. manual-only input.** I nearly integrated a full camera scanner library. I chose to ship with the typed-input-only approach (which covers USB/Bluetooth scanners natively) and a barcode reference page at `/dev/barcodes` instead. Why: the camera integration adds ~50KB of JS, requires HTTPS in production, and the typical lab tech has a handheld scanner — the phone camera is a backup, not the primary path. The input-focused design works for both paths; adding camera later is additive.

### What I chose not to build

- **Offline mode / service worker caching.** The brief says not required, and the API is local-network. Not worth the complexity.
- **Bulk operations.** A tech processes one asset at a time. Batch import is a different persona's tool.
- **RMA workflow UI.** The state machine supports it; the brief says skip it.
- **Real-time updates / WebSocket.** With ~1000 assets and one user at a time, polling on page load is fine.
- **Advanced sorting on the manager table.** Filtering covers 95% of what a manager needs at standup. Column sorting is nice-to-have but not the bottleneck.

### Pushback on the brief/starter

- The API reference says `POST /v1/scans/receive` returns `200` for idempotent duplicate receive, but the response shape is identical to `201` (just an Asset object). The client has to check `res.status` to distinguish — this is fine, but the docs could note it more explicitly as a UX-relevant distinction (the tech needs different feedback for "created" vs "already existed").
- The `Location` type has `row` as a field, but the API's facilities mock uses a flat `rack_location` string like `"Site/Room/Row/Rack/RU"`. The `row` field is never surfaced in any scan endpoint requirement (deploy needs site/room/rack/ru but not row). It's unclear whether `row` should appear in deploy UIs or if it's facilities-only.

## Pages

| Path | Description |
|---|---|
| `/tech` | Scan workflow hub |
| `/tech/receive` | Dock-side receive scan |
| `/tech/store` | Move asset to storage |
| `/tech/deploy` | Install into rack (writes to facilities + finance) |
| `/tech/transfer` | Custody handoff |
| `/manager` | Asset list with filters and pagination |
| `/manager/assets/[tag]` | Asset detail + event history |
| `/manager/reconcile` | Three-way reconciliation report |
| `/dev/barcodes` | Printable test barcodes |

## Deployment

- **Frontend:** Vercel (Next.js, auto-detected)
- **API:** Railway (Docker container from `api/Dockerfile`)

Set `API_BASE_URL` and `API_TOKEN` as Vercel environment variables pointing at your deployed API instance.
