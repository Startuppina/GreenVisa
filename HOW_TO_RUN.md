# Install dependencies

Install npm 20

## install root deps
npm install

## install backend deps
cd server
npm install
cd ..

14 vulnerabilities (4 low, 3 moderate, 6 high, 1 critical)

## install frontend deps
cd client
npm install
cd ..

## build docker image
docker compose -f docker-compose.db.yml up -d --build


# Run app

## run docker compose (after first time no need to rebuild)
docker compose -f docker-compose.db.yml up -d

## run backend

cd server
npm run dev

## run frontend

cd client
npm run dev



# google cloud for ocr

gcloud init

gcloud auth login
gcloud auth application-default login
gcloud auth list

log in via browser. currently ocr service is linked to antonio.gassner@claror.it


# tests

```bash
cd server
npm test
```