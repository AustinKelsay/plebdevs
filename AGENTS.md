# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives in `src/`, with page routes in `src/pages`, reusable UI in `src/components`, hooks in `src/hooks`, shared helpers in `src/utils`, and server-facing logic under `src/lib` and `src/db`. Context providers, constants, and config live in `src/context`, `src/constants`, and `src/config`. Styling combines Tailwind layers and globals in `src/styles`, while static files sit in `public/`. Database schemas and migrations are managed via `prisma/schema.prisma` and `prisma/migrations/`. Local infrastructure relies on `docker-compose.yml` and the project `Dockerfile` for Postgres-backed workflows.

## Build, Test, and Development Commands
Install dependencies once with `npm install`. Use `npm run dev` for the hot-reloading Next.js server, or `docker compose up --build` when the Postgres service is required. Apply schema updates with `npx prisma migrate dev` and regenerate clients via `npx prisma generate` (also run automatically on `postinstall`). Before shipping, execute `npm run build` followed by `npm run start` to verify the production bundle. Guard code quality with `npm run lint`, and auto-fix common issues using `npm run lint:fix`.

## Coding Style & Naming Conventions
Prettier enforces two-space indentation, single quotes, trailing commas (ES5), and 100-character lines; run it before committing. Favor functional React components with PascalCase filenames such as `src/components/ProfileCard.tsx`. Keep hooks prefixed with `use`, colocate utility modules near their feature, and import shared modules with the `@/` path alias defined in `jsconfig.json`.

## Testing Guidelines
A formal automated test suite is not yet established. Treat linting and targeted manual verification as the baseline, and capture edge cases in your PR description. When adding tests, colocate them beside the feature as `feature.test.ts(x)` files or place them in a nearby `__tests__/` folder. Always rerun `npm run lint` and any affected flows locally before requesting review.

## Commit & Pull Request Guidelines
Write concise, imperative commit subjects (e.g., `Add wallet connect modal`) and group related changes together. Pull requests should restate the problem, highlight key updates, link relevant issues, and include screenshots or short clips for UI adjustments. Confirm that `npm run lint`, schema migrations, and regeneration steps have been executed, and call out required environment variables such as `.env.local` entries.

## Environment & Security Notes
Request secrets from maintainers rather than reusing staging values. Never commit credentials or Prisma client artifacts unless schema changes demand it. Mask sensitive values—especially `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`—in logs and PR discussions, and review `.github/workflows/` when introducing automation to keep credentials scoped.
