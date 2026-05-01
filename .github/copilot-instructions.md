# Copilot Instructions for `my-full-stack-kanban-app`

## Current project phase (priority)

This repository is in the **Realtime Collaboration + Chat** phase. Prioritize:

1. Socket.IO-driven realtime board/chat behavior.
2. Notifications + invitations UX.
3. Permission hardening and account/project data isolation.
4. Backend refactors that keep HTTP + websocket authorization behavior aligned.

## Build, test, and lint commands

Run from repository root:

```bash
# API + frontend together
npm run dev

# Frontend
npm run dev --prefix kanban-frontend
npm run build --prefix kanban-frontend
npm run lint --prefix kanban-frontend
npm run start --prefix kanban-frontend

# API
npm run dev --prefix kanban-api
npm run build --prefix kanban-api
npm run lint --prefix kanban-api
npm run start --prefix kanban-api
```

Testing status:

- There is **no working automated test suite** in package scripts right now.
- `npm test --prefix kanban-api` is a placeholder script that exits with error.
- There is no configured single-test command in this repository yet.

## High-level architecture

This is a two-app monorepo:

1. **`kanban-frontend`**: Next.js App Router (React 19), Redux Toolkit + RTK Query.
2. **`kanban-api`**: NestJS API using raw PostgreSQL queries (`pg`) through `DatabaseService`.

Request/auth flow:

1. Frontend API slices call `NEXT_PUBLIC_API_URL` (configured as `/api` in frontend env files).
2. Next rewrite (`kanban-frontend/next.config.ts`) forwards `/api/*` to `${BACKEND_URL}/api/*`.
3. API serves under global `/api` prefix (`kanban-api/src/main.ts`).
4. JWT is stored in `kanban_token` cookie, injected into RTK Query `Authorization` headers, and checked by a global `JwtAuthGuard`.
5. Route gating for pages is done in `kanban-frontend/src/proxy.ts` using the same cookie.

Realtime flow:

1. Socket namespace is `/realtime` (frontend socket client in `src/lib/realtime/socket.ts`).
2. Users join:
   - personal rooms (`user:{id}`) on connect,
   - project rooms (`project:{id}`) on board pages,
   - conversation rooms (`conversation:{id}`) only while chat pages are open.
3. Backend services persist to Postgres first, then emit realtime events via `RealtimeEventsService`.
4. `ChatService` suppresses notification creation when recipient is already active in the conversation room.

Data model:

- Base schema: users, projects, project_members, columns, cards, comments, attachments, card_activity.
- Realtime/chat schema extensions (migrations): direct_conversations, direct_messages, invitations, notifications.
- SQL migrations live in `kanban-api/db/migrations`.

## Key conventions in this codebase

### API contract and errors

- Controllers return the envelope:
  `{ data, message, error }`.
- Failures are normalized by `AllExceptionsFilter` to:
  `{ data: null, message, error: { code, message } }`.
- Frontend types (`src/lib/types/api.ts`) and RTK Query endpoints assume this envelope.

### Backend data/access patterns

- No ORM: use `DatabaseService.query(...)` for SQL.
- Multi-step mutations use explicit transactions (`getClient()`, `BEGIN/COMMIT/ROLLBACK`, `release()`).
- Keep authorization checks in shared policy/access services (`RolePolicyService`, `ProjectAccessService`) and reuse them across modules.

### API auth/decorator pattern

- `JwtAuthGuard` is global (registered via `APP_GUARD` in `AuthModule`), so endpoints are private by default.
- Public endpoints must opt out explicitly with `@Public()`.
- Controllers should consume authenticated identity via `@CurrentUser()` (`JwtPayload`) instead of re-parsing request internals.

### Frontend server-state pattern

- Use RTK Query endpoint slices in `src/lib/store/api/*Api.ts`.
- Keep `providesTags` / `invalidatesTags` accurate when changing endpoints.
- Do not bypass this layer with ad-hoc `fetch()` in app code.

### Realtime event and room conventions

- Socket handlers authenticate at connection time, then protect `@SubscribeMessage` handlers with `WsAuthGuard`.
- Room lifecycle events are contractually named:
  - `room.project.join`
  - `room.conversation.join`
  - `room.conversation.leave`
- Domain event names use scoped prefixes (for example `board.card.*`, `board.column.*`, `member.*`, `chat.message.*`, `notification.*`, `invitation.*`).

### Session/account isolation

- Clear account-scoped client state on auth transitions (login/register/logout): auth slice, RTK Query cache, realtime socket, and localStorage session keys.
- Scope localStorage keys by user (and project/conversation where relevant), e.g.:
  - `kanban_archived_projects:{userId}`
  - `kanban_canceled_cards:{userId}:{projectId}`
  - `chat-cache:{userId}:{conversationId}`

### Realtime/chat cache contract

- Chat local cache is capped to 40 messages and expires after 3 days (`src/lib/realtime/chatCache.ts`).
- Conversation pages show countdown to cache reset and merge API messages with live socket messages.

### Product-rule conventions enforced in code

- Gmail-only rule is enforced for registration and invitations (`@gmail.com`) in both frontend validation and backend DTO/service checks.
- Notification list limits are constrained to 5 or 10 only (frontend query type + backend DTO/service).
- Invitation emails use an accept link based on `INVITATION_LANDING_URL` (defaulting to the deployed app URL) and `POST /invitations/accept-by-token` supports token acceptance.
- Owner cannot leave/remove self; non-owner privileged role changes are blocked in project member role logic.

### Framework caution from assistant config

- `kanban-frontend/CLAUDE.md` flags this Next.js version as having breaking changes; check current Next docs before framework-level refactors.
