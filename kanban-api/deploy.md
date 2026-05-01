# Deploying Kanban API to AWS EC2

## 1. Prerequisites

- An AWS EC2 instance (Ubuntu 22.04+ recommended, t3.small or larger)
- Security group allowing inbound on ports: **22** (SSH), **80** (HTTP), **443** (HTTPS), **3001** (API, optional if using reverse proxy)
- An SSH key pair configured
- A domain name (optional, for SSL)

## 2. Install Docker and Docker Compose

SSH into your instance and run:

```bash
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Log out and back in for group changes to take effect
exit
```

Verify after reconnecting:

```bash
docker --version
docker compose version
```

## 3. Clone the repository

```bash
git clone https://github.com/<your-org>/kanban-app.git
cd kanban-app
```

## 4. Create the `.env` file

```bash
cat > .env << 'EOF'
POSTGRES_USER=kanban
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>
POSTGRES_DB=kanban

JWT_SECRET=<RANDOM_SECRET_HERE>
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=you@example.com
MAIL_PASS=your_mail_password
MAIL_FROM=noreply@example.com
EOF
```

Generate a random JWT secret:

```bash
openssl rand -base64 48
```

## 5. Build and start services

```bash
docker compose up -d --build
```

This starts PostgreSQL and the API. Wait for both to be healthy:

```bash
docker compose ps
```

## 6. Run database migrations

The migration SQL files are inside the API container at `/app/db/migrations/`. Run them in order:

```bash
docker compose exec api sh -c '
  for f in db/migrations/*.sql; do
    echo "Running $f ..."
    PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -f "$f"
  done
'
```

Or if you prefer to run from the host using the exposed port:

```bash
source .env
for f in kanban-api/db/migrations/*.sql; do
  echo "Running $f ..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h 127.0.0.1 -U $POSTGRES_USER -d $POSTGRES_DB -f "$f"
done
```

## 7. Verify the API is running

```bash
curl http://localhost:3001/api/health
# or from outside:
curl http://<EC2_PUBLIC_IP>:3001/api/health
```

Check logs if something is wrong:

```bash
docker compose logs api --tail 50
```

## 8. (Optional) Nginx reverse proxy with SSL

Install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/kanban-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/kanban-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

The `Upgrade` and `Connection` headers are required for Socket.IO WebSocket connections on `/realtime`.

## 9. Monitoring and logs

```bash
# Live logs
docker compose logs -f api

# Container resource usage
docker stats

# Restart a service
docker compose restart api

# Check database
docker compose exec postgres psql -U kanban -d kanban
```

## 10. Update and redeploy

```bash
cd kanban-app
git pull origin main

# Rebuild and restart (zero-downtime for the database)
docker compose up -d --build api

# Run any new migrations
docker compose exec api sh -c '
  for f in db/migrations/*.sql; do
    echo "Running $f ..."
    PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -f "$f"
  done
'
```

To do a full rebuild including the database volume (destructive):

```bash
docker compose down -v
docker compose up -d --build
# Then re-run all migrations
```
