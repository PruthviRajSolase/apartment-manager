-- Table 2: Units (flats/rooms within a society)
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    society_id INTEGER NOT NULL REFERENCES societies(id),
    unit_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(society_id, unit_number)
);
