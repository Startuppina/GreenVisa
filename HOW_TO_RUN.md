# Install dependencies

Install npm 20

## install root deps
```bash
npm install

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

## stop and wipe the local database

Removes containers and the Postgres volume so the next `up` reapplies `server/init.sql` from scratch.

```bash
docker compose -f docker-compose.db.yml down -v
```

For local backend development, make sure `server/.env` uses:

```bash
DB_HOST=localhost
DB_PORT=5432
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