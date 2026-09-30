const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/auth');
const unitRoutes = require('./routes/units');
const app = express();
const PORT = 5000;
const residentRoutes = require('./routes/residents');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/residents', residentRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the Apartment Manager backend!');
});

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, society_id FROM users WHERE society_id = $1',
      [req.user.societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching users' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});