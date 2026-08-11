# harshitrv.in

Server-rendered portfolio and private project editor built with TanStack Start, React 19, Tailwind CSS, and shadcn/ui.

## Requirements

- Node.js 24
- pnpm 11
- One Node process when project editing is enabled

## Local development

```bash
pnpm install
pnpm dev
```

The public site is available at `http://localhost:3000`. Project data is bootstrapped from `data/projects.seed.json` into the gitignored `.data/projects.json` file.

Admin login requires a password hash:

```bash
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
pnpm admin:hash
unset ADMIN_PASSWORD
```

Copy `.env.example` to `.env`, then set:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` to the command output
- `SESSION_SECRET` to at least 32 random characters
- `APP_ORIGIN` to the exact public origin
- `PROJECT_DATA_FILE` and `PROJECT_BACKUP_DIR` to absolute writable paths in production

`TRUST_PROXY=true` may be used only when the Node port is exclusively reachable through a trusted reverse proxy that replaces forwarded client headers.

## Project data

The application is the sole writer of a versioned JSON document. It:

- validates the full document before serving requests;
- serializes mutations and rejects stale revisions;
- writes through a temporary file and atomic rename;
- keeps the latest 20 valid backups;
- quarantines corrupt primary files and restores the newest valid backup.

Mutable data must live outside the repository and `.output`. Do not run multiple application processes against the same JSON file.

## Checks

```bash
pnpm fmt:check
pnpm lint
pnpm check
pnpm test
pnpm build
```

## Production artifact

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The build emits `.output/server/index.mjs` and `.output/public`. The server listens on `NITRO_HOST`/`NITRO_PORT`; TLS termination and deployment automation are intentionally outside this repository.
