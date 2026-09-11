# Deployment readiness

Audit performed 2026-09-11. Status of each item tracked below — update this file as things get done.

## ⚠️ Needs your input first

- **Is the data in `server/data/app.db` real, or demo data?** `seedDemo.js` generates a full
  trimester's worth of realistic-looking mock inspections (see its file comment). If what's in
  there right now is just that demo data, it should be **wiped and replaced with real inspections**
  before going live, not migrated to prod. If real inspection history has already been entered
  through the app, then yes — that file is exactly what needs to move to the server. Figure out
  which case you're in before the first deploy.
- **Where is this actually running?** (plain VM / Docker / a PaaS / undecided). This changes what
  process-manager config, reverse-proxy config, and deploy scripts to write. Revisit once decided —
  see "Deployment target" below.

## ✅ Done (2026-09-11)

- [x] Server refuses to boot in production without `SESSION_SECRET` set
- [x] `DB_PATH` now resolves relative to the server directory, not the process's cwd — prevents a
      misconfigured process manager from silently creating an empty DB instead of finding the real one
- [x] `seedDemo()` (destructive — wipes all inspections, resets demo passwords) now refuses to run
      with `NODE_ENV=production`
- [x] Added `helmet` (security headers) and `compression`
- [x] Added rate-limiting on `/api/auth/login` (20 attempts / 15 min)
- [x] Added `GET /healthz` for process managers / load balancers
- [x] Added an online SQLite backup script — `npm run backup` (uses `node:sqlite`'s `backup()` API,
      safe to run while the server is live). Writes timestamped copies to `server/backups/`, keeps
      the last 14 by default (`BACKUP_KEEP_COUNT` / `BACKUP_DIR` env vars)
- [x] Bumped `express` to `4.22.2`, resolving one of three moderate `qs` CVEs without a breaking change

## 🔴 Blockers — before first production deploy

- [ ] **Generate a real `SESSION_SECRET`** for prod and store it outside git (e.g. `openssl rand
      -hex 32`). Never reuse the value in `.env.example`.
- [ ] **Pick a deployment target** and set up process management + reverse proxy accordingly:
  - **Plain Linux VM** — systemd unit (auto-restart on crash/reboot) + nginx reverse proxy
    (TLS termination, gzip already handled by `compression` but nginx can front it) + `certbot`
    for HTTPS
  - **Docker / Docker Compose** — needs a `Dockerfile` + `docker-compose.yml` with a named volume
    for `server/data/` (the SQLite file must survive container recreation)
  - **PaaS** (Railway/Render/Fly.io) — check whether the platform gives you a **persistent volume**;
    most default ephemeral filesystems will silently delete the SQLite db on every redeploy. This
    is the single biggest risk if you go this route.
  - Whichever you pick, wire `npm run backup` into a daily cron/scheduled job and confirm backups
    land somewhere that survives the server dying (not just the same disk).
- [ ] **Schedule `npm run backup`** on a cron (or platform equivalent) once the target is chosen —
      the script exists but nothing calls it automatically yet.
- [ ] **Never run `npm run seed:demo` against the production environment/database.** It's now
      blocked by the `NODE_ENV` guard, but treat it as a loaded gun — don't run it manually against
      the prod `DB_PATH` either.

## 🟡 Should-fix (not blocking, but do soon)

- [ ] Add basic request-body validation (e.g. `zod`) on the write routes — currently relies on DB
      `CHECK` constraints and manual null checks
- [ ] Set up a schema migration approach (even a simple numbered-`.sql`-files runner) before the
      schema needs its first change against real prod data — right now `schema.sql` is applied
      idempotently on boot with no migration history
- [ ] Consider `react-router-dom` → 7.18.3 (fixes an open-redirect CVE) and `express` → 5.x
      (clears the remaining `qs` CVEs) — both are breaking, budget real test time before doing them
- [ ] Replace `console.log`/`console.error` with structured logging once this is running unattended
      on a server (so you can actually find things in logs later)
- [ ] Off-box backups: `npm run backup` writes to local disk — pair it with something that copies
      backups off the server (S3, rsync to another host, etc.) so a disk failure doesn't take out
      both the live db and its backups

## 🟢 Nice-to-have

- [ ] CSRF token (low risk currently given `sameSite=lax` + JSON-only API, but worth it long-term)
- [ ] Automated tests — none currently exist
- [ ] `server/.env.production.example` documenting the prod-specific env vars (`SESSION_SECRET`,
      `NODE_ENV=production`, `DB_PATH`, `BACKUP_DIR`)
- [ ] Revisit session/login policy — sessions currently last 30 days (`server/src/app.js`, cookie
      `maxAge`) with no way to force a re-login. Worth adding a way to force sign-out (shorter
      expiry, and/or an admin action to invalidate all sessions, e.g. for a lost/stolen phone or an
      offboarded technician) before this holds anything more sensitive than PM checklists.

## Session log

- **2026-09-11**: Renamed project/repo to `courtyard-pm`, set up git + GitHub (private repo,
  `delmousegroh-org/courtyard-pm`), ran the deployment-readiness audit and fixed everything
  platform-agnostic (see "Done" above). Confirmed `server/data/app.db`'s 270 inspections are
  `seedDemo.js` mock data, not real records — real history lives on paper (photographed sample
  matches the app's checklist template exactly) and needs manual transcription via Bulk Backdate
  (clean visits) or the full room checklist (visits with repair items). Not yet done: wiping the
  demo data / resetting demo passwords, and the actual transcription.
