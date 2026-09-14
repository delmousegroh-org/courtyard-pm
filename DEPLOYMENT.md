# Deployment readiness

Audit performed 2026-09-11, re-audited 2026-09-14 (login/auth focus). Status of each item tracked
below — update this file as things get done.

## Where we are / where we can go (2026-09-14)

This is a hobby/portfolio project, not paid client work — worth keeping that framing in mind for
what's "worth" fixing next. Current state: fully deployed on real infrastructure (droplet + systemd
+ nginx + TLS + a real domain + git-based deploys with rollback), core feature set (checklist
inspections, dashboard, reports/drill-down, bulk backdate, autosave) is solid and working end to
end, no automated tests exist yet, auth is bare-bones single-role username/password.

**If the goal is landing side work / using this as a portfolio piece**, the highest-leverage next
moves aren't more app features — they're the things a prospective client or interviewer would
actually check:
- **Automated tests + CI** (GitHub Actions running lint/tests on PRs) — right now there are zero
  tests; that's the first thing a hiring engineer looks for and the fastest credibility signal to add.
- **A real README case study**: the problem (paper checklists → this), a couple of screenshots, the
  architecture in a sentence, and what you'd change with more time. That sells harder than code alone.
- **Roles (admin vs. field tech)** — right now every login can do everything, including editing the
  room list. A basic role split is a small change that reads as "thought about real usage."
- **Configurability** — the checklist template and room list are seeded for one specific building.
  Making that admin-editable (not just hardcoded/seeded) turns this from "a tool for my building"
  into "a small reusable PM-inspection product," which is a stronger pitch than a single-tenant app.
- **A separate demo instance with fake data**, distinct from whatever real deployment ends up holding
  actual building data — so you can hand someone a link without worrying about what's in it.

None of this is urgent — see the login findings below for what actually is.

## ⚠️ Needs your input first

- **Is the data in `server/data/app.db` real, or demo data?** `seedDemo.js` generates a full
  trimester's worth of realistic-looking mock inspections (see its file comment). If what's in
  there right now is just that demo data, it should be **wiped and replaced with real inspections**
  before going live, not migrated to prod. If real inspection history has already been entered
  through the app, then yes — that file is exactly what needs to move to the server. Figure out
  which case you're in before the first deploy. (Still 270 `seedDemo.js` mock inspections as of
  2026-09-14 — real history hasn't been transcribed yet.)

## 🔐 Login/auth audit (2026-09-14)

- [x] **~~CRITICAL~~ FIXED same day: production was reachable with the seeded demo credentials**
      (`del` / `open`, `gary` / `open`) at the real public domain `delgroh.com`. Confirmed live
      (logged in against prod, then logged back out) before fixing. Rotated both to random 20-char
      passwords via `create-user.js` on the droplet — **get the new passwords from this
      conversation and put them in a password manager**, they weren't written anywhere else. This
      had been flagged as an open item since the 2026-09-11 audit but became actually dangerous
      once the app moved off an obscure IP-based nip.io address onto a real, memorable domain.
- [x] `SESSION_SECRET` in prod is in fact a real random 64-hex-char value (`openssl rand -hex 32`
      shape), not a placeholder — the 2026-09-11 audit listed this as an open blocker but it was
      already done; just wasn't checked off.
- [ ] **Login has a username-enumeration timing side-channel**: `auth.routes.js` does
      `!user || !bcrypt.compareSync(...)` — when `user` is `null` the `bcrypt.compareSync` call is
      skipped entirely (short-circuit), so a nonexistent username returns noticeably faster than a
      real username with a wrong password. Fix: always run a compare (against a fixed dummy hash
      when there's no user) so both paths take the same time.
- [ ] **Rate limiting is per-IP only, not per-account** (`loginLimiter`, 20 attempts/15 min, shared
      across every username hitting that limiter from the same IP). A distributed attacker can
      still brute-force one specific account from many IPs. Low priority for a 2-user app, but
      worth a per-username counter if this ever holds real tenant data.
- [ ] **No roles** — every logged-in user has full access, including Settings → Rooms. Fine for two
      trusted users; revisit if this ever has more than a couple of logins.
- [ ] **No self-service password reset** — there's no email anywhere in this app (by design, see
      README), so resets are a manual `create-user.js` run on the server. Acceptable for personal
      use; would need a real flow (or at least an admin UI) before handing this to someone else.
- [ ] Sessions still last 30 days with no forced-reauth / revoke-all mechanism (carried over from
      the 2026-09-11 audit, see "Nice-to-have" below) — a lost/stolen phone stays logged in for up
      to a month.

## Production deployment

**Server:** DigitalOcean droplet, `159.223.128.239`, Ubuntu, reachable as `root` over SSH
(key-based). App lives at `/var/www/courtyard-pm`, a full clone of this repo checked out on the
**`production`** branch (a separate branch from `main` — deploys are a deliberate promotion, not
automatic on every push).

- **Domain:** `delgroh.com` (Namecheap) is the **canonical link — use this one**. DNS: `A` records
  for `@` and `courtyardpm` both point at `159.223.128.239`; existing `CNAME www → delgroh.com.`
  makes `www` follow the apex. `www.delgroh.com`, `courtyardpm.delgroh.com`, and the original
  `159.223.128.239.nip.io` all still resolve, but nginx 301-redirects every one of them (and plain
  HTTP on any of them) to `https://delgroh.com` — they're kept only so old links/bookmarks still
  land somewhere, not for day-to-day use. Don't touch the domain's existing `TXT` (DKIM) record —
  it's unrelated, for Namecheap Private Email.
- **Process manager:** systemd unit `courtyard-pm.service` (`/etc/systemd/system/courtyard-pm.service`)
  runs `node src/index.js` from `server/`, `Restart=on-failure`. `systemctl status|restart courtyard-pm`.
- **Reverse proxy / TLS:** nginx (`/etc/nginx/sites-enabled/courtyard-pm`) has three server blocks:
  `delgroh.com` (443) proxies to `127.0.0.1:3001` and is the only one that actually serves the app;
  a second 443 block matches `www.delgroh.com` / `courtyardpm.delgroh.com` / `159.223.128.239.nip.io`
  and 301s to `https://delgroh.com$request_uri`; a port-80 block redirects any hostname straight to
  the same canonical HTTPS URL. One certbot/Let's Encrypt cert (lineage name
  `159.223.128.239.nip.io`, since that's the first `-d` it was originally issued for) covers all four
  names and auto-renews. To add another hostname later: add it to the redirect block's `server_name`
  (or give it its own block if it should serve rather than redirect), `nginx -t && systemctl reload
  nginx`, then `certbot --nginx --cert-name 159.223.128.239.nip.io -d <all names incl. new one>
  --expand`.
- **Static assets:** the Node server itself serves the built client (`server/src/app.js` serves
  `client/dist` when `NODE_ENV=production` and falls back to `index.html` for SPA routing) — nginx
  only proxies, it doesn't serve files directly. This means `client/dist` **must be rebuilt on the
  server** after every deploy (the deploy script below does this).
- **Deploy key:** a dedicated read-only ed25519 deploy key lives at
  `/root/.ssh/courtyard_pm_deploy_key` on the droplet, registered on the GitHub repo under Settings →
  Deploy keys (title "courtyard-pm droplet (deploy, read-only)"). `/root/.ssh/config` on the droplet
  aliases `github-courtyard-pm` → `github.com` using that key, and `origin` on the droplet's clone
  points at `git@github-courtyard-pm:delmousegroh-org/courtyard-pm.git`. It's read-only, so it can
  `fetch`/`pull` but can't push — safe to leave on the box.
- **Deploy script:** `deploy.sh` (repo root, runs ON the server) backs up the db, resets the working
  tree to `origin/production`, reinstalls deps, rebuilds the client, restarts the service, and checks
  `/healthz`.

### How to deploy

From your machine, once `main` has what you want live:

```
npm run deploy
```

This fast-forwards `production` to `main` and pushes it (`git push origin main:production`), then
SSHes in and runs `deploy.sh`. Equivalent by hand:

```
git push origin main:production
ssh root@159.223.128.239 'bash -l /var/www/courtyard-pm/deploy.sh'
```

Deploying is always an explicit `main → production` promotion — pushing to `main` alone never
touches the live server.

### Rollback

```
ssh root@159.223.128.239
cd /var/www/courtyard-pm
git log --oneline -5        # find the commit to go back to
git reset --hard <sha>
npm install && npm run build -w client && systemctl restart courtyard-pm
```

(Or push an older `main` commit to `production` and re-run `npm run deploy` from your machine.)

### Notes from setup (2026-09-14)

The droplet was originally deployed by `scp`-ing individual changed files by hand (no git on the
box at all). It's now a proper git checkout on `production`. Before switching it over, the existing
untracked working tree was snapshotted onto a local-only `master` branch on the droplet as a safety
net — diffed clean against `origin/production` except for a trivial `package-lock.json`
platform-metadata difference (different npm version), so nothing was lost in the switch.

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

- [x] **Generate a real `SESSION_SECRET`** for prod — verified 2026-09-14, already a proper random
      64-hex-char value, not the `.env.example` placeholder.
- [x] **Pick a deployment target** — plain Linux VM (DigitalOcean droplet), systemd + nginx +
      certbot. See "Production deployment" above.
- [x] **Reset the demo passwords** — done 2026-09-14, see "Login/auth audit" above.
- [ ] **Schedule `npm run backup`** on a cron on the droplet — `deploy.sh` backs up before each
      deploy, but nothing runs it on a regular schedule yet (e.g. daily via crontab).
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
- **2026-09-14**: First production deploy went out (list-view navigation + checklist mobile/divider
  fixes), done by hand via `scp` + manual remote build. Converted the droplet from ad-hoc file
  copies to a proper git-based deploy: added a read-only deploy key, created the `production`
  branch, checked out the droplet's `/var/www/courtyard-pm` onto it, and wrote `deploy.sh` +
  `npm run deploy`. See "Production deployment" above for the full setup.
- **2026-09-14**: Pointed the existing `delgroh.com` domain (Namecheap) at the droplet — added `A`
  records for `@` and `courtyardpm`, updated nginx `server_name`, expanded the Let's Encrypt cert to
  cover `delgroh.com` / `www.delgroh.com` / `courtyardpm.delgroh.com` alongside the original
  `159.223.128.239.nip.io`. Left the domain's existing DKIM `TXT` record alone (Namecheap Private
  Email, unrelated).
- **2026-09-14**: Made `delgroh.com` the canonical link. Restructured nginx into a serving block for
  `delgroh.com` plus a redirect block sending `www.delgroh.com` / `courtyardpm.delgroh.com` /
  `159.223.128.239.nip.io` (and any plain-HTTP request) to `https://delgroh.com` with a 301. Verified
  all four hostnames and both schemes behave correctly.
- **2026-09-14**: Re-audited with a login/auth focus. Found prod was still reachable with the
  original seeded demo credentials now that it's on a real domain — confirmed live, then rotated
  both passwords immediately (see "Login/auth audit" above). Also confirmed `SESSION_SECRET` was
  already properly set (stale checkbox, not an actual gap). Talked through project positioning
  given this is a portfolio/side-work piece rather than client work — see "Where we are / where we
  can go" at the top of this file.
