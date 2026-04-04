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

## build docker image (development — DB only)
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

This starts:
- PostgreSQL on `localhost:5432`
- pgweb on `http://localhost:8081`

# Run app

## run docker compose (after first time no need to rebuild)
```bash
docker compose -f docker-compose.dev.yml up -d
```

## reset database

`down -v` removes the Postgres volume; next `up` reapplies `server/init.sql`. Run from repo root (where `docker-compose.dev.yml` lives).


```powershell
docker compose -f docker-compose.dev.yml down -v; docker compose -f docker-compose.dev.yml up -d
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

# Test locale stack completo (local-prod)

Per testare l'intera architettura di produzione in locale (nginx + server + db + pgweb) senza bisogno del VPS:

```bash
docker compose -f docker-compose.local-prod.yml up --build
```

Questo avvia:
- **nginx** su `http://localhost` (porta 80) — serve il client built e fa da reverse proxy per `/api/` e `/uploaded_img/`
- **server** con `node server` (non nodemon) e `NODE_ENV=production`
- **db** PostgreSQL su `localhost:5432`
- **pgweb** su `http://localhost:8081`

Per fermare e rimuovere i dati:
```powershell
docker compose -f docker-compose.local-prod.yml down -v
```

Il volume DB (`green-visa-local-prod-db`) e separato da quello di sviluppo e produzione.

# Deploy produzione (VPS)

## 1. Build del frontend

```bash
cd client
npm install
npm run build
```

Questo genera `client/dist/` con i file statici ottimizzati.

## 2. Copia dei file statici sul VPS

Copiare il contenuto di `client/dist/` dove nginx sul VPS lo serve (es. `/var/www/greenvisa-client/`).

## 3. Avvio server + database

Sul VPS, dalla root del repo:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Questo usa `docker-compose.prod.yml` (compose di produzione) che avvia solo `server` + `db`:
- Il server gira con `node server` (non nodemon) e `NODE_ENV=production`
- Il DB PostgreSQL con volume persistente
- `init.sql` è montato come bind mount in `/docker-entrypoint-initdb.d/init.sql` perché il servizio DB usa l'immagine ufficiale `postgres:16` direttamente nel compose: così il bootstrap del database resta semplice e non richiede una build dedicata dell'immagine DB
- `nginx` non è nel compose prod perché sul VPS il reverse proxy vive fuori da Docker e serve direttamente i file statici del frontend, oltre a inoltrare `/api/` e `/uploaded_img/` al backend

## 4. Configurazione nginx sul VPS

Il reverse proxy nginx sul VPS deve essere configurato per servire i file statici e fare da proxy all'API:

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

## 5. Note .env per produzione

In `server/.env` sul VPS, assicurarsi che:
- `CLIENT_URL` punti all'URL del reverse proxy (es. `http://vps-0fde778b.vps.ovh.net` senza `:5173`)
- `SERVER_URL` idem (senza `:8080`)
- `DB_HOST` puo restare `localhost` perche il compose di produzione fa override con `DB_HOST=db`

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

Su Windows spesso **non** c'è `psql` nel PATH (`psql` non riconosciuto): in quel caso non serve installare nulla se usi Postgres da Docker Compose (questo repo).

## Se il DB gira in Docker (`docker compose -f docker-compose.dev.yml up`)

`psql` è **dentro** il container `greenvisa-db`. Password e utente coincidono con `dockerfile.database` (`admin` / `pass123`), non con `server/.env` a meno che non le allinei tu.

Da PowerShell, da qualsiasi cartella (Docker deve essere avviato):

```powershell
docker exec -e PGPASSWORD=pass123 greenvisa-db psql -U admin -d green-visa -c "SELECT id, email, username FROM users WHERE administrator IS NOT TRUE;"
docker exec -e PGPASSWORD=pass123 greenvisa-db psql -U admin -d green-visa -c "DELETE FROM users WHERE administrator IS NOT TRUE;"
```
