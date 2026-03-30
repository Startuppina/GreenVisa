All critical findings are verified against the source. Here is the complete audit report.

---

# GreenVisa Failure-Oriented Security Audit

## A) Confirmed Findings

---

### 1. CRITICAL — Client-Supplied Price Sent Directly to Stripe

**Why it matters:** Any user can pay any amount they want for any product. This is a direct revenue loss vulnerability.

**Files:** `server/server.js` (line 2449), `client/src/components/carrello.jsx` (line 108), `server/priceCalculator.js`

**Evidence:** The checkout endpoint destructures `price` from the client-submitted product object and uses it directly as the Stripe amount, never substituting the database price:

```2436:2459:server/server.js
      const { id, name, image, price, quantity } = product;

      // fetch the product from the database
      const productQuery = "SELECT * FROM products WHERE id = $1";
      const productValues = [id];
      const productResult = await pool.query(productQuery, productValues);
      // ...
      const productInfo = productResult.rows[0];

      let productPrice = price; // default price  <-- CLIENT VALUE
      // ...
      const finalPriceInCents = Math.round(productPrice * 100);
```

The server fetches `productResult` from the DB but **never reads `productResult.rows[0].price`**. It uses the client's `price` directly. Additionally, `priceCalculator.js` passes the client price through unchanged for the first tier of every category:

```1:5:server/priceCalculator.js
function getHotelPrice(option, price) {
    switch (option) {
        case "1-24":
            return price;  // <-- returns whatever the client sent
```

**Attack path:** Intercept the `POST /api/checkout-session` request, set `price: 0.01` for each product. Stripe session is created for EUR 0.01 per item.

**Fix direction:** Always read price from `productResult.rows[0].price`. Never trust client-supplied price. Compute server-side totals from database values.

---

### 2. CRITICAL — No Stripe Webhook; Orders Created Client-Side Without Payment Verification

**Why it matters:** A user can get products marked as "ordered" without ever paying. Conversely, if the browser closes after payment, the order is never recorded but Stripe has the money.

**Files:** `client/src/PaySuccessPage.jsx`, `server/server.js` (line 2499)

**Evidence:** Zero webhook handling exists anywhere in the codebase (confirmed: grep for `webhook`, `endpointSecret`, `stripe.webhooks` returns no matches). Instead, order creation is triggered entirely from the client:

```12:16:client/src/PaySuccessPage.jsx
  useEffect(() => {
    createOrder();
    remove_user_cart();
```

The `createOrder` function calls `POST /api/create-order` using product IDs from `localStorage`. The server endpoint at line 2499 creates orders based solely on what the client sends — it never verifies a `session_id` or `payment_intent` with Stripe.

**Attack path:** Navigate directly to `/PaymentSuccess` after putting items in localStorage. Or call `POST /api/create-order` with any product IDs via curl.

**Fix direction:** Implement Stripe webhooks (`checkout.session.completed`). Only create orders when Stripe confirms payment. Pass the `session_id` in `success_url` and verify it server-side if a synchronous check is also needed.

---

### 3. CRITICAL — Duplicate Order Creation (Check Commented Out)

**Why it matters:** Every page refresh on `/PaymentSuccess` creates duplicate orders. The code even acknowledges this.

**Files:** `server/server.js` (lines 2526–2531), `client/src/PaySuccessPage.jsx` (line 61)

**Evidence:**

```2526:2531:server/server.js
      const queryCheck = "SELECT * FROM orders WHERE user_id = $1 AND product_id = $2";
      const existingOrder = await pool.query(queryCheck, [user_id, id]);

      /*if (existingOrder.rows.length > 0) {
        return res.status(400).json({ msg: `Ordine già esistente per il prodotto ID ${id}.` });
      }*/
```

The client code itself documents the issue:

```61:62:client/src/PaySuccessPage.jsx
      //IL POST VERRA FATTO DUE VOLTE, QUINDI DUE ORDINI INVECE CHE UNO IN QUANTO IN MAIN.JS C'E'
      //REACT STRICT MODE CHE IN AMBIENTE DI PRODUZIONE E' DISABILITATO
```

**Fix direction:** Re-enable the duplicate check. Add a unique constraint on `(user_id, product_id, order_date)` or use Stripe session IDs as idempotency keys. Wrap multi-row order creation in a transaction.

---

### 4. CRITICAL — `credit_cards` Table Stores Raw PAN + CVV (PCI-DSS Violation)

**Why it matters:** Storing CVV is forbidden under PCI-DSS under all circumstances. Storing unencrypted card numbers is a severe compliance violation. A database breach exposes full card data.

**Files:** `server/init.sql` (lines 161–170)

**Evidence:**

```161:170:server/init.sql
CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number VARCHAR(255) NOT NULL,
    expiration VARCHAR(255) NOT NULL,
    cvv VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (number)
);
```

No server routes currently write to this table, but the schema is deployed. The table exists in the database ready to receive plaintext card data.

**Fix direction:** Drop this table entirely. Never store raw card data. Stripe handles card storage via Stripe Elements / PaymentMethods.

---

### 5. CRITICAL — `PUT /api/edit-building` Has No Ownership Check (IDOR)

**Why it matters:** Any authenticated user can modify any building's data — including reassigning it to themselves — by supplying another building's ID.

**Files:** `server/server.js` (lines 2832–2951)

**Evidence:** The `WHERE` clause only filters by building ID, not by the authenticated user:

```2922:2951:server/server.js
    await pool.query(`
      UPDATE buildings
      SET
        name = $1,
        user_id = $2,
        // ... 23 more columns ...
      WHERE id = $26
  `, values);
```

While `userId` is extracted at line 2887 and used as `$2` in the `SET` clause, it's never used in the `WHERE` clause. Contrast with `DELETE /api/delete-building/:id` (line 2966) which correctly uses `WHERE user_id = $1 AND id = $2`.

**Attack path:** `PUT /api/edit-building` with `{ id: <other_user_building_id>, ... }`. The building's owner is changed to the attacker.

**Fix direction:** Add `AND user_id = $27` to the `WHERE` clause, using the authenticated `userId` as a bind parameter.

---

### 6. CRITICAL — DELETE Endpoints for Plants, Solars, Photovoltaics Have No Ownership Checks (IDOR)

**Why it matters:** Any authenticated user can delete any other user's plant, solar installation, or photovoltaic installation by guessing or enumerating IDs.

**Files:** `server/server.js` — lines 3200, 3502, 3570

**Evidence (all three follow the same pattern):**

```3200:3206:server/server.js
app.delete("/api/delete-plant/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;  // extracted but NEVER USED

    await pool.query(`DELETE FROM plants WHERE id = $1`, [id]);
```

```3502:3507:server/server.js
app.delete("/api/delete-solar/:id", authenticateJWT, async (req, res) => {
  // ...
    const { user_id } = req.user;  // extracted but NEVER USED
    await pool.query("DELETE FROM solars WHERE id = $1", values);
```

```3570:3576:server/server.js
app.delete("/api/delete-photovoltaic/:id", authenticateJWT, async (req, res) => {
  // ...
    const { user_id } = req.user;  // extracted but NEVER USED
    await pool.query("DELETE FROM photovoltaics WHERE id = $1", values);
```

**Fix direction:** Add `AND user_id = $2` (or join through `building_id` to verify ownership) to each `WHERE` clause.

---

### 7. CRITICAL — `/api/messages` Exposes All Contact Messages to Any Authenticated User

**Why it matters:** Contact form submissions (name, email, phone, company, message) are admin-only data exposed to every logged-in user.

**Files:** `server/server.js` (line 2081)

**Evidence:**

```2081:2084:server/server.js
app.get("/api/messages", authenticateJWT, async (req, res) => {
  try {
    const query = "SELECT * FROM contacts";
    const result = await pool.query(query);
```

Only `authenticateJWT` is used — no `authenticateAdmin`. Compare with the adjacent `DELETE /api/delete-message/:id` at line 2102 which correctly uses both `authenticateJWT, authenticateAdmin`.

**Fix direction:** Add `authenticateAdmin` middleware to this route.

---

### 8. CRITICAL — `/api/users-generator-types` Leaks PII of All Users (No Admin Check)

**Why it matters:** Any authenticated user can retrieve usernames, company names, phone numbers, and internal IDs for all users with unscored generators.

**Files:** `server/server.js` (line 3942)

**Evidence:**

```3942:3956:server/server.js
app.get("/api/users-generator-types", authenticateJWT, async (req, res) => {
  // ...
    const query = `
      SELECT users.username AS username, users.company_name AS company_name, users.phone_number AS phone_number, plants.generator_description AS generator_type, users.id AS user_id, plants.id AS plant_id
      FROM plants
      JOIN users ON users.id = plants.user_id
      WHERE generator_description IS NOT NULL
      AND plants.generator_assigned_score = 0.0 ;
    `;
```

No `authenticateAdmin`. The adjacent `POST /api/users-assign-score` at line 3969 correctly uses `authenticateAdmin`.

**Fix direction:** Add `authenticateAdmin` middleware.

---

### 9. CRITICAL — `/api/user-info` and Multiple Admin Routes Expose Password Hashes

**Why it matters:** Leaking `password_digest` (bcrypt hash) to clients violates basic security principles. Leaked hashes can be brute-forced offline. The `token` field (email verification token) is also exposed.

**Files:** `server/server.js` — lines 498, 735, 750, 3777, 4189

**Evidence:** `/api/user-info` (every authenticated user sees their own hash):

```494:506:server/server.js
app.get("/api/user-info", authenticateJWT, async (req, res) => {
  // ...
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);
    // ...
    res.status(200).json(result.rows[0]);  // includes password_digest, token
```

`/api/fetch-users` (admin route, all users' hashes):

```735:736:server/server.js
    const result = await pool.query("SELECT * FROM users order by id ASC");
    res.status(200).json(result.rows);
```

Same pattern at `/api/fetch-not-verified-users` (line 750), `/api/fetch-report-data` (line 3777), `/api/fetch-users-with-buildings` (line 4189).

**Fix direction:** Replace `SELECT *` with explicit column lists that exclude `password_digest` and `token`.

---

### 10. CRITICAL — Runtime Crash: `isAuthenticated.js` Missing `axios` Import

**Why it matters:** Every call to `isAuthenticated()` throws `ReferenceError: axios is not defined`, crashing any flow that depends on it.

**Files:** `client/src/components/isAuthenticated.js`

**Evidence:**

```1:3:client/src/components/isAuthenticated.js
export async function isAuthenticated() {
    try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/authenticated`, {
```

No `import axios from 'axios'` anywhere in the file.

**Fix direction:** Add `import axios from 'axios';` at the top.

---

### 11. HIGH — Stored XSS via `edit-news` Endpoint (DOMPurify Bypassed)

**Why it matters:** Admin-created news content is rendered via `dangerouslySetInnerHTML` in the frontend. The `upload-news` endpoint sanitizes with DOMPurify, but `edit-news` does not, allowing a malicious admin (or an attacker who compromises an admin session) to inject persistent XSS payable to all users.

**Files:** `server/server.js` — line 1489 vs 2149; `client/src/components/allNews.jsx` (line 221), `client/src/components/article.jsx` (line 124)

**Evidence:** `upload-news` sanitizes:

```1489:1489:server/server.js
    const sanitizedContent = DOMPurify.sanitize(content);
```

But `edit-news` stores raw content:

```2149:2150:server/server.js
    const query = "UPDATE news SET (title, content, image) = ($1, $2, $3) WHERE id = $4";
    const values = [title, content, image?.filename, id];  // content NOT sanitized
```

And the frontend renders it unsafely:

```221:221:client/src/components/allNews.jsx
                                        dangerouslySetInnerHTML={{ __html: newsItem.content }}
```

**Fix direction:** Apply `DOMPurify.sanitize(content)` in the `edit-news` handler, same as `upload-news`.

---

### 12. HIGH — Swapped Query Parameters in `/api/buildings/:id/fetch-gases`

**Why it matters:** The gas data feature is completely broken. The query matches `user_id = building_id` and `building_id = user_id`, which will almost never return correct results.

**Files:** `server/server.js` (lines 3226–3233)

**Evidence:**

```3214:3233:server/server.js
app.get("/api/buildings/:id/fetch-gases", authenticateJWT, async (req, res) => {
    const { id } = req.params;          // this is building_id
    const { user_id } = req.user;

    // ...
    const rows = await pool.query(`
      SELECT rg.*, p.description AS plant_name
      FROM refrigerant_gases rg
      LEFT JOIN plants p ON rg.plant_id = p.id
      WHERE rg.user_id = $1 AND rg.building_id = $2;
    `, [id, user_id]);   // $1 = building_id, $2 = user_id — SWAPPED
```

`$1` is used for `rg.user_id` but receives `id` (the building ID from the URL). `$2` is used for `rg.building_id` but receives `user_id`.

**Fix direction:** Swap the parameter array to `[user_id, id]`.

---

### 13. HIGH — No File Type Validation or Size Limit on Legacy Uploads

**Why it matters:** Any file type (`.html`, `.svg`, `.exe`) can be uploaded through news/product endpoints. Combined with public static serving at `/uploaded_img/`, this enables stored XSS, malware hosting, and disk exhaustion.

**Files:** `server/server.js` (lines 36–52)

**Evidence:**

```36:52:server/server.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploaded_img');
    // ...
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });  // no fileFilter, no limits

app.use('/uploaded_img', express.static(path.join(__dirname, 'uploaded_img')));
```

No `fileFilter`, no `limits.fileSize`, and the directory is served publicly without authentication.

**Fix direction:** Add a `fileFilter` that validates MIME type and magic bytes (like the OCR pipeline does). Add `limits: { fileSize: 5 * 1024 * 1024 }`. Consider requiring auth for `/uploaded_img/` access or serving through a route handler.

---

### 14. HIGH — Server Crash on Invalid Promo Code (`/api/apply-promo-code`)

**Why it matters:** Submitting any invalid promo code crashes the server because `result.rows[0]` is accessed before checking `result.rows.length`.

**Files:** `server/server.js` (lines 2347–2351)

**Evidence:**

```2347:2351:server/server.js
    const used_by = result.rows[0].used_by;     // <-- crashes if no rows
    const discount = result.rows[0].discount;    // <-- crashes if no rows
    const code_id = result.rows[0].id;           // <-- crashes if no rows

    if (result.rows.length > 0) {                // <-- too late
```

**Fix direction:** Move the `result.rows.length > 0` check before accessing `result.rows[0]`.

---

### 15. HIGH — Cookie Security Flags Disabled (`httpOnly: false`, `secure: false`)

**Why it matters:** JWT tokens are accessible to JavaScript (XSS can steal sessions) and sent over unencrypted HTTP (MITM can intercept them).

**Files:** `server/server.js` (lines 428–433)

**Evidence:**

```428:433:server/server.js
    res.cookie('accessToken', token, {
      httpOnly: false,
      secure: false, // in poducazione mettere true
      sameSite: 'Lax',
      maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
    });
```

The comment acknowledges this should be `true` in production but there's no env-based toggle.

**Fix direction:** Set `httpOnly: true` and `secure: process.env.NODE_ENV === 'production'`.

---

### 16. HIGH — Solar/Photovoltaic Routes Have No Building Ownership Verification

**Why it matters:** Any authenticated user can read, insert, or modify solar/photovoltaic data for buildings they don't own.

**Files:** `server/server.js` — lines 3432, 3515, 3534, 3520, 3586, 3619

**Evidence (representative example — fetch-solars):**

```3515:3521:server/server.js
app.get("/api/buildings/:id/fetch-solars", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.user;

    const rows = await pool.query(`SELECT * FROM solars WHERE building_id = $1`, [id]);
    // user_id never checked
```

**Fix direction:** Join through the `buildings` table to verify `buildings.user_id = req.user.user_id` for all building-scoped routes.

---

### 17. MEDIUM — Promo Codes Not User-Scoped at Checkout, Unlimited Use

**Why it matters:** Any valid promo code works for any user, can be reused infinitely, and there is no mechanism to mark it as consumed.

**Files:** `server/server.js` (line 2421)

**Evidence:**

```2421:2421:server/server.js
      const promoQuery = "SELECT * FROM promocodes WHERE code = $1 AND start <= CURRENT_DATE AND expiration >= CURRENT_DATE";
```

No check against `promocodes_assignments` (which exists in the schema to restrict codes to specific users). No "used" flag or counter is decremented after application.

**Fix direction:** Validate promo code eligibility against `promocodes_assignments` and decrement a usage counter or mark as consumed.

---

### 18. MEDIUM — No Transaction Wrapping on Multi-Row Order Creation

**Why it matters:** If the loop at `create-order` fails partway, some order rows are committed and others are not, leaving the system in an inconsistent state.

**Files:** `server/server.js` (lines 2509–2536)

**Evidence:**

```2509:2536:server/server.js
    for (const id of orderData) {
      const query = "SELECT quantity, price FROM cart WHERE user_id = $1 AND product_id = $2";
      // ...
      const query2 = "INSERT INTO orders ...";
      await pool.query(query2, values2);   // individual inserts, no BEGIN/COMMIT
    }
```

**Fix direction:** Wrap the entire loop in `BEGIN`/`COMMIT` using a client from `pool.connect()`.

---

### 19. MEDIUM — Recovery Token JWT Has Incompatible Payload Shape

**Why it matters:** The recovery token uses `{ id: ... }` but all routes expect `req.user.user_id`. If a user authenticates with only a recovery token, `req.user.user_id` is `undefined`, causing silent data integrity failures (queries with `undefined` as user_id).

**Files:** `server/server.js` (line 767 vs line 406)

**Evidence:** Login token: `jwt.sign({ user_id: ..., role: ..., username: ... })`. Recovery token: `jwt.sign({ id: result.rows[0].id })`. Both are accepted by `authenticateJWT` via the `recoveryToken` cookie.

**Fix direction:** Use the same payload shape for both tokens, or reject recovery tokens for non-recovery routes.

---

## B) Strong Suspicions Needing Runtime Verification

| # | Issue | Why it needs runtime verification |
|---|-------|-----------------------------------|
| 1 | **`axiosInstance.js` missing `withCredentials`** — The shared axios instance used by OCR frontend code doesn't set `withCredentials: true` in its base config, which would cause all OCR API calls to fail auth. | Depends on whether individual callers override this. Need to test actual OCR flows. |
| 2 | **`fs.unlinkSync` with DB-sourced filename in edit-news/edit-product** (lines 2146, 2187) — If an attacker could inject a path traversal payload into the `image` column, they could delete arbitrary server files. | Requires ability to control the `image` column value, which is set server-side from multer. Low likelihood but not zero if another IDOR allows editing the DB row. |
| 3 | **`isAuthenticated()` called without `await` in `navbar.jsx`** — The function is async but invoked synchronously, so the result is always a truthy Promise. | This compounds with finding #10 (missing import). If the import were fixed, the await-less call would still always evaluate to truthy. Needs frontend testing. |
| 4 | **Admin password logged to stdout** (`server.js:4443` — `console.log("PASS_ADMIN:", process.env.PASS_ADMIN)`) — Leaks into container/service logs. | Impact depends on log retention and access policies in production. |

---

## C) Not Found / Appears Safe

| Category | Assessment |
|----------|-----------|
| **SQL Injection** | All database queries reviewed use parameterized queries (`$1`, `$2`, etc.). No string concatenation or template literals found in SQL query construction with user input. **Appears safe.** |
| **Hardcoded Secrets in Source** | No API keys, passwords, or tokens found hardcoded in `.js` or `.json` files. All secrets loaded via `process.env`. `.env` files are in `.gitignore`. **Appears safe.** |
| **OCR/Document Pipeline Security** | The newer document handling code (`routes/documents.js`, `services/documentStorageService.js`, `services/documentValidationService.js`) is well-implemented: magic-byte validation, UUID-based filenames, SHA-256 deduplication, file size limits, parameterized queries, ownership checks on all routes. **Appears safe.** |
| **Admin route protection (middleware-level)** | Most admin routes correctly use both `authenticateJWT` and `authenticateAdmin` middleware. The exceptions are `/api/messages` and `/api/users-generator-types` (reported above). **Mostly safe with noted exceptions.** |
| **Document routes ownership** | All document-related routes in `routes/documents.js` verify `batch.user_id !== req.user.user_id` / `doc.user_id !== req.user.user_id`. **Appears safe.** |

---

## Priority Fix Order

| Priority | Findings | Effort |
|----------|----------|--------|
| **Immediate** | #1 (client price to Stripe), #2 (no webhook), #3 (duplicate orders) | High — requires rearchitecting payment flow |
| **Immediate** | #4 (drop `credit_cards` table) | Low |
| **Immediate** | #5, #6 (IDOR on edit-building, delete-plant/solar/photovoltaic) | Low — add `AND user_id` to WHERE clauses |
| **Immediate** | #9 (password hash exposure) | Low — change `SELECT *` to explicit column lists |
| **Urgent** | #7, #8 (missing admin checks on `/api/messages`, `/api/users-generator-types`) | Low — add `authenticateAdmin` middleware |
| **Urgent** | #10 (isAuthenticated.js crash), #14 (promo code crash) | Low — one-line fixes |
| **Urgent** | #11 (XSS via edit-news), #13 (upload validation), #15 (cookie flags) | Low–Medium |
| **Soon** | #12 (swapped params), #16 (building ownership on solar routes), #17 (promo code scoping), #18 (transactions) | Medium |