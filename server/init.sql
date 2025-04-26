CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL, --nome e cognome del referente 
    company_name VARCHAR(255) NOT NULL, --nome dell'azienda, ragione sociale 
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255) DEFAULT NULL UNIQUE,
    p_iva VARCHAR(11) UNIQUE,
    tax_code VARCHAR(16) DEFAULT NULL UNIQUE, --codice fiscale
    legal_headquarter VARCHAR(255) DEFAULT NULL, -- sede legale
    turnover INTEGER DEFAULT NULL, --fatturato
    administrator BOOLEAN DEFAULT FALSE,
    password_digest TEXT,
    isVerified BOOLEAN DEFAULT FALSE,
    token VARCHAR(255) DEFAULT NULL -- Token per la verifica dell'indirizzo email

    CHECK (LENGTH(p_iva) = 11 AND p_iva ~ '^[0-9]+$')
    CHECK (LENGTH(tax_code) = 16 AND tax_code ~ '^[A-Z0-9]+$')

);

CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS news_read_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP DEFAULT NULL,  -- Memorizza il timestamp di quando la notizia è stata letta
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    UNIQUE (user_id, news_id)  -- Un utente può avere uno stato di lettura per ogni notizia
);


CREATE TYPE category_type AS ENUM (
    'Certificazione hotel',
    'Certificazione spa e resorts',
    'Certificazione trasporti',
    'Certificazione industria',
    'Certificazione store e retail',
    'Certificazione bar e ristoranti'
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255) NOT NULL,
    info TEXT NOT NULL,
    cod VARCHAR(255) NOT NULL,
    category category_type NOT NULL,
    tag VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (cod)  -- Aggiunto un vincolo di unicità per il codice prodotto
);


CREATE TABLE IF NOT EXISTS plates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,  -- Riferimento diretto alla certificazione
    serial_number VARCHAR(255) UNIQUE NOT NULL,  -- Numero di serie univoco per ogni targhetta
    status VARCHAR(50) DEFAULT 'in attesa di spedizione',  -- Stato della targhetta (es. "spedita", "in produzione")
    shipping_date DATE,  -- Data di spedizione (può essere NULL finché non è spedita)
    tracking_number VARCHAR(255),  -- Numero di tracciamento per la spedizione
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS promocodes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    discount INT NOT NULL,
    used_by VARCHAR(255),
    start DATE NOT NULL,
    expiration DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS promocodes_publishment (
    id SERIAL PRIMARY KEY,
    promocode_id INT NOT NULL,
    FOREIGN KEY (promocode_id) REFERENCES promocodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promocodes_assignments (
    id SERIAL PRIMARY KEY,
    promocode_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (promocode_id) REFERENCES promocodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name_surname VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    phone_number VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL  -- Messaggio inviato dall'utente
);

CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),  -- Assicurati che la quantità sia positiva
    option VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,  -- Prezzo dell'articolo (al momento dell'aggiunta al carrello)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Assicurati che almeno uno tra user_id e session_id sia presente
    CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Aggiungere indici per migliorare le performance di query basate su user_id e session_id
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_session_id ON cart(session_id);


CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    user_id INTEGER NOT NULL,
    product_id INTEGER DEFAULT NULL, -- Ora accetta NULL
    code_id INTEGER DEFAULT NULL,   -- Codice promozionale (opzionale)
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Ora include data e ora
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (code_id) REFERENCES promocodes(id) ON DELETE SET NULL
);

-- Modifica della colonna product_id per permettere NULL
--ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;



CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number VARCHAR(255) NOT NULL,
    expiration VARCHAR(255) NOT NULL,
    cvv VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (number)  -- Aggiunto un vincolo di unicità per il numero della carta di credito
);


-------------------------------------------------------------------------------------------------------------------------

-- BUILDINGS INPIANTI SOLARI E FOTOVOLTAICI DI UN UTENTE --


CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),  -- Assumendo che tu abbia una tabella 'users' con una colonna 'id'
    --description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    usage VARCHAR(50) NOT NULL,
    construction_year VARCHAR(50) NOT NULL,
    area INTEGER NOT NULL,
    renovation VARCHAR(50) NOT NULL,
    heat_distribution VARCHAR(50) NOT NULL,
    ventilation VARCHAR(50) NOT NULL,
    energy_control VARCHAR(50) NOT NULL,
    maintenance VARCHAR(50) NOT NULL,
    electricity_forniture VARCHAR(50) NOT NULL,
    water_recovery VARCHAR(50) NOT NULL,
    electricity_meter VARCHAR(50) NOT NULL,
    incandescent INTEGER NOT NULL,
    led INTEGER NOT NULL,
    gas_lamp INTEGER NOT NULL,
    analyzers VARCHAR(50) NOT NULL,
    autoLightingControlSystem VARCHAR(50) NOT NULL,
    emissionMark INTEGER DEFAULT NULL,
    emissionCO2 DECIMAL(10, 5) DEFAULT NULL,
    areaEmissionCO2 DECIMAL(10, 5) DEFAULT NULL,
    results_visible BOOLEAN DEFAULT FALSE,

    -- gli attributi sotto saranno specifici solamente per edifici industriali
    ateco VARCHAR(8) DEFAULT NULL,
    activity_description VARCHAR(300) DEFAULT NULL,
    annual_turnover INTEGER DEFAULT NULL,
    num_employees INTEGER DEFAULT NULL,
    prodProcessDesc VARCHAR(300) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS user_consumptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- assuming you have a users table with an id field
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    energy_source VARCHAR(50) NOT NULL,
    consumption DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS climate_gas_altering (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- assuming you have a users table with an id field
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    type VARCHAR(50) DEFAULT NULL,
    annual_consumption DECIMAL(10, 2) DEFAULT NULL,
    unit_type VARCHAR(50) DEFAULT NULL,
    usage VARCHAR(50) DEFAULT NULL
);


CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- assuming you have a users table with an id field
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    description TEXT NOT NULL,
    plant_type VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    generator_type VARCHAR(255) NOT NULL,
    generator_description TEXT DEFAULT NULL,  -- Optional if 'Altro' is selected
    generator_assigned_score DECIMAL(10,2) DEFAULT 0.0,
    fuel_type VARCHAR(50) NOT NULL
    --quantity INTEGER CHECK (quantity > 0),  -- Quantity must be a positive integer
    --electricity_supply VARCHAR(50) NOT NULL,
    --plantScore DECIMAL(10,2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS solars (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    installed_area DECIMAL(10,2) NOT NULL CHECK (installed_area > 0) --quantita' installata--
    --solarScore DECIMAL(10,2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS photovoltaics (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    power DECIMAL(10,2) NOT NULL CHECK (power > 0) --potenza--
    --photovoltaicScore DECIMAL(10,2) DEFAULT 0.0
);

-------------------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    certification_id INTEGER NOT NULL,
    page_no INTEGER,
    survey_data JSONB,
    total_score DECIMAL(10,2) DEFAULT 0.0,
    co2emissions DECIMAL(10,2) DEFAULT 0.0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_survey UNIQUE (user_id, certification_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (certification_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS second_level_certification_requests (
    id SERIAL PRIMARY KEY,
    certification_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (certification_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (certification_id, user_id)
);

CREATE TABLE IF NOT EXISTS second_level_certification_approvation (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_cancelled BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (request_id) REFERENCES second_level_certification_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (request_id, user_id)
);





