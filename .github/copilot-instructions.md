# Copilot Instructions for `my-full-stack-kanban-app`

## Current project phase (priority)

This project is now in the **Realtime Collaboration + Chat phase**. Prioritize:

1. Socket.IO-based realtime collaboration and chat.
2. Notifications + invitations UX improvements.
3. Role/permission hardening and account/project data isolation.
4. SOLID-oriented API refactor where needed to support websocket + HTTP parity.

## Build, test, and lint commands

From repository root:

```bash
# Run API + frontend in parallel
npm run dev

# Frontend only
npm run dev --prefix kanban-frontend
npm run build --prefix kanban-frontend
npm run lint --prefix kanban-frontend
npm run start --prefix kanban-frontend

# API only
npm run dev --prefix kanban-api
npm run build --prefix kanban-api
npm run start --prefix kanban-api
```

Testing status:

- There is currently **no working automated test suite configured** in package scripts.
- `kanban-api` has a placeholder `npm test` script that exits with an error.
- There is currently no “run a single test” command available in this repo.

## MCP servers to prioritize

- **Playwright MCP (recommended):** use it for end-to-end UI verification of auth redirects, board drag-and-drop flows, modal flows, and `/api/*` network behavior through the Next.js rewrite.
- **PostgreSQL MCP (if available):** use it to inspect migration effects, verify role/member/card data relationships, and validate SQL-backed behavior in `kanban-api` services.

## High-level architecture

This repository is a two-app setup:

1. **`kanban-frontend`**: Next.js App Router UI (React 19), Redux Toolkit + RTK Query for API state.
2. **`kanban-api`**: NestJS REST API using raw SQL via `pg` (`DatabaseService`) against PostgreSQL.

Realtime architecture target for this phase:

1. Keep REST for CRUD and initial data hydration.
2. Add Socket.IO channel(s) for live board updates, chat messages, and notifications.
3. Keep auth/permission parity across HTTP controllers and websocket handlers.

Request flow:

1. Frontend calls `/api/*` paths.
2. Next.js rewrite (`kanban-frontend/next.config.ts`) proxies those to `${BACKEND_URL}/api/*` (default `http://localhost:3001`).
3. NestJS serves routes under global `/api` prefix (`kanban-api/src/main.ts`).

Auth flow:

1. Login/register returns JWT from API.
2. Frontend stores token in `kanban_token` cookie (`js-cookie`).
3. RTK Query base API injects `Authorization: Bearer <token>` from that cookie.
4. Next middleware/proxy (`kanban-frontend/src/proxy.ts`) guards non-public pages by presence of the cookie.
5. API enforces auth globally with `JwtAuthGuard` (registered as `APP_GUARD`), and public endpoints opt out via `@Public()`.

Data model and permissions:

- Core entities: users, projects, project_members, columns, cards, comments, attachments, card_activity.
- Membership and role checks are enforced in service layer methods (owner/admin/member checks before writes).
- Database schema and role seed live in SQL migrations under `kanban-api/db/migrations`.

## Key conventions in this codebase

### API response envelope is standardized

All endpoints return:

```json
{ "data": ..., "message": "...", "error": null | { "code": "...", "message": "..." } }
```

Use this same shape for new endpoints. Error code mapping is centralized in the global exception filter.

### API modules use raw SQL, not an ORM

- Services call `DatabaseService.query(...)` directly.
- Multi-step writes use explicit transactions with `getClient()`, `BEGIN/COMMIT/ROLLBACK`, and `client.release()` in `finally`.
- DTOs + Nest validation pipes are relied on for input validation.

### SOLID-first backend evolution (required in this phase)

- Separate transport concerns (REST controllers / Socket gateways) from business logic services.
- Centralize role rules in shared policy methods used by both HTTP and socket events.
- Keep invitation, notification, chat, and membership logic in distinct services/modules.
- Favor extension (new events/features) over modifying unrelated modules.

### Frontend API layer is RTK Query-first

- Add/modify endpoints in `src/lib/store/api/*Api.ts` files via `baseApi.injectEndpoints`.
- Keep cache behavior correct with `providesTags` / `invalidatesTags`.
- Use generated hooks (`useXxxQuery`, `useXxxMutation`) in components; do not bypass the API layer for server-backed state.

For realtime additions:

- Add a dedicated socket client layer; do not scatter socket logic across unrelated components.
- Use RTK Query or store actions to reconcile incoming websocket events with cached REST data.

### Route protection depends on cookie semantics

- Public pages are `/`, `/login`, `/register`.
- Protected dashboard routes rely on `kanban_token` cookie checks in `src/proxy.ts`.
- Avoid changes that break this contract unless updating both middleware/proxy and auth handling together.

### Account/project isolation is mandatory

- Any localStorage caches (archived/canceled/chat drafts/messages) must be scoped by user and project.
- Login/logout/register flows must clear or reinitialize account-bound UI state immediately.
- Never reuse previous-account cached state in the current session.

### Realtime/chat data policy for localStorage

- Use a fixed-size queue (circular-buffer behavior) for recent messages.
- Keep a maximum length (e.g., 40); trim oldest entries when capacity is exceeded.
- Persist timestamp metadata and clear chat cache older than 3 days.
- Expose a UI countdown showing time until local cache reset.

### Role rules (target behavior)

- **admin**: full CRUD in own project, including collaborators.
- **editor**: CRUD for board content only.
- **viewer**: read-only.
- Project author cannot remove self from project.
- Non-author members cannot elevate/change privileged roles across foreign-owned projects.

### Feature priorities for this phase

1. Team members page: horizontal project selector + member list per selected project.
2. Team settings invitations:
   - external invitation button with Gmail-only validation (`@gmail.com`),
   - signup email validation aligned to same Gmail rule,
   - invitation email “Accept invitation” link to `https://kanban-app-full-stack.vercel.app`,
   - internal “Add member” dropdown search by email.
3. Header:
   - notifications dropdown (latest 5 + “see more” latest 10),
   - dedicated messages icon linking to chat list,
   - users dropdown search by email with icon actions: follow label, send message, view profile.
4. Canceled view:
   - scope to one project/account,
   - support unarchive/delete for columns and delete for cards.
5. View transitions between app views for smoother UX.

### Next.js version caution (from existing assistant rules)

`kanban-frontend/CLAUDE.md` notes this project uses a Next.js version with breaking changes; check `node_modules/next/dist/docs/` and current deprecation guidance before framework-level refactors.
