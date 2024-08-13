CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255) NOT NULL,
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (cod)  -- Aggiunto un vincolo di unicità per il codice prodotto
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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

/*
CREATE TABLE if NOT EXISTS session (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    PRIMARY KEY (sid)
);*/


