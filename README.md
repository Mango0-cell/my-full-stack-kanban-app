# Kanban App

Aplicacion full-stack para gestion de proyectos tipo Kanban. Incluye autenticacion, tableros por proyecto, columnas, tarjetas, comentarios, adjuntos, archivo/cancelados, miembros, invitaciones, notificaciones y chat en tiempo real.

## Contenido

- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Instalacion local](#instalacion-local)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Scripts disponibles](#scripts-disponibles)
- [API](#api)
- [Tiempo real](#tiempo-real)
- [Frontend](#frontend)
- [Docker](#docker)
- [Calidad y pruebas](#calidad-y-pruebas)
- [Notas de seguridad](#notas-de-seguridad)
- [Troubleshooting](#troubleshooting)

## Stack

### Backend

- Node.js + TypeScript
- NestJS
- PostgreSQL con SQL parametrizado mediante `pg`
- JWT con `jsonwebtoken`
- Hashing de passwords con `bcrypt`
- Socket.IO para eventos en tiempo real
- Helmet, CORS estricto, validacion con `class-validator`

### Frontend

- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Redux Toolkit + RTK Query
- React Hook Form + Zod
- DnD Kit
- Plate.js para markdown/rich text
- Radix UI, shadcn-style components y Lucide React
- Socket.IO Client

### Infraestructura local

- Docker Compose para PostgreSQL y API
- Base de datos PostgreSQL 16

## Estructura del proyecto

```text
.
├── docker-compose.yml
├── package.json
├── README.md
├── kanban-api/
│   ├── db/migrations/
│   ├── src/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── columns/
│   │   ├── cards/
│   │   ├── comments/
│   │   ├── attachments/
│   │   ├── invitations/
│   │   ├── notifications/
│   │   ├── chat/
│   │   ├── realtime/
│   │   └── users/
│   ├── Dockerfile
│   └── package.json
└── kanban-frontend/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   └── lib/
    └── package.json
```

## Requisitos

- Node.js 20 o superior
- npm
- PostgreSQL 16 o Docker
- GitHub CLI solo si vas a automatizar tareas del repositorio remoto

## Variables de entorno

### Backend: `kanban-api/.env`

```env
DATABASE_URL=postgresql://kanban:kanban_secret@localhost:5432/kanban
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# SMTP opcional para invitaciones/correos
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_password
SMTP_FROM=noreply@example.com
```

Notas:

- `JWT_SECRET` y `DATABASE_URL` son obligatorios. La API termina el proceso si faltan.
- En desarrollo se permiten automaticamente `http://localhost:3000` y `http://localhost:3001`.
- El servicio de correo usa variables `SMTP_*`.

### Frontend: `kanban-frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Notas:

- El frontend consume la API mediante RTK Query.
- Si `NEXT_PUBLIC_SOCKET_URL` no existe, el cliente de realtime usa `http://localhost:3001` como fallback en desarrollo.

### Docker Compose: `.env` en la raiz

```env
POSTGRES_USER=kanban
POSTGRES_PASSWORD=kanban_secret
POSTGRES_DB=kanban
POSTGRES_PORT=5432

JWT_SECRET=change_this_to_a_long_random_secret
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000

MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
```

Nota: el backend lee variables SMTP con prefijo `SMTP_*` cuando se ejecuta directamente. El `docker-compose.yml` actual define variables `MAIL_*` para el contenedor; si necesitas SMTP real en Docker, agrega tambien las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` y `SMTP_FROM_NAME` al servicio `api`.

## Instalacion local

Instala dependencias en la raiz y en cada app:

```bash
npm install
npm install --prefix kanban-api
npm install --prefix kanban-frontend
```

Levanta PostgreSQL con Docker:

```bash
docker compose up -d postgres
```

Crea `kanban-api/.env` y `kanban-frontend/.env.local` con los valores anteriores.

Ejecuta migraciones:

```bash
for f in kanban-api/db/migrations/*.sql; do
  psql "postgresql://kanban:kanban_secret@localhost:5432/kanban" -f "$f"
done
```

Arranca backend y frontend juntos:

```bash
npm run dev
```

URLs locales:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`

## Base de datos y migraciones

Las migraciones viven en `kanban-api/db/migrations/` y se ejecutan en orden alfabetico:

```text
001_initial_schema.sql
002_allow_custom_priority.sql
003_realtime_foundation.sql
004_invitation_pending_constraints.sql
005_add_editor_role.sql
006_drop_user_follows.sql
007_project_canceled_items.sql
```

El esquema cubre:

- usuarios y roles
- proyectos y miembros
- columnas y tarjetas
- comentarios, adjuntos y actividad
- conversaciones y mensajes directos
- invitaciones
- notificaciones
- tarjetas y columnas canceladas/archivadas

El proyecto no usa ORM. Los servicios del backend ejecutan SQL parametrizado mediante `pg`.

## Scripts disponibles

### Raiz

```bash
npm run dev
```

Ejecuta en paralelo:

- `npm run dev --prefix kanban-api`
- `npm run dev --prefix kanban-frontend`

### Backend

```bash
npm run dev --prefix kanban-api
npm run build --prefix kanban-api
npm run start --prefix kanban-api
npm run lint --prefix kanban-api
```

### Frontend

```bash
npm run dev --prefix kanban-frontend
npm run build --prefix kanban-frontend
npm run start --prefix kanban-frontend
npm run lint --prefix kanban-frontend
```

## API

La API usa prefijo global `/api`. Los endpoints principales son:

### Salud

- `GET /api/health`

### Autenticacion

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Usuarios

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/password`
- `GET /api/users/search`
- `GET /api/users/:id`
- `DELETE /api/users/account`

### Proyectos y miembros

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/members`
- `POST /api/projects/:id/members`
- `PUT /api/projects/:id/members/:uid`
- `DELETE /api/projects/:id/members/:uid`
- `POST /api/projects/:id/leave`

### Columnas

- `GET /api/projects/:id/columns`
- `POST /api/projects/:id/columns`
- `PUT /api/projects/:id/columns/:cid`
- `DELETE /api/projects/:id/columns/:cid`

### Tarjetas

- `GET /api/projects/:id/cards`
- `GET /api/columns/:cid/cards`
- `POST /api/columns/:cid/cards`
- `GET /api/cards/:id`
- `PUT /api/cards/:id`
- `DELETE /api/cards/:id`
- `PUT /api/cards/:id/move`

### Comentarios, adjuntos y actividad

- `GET /api/cards/:id/comments`
- `POST /api/cards/:id/comments`
- `PUT /api/comments/:id`
- `DELETE /api/comments/:id`
- `GET /api/cards/:id/attachments`
- `POST /api/cards/:id/attachments`
- `DELETE /api/attachments/:id`
- `GET /api/cards/:id/activity`

### Invitaciones y notificaciones

- `POST /api/invitations`
- `GET /api/invitations`
- `GET /api/invitations/sent`
- `GET /api/invitations/pending`
- `PUT /api/invitations/:id`
- `DELETE /api/invitations/:id`
- `POST /api/invitations/:id/accept`
- `POST /api/invitations/:id/decline`
- `POST /api/invitations/accept-by-token`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Chat

- `GET /api/chat/conversations`
- `POST /api/chat/conversations`
- `GET /api/chat/conversations/:id/messages`
- `DELETE /api/chat/conversations/:id`
- `POST /api/chat/messages`

### Cancelados / archivo

- `GET /api/projects/:id/canceled`
- `POST /api/projects/:id/canceled/cards/:cardId`
- `POST /api/projects/:id/canceled/columns/:columnId`
- `POST /api/projects/:id/canceled/cards/:canceledCardId/unarchive`
- `DELETE /api/projects/:id/canceled/cards/:canceledCardId`
- `DELETE /api/projects/:id/canceled/groups/:groupId`

## Tiempo real

El backend expone Socket.IO en `/realtime`. Los eventos de entrada principales son:

- `room.project.join`
- `room.conversation.join`
- `room.conversation.leave`

El frontend centraliza la conexion en `kanban-frontend/src/lib/realtime/socket.ts` y sincroniza caches de RTK Query desde `kanban-frontend/src/lib/realtime/chatCache.ts`.

## Frontend

Rutas principales:

- `/` pagina inicial
- `/login`
- `/register`
- `/board`
- `/board/[projectId]`
- `/archive`
- `/members`
- `/profile`
- `/settings`
- `/integrations`
- `/optimizer`
- `/chats`
- `/chats/[conversationId]`
- `/invitations/accept`

Convenciones importantes:

- No usar `fetch()` directo para datos de producto; usar RTK Query en `src/lib/store/api/`.
- Formularios con React Hook Form + Zod.
- DnD con `@dnd-kit`.
- Rich text/markdown con Plate.js.
- Componentes compartidos en `src/components/ui`, `src/components/shared`, `src/components/forms` y `src/components/board`.

## Docker

Levantar PostgreSQL y API:

```bash
docker compose up -d --build
```

Ejecutar migraciones dentro del stack:

```bash
docker compose exec api sh -c '
  for f in db/migrations/*.sql; do
    echo "Running $f ..."
    PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -f "$f"
  done
'
```

Ver logs:

```bash
docker compose logs -f api
docker compose logs -f postgres
```

El archivo `kanban-api/deploy.md` contiene una guia especifica para desplegar la API en AWS EC2 con Docker, Nginx y SSL.

## Calidad y pruebas

Comandos recomendados antes de abrir un PR:

```bash
npm run build --prefix kanban-api
npm run build --prefix kanban-frontend
npm run lint --prefix kanban-frontend
```

Estado actual:

- El backend tiene script `test`, pero actualmente es un placeholder que falla de forma intencional.
- El lint del backend ejecuta ESLint con `--fix`.
- El frontend usa ESLint 9 con configuracion de Next.

## Notas de seguridad

- No commitear `.env`, secretos ni credenciales SMTP.
- Usar un `JWT_SECRET` largo y aleatorio en cualquier entorno compartido.
- Mantener `CORS_ORIGINS` con dominios explicitos en produccion.
- El backend valida DTOs globalmente con `ValidationPipe`.
- Las consultas a PostgreSQL deben mantenerse parametrizadas.
- En produccion, servir la API detras de HTTPS y configurar el proxy para soportar WebSocket.

## Troubleshooting

### La API termina al arrancar

Revisa que existan `DATABASE_URL` y `JWT_SECRET` en `kanban-api/.env` o en el entorno del contenedor.

### El frontend no conecta con la API

Confirma que `NEXT_PUBLIC_API_URL` apunte a la API con el prefijo `/api`, por ejemplo:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Socket.IO no conecta

Verifica `NEXT_PUBLIC_SOCKET_URL`, CORS y que el backend este escuchando en `http://localhost:3001`. Si hay proxy reverso, debe reenviar los headers `Upgrade` y `Connection`.

### Las tablas no existen

Ejecuta las migraciones de `kanban-api/db/migrations/` en orden contra la base configurada en `DATABASE_URL`.

### El puerto 5432 esta ocupado

Cambia `POSTGRES_PORT` en el `.env` de la raiz o detiene el servicio local de PostgreSQL que ya usa ese puerto.
