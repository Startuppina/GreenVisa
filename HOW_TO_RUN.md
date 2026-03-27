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


# Run app

## run docker compose
docker compose -f docker-compose.db.yml up -d --build

## run backend

cd server
npm run dev

## run frontend

cd client
npm run dev

