CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255),
    administrator BOOLEAN NOT NULL,
    password_digest TEXT
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
    price INTEGER NOT NULL,
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
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL  -- Messaggio inviato dall'utente
);

CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),  -- Assicurati che la quantità sia positiva
    option VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,  -- Prezzo dell'articolo (al momento dell'aggiunta al carrello)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
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




