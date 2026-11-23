-- Table 1: Societies (each row = one tenant/customer)
CREATE TABLE societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
