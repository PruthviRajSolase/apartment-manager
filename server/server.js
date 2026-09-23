// Import the Express library we installed earlier
const express = require('express');

// Create an "app" — this represents our whole web server
const app = express();

// Choose a port number — the "address" on your machine this server listens on
const PORT = 5000;

// Define a route: when someone visits the root URL ("/") with a GET request,
// run this function and send back a response
app.get('/', (req, res) => {
  res.send('Hello v2 from the backend!');
});

// Start the server listening on PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});