# Install dependencies

Install npm 20

## install root deps
```bash
npm install
```

## install backend deps
```bash
cd server
npm install
```
14 vulnerabilities (4 low, 3 moderate, 6 high, 1 critical)

## install frontend deps
```bash
cd client

npm install
```

## build docker image
```bash
docker compose -f docker-compose.db.yml up -d --build
```

This starts:
- PostgreSQL on `localhost:5432`
- pgweb on `http://localhost:8081`

# Run app

## run docker compose (after first time no need to rebuild)
docker compose -f docker-compose.db.yml up -d

## reset database

`down -v` removes the Postgres volume; next `up` reapplies `server/init.sql`. Run from repo root (where `docker-compose.db.yml` lives).


```powershell
docker compose -f docker-compose.db.yml down -v; docker compose -f docker-compose.db.yml up -d
```

## open pgweb

Open `http://localhost:8081` to inspect the local PostgreSQL database from the browser.
If pgweb asks for connection details, use:
- host: `db` if pgweb is running inside Docker Compose
- port: `5432`
- user: `admin`
- password: `pass123`
- database: `green-visa`

The schema is initialized from `server/init.sql`, so this is the quickest way to browse tables and run ad hoc queries during local development.

## run backend
```bash
cd server; npm run dev
```

## run frontend
```bash
cd client; npm run dev
```

## frontend proxy behavior (dev and remote LAN)

The frontend now calls relative paths:
- API: `/api/...`
- Uploaded images: `/uploaded_img/...`

In development, Vite proxies these paths to the backend on `http://localhost:8080`.
This means a browser opened from another PC must point to the frontend host (for example `http://<server-ip>:5173`) and will not call its own `localhost:8080`.

Quick check from browser DevTools Network:
- requests must go to `http://<frontend-host>:5173/api/...`
- requests must not go directly to `http://localhost:8080/...`

## production note (important)

`vite server.proxy` works only with `npm run dev`.
For production, configure an equivalent reverse proxy in front of the built frontend/static files.

Example Nginx mapping (same-origin safe):

```nginx
server {
  listen 80;
  server_name your-domain.example;

  # Frontend static build
  location / {
    root /var/www/greenvisa-client;
    try_files $uri /index.html;
  }

  # Backend API
  location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Uploaded images served by backend
  location /uploaded_img/ {
    proxy_pass http://127.0.0.1:8080/uploaded_img/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

If you deploy on HTTPS, keep backend cookies in production mode (`NODE_ENV=production`) so `secure` cookies are enabled.


# google cloud for ocr

1. download google cloud cli

2.
```bash
gcloud init

gcloud auth login
gcloud auth application-default login
gcloud auth list
```
log in via browser. currently ocr service is linked to antonio.gassner@claror.it



# tests

```bash
cd server; npm test

npm run test:block2
```

# seeding database per sviluppo questionario 

```bash
$env:TRANSPORT_V2_DEV_SEED='1'
node .\scripts\seedTransportV2Access.js
```

# Eliminare dal DB tutti gli utenti non admin

Operazione distruttiva: rimuove tutte le righe in `users` con `administrator = false` (gli account con `administrator = true` restano). Prima controlla cosa verrebbe cancellato, poi esegui la `DELETE`.

Su Windows spesso **non** c’è `psql` nel PATH (`psql` non riconosciuto): in quel caso non serve installare nulla se usi Postgres da Docker Compose (questo repo).

## Se il DB gira in Docker (`docker compose -f docker-compose.db.yml up`)

`psql` è **dentro** il container `greenvisa-db`. Password e utente coincidono con `Dockerfile.db` (`admin` / `pass123`), non con `server/.env` a meno che non le allinei tu.

Da PowerShell, da qualsiasi cartella (Docker deve essere avviato):

```powershell
docker exec -e PGPASSWORD=pass123 greenvisa-db psql -U admin -d green-visa -c "SELECT id, email, username FROM users WHERE administrator IS NOT TRUE;"
docker exec -e PGPASSWORD=pass123 greenvisa-db psql -U admin -d green-visa -c "DELETE FROM users WHERE administrator IS NOT TRUE;"
```