# CodeZi

CodeZi is a small full-stack web app that runs on a homelab: a React front end, an Express + Socket.IO back end, and MongoDB. Its main feature is **real-time multiplayer Texas Hold'em poker**.

## Features

- **Multiplayer poker** over Socket.IO: lobby rooms, blinds, dealer button rotation, check / call / raise / fold / all-in, validated raises, side pots, split pots, and a showdown that pays the best hand.
- **Safe leaving**: a player who leaves or disconnects mid-hand is folded out; their chips stay in the pot and turn order stays correct.
- **Idle session sweeper**: rooms with no activity are cleaned up automatically.
- **User API** (`/api/user`) with input validation, a per-IP rate limit on creation, and an optional admin password for rename/delete.
- **Hardening**: security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), no `X-Powered-By`, no extra runtime dependencies for any of it.
- **Resilient DB**: the server starts even if MongoDB is down and keeps retrying in the background.

## Architecture

```
browser ──► nginx (client container, port 80)
              ├─ /            static React build (Vite, MUI, TailwindCSS)
              ├─ /api/*       ──► backend:8080 (Express)
              ├─ /socket.io/* ──► backend:8080 (WebSocket / polling)
              └─ /health      ──► backend:8080
backend (Node 22, Express + Socket.IO) ──► MongoDB (shared homelab instance)
```

```
client/                    React app + nginx.conf + Dockerfile
server/
  src/server.js            app, CORS, Socket.IO, startup
  src/routes, controllers  REST API (/api/user, /api/health, /api/ping)
  src/middleware/          securityHeaders, rateLimit, requireAdmin, requestLogger
  src/utils/               user input validation
  src/sockets/             poker Socket.IO events (joinRoom, leaveRoom, startGame, playerAction)
  src/services/poker/      cardUtils, handEvaluator, gameLogic (pure game rules)
  src/models/              Mongoose models (Mongoose 6)
  test/                    node:test unit tests
docker-compose.yml         backend + web
```

## Requirements

- Node.js 22+
- MongoDB (a local instance, or a connection string for a remote one)

## Local development

```bash
# server
cd server
npm install
cp .env.example .env      # then edit values; use MONGO_URI=mongodb://localhost:27017/codezi locally
npm run dev               # node --watch src/server.js, port 8080

# client (second terminal)
cd client
npm install
npm run dev               # Vite dev server, http://localhost:5173
```

## Tests

```bash
cd server
npm test                  # node --test: poker logic, hand evaluator, validation, middleware
```

CI (`.github/workflows/ci.yml`) installs the server, syntax-checks every file under `server/src`, runs `npm test`, and builds the client on every pull request and non-`main` push.

## Deploy with Docker Compose

```bash
cp server/.env.example server/.env   # fill in real values; never commit this file
docker compose up -d --build
```

The `web` container serves the app on port 80 and proxies `/api`, `/socket.io` and `/health` to the `backend` container. The backend has a Docker healthcheck on `/health`.

Pushes to `main` trigger `.github/workflows/deploy.yml`, which syncs the repo to the homelab host (keeping its existing `server/.env`) and runs `docker compose up -d --build`.

## Environment variables

Set these in `server/.env` (see `server/.env.example`). Names only; values belong in your own `.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port (default `8080`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (`MONGODB_URI` / `DATABASE_URL` also accepted) |
| `LOCAL_MONGO_URI` | Local MongoDB fallback |
| `FORCE_LOCAL_MONGO` | `true` to use only the local MongoDB |
| `CLIENT_URL` | Extra allowed browser origins, comma-separated |
| `ADMIN_PASSWORD` | Required (via `x-admin-password` header) to rename/delete users; open while unset |
| `SESSION_IDLE_MS` | Idle time before a poker room is swept |

## API

- `GET /health` and `GET /api/health`: health checks
- `GET /api/ping`: connectivity check
- `GET /api/user`, `GET /api/user/:id`: list / fetch users
- `POST /api/user`: create a user (`firstName` 1–40 chars, `lastName` optional up to 40; rate limited to 15 per 15 minutes per IP, then `429`)
- `PATCH /api/user/:id`, `DELETE /api/user/:id`: admin-protected

## License

See [LICENSE](LICENSE).
