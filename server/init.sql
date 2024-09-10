CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL, --nome e cognome del referente 
    company_name VARCHAR(255) NOT NULL, --nome dell'azienda, ragione sociale 
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255),
    p_iva VARCHAR(11) UNIQUE,
    tax_code VARCHAR(16) DEFAULT NULL UNIQUE, --codice fiscale
    legal_headquarter VARCHAR(255), -- sede legale
    administrator BOOLEAN NOT NULL,
    password_digest TEXT

    CHECK (LENGTH(p_iva) = 11 AND p_iva ~ '^[0-9]+$')
    CHECK (LENGTH(tax_code) = 16 AND tax_code ~ '^[A-Z0-9]+$')

);

CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
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
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    code_id INTEGER DEFAULT NULL, -- Il codice promozionale associato all'ordine --
    order_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (code_id) REFERENCES promocodes(id) ON DELETE SET NULL
);

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

CREATE TYPE construction_year_enum AS ENUM (
    'Prima del 1976', 
    'Tra 1976 e 1991', 
    'Tra 1991 e 2004', 
    'dopo il 2004'
);

CREATE TYPE renovation_enum AS ENUM (
    'Edile', 
    'Impiantistico', 
    'No'
);

CREATE TYPE heat_distribution_enum AS ENUM (
    'Radiatori', 
    'Ventilconvettori', 
    'Impianto ad aria canalizzato', 
    'Pavimento radiante'
);

CREATE TYPE ventilation_enum AS ENUM (
    'Si', 
    'Si, con recupero calore', 
    'No'
);

CREATE TYPE energy_control_enum AS ENUM (
    'Settimanale', 
    'Mensile', 
    'Annuale', 
    'No'
);

CREATE TYPE maintenance_enum AS ENUM (
    'Settimanale', 
    'Mensile', 
    'Annuale', 
    'No'
);

CREATE TYPE water_recovery_enum AS ENUM (
    'per irrigazione', 
    'per la cassette di scarico', 
    'altro', 
    'No'
);

CREATE TYPE electricity_meter_enum AS ENUM (
    'da 0 a 10 kW', 
    'da 10 a 20 kW', 
    'da 20 a 50 kW', 
    'da 50 a 100 kW', 
    'oltre i 100 kW'
);

CREATE TYPE analyzers_enum AS ENUM (
    'Si', 
    'No', 
    'Non so'
);


CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),  -- Assumendo che tu abbia una tabella 'users' con una colonna 'id'
    description TEXT NOT NULL,
    construction_year construction_year_enum NOT NULL,
    renovation renovation_enum NOT NULL,
    heat_distribution heat_distribution_enum NOT NULL,
    ventilation ventilation_enum NOT NULL,
    energy_control energy_control_enum NOT NULL,
    maintenance maintenance_enum NOT NULL,
    water_recovery water_recovery_enum NOT NULL,
    electricity_meter electricity_meter_enum NOT NULL,
    incandescent INTEGER NOT NULL,
    led INTEGER NOT NULL,
    gas_lamp INTEGER NOT NULL,
    analyzers analyzers_enum NOT NULL,
    buildingScore DECIMAL(10, 2) DEFAULT 0.0
);

CREATE TYPE plant_type_enum AS ENUM (
    'Centralizzato', 
    'Autonomo'
);

CREATE TYPE service_type_enum AS ENUM (
    'Riscaldamento', 
    'Raffrescamento', 
    'Acqua calda sanitaria', 
    'Altra produzione termica'
);

CREATE TYPE generator_type_enum AS ENUM (
    'Caldaia tradizionale', 
    'Caldaia condensazione', 
    'Pompa di calore idronica', 
    'Ibrido (Caldaia e Pompa di Calore)', 
    'Teleriscaldamento', 
    'Cogeneratore o Trigenerazione con Motore endotermico',
    'Cogeneratore o Trigenerazione con Microturbina',
    'Cogeneratore o Trigenerazione con Fuel Cell',
    'Altro'
);

CREATE TYPE fuel_type_enum AS ENUM (
    'Gas Naturale (Metano)', 
    'GPL', 
    'Gasolio', 
    'Olio combustibile', 
    'Pellet', 
    'Cippato di legna', 
    'Biogas', 
    'Biodiesel', 
    'Elettrico - mix generico', 
    'Elettrico - 100% rinnovabili'
);

CREATE TYPE electricity_supply_enum AS ENUM (
    'Elettrico - mix generico', 
    'Elettrico - 100% rinnovabili'
);


CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- assuming you have a users table with an id field
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    description TEXT NOT NULL,
    plant_type plant_type_enum NOT NULL,
    service_type service_type_enum NOT NULL,
    generator_type generator_type_enum NOT NULL,
    generator_description TEXT DEFAULT NULL,  -- Optional if 'Altro' is selected
    generator_assigned_score DECIMAL(10,2) DEFAULT 0.0,
    fuel_type fuel_type_enum NOT NULL,
    quantity INTEGER CHECK (quantity > 0),  -- Quantity must be a positive integer
    electricity_supply electricity_supply_enum NOT NULL,
    plantScore DECIMAL(10,2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS solars (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    installed_area DECIMAL(10,2) NOT NULL CHECK (installed_area > 0), --quantita' installata--
    solarScore DECIMAL(10,2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS photovoltaics (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,  -- assuming you have a buildings table with an id field
    power DECIMAL(10,2) NOT NULL CHECK (power > 0), --potenza--
    photovoltaicScore DECIMAL(10,2) DEFAULT 0.0
);

-------------------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    certification_id INTEGER NOT NULL,
    page_no INTEGER,
    survey_data JSONB,
    total_score INTEGER,
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





