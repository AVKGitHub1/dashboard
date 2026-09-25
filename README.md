# Dashboard

A self-hosted personal dashboard: a grid of resizable/movable widgets (weather, stocks,
links, clock, world clock, RSS, system stats, notes/todo) packaged as a single Docker
container.

## Quick start

```bash
cp docker-compose.yml.example docker-compose.yml   # your local copy; gitignored
docker compose up -d --build
```

`docker-compose.yml.example` is the checked-in template; your own `docker-compose.yml`
(port mappings, bind-mount paths, env overrides) stays untracked so personal setup never
ends up in a commit.

Or with plain Docker:

```bash
docker build -t dashboard .
docker run -d --name dashboard -p 7070:7070 -v dashboard_data:/data dashboard
```

Then open **http://localhost:7070**.

The server speaks plain HTTP on that one dedicated port. If you expose this beyond your
LAN, put a reverse proxy (Caddy/Traefik/nginx) in front to terminate TLS — the app
already honors `X-Forwarded-Proto` for cookie security (see `COOKIE_SECURE` below), so
no app-side changes are needed to sit behind one.

## First login

On first boot, a random admin username/password is generated and printed **once** to the
container logs:

```bash
docker logs dashboard
```

Look for the framed block:

```
============================================================
 Dashboard — first-run admin credentials (shown only once)
 Username: admin
 Password: <generated>
============================================================
```

Save it — it will not be shown again. You can change the password from **Settings** after
logging in.

**Locked out?** Reset it directly, without going through the UI:

```bash
docker exec dashboard node src/scripts/resetPassword.js admin <newPassword>
```

## API keys

Weather and stock data require your own free-tier API keys, entered from the in-app
**Settings** page (never baked into the image, never exposed to the browser):

- **OpenWeatherMap** — https://openweathermap.org/api
- **Finnhub** — https://finnhub.io/register

Keys are encrypted at rest (AES-256-GCM) using a secret generated on first boot and stored
at `DATA_DIR/secret.key`. Losing that file (or changing `APP_SECRET`) invalidates
previously stored keys — you'll need to re-enter them in Settings.

## Persistence

All state lives under the `/data` volume:

- `dashboard.db` — SQLite: users, sessions, widget layout/config, watchlists, links, feeds, todos
- `secret.key` — API-key encryption key
- `session.secret` — session-signing secret (unless `SESSION_SECRET` env var is set)
- `uploads/icons/` — uploaded link icons

Back up or restore the whole app by backing up this one volume.

## Health check

The image defines a `HEALTHCHECK` against the unauthenticated `GET /api/health`
endpoint, so `docker ps` reports `healthy`/`unhealthy` and orchestrators (e.g. Docker
Swarm, Kubernetes-via-kompose) can act on container health automatically.

## Configuration

See [.env.example](.env.example) for all environment variables (`PORT`, `DATA_DIR`,
`SESSION_SECRET`, `APP_SECRET`, `COOKIE_SECURE`).

## On a phone

The dashboard is usable from a phone or tablet browser as-is — no separate app, no
extra configuration.

Below 768px wide the 12-column grid would give each column about 30px, so narrow
screens instead stack every widget into a single full-width column, ordered the way the
desktop grid reads (top to bottom, then left to right within a row). **That stacked view
is read-only**: each widget stores one `x/y/w/h`, so letting a phone move or resize
anything would write the collapsed one-column coordinates back over the desktop layout.
Rearrange on a desktop; a phone renders that arrangement.

Everything *inside* a widget still works by touch, including drag-to-reorder — press and
hold a tile (a city, a link, a ticker, a checklist row) for a moment until it dims, then
drag it to its new position. Add the site to your home screen and it launches
full-screen via the bundled web manifest.

## System Stats widget — container vs. host metrics

By default, the System Stats widget reports **container/cgroup-level** CPU, memory, and
disk usage — not necessarily the full host's. This is the safe default: it requires no
extra privileges or mounts. To see true host-level stats instead, you'd need to bind-mount
host paths (e.g. `-v /proc:/host/proc:ro`, `-v /:/host:ro`) and adjust
`server/src/services/system.service.js` to read from them — a deliberate trade-off since
granting a container read access to host `/proc`/`/` has real security implications for a
self-hosted tool. Not enabled by default.

## Development

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
cd client && npm install && npm run dev
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:7070` (see
`client/vite.config.ts`). In dev, `DATA_DIR` defaults to `<repo>/data`.

Enable the pre-commit secret scan once per clone:

```bash
git config core.hooksPath .githooks
```

It blocks commits that stage `.env`/key/database files or add lines that look like
credentials. For a false positive, put `secret-scan:allow` on the line.

## Suggested future widgets

Not built yet, but natural next additions given the existing patterns:

- **Calendar/agenda** — subscribe to an iCal URL, pairs naturally with the clock widget.
- **Uptime/status-page ping** — periodic pings of user-configured URLs/hosts with up/down history.
- **GitHub activity** — recent commits/PRs/issues for a repo or user via a user-supplied token.
- **Crypto prices** — same shared-time-range + expandable-chart UX as stocks, via CoinGecko.
