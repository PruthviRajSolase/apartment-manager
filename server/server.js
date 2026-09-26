const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the Apartment Manager backend!');
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching users' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});