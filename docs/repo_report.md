# Repo Report

_Generated: 2026-03-27 | Repo: GreenVisa-main_

---

## 1. Executive summary

**Stack:** This is a full-stack JavaScript web application built with React 18 + Vite (frontend) and Express.js + Node.js (backend), backed by PostgreSQL. The frontend uses TailwindCSS for styling, SurveyJS for questionnaires, jsPDF for client-side PDF generation, and Stripe for payments. The backend is a single monolithic `server.js` file (~4,456 lines) handling all API routes, authentication, email, payments, and business logic.

**Architecture:** The repo is a two-folder monorepo: `client/` (Vite React SPA) and `server/` (Express API). They communicate over HTTP, with the frontend making authenticated API calls via Axios. Authentication uses JWT tokens stored in cookies. The database is PostgreSQL, seeded via `init.sql`. Docker Compose is split into three files: production (server + db), development (db + pgweb), and local prod test (nginx + server + db + pgweb). The production VPS uses an external nginx reverse proxy.

**Recommended dev setup for Windows:** Run the frontend and backend natively (Node.js on Windows) and use Docker only for PostgreSQL. This avoids Docker volume/polling issues on Windows while keeping the database easy to manage. You'll need to fix the `.env` files and `db.js` to point to `localhost` instead of the VPS / Docker service name. This is the fastest path to a working local setup.

---

## 2. Repository shape

```
GreenVisa-main/
├── client/                          # React + Vite frontend
│   ├── public/img/                  # Static images, logo, icons
│   ├── src/
│   │   ├── assets/                  # React assets (svg)
│   │   ├── components/              # ~50 UI components
│   │   ├── provider/provider.jsx    # Global React context
│   │   ├── questionnaires/          # SurveyJS JSON definitions
│   │   ├── *.jsx                    # Page-level components
│   │   ├── axiosInstance.js         # Axios config with JWT interceptor
│   │   ├── main.jsx                 # Router + entry point
│   │   ├── App.jsx                  # Landing page (hero, carousel, etc.)
│   │   ├── pdfGeneratorQuestionnaires.js  # PDF export for surveys
│   │   ├── surveyTheme.js           # SurveyJS theme config
│   │   └── index.css                # Tailwind directives
│   ├── .env                         # VITE_REACT_SERVER_ADDRESS
│   ├── dockerfile                   # Docker build for client
│   ├── dockerfile.prod              # nginx multi-stage production image
│   ├── vite.config.js               # Vite dev server config
│   ├── tailwind.config.mjs          # Tailwind configuration
│   ├── wait-for-server.sh           # Bash script (Docker only)
│   └── package.json
├── server/                          # Express.js backend
│   ├── img/                         # Static logo images for emails
│   ├── .env                         # All server env vars (DB, email, Stripe, etc.)
│   ├── db.js                        # PostgreSQL pool (reads DB_HOST from env, defaults to 'db')
│   ├── init.sql                     # Full DB schema (20+ tables)
│   ├── priceCalculator.js           # Pricing logic per certification category
│   ├── server.js                    # MONOLITH: all routes, middleware, cron, email (~4456 lines)
│   ├── dockerfile                   # Docker build for server
│   ├── node_modules/                # COMMITTED (should be .gitignored)
│   └── package.json
├── patches/                         # patch-package fixes
│   └── buffer-equal-constant-time+1.0.1.patch
├── docker-compose.prod.yml          # Production: server, db
├── docker-compose.dev.yml           # Development: db, pgweb
├── docker-compose.local-prod.yml    # Local prod test: nginx, server, db, pgweb
├── dockerfile.database              # Postgres image for docker-compose.dev
├── .dockerignore
├── .gitignore
├── package.json                     # Root package (minimal, mostly metadata)
└── README.md                        # Basic setup + Docker + git workflow
```

| Area | Purpose |
|------|---------|
| `client/` | React SPA: certification marketplace, questionnaires, building management, reports, payments |
| `server/` | Express API: auth, CRUD, payments (Stripe), email (Nodemailer), file uploads (Multer), cron jobs |
| `patches/` | Fixes a `SlowBuffer` deprecation in `buffer-equal-constant-time` (used by `jwa`/`jsonwebtoken`) |
| Root | Docker Compose orchestration, root package.json for patch-package |

---

## 3. Technology stack

### Frontend
| Technology | Version | Status |
|-----------|---------|--------|
| React | 18.3.1 | **Confirmed** (package.json) |
| Vite | 5.3.4 | **Confirmed** |
| TailwindCSS | 3.4.7 | **Confirmed** |
| React Router DOM | 6.26.0 | **Confirmed** |
| Axios | 1.7.3 | **Confirmed** |
| SurveyJS (survey-core, survey-react-ui, survey-pdf) | 1.12.7 | **Confirmed** |
| jsPDF + jspdf-autotable | 2.5.2 / 3.8.3 | **Confirmed** |
| html2canvas | 1.4.1 | **Confirmed** |
| Jodit (WYSIWYG editor) | 4.2.27 | **Confirmed** |
| react-credit-cards-2 | 1.0.2 | **Confirmed** |
| js-cookie | 3.0.5 | **Confirmed** |
| FontAwesome | 6.6.0 | **Confirmed** |

### Backend
| Technology | Version | Status |
|-----------|---------|--------|
| Node.js | 20 (Alpine, via Dockerfile) | **Confirmed** |
| Express | 4.19.2 | **Confirmed** |
| PostgreSQL client (pg) | 8.12.0 | **Confirmed** |
| Multer (file upload) | 1.4.5-lts.1 | **Confirmed** |
| Sharp (image processing) | 0.33.5 | **Confirmed** |
| Stripe | 16.8.0 | **Confirmed** |
| Nodemailer | 6.9.14 | **Confirmed** |
| bcryptjs | 2.4.3 | **Confirmed** |
| jsonwebtoken | 9.0.2 | **Confirmed** |
| node-cron | 3.0.3 | **Confirmed** |
| DOMPurify + jsdom | 3.1.6 / 25.0.1 | **Confirmed** |
| nodemon (dev) | 3.1.4 | **Confirmed** |
| validate-vat | 0.9.0 | **Confirmed** |

### Database
| Technology | Details | Status |
|-----------|---------|--------|
| PostgreSQL | Latest (via `image: postgres` in compose) | **Confirmed** |
| pgweb | `sosedoff/pgweb` admin UI on port 8081 | **Confirmed** |

### Infrastructure / Dev tooling
| Tool | Purpose | Status |
|------|---------|--------|
| Docker Compose | 3 compose files: prod (server+db), dev (db+pgweb), local-prod (nginx+server+db+pgweb) | **Confirmed** |
| patch-package | Fix `buffer-equal-constant-time` | **Confirmed** (patch file exists) |
| ESLint | Client linting | **Confirmed** |
| PostCSS + Autoprefixer | CSS processing | **Confirmed** |

### External services and APIs
| Service | Purpose | Status |
|---------|---------|--------|
| Stripe (test mode) | Payment processing | **Confirmed** (sk_test_ key in .env) |
| Gmail SMTP (Nodemailer) | Transactional emails (verification, recovery, notifications) | **Confirmed** |
| VIES VAT validation | EU VAT number verification | **Confirmed** (validate-vat) |
| OVH VPS | Production hosting | **Confirmed** (URLs in .env files) |

---

## 4. How to run locally without Docker (Windows-first)

### Prerequisites
- **Node.js 20.x** (match the Dockerfile base image) — **Confirmed** from `FROM node:20-alpine`
- **PostgreSQL** installed locally OR running via Docker (recommended: `docker run -d --name greenvisa-db -e POSTGRES_DB=green-visa -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=pass123 -p 5432:5432 -v ./server/init.sql:/docker-entrypoint-initdb.d/init.sql postgres`)
- **npm** (comes with Node.js)
- **Git** (optional but expected)

### Step 1: Fix environment files

#### `client/.env` — change to:
```
VITE_REACT_SERVER_ADDRESS=http://localhost:8080
```
_(The committed file points to `http://vps-0fde778b.vps.ovh.net:8080` — this WILL break local dev.)_

#### `server/.env` — change these lines:
```
DB_HOST=localhost
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:8080
```
_(The committed file has `DB_HOST=db` (Docker service name) and both URLs pointing to the VPS.)_

> **WARNING:** The `server/.env` file contains real secrets (SMTP password, Stripe test key, admin password, JWT secret). Do NOT commit changes to this file. Consider adding it to `.gitignore`.

#### `server/db.js` — reads from env vars (already fixed):
```js
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'pass123',
  database: process.env.DB_NAME || 'green-visa',
});
```
For native dev, `server/.env` sets `DB_HOST=localhost`. In Docker Compose, the `environment` section overrides with `DB_HOST=db`.

### Step 2: Start PostgreSQL

**Option A — Docker (easiest, even on Windows):**
```powershell
docker run -d --name greenvisa-db `
  -e POSTGRES_DB=green-visa `
  -e POSTGRES_USER=admin `
  -e POSTGRES_PASSWORD=pass123 `
  -p 5432:5432 `
  -v "${PWD}/server/init.sql:/docker-entrypoint-initdb.d/init.sql" `
  postgres
```

**Option B — Native PostgreSQL:**
Install PostgreSQL, create database `green-visa` with user `admin` / password `pass123`, then run:
```powershell
psql -U admin -d green-visa -f server/init.sql
```

### Step 3: Install dependencies

```powershell
# Root (for patch-package)
npm install

# Server
cd server
npm install
cd ..

# Client
cd client
npm install
cd ..
```

> **Note:** `server/node_modules` is committed to the repo (it's not in `.gitignore`). You may want to delete it and reinstall: `Remove-Item -Recurse server\node_modules; cd server; npm install`.

> **Windows note:** The `sharp` package requires native binaries. On Node.js 20+ it should auto-download prebuilt binaries, but if it fails, run `npm rebuild sharp` in the server directory.

### Step 4: Start services (order matters)

```powershell
# Terminal 1: Start the backend
cd server
npm run dev
# Expected output: "Admin già esistente." or "Admin creato con successo."
# Runs on http://localhost:8080

# Terminal 2: Start the frontend
cd client
npm run dev
# Expected output: Vite dev server on http://localhost:5173
```

### Step 5: Verify

| Service | URL | What to check |
|---------|-----|---------------|
| Frontend | http://localhost:5173 | Landing page loads with hero section, Green Visa logo |
| Backend | http://localhost:8080/api/products-info | Returns JSON (possibly empty array) |
| Database | `psql -U admin -d green-visa -c "SELECT COUNT(*) FROM users"` | Returns count (should be 1 — the admin) |

### Admin login
- Username: `ADMIN` (from env `USERNAME_ADMIN`)
- Email: value from `EMAIL_ADMIN` in `server/.env`
- Password: value from `PASS_ADMIN` in `server/.env`

The admin user is auto-created on server startup if no admin exists.

### Is native better than Docker for development?

**Yes, for this repo.** Reasons:
1. Vite HMR is already configured with `usePolling: true` (Docker-friendly), but native file watching is faster and less CPU-intensive on Windows.
2. `sharp` has native dependencies that can be finicky inside Docker on Windows.
3. `server.js` uses `nodemon` for dev — native restart is faster.
4. Volume mounts on Windows + Docker have known performance issues (`node_modules` especially).
5. The only service worth keeping in Docker is PostgreSQL — it's a single container and avoids a full Windows PostgreSQL install.

---

## 5. How to run with Docker

### Compose file layout

| File | Purpose | Services |
|------|---------|----------|
| `docker-compose.prod.yml` | **Production** (VPS with external nginx) | `server`, `db` |
| `docker-compose.dev.yml` | **Development** (DB only, app runs natively) | `db`, `pgweb` |
| `docker-compose.local-prod.yml` | **Local prod test** (full stack on localhost) | `nginx`, `server`, `db`, `pgweb` |

### Production compose (`docker-compose.prod.yml`)

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `server` | Built from `./server/dockerfile` | 8080:8080 | `command: node server`, `NODE_ENV=production`, `DB_HOST=db` |
| `db` | `postgres:16` | 5432:5432 | Volume `green-visa-db` at `/var/lib/postgresql` |

Nginx on the VPS host serves the built client static files and proxies `/api/` and `/uploaded_img/` to the server container.

### Development compose (`docker-compose.dev.yml`)

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `db` | Built from `dockerfile.database` | 5432:5432 | `container_name: greenvisa-db` |
| `pgweb` | `sosedoff/pgweb` | 8081:8081 | |

Server and client run natively with `npm run dev`.

### Local prod test compose (`docker-compose.local-prod.yml`)

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `nginx` | Built from `client/dockerfile.prod` (multi-stage: node build + nginx) | 80:80 | SPA fallback + API proxy |
| `server` | Built from `./server/dockerfile` | — | `command: node server`, `NODE_ENV=production` |
| `db` | `postgres:16` | 5432:5432 | Separate volume `green-visa-local-prod-db` |
| `pgweb` | `sosedoff/pgweb` | 8081:8081 | |

### Commands
```powershell
# Development (DB only)
docker compose -f docker-compose.dev.yml up -d --build

# Local prod test (full stack on http://localhost)
docker compose -f docker-compose.local-prod.yml up --build

# Production (on VPS)
docker compose up -d --build
```

### Known considerations

1. **Dockerfile casing:** Compose files reference `dockerfile` (lowercase) matching the actual filenames on disk. This works on both Windows and Linux.

2. **Server `.env` vs compose environment:** `server/.env` has `DB_HOST=localhost` for native dev. The production and local-prod compose files override this with `DB_HOST=db` via the `environment` section.

3. **`db.js` defaults:** `server/db.js` uses `process.env.DB_HOST || 'db'`, so it works both natively (reads `.env`) and in Docker (compose overrides).

4. **`wait-for-server.sh`:** Only used by the old dev client container (no longer in any compose). Kept for reference.

---

## 6. Setup blockers and likely causes of a "broken local instance"

### Blocker 1: Client `.env` points to remote VPS
- **Evidence:** `client/.env` line 2: `VITE_REACT_SERVER_ADDRESS=http://vps-0fde778b.vps.ovh.net:8080`
- **Impact:** All API calls from the frontend go to the remote VPS instead of local backend. The app may appear to load but will show stale data or fail to authenticate.
- **Severity:** **HIGH**
- **Fix:** Change to `VITE_REACT_SERVER_ADDRESS=http://localhost:8080` (the commented-out line 1 already has this).

### Blocker 2: Server `.env` CLIENT_URL and SERVER_URL point to VPS
- **Evidence:** `server/.env` lines 22-25: `CLIENT_URL = http://vps-0fde778b.vps.ovh.net:5173` and `SERVER_URL = http://vps-0fde778b.vps.ovh.net:8080`
- **Impact:** Stripe redirect URLs after payment will go to the VPS. Email verification links will point to the VPS. Any server-generated absolute URL is wrong for local dev.
- **Severity:** **HIGH**
- **Fix:** Change both to `http://localhost:5173` and `http://localhost:8080`.

### Blocker 3: `db.js` hardcodes Docker hostname `db` — **RESOLVED**
- **Evidence:** `server/db.js` now uses `process.env.DB_HOST || 'db'` and reads from `server/.env` via dotenv.
- **Status:** Fixed. Works both natively (`DB_HOST=localhost` from `.env`) and in Docker (compose sets `DB_HOST=db` via environment).

### Blocker 4: `server/node_modules` is committed to git
- **Evidence:** `server/node_modules/` directory is present with 130+ packages; `.gitignore` lists `node_modules` but only for the root (or client).
- **Impact:** Stale or platform-incompatible native modules (especially `sharp`, `bcryptjs`). May cause cryptic errors on a different OS or Node version.
- **Severity:** **MEDIUM**
- **Fix:** Add `server/node_modules/` to `.gitignore`, delete the committed folder, and run `npm install` fresh.

### Blocker 5: `sharp` native binary compatibility
- **Evidence:** `server/package.json` includes `"sharp": "^0.33.5"`. Sharp uses platform-specific prebuilt binaries.
- **Impact:** If the committed `node_modules` contains Linux binaries (from Docker or a Linux dev), they won't work on Windows.
- **Severity:** **MEDIUM**
- **Fix:** Delete `server/node_modules` and run `npm install` on Windows. If issues persist: `npm rebuild sharp`.

### Blocker 6: Dockerfile casing mismatch — **RESOLVED**
- **Evidence:** Compose files now reference `dockerfile: dockerfile` (lowercase), matching the actual filenames on disk.
- **Status:** Fixed. No action needed.

### Blocker 7: CORS only allows two origins
- **Evidence:** `server/server.js` line 60: `origin: ['http://localhost:5173', 'http://vps-0fde778b.vps.ovh.net:5173']`
- **Impact:** If the frontend is accessed via any other hostname (e.g., `127.0.0.1`, a LAN IP, or `0.0.0.0`), CORS will block API requests.
- **Severity:** **LOW** (localhost is fine for dev)
- **Fix:** None needed for typical local dev. If you need other origins, add them to the CORS array.

### Blocker 8: Cookies set with `secure: false` and `sameSite: 'Lax'`
- **Evidence:** `server/server.js` lines 75-79 and 96-99.
- **Impact:** Cookies work correctly on `http://localhost` with `secure: false`. If you ever switch to HTTPS locally or cross-origin, cookies will silently fail.
- **Severity:** **LOW** (for local dev)
- **Fix:** None needed for local HTTP dev. For HTTPS, set `secure: true` and `sameSite: 'None'`.

### Blocker 9: Gmail SMTP credentials may be revoked
- **Evidence:** `server/.env` contains `PASS_SENDER` (a Gmail app password). App passwords can be revoked by the account owner.
- **Impact:** All email-sending features (verification, recovery, contact responses) will fail silently or throw errors.
- **Severity:** **MEDIUM** (affects account verification flow, but not core dev)
- **Fix:** Verify the credentials still work, or use a local SMTP tool like Mailpit/MailHog for dev.

### Blocker 10: `isAuthenticated.js` uses undefined `axios`
- **Evidence:** `client/src/components/isAuthenticated.js` line 3: `await axios.get(...)` but there is no `import axios` at the top of the file.
- **Impact:** This function will throw a ReferenceError at runtime whenever called. The navbar uses it to decide login/user navigation.
- **Severity:** **MEDIUM**
- **Fix:** Add `import axios from 'axios';` at the top of the file.

---

## 7. Frontend module map

### Routing & Pages
| Files | Purpose | Centrality |
|-------|---------|-----------|
| `main.jsx` | Defines all routes via `createBrowserRouter` | **Core** — entry point |
| `App.jsx` | Landing page (hero, carousel, protocols, benefits) | High |
| `LoginPage.jsx` | Login form | High |
| `SignUpPage.jsx` | Registration form | High |
| `UserPage.jsx` | User profile + admin dashboard toggle | **Core** |
| `buildingsPage.jsx` | List of user's buildings | High |
| `buildingPage.jsx` | Single building detail (plants, solar, photovoltaics, consumption, emissions) | **Core** |
| `questionnairePage.jsx` | Renders the appropriate SurveyJS questionnaire by category | **Core** |
| `reportPage.jsx` | Generates PDF report of user's buildings and emissions | High |
| `CertificationPage.jsx` | Downloads certification PDF | Medium |
| `EntryPage.jsx` | Products listing page (`/Products`) | High |
| `ProductPage.jsx` | Single product detail | Medium |
| `CarrelloPage.jsx` | Shopping cart | Medium |
| `paymentPage.jsx` | Payment flow | Medium |
| `PaySuccessPage.jsx` | Post-payment success page | Low |
| `NewsPage.jsx`, `ArticlePage.jsx` | News listing and article detail | Medium |
| `ContactsPage.jsx` | Contact form | Low |
| `PrivacyPage.jsx` | Privacy policy | Low |
| `confirmAccountPage.jsx`, `accountVerifiedPage.jsx`, `confirmAccountPageNoCompanyEmail.jsx` | Email verification flow | Medium |
| `notFoundPage.jsx` | 404 page | Low |
| `userBuldingsPageAdmin.jsx` | Admin view of a specific user's buildings | Medium |

### Shared Components
| Files | Purpose |
|-------|---------|
| `navbar.jsx` | Global navigation bar |
| `footer.jsx` | Global footer |
| `scrollToTop.jsx` | Scroll-to-top on route change |
| `hero.jsx` | Landing page hero section |
| `carousel2.jsx`, `infinite_carousel.jsx`, `news_carousel.jsx` | Various carousels |
| `messagePopUp.jsx`, `confirmPopUp.jsx`, `autosavePopup.jsx` | Modal/popup components |
| `login.jsx`, `signup.jsx` | Auth form components |

### Providers / Context / State
| Files | Purpose |
|-------|---------|
| `provider/provider.jsx` | `RecoveryContext` — global state for email, OTP, cart, building ID, refresh triggers |
| `axiosInstance.js` | Configured Axios with JWT Bearer interceptor and token expiry handling |
| `components/isAuthenticated.js` | Auth check utility (**has a bug — missing axios import**) |

### Questionnaire / Survey Logic
| Files | Purpose |
|-------|---------|
| `questionnaires/transportQuestionnaire.js` | SurveyJS JSON definition for transport certification |
| `questionnaires/wellnessQuestionnaire.js` | SurveyJS JSON definition for spa/resort certification |
| `components/transportQuestionnaire.jsx` | React wrapper for transport survey (auto-save, restore, score calculation) |
| `components/wellnessQuestionnaire.jsx` | React wrapper for wellness survey |
| `components/questionnairesBaseFunctions.js` | Shared functions: `fetchInfo`, `restoreSurveyData`, `submitSurveyData` |
| `surveyTheme.js` | SurveyJS theme configuration |
| `pdfGeneratorQuestionnaires.js` | Generates PDF from survey responses |
| `surveyPDF.txt` | Possibly a template or reference (text file) |

### PDF / Report Generation
| Files | Purpose |
|-------|---------|
| `reportPage.jsx` | Generates building report PDF with jsPDF + autoTable |
| `CertificationPage.jsx` | Generates certification PDF |
| `pdfGeneratorQuestionnaires.js` | Generates questionnaire report PDF |

### Auth / User / Account Flows
| Files | Purpose |
|-------|---------|
| `LoginPage.jsx`, `components/login.jsx` | Login flow |
| `SignUpPage.jsx`, `components/signup.jsx` | Registration flow |
| `UserPage.jsx` | User profile, admin toggle |
| `components/userDataModifier.jsx` | Edit user profile fields |
| `components/insertEmail.jsx` | Email input for password recovery |
| `components/OTPInput.jsx` | OTP verification |
| `components/reset.jsx` | Password reset |
| `components/recovered.jsx` | Password recovered confirmation |
| `confirmAccountPage.jsx`, `accountVerifiedPage.jsx` | Email verification |

### Payments / Cart / Product Flows
| Files | Purpose |
|-------|---------|
| `CarrelloPage.jsx`, `components/carrello.jsx` | Shopping cart |
| `paymentPage.jsx`, `components/payment.jsx`, `components/payment_cart.jsx` | Payment UI |
| `PaySuccessPage.jsx` | Post-payment |
| `EntryPage.jsx`, `ProductPage.jsx` | Product browsing |
| `components/products.jsx`, `components/productDetails.jsx`, `components/products_form.jsx` | Product display and admin form |
| `components/quantitySelector.jsx` | Quantity picker |
| `components/getPriceCategory.js` | Price category helper |
| `components/promoCodeForm.jsx`, `components/promoCodes.jsx` | Promo codes |

### Building / Report / Certification Flows
| Files | Purpose |
|-------|---------|
| `buildingsPage.jsx`, `buildingPage.jsx` | Building CRUD and detail |
| `components/building.jsx`, `components/buildingFrom.jsx` | Building form/display |
| `components/buildingResults.jsx` | Emission results display |
| `components/plants.jsx`, `components/plantForm.jsx` | Plant management (heating/cooling systems) |
| `components/solars.jsx`, `components/solarForm.jsx` | Solar thermal panels |
| `components/photovoltaics.jsx`, `components/photoForm.jsx` | Photovoltaic systems |
| `components/comsumption.jsx`, `components/consumptionForm.jsx` | Energy consumption tracking |
| `components/climateAlteringGases.jsx`, `components/climateGasAlteringForm.jsx` | Refrigerant gas tracking |
| `components/emissionsCalculator.js` | Client-side CO2 emissions calculation engine |
| `components/categoryBasedSelect.jsx` | Category-specific form selectors |

### Admin Flows
| Files | Purpose |
|-------|---------|
| `components/content_dashboard.jsx` | Admin dashboard (messages, orders, users, products, news, promo codes, certifications) |
| `components/allUsers.jsx` | User management |
| `components/allOrders.jsx` | Order management |
| `components/allNews.jsx` | News management |
| `components/allProducts.jsx` | Product management |
| `components/UsersBuildings.jsx` | View user buildings |
| `components/usersGeneratorTypes.jsx` | View/assign generator scores |
| `components/secondLevelCerts.jsx` | Second-level certification approval |
| `components/news_form.jsx` | News creation form (with Jodit editor) |
| `components/textEditor.jsx` | WYSIWYG text editor wrapper |

---

## 8. Backend module map

> **Note:** The entire backend lives in a single `server.js` file (~4,456 lines). There is no route/controller separation. Below is a logical grouping of the code.

### App Bootstrap & Middleware (lines 1–165)
- **Files:** `server.js` (top), `db.js`
- **What it does:** Express setup, CORS config (localhost + VPS), cookie-parser, JSON body parser, DOMPurify, Multer storage config, JWT verification middleware (`authenticateJWT`), admin middleware (`authenticateAdmin`), session cookie middleware for unauthenticated users.
- **Coupling:** Everything depends on this section.

### Auth / Session / Account (lines 166–727)
- **Routes:** `POST /api/signup`, `POST /api/login`, `POST /api/logout`, `GET /api/authenticated`, `DELETE /api/delete-account`, `GET /api/user-info`, `PUT /api/update-username`, `PUT /api/update-phone`, `PUT /api/update-email`, `PUT /api/update-tax-code`, `PUT /api/update-turnover`, `POST /api/check-vat`, `GET /api/verify` (email verification), `POST /api/send-verify-email`
- **What it does:** Full user lifecycle: registration with VAT validation, email verification (UUID token), JWT-based login, password hashing with bcrypt, profile updates.
- **Coupling:** High — JWT auth is used by ~90% of routes.

### Email Flows (lines 759–1418)
- **Routes:** `POST /api/send_email`, `POST /api/send-email-message`, `POST /api/send_recovery_email`
- **Functions:** `sendConfirmationEmail()`, `sendRecoveryEmail()`, `sendEmailMessage()`, various HTML email templates
- **What it does:** Gmail SMTP via Nodemailer. Sends verification emails, password recovery OTPs, contact form responses, and order confirmation emails.
- **Coupling:** Medium — depends on env vars for SMTP credentials.

### Password Recovery (lines 1419–1465)
- **Routes:** `POST /api/send_recovery_email`, `PUT /api/change-password`
- **What it does:** OTP-based password reset flow.

### News / Content Management (lines 1466–1643)
- **Routes:** `POST /api/upload-news` (with image), `GET /api/news`, `GET /api/article/:id`, `PUT /api/set-news-read/:id`, `GET /api/news-unread`, `DELETE /api/delete-news/:id`, `PUT /api/edit-news/:id`
- **What it does:** Admin-only news CRUD with image uploads (Multer). Tracks read status per user.
- **Coupling:** Low — self-contained.

### Products (lines 1644–1832)
- **Routes:** `GET /api/categories`, `POST /api/upload-product` (with image), `GET /api/products-info`, `GET /api/product-details/:id`, `DELETE /api/delete-product/:id`, `PUT /api/edit-product/:id`
- **What it does:** Certification product CRUD. Products are categorized by certification type (hotel, spa, transport, industry, store, bar/restaurant). Creates Stripe products.
- **Coupling:** Medium — products are referenced by cart, orders, surveys.

### Cart (lines 1833–2066)
- **Routes:** `POST /api/cart-insertion/:id`, `GET /api/fetch-user-cart`, `PUT /api/update-quantity/:id`, `DELETE /api/remove-from-cart/:id`
- **What it does:** Cart management supporting both authenticated users (by user_id) and anonymous sessions (by session cookie).
- **Coupling:** Medium — uses priceCalculator.js for dynamic pricing.

### Payments / Stripe (lines 2413–2644)
- **Routes:** `POST /api/checkout-session`, `POST /api/create-order`, `GET /api/user-orders`, `GET /api/all-orders`, `DELETE /api/remove-user-cart`
- **What it does:** Stripe checkout session creation, order recording, promo code application.
- **Coupling:** High — depends on products, cart, promo codes.

### Promo Codes (lines 2200–2412)
- **Routes:** `POST /api/create-promo-code`, `GET /api/fetch-promo-codes`, `POST /api/publish-promo-code/:id`, `POST /api/assign-promo-code-to-users/:id`, `POST /api/apply-promo-code`, `DELETE /api/delete-promo-code/:id`
- **What it does:** Admin promo code lifecycle — creation, publishing, per-user assignment, application at checkout.
- **Coupling:** Medium.

### Contact Messages (lines 2067–2121)
- **Routes:** `POST /api/send-message`, `GET /api/messages`, `DELETE /api/delete-message/:id`, `POST /api/send-message-response`
- **What it does:** Contact form submissions and admin responses.
- **Coupling:** Low.

### Buildings CRUD (lines 2701–2976)
- **Routes:** `POST /api/upload-building`, `PUT /api/edit-building`, `DELETE /api/delete-building/:id`, `GET /api/fetch-buildings`, `GET /api/fetch-building/:id`
- **What it does:** Building creation with extensive attributes (location, energy systems, lighting, etc.). Includes industrial-specific fields (ATECO code, employees).
- **Coupling:** High — buildings are central to the emissions/certification workflow.

### Plants / Solar / Photovoltaics / Consumption / Gases (lines 3016–3771)
- **Routes:** Many CRUD routes for plants, solar panels, photovoltaics, energy consumption, refrigerant gases — all scoped to a building ID.
- **What it does:** Detailed energy infrastructure data collection per building.
- **Coupling:** High — feeds into emissions calculation.

### Reports & Emissions Data (lines 3772–3941)
- **Routes:** `GET /api/fetch-report-data`, `GET /api/user-questionnaires`, `GET /api/:buildingID/fetch-emissions-data`
- **What it does:** Aggregates building data for PDF report generation. Fetches survey responses.
- **Coupling:** High.

### Survey / Questionnaire Responses (lines 3882–3968)
- **Routes:** `POST /api/responses`, `GET /api/responses-fetch`, `GET /api/users-generator-types`
- **What it does:** Saves and retrieves SurveyJS survey responses (JSONB in PostgreSQL). Auto-saves page progress.
- **Coupling:** Medium.

### Second-Level Certification (lines 4004–4177)
- **Routes:** `POST /api/second-level-certification`, `GET /api/fetch-second-level-requests`, `POST /api/approve-second-level-request`, `GET /api/fetch-approved-requests`, `PUT /api/cancel-approvation/:approvation_id`, `DELETE /api/delete-second-level-request`
- **What it does:** Two-tier certification flow — users request, admins approve.
- **Coupling:** Medium.

### Admin User/Building Views (lines 4179–4368)
- **Routes:** `GET /api/fetch-user-info-by-buildings`, `GET /api/fetch-user-buildings/:id`, `GET /api/fetch-building-plants-solars-photos/:id/:buildingID`, `PUT /api/insert-results/:buildingID`, `GET /api/fetch-results/:buildingID`, `GET /api/is-user-certificable`, `GET /api/fetch-all-user-quantity`
- **What it does:** Admin views of user data and building results. Score assignment.
- **Coupling:** Medium.

### Scheduled Jobs (lines 126–163)
- **Functions:** `cleanUpCart()` (every 3 days), `deleteExpiredPromoCodes()` (every hour)
- **What it does:** Housekeeping cron jobs via `node-cron`.
- **Coupling:** Low.

### Utility Functions (lines 4372–4417)
- **Functions:** `emailCheck()`, `passwordCheck()`, `phoneCheck()`, `vatCheck()`, `cfCheck()`
- **What it does:** Input validation helpers.
- **Coupling:** Used across auth routes.

### File Uploads
- **Config:** Multer stores files in `server/uploaded_img/` with timestamped filenames.
- **Static serving:** `app.use('/uploaded_img', express.static(...))` serves uploaded images.
- **Used by:** News and product image uploads.
- **Coupling:** Low — self-contained Multer config.

### Price Calculation
- **File:** `priceCalculator.js`
- **Functions:** `getHotelPrice()`, `getSpaPrice()`, `getTransportPrice()`, `getIndustryPrice()`, `getStorePrice()`, `getBarPrice()`
- **What it does:** Dynamic price multipliers based on facility size/count options. Currently most cases return `0.5` (placeholder values).
- **Coupling:** Used by cart insertion route.

---

## 9. Database overview

### Tables (from `init.sql`)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User accounts (companies), with VAT, tax code, admin flag, email verification | Central entity |
| `news` | Admin-published articles | → users (author) |
| `news_read_status` | Per-user read tracking for news | → users, → news |
| `products` | Certification products (hotel, spa, transport, etc.) | → users (creator), has Stripe product ID |
| `plates` | Physical certification plates with serial numbers and shipping | → products, → users |
| `promocodes` | Discount codes with date ranges | |
| `promocodes_publishment` | Published promo codes | → promocodes |
| `promocodes_assignments` | Per-user promo code assignments | → promocodes, → users |
| `contacts` | Contact form submissions | |
| `cart` | Shopping cart (by user_id OR session_id) | → users, → products |
| `orders` | Completed purchase orders | → users, → products, → promocodes |
| `credit_cards` | Stored credit card data (raw numbers!) | → users |
| `buildings` | Physical buildings/facilities with energy characteristics | → users |
| `user_consumptions` | Energy consumption records per building | → users, → buildings |
| `plants` | Heating/cooling plants per building | → users, → buildings |
| `refrigerant_gases` | Climate-altering gases per plant/building | → plants, → buildings, → users |
| `solars` | Solar thermal installations | → buildings |
| `photovoltaics` | Photovoltaic installations | → buildings |
| `survey_responses` | Questionnaire answers (JSONB), scores, CO2 | → users, → products (certification) |
| `second_level_certification_requests` | Second-level cert requests | → products, → users |
| `second_level_certification_approvation` | Approvals for second-level certs | → requests, → users |

### Core relationships
```
users ──┬── buildings ──┬── plants ──── refrigerant_gases
        │               ├── solars
        │               ├── photovoltaics
        │               └── user_consumptions
        ├── survey_responses ──── products (certification type)
        ├── orders ──── products
        ├── cart ──── products
        └── second_level_certification_requests ──── products
```

### OCR-relevant observations
- **No `documents` or `files` table exists.** There is no general document storage mechanism.
- The `survey_responses` table uses JSONB for flexible data — extracted OCR fields could potentially be stored similarly.
- The `buildings` table has many structured fields (energy, construction, location) that could be pre-filled from scanned documents.
- Image uploads exist via Multer → `uploaded_img/` directory, but only for news and product images, not for user documents.
- **The `credit_cards` table stores raw card numbers.** This is a PCI compliance concern unrelated to OCR but worth noting.

---

## 10. OCR integration notes

### Frontend entry points for document upload

**Best fit:** The building detail page (`buildingPage.jsx`) already has a sectioned UI with expandable panels for plants, solar, photovoltaics, consumption, and gases. A new "Documenti / Upload" panel can be added here following the same pattern.

Specific integration points:
1. **New component:** `components/documentUpload.jsx` — a drag-and-drop or file-input component for PDF/image upload.
2. **Existing page to host it:** `buildingPage.jsx` — add alongside existing sections (plants, solar, etc.).
3. **Alternative entry point:** `questionnairePage.jsx` — allow document upload to pre-fill questionnaire answers.
4. **User page:** `UserPage.jsx` could show a list of uploaded documents and their processing status.

### Backend endpoints/services needed

**New endpoints (suggested):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/buildings/:id/upload/document` | POST | Upload a document (PDF/image) for a building |
| `/api/buildings/:id/documents` | GET | List documents for a building |
| `/api/documents/:docId` | GET | Get document details + extracted data |
| `/api/documents/:docId/ocr` | POST | Trigger OCR processing |
| `/api/documents/:docId/extracted-data` | GET | Get extracted fields |
| `/api/documents/:docId/confirm` | POST | Confirm/edit extracted data before applying |

**New service files (do NOT add to `server.js`):**
- `server/routes/documents.js` — Express router for document endpoints
- `server/services/ocrService.js` — OCR processing logic (call external API like Azure Document Intelligence, Google Cloud Vision, or Tesseract.js)
- `server/services/fieldMapper.js` — Maps OCR output to building/questionnaire fields

### Storage strategy

**Recommended approach:**
1. **Files:** Use existing Multer config, store in `server/uploaded_documents/` (similar to `uploaded_img/`).
2. **Metadata:** New `documents` table:
   ```sql
   CREATE TABLE IF NOT EXISTS documents (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
       filename VARCHAR(255) NOT NULL,
       original_name VARCHAR(255) NOT NULL,
       mime_type VARCHAR(100) NOT NULL,
       file_size INTEGER,
       ocr_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
       extracted_data JSONB DEFAULT NULL,
       uploaded_at TIMESTAMPTZ DEFAULT NOW(),
       processed_at TIMESTAMPTZ DEFAULT NULL
   );
   ```
3. **Extracted data:** Store as JSONB (matching the `survey_responses` pattern already in use).

### Extracted-field mapping

OCR output can map to these existing entities:

| Document type | Target table/fields |
|--------------|-------------------|
| Energy bills | `user_consumptions` (energy_source, consumption) |
| Building permit / technical docs | `buildings` (area, construction_year, location, address) |
| Plant/equipment certificates | `plants` (plant_type, service_type, generator_type, fuel_type) |
| Solar/PV installation docs | `solars` (installed_area), `photovoltaics` (power) |
| Fleet/vehicle documents | `survey_responses` (transport questionnaire fields) |
| Company registration | `users` (company_name, p_iva, legal_headquarter) |

### Validation/review flow

1. User uploads document → status: `pending`
2. Backend sends to OCR service → status: `processing`
3. OCR completes → extracted fields stored in JSONB → status: `completed`
4. Frontend shows extracted data with editable fields (pre-filled form)
5. User reviews, corrects, and confirms
6. Confirmed data is written to the target table (building, consumption, etc.)

### What existing code can be reused

| Existing code | Reuse for OCR |
|--------------|--------------|
| Multer config in `server.js` (lines 36-50) | File upload handling — extend with new destination for documents |
| `uploaded_img` static serving pattern | Serve uploaded documents similarly |
| `survey_responses` JSONB pattern | Store extracted OCR data as JSONB |
| `components/buildingFrom.jsx` | Template for pre-filled form UI after OCR extraction |
| `components/consumptionForm.jsx` | Template for pre-filled consumption data |
| `axiosInstance.js` | API calls from frontend |
| `authenticateJWT` middleware | Protect document endpoints |

### What should be new modules

> **Critical:** Do NOT add OCR logic to `server.js`. It's already 4,456 lines.

| New module | Purpose |
|-----------|---------|
| `server/routes/documents.js` | Express Router for all document endpoints |
| `server/services/ocrService.js` | OCR processing (wraps external API) |
| `server/services/fieldMapper.js` | Maps OCR JSON to domain entities |
| `client/src/components/documentUpload.jsx` | Upload UI component |
| `client/src/components/ocrReview.jsx` | Review/edit extracted data |
| `client/src/components/documentList.jsx` | List of user's documents |

---

## 11. Recommended workflow for my case

### Best local setup

1. **PostgreSQL via Docker** (one container, trivial to manage):
   ```powershell
   docker run -d --name greenvisa-db -e POSTGRES_DB=green-visa -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=pass123 -p 5432:5432 -v "${PWD}/server/init.sql:/docker-entrypoint-initdb.d/init.sql" postgres
   ```

2. **Backend natively on Windows:**
   - Fix `db.js` to read from env vars
   - Fix `server/.env` to use localhost URLs
   - `cd server && npm install && npm run dev`

3. **Frontend natively on Windows:**
   - Fix `client/.env` to use `http://localhost:8080`
   - `cd client && npm install && npm run dev`

### When Docker is still useful

- **Database management:** Keep PostgreSQL in Docker rather than installing natively on Windows.
- **pgweb:** Run `docker run -d --name pgweb --link greenvisa-db:db -e DATABASE_URL=postgres://admin:pass123@db:5432/green-visa -p 8081:8081 sosedoff/pgweb` for a nice DB admin UI.
- **Full integration testing:** Before deploying, test with `docker compose -f docker-compose.local-prod.yml up --build` to simulate the production stack locally.
- **Reproducing production issues:** The VPS runs Docker, so `docker-compose.local-prod.yml` is the closest match to the production architecture.

### First files to read (in order)

1. `server/.env` — understand all config variables
2. `server/db.js` — understand (and fix) DB connection
3. `server/server.js` lines 1–165 — middleware, auth, multer setup
4. `client/.env` + `client/src/axiosInstance.js` — understand API connection
5. `client/src/main.jsx` — understand all routes
6. `server/init.sql` — understand the full data model
7. `client/src/components/emissionsCalculator.js` — understand the core business logic
8. `client/src/components/transportQuestionnaire.jsx` — understand the questionnaire pattern

### Safest path to start implementing OCR

1. **First:** Get the app running locally (fix env, fix db.js, install deps).
2. **Second:** Create a new `documents` table in `init.sql`.
3. **Third:** Create `server/routes/documents.js` with a simple upload endpoint (Multer).
4. **Fourth:** Create `client/src/components/documentUpload.jsx` with a basic file input.
5. **Fifth:** Wire up OCR processing (start with Tesseract.js for local dev, upgrade to a cloud API later).
6. **Sixth:** Build the review/confirm UI on the frontend.

---

## 12. Open questions / unknowns

| # | Question | Why it matters |
|---|----------|---------------|
| 1 | Are the Gmail SMTP credentials (`PASS_SENDER`) still active? | All email features (verification, recovery) depend on it. Cannot verify without testing. **Inferred: likely still works if the app was recently used.** |
| 2 | Is the VPS (`vps-0fde778b.vps.ovh.net`) still running? | The committed `.env` files point to it. If the VPS is down, the app as-committed won't work at all (even locally, since the frontend calls the VPS API). **Inferred: probably yes, since the repo seems maintained.** |
| 3 | What Node.js version does the team actually use locally? | Dockerfiles specify Node 20 Alpine, but there's no `.nvmrc` or `engines` field. **Inferred: Node 20.x based on Dockerfile.** |
| 4 | Is `server/node_modules` intentionally committed? | It's ~130+ packages. The `.gitignore` lists `node_modules` but it may not cover `server/node_modules`. **Inferred: accidental commit.** |
| 5 | Are there other questionnaire types beyond transport and wellness? | Only two questionnaire JSON files exist, but the `category_type` enum has 6 categories. **Inferred: the other 4 questionnaires are not yet implemented.** |
| 6 | Why is `credit_cards` table storing raw card numbers? | Stripe handles actual payments, so this table may be unused or for display purposes only. **Cannot verify without running the app.** |
| 7 | Is the Stripe key still in test mode? | The key starts with `sk_test_` which confirms test mode. **Confirmed.** |
| 8 | What deployment pipeline is used for the VPS? | No CI/CD config found (no `.github/workflows`, no Dockerfile-based CD). **Inferred: manual `cd client && npm run build` + copy dist to nginx + `docker compose up -d --build` on the VPS.** |
| 9 | Is the `patches/` directory still needed? | It fixes a `SlowBuffer` deprecation. Modern Node.js (20+) may not need it. **Inferred: probably still needed if `jwa` hasn't been updated.** |
| 10 | Are there any integration tests? | `server/package.json` has `"test": "echo \"Error: no test specified\""`. **Confirmed: no tests exist.** |
| 11 | What OCR service does the team prefer (Tesseract, Azure, Google, AWS)? | The choice significantly affects the implementation. **Unknown — needs team input.** |
| 12 | Is the `sharp` dependency actually used in current code? | It's in `package.json` but I did not find any `require('sharp')` call in `server.js`. **Inferred: may be unused or planned for future use.** This would be good to verify to avoid Windows build issues. |

---

## 13. Recommended next step for implementing OCR first

### Exact first small milestone

**"Upload a document for a building and store it with metadata"** — no OCR processing yet, just the plumbing.

### Exact files most likely involved

| File | Action |
|------|--------|
| `server/init.sql` | Add `documents` table (see schema in Section 10) |
| `server/routes/documents.js` | **NEW** — Express Router with `POST /upload` and `GET /list` endpoints |
| `server/server.js` | Add one line: `app.use('/api/documents', require('./routes/documents'))` |
| `client/src/components/documentUpload.jsx` | **NEW** — File input component with drag-and-drop |
| `client/src/buildingPage.jsx` | Add "Documenti" section alongside existing panels |

### Minimal end-to-end slice to build first

1. **Database:** Add `documents` table to `init.sql`. Re-seed.
2. **Backend:** Create `server/routes/documents.js`:
   - `POST /api/documents/upload/:buildingId` — accepts file via Multer, saves to `uploaded_documents/`, inserts row in `documents` table with `ocr_status: 'pending'`.
   - `GET /api/documents/:buildingId` — returns list of documents for a building.
3. **Frontend:** Create `documentUpload.jsx`:
   - File input (accept PDF, JPEG, PNG).
   - Upload via Axios to the new endpoint.
   - Show list of uploaded documents with status badges.
4. **Integration:** Add the component to `buildingPage.jsx`.
5. **Verify:** Upload a file, see it in the database, see it listed in the UI.

This slice is **small, safe, and fully testable** without any OCR dependency. It establishes the upload pipeline that everything else (OCR processing, field extraction, review UI) will build on.

**After this works**, the next slice would be wiring up a basic OCR call (e.g., Tesseract.js for local dev) and displaying raw extracted text.
