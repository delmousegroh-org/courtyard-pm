# Room Inspections

![Node](https://img.shields.io/badge/node-%3E%3D22.5.0-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/express-4-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-node%3Asqlite-003B57?logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite&logoColor=white)

A mobile-first web app for tracking preventative maintenance (PM) room inspections, replacing a
paper checklist system. Rooms are inspected once per "trimester" (Jan–Apr, May–Aug, Sep–Dec) using
a full item-by-item checklist. A dashboard shows every room as a color-coded, icon-coded tile
(green check = all good, amber warning = needs repair, gray hourglass = not started), and a
Reports page gives at-a-glance analytics — completion by floor, top problem categories, and recent
activity — with drill-down from a problem category down to the specific room, item, and note.

- **Client**: React + Vite + react-bootstrap + react-bootstrap-icons, in `client/`
- **Server**: Node/Express + SQLite (Node's built-in `node:sqlite`), in `server/`
- Single Node process serves both the API and the built client in production — no separate static
  host, no CORS.

## Login

Login is **username + password** (not email — there's no email involved anywhere in this app).
Every PM visit can credit up to **two technicians** ("done by"), so two people can log a room
they worked on together — pick them from a checkbox pair wherever a visit is recorded (the
inspection form, quick-mark, and bulk backdate).

## First-time setup

```bash
npm install                       # installs client + server workspaces
cp server/.env.example server/.env
npm run seed                      # seeds the checklist template + best-effort room list
npm run seed:demo                 # seeds 2 demo users + mock PM history from Jan 1 through today
```

This creates two logins:

| Username | Password | Name |
| -------- | -------- | ---- |
| `del`    | `open`   | Del  |
| `gary`   | `open`   | Gary |

**Change these before this app is used for real.** They're placeholder credentials for
development only. Add or update a user any time with:

```bash
npm run create-user -- <username> <password> "Display Name"
```

The seeded room list (122 rooms, floors 1–5) was reconstructed from paper records — check it in
**Settings → Rooms** in the app and correct anything wrong.

### About the seeded demo data

`npm run seed:demo` generates a full mock inspection history — checklist detail, needs-repair
items with notes and repair codes, overall notes, and technician credit — for every trimester from
January 1st of the current year through today. The two trimesters fully in the past are almost
entirely complete; the current trimester is only partially done, in proportion to how far into it
"today" is, so the dashboard looks like a real building mid-cycle rather than either empty or
finished.

**We're intentionally leaving the database seeded with this mock data while building out the
UI** — don't run `npm run seed` or `npm run seed:demo` again mid-session unless you want the
inspection history reset, since `seed:demo` wipes and regenerates all inspections every time it
runs (it's idempotent, not additive). It's safe to restart the dev server as much as you want;
only the structural `seed()` (checklist template + room list) runs automatically on boot, and it's
a no-op once seeded.

## Development

Dev is served from **courtyardpm.test** instead of `localhost`. (Not `.dev` — Chrome hard-codes
the entire `.dev` TLD onto its HSTS preload list and will force HTTPS on it with no way to opt
out, which breaks plain-HTTP local dev. `.test` is reserved by RFC 2606 for exactly this and isn't
forced to HTTPS.) One-time setup, add this line to `/etc/hosts`:

```
127.0.0.1 courtyardpm.test
```

```bash
sudo sh -c 'echo "127.0.0.1 courtyardpm.test" >> /etc/hosts'
```

Then:

```bash
npm run dev
```

Runs the Express API on `:3001` and the Vite dev server on `:5173` (proxying `/api` to the
server), via `concurrently`, and opens http://courtyardpm.test:5173 in your browser automatically.

## Production build

```bash
npm run build     # builds client/dist
npm start          # serves API + built client from one process
```

## Deployment

Any host that can run a small persistent Node process works (e.g. Render, Fly.io, a cheap VPS).
Requirements:

- Set `SESSION_SECRET`, `DB_PATH`, and `NODE_ENV=production` as environment variables.
- **The SQLite file (`server/data/app.db` by default) must live on a persistent disk/volume** —
  not the container's ephemeral filesystem — or all data is lost on every redeploy/restart.
- Run `npm install && npm run build` during deploy, then `npm start`.
- Create your first real login with `npm run create-user -- <username> <password> "Display Name"`
  after the first deploy (or via a one-off shell on the host), and **don't run `seed:demo` against
  a real deployment** — it wipes all inspection history.

There's no self-service signup or roles yet — add more users by running `create-user` again.

## Reporting

The **Reports** page (`/reports`) is built for inspectors to drill down, not just glance at a
completion percentage:

- At-a-glance stat cards: total rooms, all-good, needs repair, not started.
- Completion-by-floor bars, so you can see which floors are behind.
- Top problem categories for the period (e.g. "Air Conditioning/Heating") — click one to drill
  down into exactly which rooms, which checklist item, and what note/repair code was logged.
- Recent activity feed — who did the PM, when, on which room, and whether it came back clean or
  needs repair.

The main **Dashboard** (`/`) is the fast, at-a-glance status board: every room in the building as a
small icon+color tile (green check / amber warning / gray hourglass), grouped by floor, with a
one-click "quick mark done" for backdating a room without filling out the full checklist.
