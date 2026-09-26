-- Table 1: Societies (each row = one tenant/customer)
CREATE TABLE societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table 2: Users (admins, committee members, residents)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    society_id INTEGER NOT NULL REFERENCES societies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'resident',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table 3: Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    society_id INTEGER NOT NULL REFERENCES societies(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table 4: Issues
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    society_id INTEGER NOT NULL REFERENCES societies(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

