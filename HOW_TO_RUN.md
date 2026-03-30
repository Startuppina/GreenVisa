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

# Run app

## run docker compose (after first time no need to rebuild)
docker compose -f docker-compose.db.yml up -d

## run backend
```bash
cd server

npm run dev
```

## run frontend
```bash
cd client

npm run dev
```


# google cloud for ocr
```bash
gcloud init

gcloud auth login
gcloud auth application-default login
gcloud auth list

log in via browser. currently ocr service is linked to antonio.gassner@claror.it
```

# tests

```bash
cd server
npm test
```