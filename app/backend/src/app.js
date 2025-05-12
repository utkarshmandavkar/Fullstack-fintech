const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/users', require('./routes/users'));
app.use('/transactions', require('./routes/transactions'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
