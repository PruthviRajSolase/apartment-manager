const { Pool } = require('pg');
require('dotenv').config();

// A "pool" manages multiple reusable connections to Postgres,
// instead of opening/closing a new connection for every single query
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Export a simple "query" function other files can use,
// so they never need to touch the pool directly
module.exports = {
  query: (text, params) => pool.query(text, params),
};